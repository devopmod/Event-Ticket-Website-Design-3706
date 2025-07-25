import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from './common/SafeIcon';

const { FiPlus, FiMinus, FiMove } = FiIcons;

const NewVenueSeatingChart = ({
  venue,
  eventId,
  tickets = [],
  selectedTickets = [],
  onTicketSelect,
  readonly = false
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isCanvasActive, setIsCanvasActive] = useState(false);

  // Get zones and seats from venue
  const zones = venue?.zones || [];
  const singleSeats = venue?.single_seats || [];

  // Create ticket lookup for status
  const ticketLookup = useCallback(() => {
    const lookup = {};
    tickets.forEach(ticket => {
      if (ticket.zone_id) {
        if (!lookup.zones) lookup.zones = {};
        if (!lookup.zones[ticket.zone_id]) lookup.zones[ticket.zone_id] = [];
        lookup.zones[ticket.zone_id].push(ticket);
      } else if (ticket.seat_id) {
        if (!lookup.seats) lookup.seats = {};
        lookup.seats[ticket.seat_id] = ticket;
      }
    });
    return lookup;
  }, [tickets]);

  const ticketMap = ticketLookup();

  // Drawing functions
  const drawGrid = useCallback((ctx, width, height) => {
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 0.5;
    const gridSize = 20 * scale;
    const offsetX = pan.x % gridSize;
    const offsetY = pan.y % gridSize;

    // Vertical lines
    for (let x = offsetX; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = offsetY; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, [scale, pan]);

  const drawStage = useCallback((ctx) => {
    // Draw stage from venue geometry_data
    const geometryData = venue?.geometry_data || {};
    const elements = geometryData.elements || [];
    
    const stages = elements.filter(el => el.type === 'stage');
    
    stages.forEach(stage => {
      const x = stage.x * scale + pan.x;
      const y = stage.y * scale + pan.y;
      const width = (stage.width || 200) * scale;
      const height = (stage.height || 40) * scale;

      ctx.fillStyle = stage.color || '#6B7280';
      ctx.fillRect(x, y, width, height);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `${12 * scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(stage.label || 'STAGE', x + width / 2, y + height / 2 + 4);
    });
  }, [venue, scale, pan]);

  const drawZone = useCallback((ctx, zone) => {
    const shape = zone.ui_shape || {};
    const color = zone.category?.color || '#3B82F6';
    
    // Get tickets for this zone
    const zoneTickets = ticketMap.zones?.[zone.id] || [];
    const availableCount = zoneTickets.filter(t => t.status === 'free').length;
    const totalCount = zone.capacity;
    
    // Determine zone status
    let opacity = 1;
    let strokeColor = color;
    
    if (availableCount === 0) {
      opacity = 0.6;
      strokeColor = '#6B7280';
    }

    ctx.globalAlpha = opacity;

    if (shape.type === 'polygon' && shape.points) {
      // Draw polygon zone
      const points = shape.points.map(point => ({
        x: point.x * scale + pan.x,
        y: point.y * scale + pan.y
      }));

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();

      ctx.fillStyle = `${color}33`;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw label at center
      if (zone.name && scale > 0.6) {
        const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
        const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
        
        ctx.fillStyle = '#1F2937';
        ctx.font = `bold ${14 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(zone.name, centerX, centerY);
        
        // Show availability
        if (scale > 0.5) {
          ctx.font = `${10 * scale}px Arial`;
          ctx.fillText(`${availableCount}/${totalCount}`, centerX, centerY + 18 * scale);
        }
      }
    } else {
      // Draw rectangular zone
      const x = (shape.x || 0) * scale + pan.x;
      const y = (shape.y || 0) * scale + pan.y;
      const width = (shape.width || 100) * scale;
      const height = (shape.height || 80) * scale;

      ctx.fillStyle = `${color}33`;
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      // Draw label
      if (zone.name && scale > 0.6) {
        ctx.fillStyle = '#1F2937';
        ctx.font = `bold ${14 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(zone.name, x + width / 2, y + height / 2);
        
        // Show availability
        if (scale > 0.5) {
          ctx.font = `${10 * scale}px Arial`;
          ctx.fillText(`${availableCount}/${totalCount}`, x + width / 2, y + height / 2 + 18 * scale);
        }
      }
    }

    ctx.globalAlpha = 1.0;
  }, [ticketMap, scale, pan]);

  const drawSeat = useCallback((ctx, seat) => {
    const ticket = ticketMap.seats?.[seat.id];
    const status = ticket?.status || 'free';
    const isSelected = selectedTickets.some(t => t.id === ticket?.id);
    
    const x = seat.x * scale + pan.x;
    const y = seat.y * scale + pan.y;
    const size = 20 * scale;
    
    // Determine color
    let color = seat.category?.color || '#3B82F6';
    if (status === 'sold') color = '#6B7280';
    else if (status === 'held') color = '#F59E0B';
    else if (isSelected) color = '#10B981';

    // Draw seat
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 4 * scale);
    ctx.fill();

    // Draw border for selected/held
    if (isSelected) {
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (status === 'held') {
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw seat number
    if (seat.seat_number && scale > 0.5) {
      ctx.fillStyle = status === 'sold' ? '#9CA3AF' : '#FFFFFF';
      ctx.font = `${Math.min(10 * scale, size * 0.4)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(seat.seat_number, x + size / 2, y + size / 2 + 3);
    }

    // Check mark for selected seats
    if (isSelected && scale > 0.7) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `${size * 0.6}px Arial`;
      ctx.fillText('✓', x + size / 2, y + size / 2 + 2);
    }
  }, [ticketMap, selectedTickets, scale, pan]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height);

    // Draw stage
    drawStage(ctx);

    // Draw zones
    zones.forEach(zone => {
      drawZone(ctx, zone);
    });

    // Draw individual seats
    singleSeats.forEach(seat => {
      drawSeat(ctx, seat);
    });
  }, [zones, singleSeats, drawGrid, drawStage, drawZone, drawSeat]);

  // Event handlers
  const getMousePos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / scale,
      y: (e.clientY - rect.top - pan.y) / scale
    };
  }, [scale, pan]);

  const isPointInZone = useCallback((point, zone) => {
    const shape = zone.ui_shape || {};
    
    if (shape.type === 'polygon' && shape.points) {
      // Point in polygon test
      let inside = false;
      const points = shape.points;
      
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i].x;
        const yi = points[i].y;
        const xj = points[j].x;
        const yj = points[j].y;
        
        const intersect = ((yi > point.y) !== (yj > point.y)) && 
                         (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      
      return inside;
    } else {
      // Rectangle test
      const x = shape.x || 0;
      const y = shape.y || 0;
      const width = shape.width || 100;
      const height = shape.height || 80;
      
      return point.x >= x && point.x <= x + width && 
             point.y >= y && point.y <= y + height;
    }
  }, []);

  const isPointInSeat = useCallback((point, seat) => {
    const size = 20;
    return point.x >= seat.x && point.x <= seat.x + size &&
           point.y >= seat.y && point.y <= seat.y + size;
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (readonly) return;

    const pos = getMousePos(e);

    // Check for seat click
    const clickedSeat = singleSeats.find(seat => isPointInSeat(pos, seat));
    if (clickedSeat) {
      const ticket = ticketMap.seats?.[clickedSeat.id];
      if (ticket && (ticket.status === 'free' || selectedTickets.some(t => t.id === ticket.id))) {
        onTicketSelect?.(ticket, 'seat');
      }
      return;
    }

    // Check for zone click
    const clickedZone = zones.find(zone => isPointInZone(pos, zone));
    if (clickedZone) {
      const zoneTickets = ticketMap.zones?.[clickedZone.id] || [];
      const availableTickets = zoneTickets.filter(t => t.status === 'free');
      
      if (availableTickets.length > 0) {
        onTicketSelect?.(clickedZone, 'zone', availableTickets);
      }
      return;
    }

    // Start panning
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPanStart({ x: pan.x, y: pan.y });
  }, [readonly, getMousePos, singleSeats, zones, ticketMap, selectedTickets, onTicketSelect, pan, isPointInSeat, isPointInZone]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      setPan({
        x: panStart.x + e.clientX - dragStart.x,
        y: panStart.y + e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(prev * delta, 0.2), 3));
  }, []);

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev * 1.2, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev * 0.8, 0.2));
  }, []);

  const fitToView = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      draw();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [draw]);

  // Redraw when dependencies change
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="relative w-full aspect-[4/3] max-h-[600px] rounded-lg overflow-hidden bg-zinc-900">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <button
          onClick={zoomIn}
          className="p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg"
          title="Zoom In"
        >
          <SafeIcon icon={FiPlus} className="w-4 h-4" />
        </button>
        <button
          onClick={zoomOut}
          className="p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg"
          title="Zoom Out"
        >
          <SafeIcon icon={FiMinus} className="w-4 h-4" />
        </button>
        <button
          onClick={fitToView}
          className="p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg"
          title="Fit to View"
        >
          <SafeIcon icon={FiMove} className="w-4 h-4" />
        </button>
      </div>

      {/* Zoom Level */}
      <div className="absolute top-4 left-4 z-10 bg-zinc-700 text-white px-3 py-1 rounded-lg text-sm">
        {Math.round(scale * 100)}%
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseEnter={() => setIsCanvasActive(true)}
        onMouseLeave={() => setIsCanvasActive(false)}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export default NewVenueSeatingChart;