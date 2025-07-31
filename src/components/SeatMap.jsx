import React,{useRef,useEffect,useState,useCallback} from 'react';
import {motion} from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from './common/SafeIcon';

// Дополнительное логирование для отладки 
console.log('SeatMap.jsx loaded');

const {FiZoomIn,FiZoomOut,FiMove,FiInfo,FiCheck,FiX}=FiIcons;

const SeatMap=({venue,priceBook={},seatStatuses={},selectedSeats=[],onSeatSelect,readonly=false})=> {
  const canvasRef=useRef(null);
  const containerRef=useRef(null);
  const [scale,setScale]=useState(1);
  const [pan,setPan]=useState({x: 50,y: 50});
  const [isDragging,setIsDragging]=useState(false);
  const [dragStart,setDragStart]=useState({x: 0,y: 0});

  // Extract elements and categories from venue
  const elements=venue?.geometry || venue?.canvas_data?.elements || [];
  const categories=venue?.categories || venue?.canvas_data?.categories || {};

  // Drawing functions
  const drawGrid=useCallback((ctx,width,height)=> {
    ctx.strokeStyle='#374151';
    ctx.lineWidth=0.5;
    const gridSize=20 * scale;
    const offsetX=pan.x % gridSize;
    const offsetY=pan.y % gridSize;

    // Vertical lines
    for (let x=offsetX;x < width;x +=gridSize) {
      ctx.beginPath();
      ctx.moveTo(x,0);
      ctx.lineTo(x,height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y=offsetY;y < height;y +=gridSize) {
      ctx.beginPath();
      ctx.moveTo(0,y);
      ctx.lineTo(width,y);
      ctx.stroke();
    }
  },[scale,pan]);

  const drawStage=useCallback((ctx)=> {
    const stageWidth=200 * scale;
    const stageHeight=40 * scale;
    const x=(400 - 100) * scale + pan.x;// Center stage
    const y=50 * scale + pan.y;

    ctx.fillStyle='#6B7280';
    ctx.fillRect(x,y,stageWidth,stageHeight);

    ctx.fillStyle='#FFFFFF';
    ctx.font=`${12 * scale}px Arial`;
    ctx.textAlign='center';
    ctx.fillText('STAGE',x + stageWidth / 2,y + stageHeight / 2 + 4);
  },[scale,pan]);

  const getSeatStatus=useCallback((seatId)=> {
    const status=seatStatuses[seatId]?.status || 'free';
    const isSelected=selectedSeats.some(s=> s.id===seatId);
    if (isSelected) return 'selected';
    return status;
  },[seatStatuses,selectedSeats]);

  const getSeatColor=useCallback((seat,status)=> {
    switch (status) {
      case 'sold': return '#6B7280';// Gray
      case 'held': return '#F59E0B';// Amber
      case 'selected': return '#10B981';// Green
      case 'free':
      default:
        // Use category color or default blue
        if (seat.categoryId && categories[seat.categoryId]) {
          return categories[seat.categoryId].color;
        }
        return '#3B82F6';// Blue
    }
  },[categories]);

  const drawSeat=useCallback((ctx,seat)=> {
    const status=getSeatStatus(seat.id);
    const x=seat.x * scale + pan.x;
    const y=seat.y * scale + pan.y;
    const size=(seat.size || 20) * scale;
    const color=getSeatColor(seat,status);

    // Seat background
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.roundRect(x,y,size,size,4 * scale);
    ctx.fill();

    // Seat border for selected/reserved
    if (status==='selected') {
      ctx.strokeStyle='#059669';
      ctx.lineWidth=2;
      ctx.stroke();
    } else if (status==='held') {
      ctx.strokeStyle='#D97706';
      ctx.lineWidth=2;
      ctx.stroke();
    }

    // Seat number
    if (seat.number && scale > 0.5) {
      ctx.fillStyle=status==='sold' ? '#9CA3AF' : '#FFFFFF';
      ctx.font=`${Math.min(10 * scale,size * 0.4)}px Arial`;
      ctx.textAlign='center';
      ctx.fillText(seat.number,x + size / 2,y + size / 2 + 3);
    }

    // Check mark for selected seats
    if (status==='selected' && scale > 0.7) {
      ctx.fillStyle='#FFFFFF';
      ctx.font=`${size * 0.6}px Arial`;
      ctx.fillText('✓',x + size / 2,y + size / 2 + 2);
    }
  },[scale,pan,getSeatStatus,getSeatColor]);

  const drawSection=useCallback((ctx,section)=> {
    const x=section.x * scale + pan.x;
    const y=section.y * scale + pan.y;
    const width=(section.width || 100) * scale;
    const height=(section.height || 80) * scale;

    // Section background
    ctx.fillStyle='rgba(59,130,246,0.1)';
    ctx.fillRect(x,y,width,height);

    // Section border
    ctx.strokeStyle=section.color || '#3B82F6';
    ctx.lineWidth=1;
    ctx.strokeRect(x,y,width,height);

    // Section label
    if (section.label && scale > 0.6) {
      ctx.fillStyle='#9CA3AF';
      ctx.font=`${12 * scale}px Arial`;
      ctx.textAlign='center';
      ctx.fillText(section.label,x + width / 2,y + height / 2);
    }
  },[scale,pan]);

  const draw=useCallback(()=> {
    const canvas=canvasRef.current;
    if (!canvas) return;

    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Draw grid (light)
    drawGrid(ctx,canvas.width,canvas.height);

    // Draw stage
    drawStage(ctx);

    // Draw sections first
    elements.filter(el=> el.type==='section').forEach(section=> {
      drawSection(ctx,section);
    });

    // Draw seats on top
    elements.filter(el=> el.type==='seat').forEach(seat=> {
      drawSeat(ctx,seat);
    });
  },[elements,drawGrid,drawStage,drawSection,drawSeat]);

  // Event handlers
  const getMousePos=useCallback((e)=> {
    const canvas=canvasRef.current;
    if (!canvas) return {x: 0,y: 0};

    const rect=canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / scale,
      y: (e.clientY - rect.top - pan.y) / scale
    };
  },[scale,pan]);

  const handleMouseDown=useCallback((e)=> {
    if (readonly) return;

    const pos=getMousePos(e);

    // Check if clicking on a seat
    const clickedSeat=elements.find(element=> {
      if (element.type !=='seat') return false;
      const size=element.size || 20;
      return pos.x >=element.x && pos.x <=element.x + size && 
             pos.y >=element.y && pos.y <=element.y + size;
    });

    if (clickedSeat) {
      const status=getSeatStatus(clickedSeat.id);
      if (status==='free' || status==='selected') {
        onSeatSelect?.(clickedSeat);
      }
      return;
    }

    // Start panning
    setIsDragging(true);
    setDragStart({x: e.clientX - pan.x,y: e.clientY - pan.y});
  },[readonly,elements,getMousePos,getSeatStatus,onSeatSelect,pan]);

  const handleMouseMove=useCallback((e)=> {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  },[isDragging,dragStart]);

  const handleMouseUp=useCallback(()=> {
    setIsDragging(false);
  },[]);

  const handleWheel=useCallback((e)=> {
    e.preventDefault();
    const delta=e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev=> Math.min(Math.max(prev * delta,0.2),3));
  },[]);

  const zoomIn=useCallback(()=> {
    setScale(prev=> Math.min(prev * 1.2,3));
  },[]);

  const zoomOut=useCallback(()=> {
    setScale(prev=> Math.max(prev * 0.8,0.2));
  },[]);

  const resetView=useCallback(()=> {
    setScale(1);
    setPan({x: 50,y: 50});
  },[]);

  // Setup canvas
  useEffect(()=> {
    const canvas=canvasRef.current;
    const container=containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas=()=> {
      const rect=container.getBoundingClientRect();
      canvas.width=rect.width;
      canvas.height=rect.height;
      draw();
    };

    resizeCanvas();
    window.addEventListener('resize',resizeCanvas);
    return ()=> window.removeEventListener('resize',resizeCanvas);
  },[draw]);

  // Redraw when dependencies change
  useEffect(()=> {
    draw();
  },[draw]);

  return (
    <div className="relative w-full h-full bg-zinc-900 rounded-lg overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <button
          onClick={zoomIn}
          className="p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg"
          title="Zoom In"
        >
          <SafeIcon icon={FiZoomIn} className="w-4 h-4" />
        </button>
        <button
          onClick={zoomOut}
          className="p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg"
          title="Zoom Out"
        >
          <SafeIcon icon={FiZoomOut} className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg"
          title="Reset View"
        >
          <SafeIcon icon={FiMove} className="w-4 h-4" />
        </button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute top-4 left-4 z-10 bg-zinc-700 text-white px-3 py-1 rounded-lg text-sm">
        {Math.round(scale * 100)}%
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab"
        style={{cursor: isDragging ? 'grabbing' : 'grab'}}
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

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-zinc-800/90 text-white p-3 rounded-lg">
        <div className="space-y-2">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
            <span className="text-sm">Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span className="text-sm">Selected</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-amber-500 rounded mr-2"></div>
            <span className="text-sm">Reserved</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-500 rounded mr-2"></div>
            <span className="text-sm">Sold</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {!readonly && (
        <div className="absolute bottom-4 right-4 z-10 bg-zinc-800/90 text-white p-3 rounded-lg text-sm max-w-xs">
          <div className="space-y-1">
            <div><strong>Click:</strong> Select/deselect seat</div>
            <div><strong>Drag:</strong> Pan view</div>
            <div><strong>Wheel:</strong> Zoom in/out</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatMap;