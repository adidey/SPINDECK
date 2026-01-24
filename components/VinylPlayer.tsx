
import React, { useState, useRef, useEffect } from 'react';
import { Track } from '../types';

interface VinylPlayerProps {
  currentTrack: Track;
  progress: number;
  isPlaying: boolean;
  onScrub: (newProgress: number) => void;
  rotationSpeed?: number;
}

const VinylPlayer: React.FC<VinylPlayerProps> = ({ 
  currentTrack, 
  progress, 
  isPlaying, 
  onScrub,
  rotationSpeed = 2 
}) => {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startAngleRef = useRef(0);
  const currentRotationRef = useRef(0);
  
  useEffect(() => {
    let animationId: number;
    const animate = () => {
      if (isPlaying && !isDragging) {
        setRotation(prev => {
          const delta = (rotationSpeed * 0.12);
          currentRotationRef.current = (prev + delta) % 360;
          return currentRotationRef.current;
        });
      }
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, isDragging, rotationSpeed]);

  const getAngle = (clientX: number, clientY: number) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    const angle = getAngle(e.clientX, e.clientY);
    startAngleRef.current = angle - currentRotationRef.current;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const angle = getAngle(e.clientX, e.clientY);
    const newRotation = angle - startAngleRef.current;
    const delta = newRotation - currentRotationRef.current;
    if (Math.abs(delta) < 180) {
      const seekFactor = 0.003;
      onScrub(Math.max(0, Math.min(1, progress + (delta * seekFactor))));
    }
    setRotation(newRotation);
    currentRotationRef.current = newRotation;
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Precision Frame */}
      <div className="absolute w-[400px] h-[400px] border border-[#222] rounded-full pointer-events-none" />
      
      <div 
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setIsDragging(false)}
        onPointerLeave={() => setIsDragging(false)}
        className="relative w-80 h-80 rounded-full cursor-grab active:cursor-grabbing select-none"
        style={{ touchAction: 'none' }}
      >
        <div 
          className="absolute inset-0 rounded-full bg-[#0A0A0A] border border-[#222] overflow-hidden flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.5)]"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Groove Texture */}
          <div className="absolute inset-0 opacity-40 bg-[repeating-radial-gradient(circle_at_center,_#111_0px,_#111_0.5px,_#000_1px)]" />
          
          {/* Industrial Center Label with 8-bit Display Aesthetic */}
          <div className="relative w-28 h-28 rounded-full border-[10px] border-[#0A0A0A] bg-black overflow-hidden flex flex-col items-center justify-center shadow-inner">
            {/* 8-bit styled Image */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
               <img 
                src={currentTrack.albumArt} 
                alt=""
                className="w-full h-full object-cover opacity-90"
                style={{ imageRendering: 'pixelated' }}
                draggable={false}
              />
              {/* Pixel Grid / Scanline Overlay */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-30" 
                style={{ 
                  backgroundImage: `linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))`,
                  backgroundSize: '100% 2px, 3px 100%'
                }} 
              />
              {/* Subtle CRT Flicker effect could be added here if desired */}
            </div>

            {/* Overlay for "Digital Display" aesthetic */}
            <div className="absolute inset-0 bg-black/10" />
            
            <div className="z-10 bg-white/90 backdrop-blur-sm px-2 py-0.5 border border-black/20 text-[7px] font-mono font-bold text-black tracking-tight flex flex-col items-center shadow-sm">
              <span className="leading-none">SIGNAL_READY</span>
              <span className="opacity-40 text-[5px]">CORE_v.2.0</span>
            </div>
            
            {/* Spindle hole */}
            <div className="z-10 mt-1.5 w-2.5 h-2.5 bg-[#0A0A0A] rounded-full border border-white/5" />
          </div>
        </div>
        
        {/* Subtle Matte Reflection */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

export default VinylPlayer;
