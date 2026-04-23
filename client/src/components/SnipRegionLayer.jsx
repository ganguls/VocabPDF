import React, { useState, useEffect } from 'react';

export default function SnipRegionLayer({ containerRef, onSnip, active, onCancel }) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentPos, setCurrentPos] = useState(null);

  useEffect(() => {
    if (!active) {
      setIsDrawing(false);
      setStartPos(null);
      setCurrentPos(null);
    }
  }, [active]);

  if (!active) return null;

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click
    e.preventDefault();
    
    const container = containerRef.current;
    if (!container) return;

    // Use pageX/pageY which includes scroll offset relative to the document
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left + container.scrollLeft;
    const y = e.clientY - rect.top + container.scrollTop;
    
    setStartPos({ x, y, clientX: e.clientX, clientY: e.clientY });
    setCurrentPos({ x, y, clientX: e.clientX, clientY: e.clientY });
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left + container.scrollLeft;
    const y = e.clientY - rect.top + container.scrollTop;

    setCurrentPos({ x, y, clientX: e.clientX, clientY: e.clientY });
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (Math.abs(currentPos.x - startPos.x) < 5 || Math.abs(currentPos.y - startPos.y) < 5) {
      onCancel(); // Click without drag cancels
      return;
    }

    extractSnip();
  };

  const extractSnip = () => {
    if (!containerRef.current) {
      onCancel();
      return;
    }

    // Viewport relative bounds
    const rect = {
      left: Math.min(startPos.clientX, currentPos.clientX),
      top: Math.min(startPos.clientY, currentPos.clientY),
      right: Math.max(startPos.clientX, currentPos.clientX),
      bottom: Math.max(startPos.clientY, currentPos.clientY),
      width: Math.abs(currentPos.clientX - startPos.clientX),
      height: Math.abs(currentPos.clientY - startPos.clientY),
    };

    const canvases = Array.from(containerRef.current.querySelectorAll('canvas.react-pdf__Page__canvas'));
    
    const intersecting = canvases.map(canvas => {
       const canvasRect = canvas.getBoundingClientRect();
       const overlap = {
         left: Math.max(rect.left, canvasRect.left),
         top: Math.max(rect.top, canvasRect.top),
         right: Math.min(rect.right, canvasRect.right),
         bottom: Math.min(rect.bottom, canvasRect.bottom)
       };
       if (overlap.left < overlap.right && overlap.top < overlap.bottom) {
         overlap.width = overlap.right - overlap.left;
         overlap.height = overlap.bottom - overlap.top;
         return { canvas, canvasRect, overlap };
       }
       return null;
    }).filter(Boolean);

    if (intersecting.length === 0) {
      onCancel();
      return;
    }

    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = rect.width;
    mergedCanvas.height = rect.height;
    const ctx = mergedCanvas.getContext('2d');
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, rect.width, rect.height);

    intersecting.forEach(({ canvas, canvasRect, overlap }) => {
      // react-pdf scales canvas internally based on devicePixelRatio
      const scaleX = canvas.width / canvasRect.width;
      const scaleY = canvas.height / canvasRect.height;

      const sx = (overlap.left - canvasRect.left) * scaleX;
      const sy = (overlap.top - canvasRect.top) * scaleY;
      const sw = overlap.width * scaleX;
      const sh = overlap.height * scaleY;

      const dx = overlap.left - rect.left;
      const dy = overlap.top - rect.top;

      ctx.drawImage(canvas, sx, sy, sw, sh, dx, dy, overlap.width, overlap.height);
    });

    const base64 = mergedCanvas.toDataURL('image/jpeg', 0.9);
    onSnip(base64);
  };

  const getRectStyle = () => {
    if (!startPos || !currentPos) return {};
    const left = Math.min(startPos.x, currentPos.x);
    const top = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);
    return { left, top, width, height };
  };

  return (
    <div 
      className="snip-layer-overlay"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={(e) => { e.preventDefault(); onCancel(); }}
    >
      <div className="snip-instructions">
        <span>Click and drag to select an area to scan. Right-click to cancel.</span>
      </div>
      {isDrawing && (
        <div className="snip-box" style={getRectStyle()} />
      )}
    </div>
  );
}
