
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
          const delta = (rotationSpeed * 0.1);
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
      const seekFactor = 0.002;
      onScrub(Math.max(0, Math.min(1, progress + (delta * seekFactor))));
    }
    setRotation(newRotation);
    currentRotationRef.current = newRotation;
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Precision Industrial Frame */}
      <div className="absolute w-[420px] h-[420px] border border-[#27272A] rounded-full pointer-events-none opacity-50" />
      
      {/* Platter Base */}
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
          className="absolute inset-0 rounded-full bg-[#121212] border-2 border-[#1E1E1E] overflow-hidden flex items-center justify-center shadow-2xl"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Mechanical Groove Texture - Subtle and Matte */}
          <div className="absolute inset-0 opacity-20 bg-[repeating-radial-gradient(circle_at_center,_#222_0px,_#222_0.5px,_#000_1px)]" />
          
          {/* Stroboscopic Markings on Rim */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(60)].map((_, i) => (
              <div 
                key={i} 
                className="absolute h-full w-[1px]" 
                style={{ transform: `rotate(${i * 6}deg)` }}
              >
                <div className="w-[1px] h-2 bg-[#222] absolute top-0" />
              </div>
            ))}
          </div>

          {/* Center Display Label */}
          <div className="relative w-32 h-32 rounded-full border-[1px] border-[#222] bg-[#0A0A0A] overflow-hidden flex flex-col items-center justify-center">
             <img 
                src={currentTrack.albumArt} 
                alt=""
                className="absolute inset-0 w-full h-full object-cover grayscale brightness-50 contrast-125"
                style={{ imageRendering: 'pixelated' }}
                draggable={false}
              />
              {/* Overlay for matte CRT aesthetic */}
              <div className="absolute inset-0 bg-black/40" />
              
              {/* Technical Readout */}
              <div className="z-10 flex flex-col items-center gap-1">
                <div className="bg-white px-1.5 py-0.5 text-[6px] font-mono font-bold text-black uppercase tracking-tighter">
                  ACT_STATE: {isPlaying ? 'RUN' : 'STP'}
                </div>
                <div className="w-1.5 h-1.5 bg-white rounded-full mt-1" />
              </div>
          </div>
        </div>
        
        {/* Subtle Matte Sheen */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

export default VinylPlayer;
