
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
    <div className="flex flex-col items-center gap-5 group select-none">
      <span className="text-[11px] font-black text-white/40 group-hover:text-white/60 transition-colors tracking-[0.25em] uppercase">
        {label}
      </span>
      <div
        ref={knobRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-24 h-24 bg-[#0a0a0a] rounded-full flex items-center justify-center cursor-ns-resize active:cursor-grabbing shadow-[0_15px_35px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.02)]"
        style={{ touchAction: 'none' }}
      >
        {/* Recessed Well */}
        <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-black to-[#111] shadow-[inset_0_2px_6px_rgba(0,0,0,1)]" />

        {/* Main Dial Body */}
        <div
          className="relative w-[82%] h-[82%] rounded-full bg-[#111] shadow-[0_8px_16px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.05)] flex items-center justify-center transition-transform duration-75 ease-out"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Subtle Texture */}
          <div className="absolute inset-0 rounded-full opacity-5 bg-[conic-gradient(from_0deg,_#444,_#111,_#444,_#111,_#444)]" />

          {/* Glowing Indicator Dot */}
          <div className="absolute top-2 w-2.5 h-2.5 bg-[#ff8c00] rounded-full shadow-[0_0_15px_rgba(255,140,0,0.9)] border border-black/40" />
        </div>

        {/* Inner Circumference Ring */}
        <div className="absolute inset-3 rounded-full border border-white/[0.03] pointer-events-none" />
      </div>
    </div>
  );
};

export default Knob;
