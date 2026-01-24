
import React, { useRef, useState } from 'react';

interface KnobProps {
  label: string;
  value: number; // 0 to 1
  onChange: (val: number) => void;
}

const Knob: React.FC<KnobProps> = ({ label, value, onChange }) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const rotation = -135 + (value * 270);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !knobRef.current) return;

    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const angleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    let angleDeg = angleRad * (180 / Math.PI);
    
    let adjustedAngle = angleDeg + 90; 
    if (adjustedAngle < 0) adjustedAngle += 360;
    
    // Normalize mapping from 45deg (bottom-left) to 315deg (bottom-right)
    let rawVal = (adjustedAngle - 45) / 270;
    if (rawVal < 0 && rawVal > -0.2) rawVal = 0;
    if (rawVal > 1 && rawVal < 1.2) rawVal = 1;

    const clampedVal = Math.max(0, Math.min(1, rawVal));
    onChange(clampedVal);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 group select-none">
      <span className="text-[11px] font-black text-white/40 group-hover:text-white transition-colors tracking-widest uppercase">
        {label}
      </span>
      <div 
        ref={knobRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-20 h-20 bg-[#121212] rounded-full flex items-center justify-center cursor-ns-resize active:cursor-grabbing shadow-[0_15px_30px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)]"
        style={{ touchAction: 'none' }}
      >
        {/* Deep Matte Base */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#080808] shadow-inner" />
        
        {/* Rotating Cylinder Body */}
        <div 
          className="relative w-[85%] h-[85%] rounded-full bg-[#111] shadow-[0_10px_20px_rgba(0,0,0,0.6)] flex items-center justify-center transition-transform duration-75 ease-out"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Subtle Brushed Metal Texture Overlay */}
          <div className="absolute inset-0 rounded-full opacity-10 bg-[conic-gradient(from_0deg,_#333,_#111,_#333,_#111,_#333)]" />
          
          {/* Indicator Dot - Brass/Orange Glow */}
          <div className="absolute top-2 w-2 h-2 bg-[#ff8c00] rounded-full shadow-[0_0_12px_rgba(255,140,0,0.8)] border border-black/50" />
        </div>
        
        {/* Knob Inner Ring Detail */}
        <div className="absolute inset-2 rounded-full border border-white/5 pointer-events-none opacity-20" />
      </div>
    </div>
  );
};

export default Knob;
