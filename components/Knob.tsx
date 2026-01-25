
import React, { useRef, useState } from 'react';
import './Knob.css';

interface KnobProps {
  label: string;
  value: number;
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
    
    let rawVal = (adjustedAngle - 45) / 270;
    if (rawVal < 0 && rawVal > -0.2) rawVal = 0;
    if (rawVal > 1 && rawVal < 1.2) rawVal = 1;

    const clampedVal = Math.max(0, Math.min(1, rawVal));
    onChange(clampedVal);
  };

  return (
    <div className="knob-container">
      <span className="knob-label">{label}</span>
      <div 
        ref={knobRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setIsDragging(false)}
        className="knob-base"
      >
        <div className="knob-recess" />
        <div 
          className="knob-dial"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div className="dial-machining" />
          <div className="glow-indicator" />
        </div>
      </div>
    </div>
  );
};

export default Knob;
