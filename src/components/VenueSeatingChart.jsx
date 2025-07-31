import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from './common/SafeIcon';
import { getSafeStatus } from '../constants/seatStatus';

const { FiPlus, FiMinus, FiMove } = FiIcons;

const VenueSeatingChart = ({
  venue,
  eventId,
  reservedSeats = [],
  purchasedSeats = [],
  selectedSeats = [],
  onSeatSelect,
  readonly = false
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elements, setElements] = useState([]);
  const [categories, setCategories] = useState({});
  const [bounds, setBounds] = useState({ minX: 0, minY: 0, maxX: 800, maxY: 600 });
  const [isCanvasActive, setIsCanvasActive] = useState(false);
  
  // Add state for grid visibility
  const [showGrid, setShowGrid] = useState(true);
  
  // Touch handling state
  const [lastTouchDistance, setLastTouchDistance] = useState(null);
  const [lastPinchCenter, setLastPinchCenter] = useState(null);

  // Prevent page scroll when canvas is active
  useEffect(() => {
    const preventScroll = (e) => {
      if (isCanvasActive) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const handleWheel = (e) => {
      if (isCanvasActive) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const handleTouchMove = (e) => {
      if (isCanvasActive) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    if (isCanvasActive) {
      // Prevent scrollbar from appearing/disappearing
      document.body.style.overflow = 'hidden';
      
      // Add event listeners to prevent scroll
      document.addEventListener('wheel', handleWheel, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('scroll', preventScroll, { passive: false });
    } else {
      // Restore normal scrolling
      document.body.style.overflow = '';
      
      // Remove event listeners
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('scroll', preventScroll);
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('scroll', preventScroll);
    };
  }, [isCanvasActive]);

  // Load venue layout
  useEffect(() => {
    if (venue?.canvas_data) {
      try {
        const canvasData = typeof venue.canvas_data === 'string' ? JSON.parse(venue.canvas_data) : venue.canvas_data;
        setElements(canvasData.elements || []);
        setCategories(canvasData.categories || {});
        
        // Load the showGrid setting if available
        if (canvasData.showGrid !== undefined) {
          setShowGrid(canvasData.showGrid);
        }
      } catch (error) {
        console.error('Error parsing venue canvas data:', error);
        setElements([]);
        setCategories({});
      }
    } else {
      setElements([]);
      setCategories({});
    }
  }, [venue]);

  // Calculate bounding box of all elements
  const calculateBounds = useCallback(() => {
    if (elements.length === 0) return { minX: 0, minY: 0, maxX: 800, maxY: 600 };

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    elements.forEach(element => {
      if (element.type === 'seat') {
        const size = element.size || 20;
        minX = Math.min(minX, element.x);
        minY = Math.min(minY, element.y);
        maxX = Math.max(maxX, element.x + size);
        maxY = Math.max(maxY, element.y + size);
      } else if (element.type === 'section' || element.type === 'stage') {
        const width = element.width || 100;
        const height = element.height || 80;
        minX = Math.min(minX, element.x);
        minY = Math.min(minY, element.y);
        maxX = Math.max(maxX, element.x + width);
        maxY = Math.max(maxY, element.y + height);
      } else if (element.type === 'polygon' && element.points) {
        element.points.forEach(point => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
      }
    });

    // Add some padding
    const padding = 50;
    const newBounds = {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding
    };

    setBounds(newBounds);
    return newBounds;
  }, [elements]);

  // Auto-fit and center view on load
  useEffect(() => {
    if (elements.length > 0) {
      const newBounds = calculateBounds();
      fitToView(newBounds);
    }
  }, [elements]);

  // Fit all elements to view
  const fitToView = useCallback((customBounds = null) => {
    const canvas = canvasRef.current;
    if (!canvas || elements.length === 0) return;

    const venBounds = customBounds || bounds;
    const contentWidth = venBounds.maxX - venBounds.minX;
    const contentHeight = venBounds.maxY - venBounds.minY;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate scale to fit content with some margin
    const scaleX = (canvasWidth * 0.9) / contentWidth;
    const scaleY = (canvasHeight * 0.9) / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 2); // Max scale of 2

    // Center the content
    const centerX = (venBounds.minX + venBounds.maxX) / 2;
    const centerY = (venBounds.minY + venBounds.maxY) / 2;
    const newPanX = canvasWidth / 2 - centerX * newScale;
    const newPanY = canvasHeight / 2 - centerY * newScale;

    setScale(newScale);
    setPan({ x: newPanX, y: newPanY });
  }, [elements, bounds]);

  const getSeatStatus = useCallback((seatId) => {
    if (purchasedSeats.find(s => s.seat_id === seatId)) return 'purchased';
    if (reservedSeats.find(s => s.seat_id === seatId)) return 'reserved';
    if (selectedSeats.find(s => s.id === seatId)) return 'selected';
    return 'available';
  }, [reservedSeats, purchasedSeats, selectedSeats]);

  const getSeatColor = useCallback((seat, status) => {
    switch (status) {
      case 'purchased': return '#6B7280'; // Gray
      case 'reserved': return '#F59E0B'; // Amber
      case 'selected': return '#10B981'; // Green
      case 'available':
      default:
        // Use category color if available
        if (seat.categoryId && categories[seat.categoryId]) {
          return categories[seat.categoryId].color;
        }
        return '#3B82F6'; // Blue
    }
  }, [categories]);

  // Drawing functions
  const drawGrid = useCallback((ctx, width, height) => {
    // Only draw grid if showGrid is true
    if (!showGrid) return;

    ctx.strokeStyle = '#18181b'; // Changed grid color to #18181b
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
  }, [scale, pan, showGrid]);

  const drawStage = useCallback((ctx) => {
    // Find stage elements
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
  }, [elements, scale, pan]);

  const drawSeat = useCallback((ctx, seat) => {
    const status = getSeatStatus(seat.id);
    const x = seat.x * scale + pan.x;
    const y = seat.y * scale + pan.y;
    const size = (seat.size || 20) * scale;
    const color = getSeatColor(seat, status);

    // Seat background
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 4 * scale);
    ctx.fill();

    // Seat border for selected/reserved
    if (status === 'selected') {
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (status === 'reserved') {
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Seat number if scale is large enough
    if (seat.number && scale > 0.5) {
      ctx.fillStyle = status === 'purchased' ? '#9CA3AF' : '#FFFFFF';
      ctx.font = `${Math.min(10 * scale, size * 0.4)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(seat.number, x + size / 2, y + size / 2 + 3);
    }

    // Check mark for selected seats
    if (status === 'selected' && scale > 0.7) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `${size * 0.6}px Arial`;
      ctx.fillText('✓', x + size / 2, y + size / 2 + 2);
    }
  }, [scale, pan, getSeatStatus, getSeatColor]);

  const drawSection = useCallback((ctx, section) => {
    const x = section.x * scale + pan.x;
    const y = section.y * scale + pan.y;
    const width = (section.width || 100) * scale;
    const height = (section.height || 80) * scale;

    // Get section color from category
    let sectionColor = '#3B82F6';
    if (section.categoryId && categories[section.categoryId]) {
      sectionColor = categories[section.categoryId].color;
    }

    // Section background
    ctx.fillStyle = `${sectionColor}33`; // 20% opacity
    ctx.fillRect(x, y, width, height);

    // Section border
    ctx.strokeStyle = sectionColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);

    // Section label
    if (section.label && scale > 0.6) {
      ctx.fillStyle = '#9CA3AF';
      ctx.font = `${12 * scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(section.label, x + width / 2, y + height / 2);
    }
  }, [scale, pan, categories]);

  // ИСПРАВЛЕНИЕ: Добавляем функцию для рисования полигонов
  const drawPolygon = useCallback((ctx, polygon) => {
    if (!polygon.points || polygon.points.length < 3) return;

    const points = polygon.points.map(point => ({
      x: point.x * scale + pan.x,
      y: point.y * scale + pan.y
    }));

    // Get polygon color from category
    let polygonColor = '#3B82F6';
    if (polygon.categoryId && categories[polygon.categoryId]) {
      polygonColor = categories[polygon.categoryId].color;
    }

    // Draw polygon
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();

    // Fill polygon with semi-transparent color
    ctx.fillStyle = `${polygonColor}33`; // 20% opacity
    ctx.fill();

    // Stroke polygon
    ctx.strokeStyle = polygonColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw label if exists
    if (polygon.label && scale > 0.6) {
      // Calculate center of polygon
      const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
      const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

      ctx.fillStyle = '#9CA3AF';
      ctx.font = `bold ${14 * scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(polygon.label, centerX, centerY);
    }
  }, [scale, pan, categories]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height);

    // Draw stage
    drawStage(ctx);

    // Draw sections first
    elements.filter(el => el.type === 'section').forEach(section => {
      drawSection(ctx, section);
    });

    // ИСПРАВЛЕНИЕ: Draw polygons
    elements.filter(el => el.type === 'polygon').forEach(polygon => {
      drawPolygon(ctx, polygon);
    });

    // Draw seats on top
    elements.filter(el => el.type === 'seat').forEach(seat => {
      drawSeat(ctx, seat);
    });
  }, [elements, drawGrid, drawStage, drawSection, drawPolygon, drawSeat]);

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

  const handleMouseDown = useCallback((e) => {
    if (readonly) return;

    const pos = getMousePos(e);

    // Check if clicking on a seat
    const clickedSeat = elements.find(element => {
      if (element.type !== 'seat') return false;
      const size = element.size || 20;
      return pos.x >= element.x && pos.x <= element.x + size && 
             pos.y >= element.y && pos.y <= element.y + size;
    });

    if (clickedSeat) {
      const status = getSeatStatus(clickedSeat.id);
      if (status === 'available' || status === 'selected') {
        onSeatSelect?.(clickedSeat);
      }
      return;
    }

    // Start panning
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [readonly, elements, getMousePos, getSeatStatus, onSeatSelect, pan]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();

    // Get the mouse position before scaling
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate position in world space
    const worldX = (mouseX - pan.x) / scale;
    const worldY = (mouseY - pan.y) / scale;

    // Calculate new scale
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(scale * delta, 0.2), 3);

    // Calculate new pan to keep the point under the mouse fixed
    const newPanX = mouseX - worldX * newScale;
    const newPanY = mouseY - worldY * newScale;

    setScale(newScale);
    setPan({ x: newPanX, y: newPanY });
  }, [scale, pan]);

  const zoomIn = useCallback(() => {
    // Get the center of the canvas
    const canvas = canvasRef.current;
    if (!canvas) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Calculate position in world space
    const worldX = (centerX - pan.x) / scale;
    const worldY = (centerY - pan.y) / scale;

    // Calculate new scale
    const newScale = Math.min(scale * 1.2, 3);

    // Calculate new pan to keep the center point fixed
    const newPanX = centerX - worldX * newScale;
    const newPanY = centerY - worldY * newScale;

    setScale(newScale);
    setPan({ x: newPanX, y: newPanY });
  }, [scale, pan]);

  const zoomOut = useCallback(() => {
    // Get the center of the canvas
    const canvas = canvasRef.current;
    if (!canvas) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Calculate position in world space
    const worldX = (centerX - pan.x) / scale;
    const worldY = (centerY - pan.y) / scale;

    // Calculate new scale
    const newScale = Math.max(scale * 0.8, 0.2);

    // Calculate new pan to keep the center point fixed
    const newPanX = centerX - worldX * newScale;
    const newPanY = centerY - worldY * newScale;

    setScale(newScale);
    setPan({ x: newPanX, y: newPanY });
  }, [scale, pan]);

  // Touch event handlers
  const handleTouchStart = useCallback((e) => {
    setIsCanvasActive(true);
    
    if (e.touches.length === 1) {
      // Single touch - prepare for panning
      setIsDragging(true);
      setDragStart({ 
        x: e.touches[0].clientX - pan.x, 
        y: e.touches[0].clientY - pan.y 
      });
    } else if (e.touches.length === 2) {
      // Two touches - prepare for pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      setLastTouchDistance(distance);

      // Calculate pinch center
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      setLastPinchCenter({ x: centerX, y: centerY });
    }
  }, [pan]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault(); // Prevent scrolling

    if (e.touches.length === 1 && isDragging) {
      // Pan with single touch
      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    } else if (e.touches.length === 2 && lastTouchDistance !== null) {
      // Pinch zoom with two touches
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Calculate zoom factor
      const factor = distance / lastTouchDistance;
      const newScale = Math.min(Math.max(scale * factor, 0.2), 3);

      // Calculate new pinch center
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

      // Convert pinch center to world coordinates before scaling
      const canvas = canvasRef.current;
      if (canvas && lastPinchCenter) {
        const rect = canvas.getBoundingClientRect();
        const worldX = (lastPinchCenter.x - rect.left - pan.x) / scale;
        const worldY = (lastPinchCenter.y - rect.top - pan.y) / scale;

        // Calculate new pan to keep the pinch center fixed
        const newPanX = centerX - rect.left - worldX * newScale;
        const newPanY = centerY - rect.top - worldY * newScale;

        setScale(newScale);
        setPan({ x: newPanX, y: newPanY });

        // Update last distance and center
        setLastTouchDistance(distance);
        setLastPinchCenter({ x: centerX, y: centerY });
      }
    }
  }, [isDragging, dragStart, lastTouchDistance, lastPinchCenter, scale, pan]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setLastTouchDistance(null);
    setLastPinchCenter(null);
    setIsCanvasActive(false);
  }, []);

  // Mouse enter/leave handlers for scroll prevention
  const handleMouseEnter = useCallback(() => {
    setIsCanvasActive(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsCanvasActive(false);
    setIsDragging(false);
  }, []);

  // Setup canvas with responsive sizing
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
    <div className="relative w-full aspect-[4/3] max-h-[600px] rounded-lg overflow-hidden" style={{ backgroundColor: '#3f3f4680' }}>
      {/* Controls - Vertical Layout */}
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
          onClick={() => fitToView()}
          className="p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg"
          title="Fit to View"
        >
          <SafeIcon icon={FiMove} className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab"
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
          backgroundColor: '#3f3f4680' // Changed to the requested color
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export default VenueSeatingChart;