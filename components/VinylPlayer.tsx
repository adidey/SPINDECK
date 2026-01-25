
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
  rotationSpeed = 1.2
}) => {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startAngleRef = useRef(0);
  const currentRotationRef = useRef(0);
  const velocityRef = useRef(0);
  const lastAngleRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityHistoryRef = useRef<number[]>([]);
  const requestRef = useRef<number>(null);

  // Inertia constants
  const FRICTION = 0.985;
  const MIN_VELOCITY = 0.01;

  useEffect(() => {
    const animate = () => {
      if (!isDragging) {
        const baseSpeed = isPlaying ? rotationSpeed : 0;

        // Decay the manual velocity (inertia)
        velocityRef.current *= FRICTION;

        if (Math.abs(velocityRef.current) < MIN_VELOCITY) {
          velocityRef.current = 0;
        }

        // Apply rotation
        currentRotationRef.current = (currentRotationRef.current + baseSpeed + velocityRef.current) % 360;
        setRotation(currentRotationRef.current);
      }
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
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
    lastAngleRef.current = angle;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    velocityHistoryRef.current = [];
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const now = performance.now();
    const angle = getAngle(e.clientX, e.clientY);
    const dt = now - lastTimeRef.current;

    if (dt > 0) {
      let dAngle = angle - lastAngleRef.current;

      // Handle 360 wraparound
      if (dAngle > 180) dAngle -= 360;
      if (dAngle < -180) dAngle += 360;

      // Update velocity history for smooth inertia on release
      velocityHistoryRef.current.push(dAngle);
      if (velocityHistoryRef.current.length > 5) {
        velocityHistoryRef.current.shift();
      }

      const newRotation = angle - startAngleRef.current;
      const deltaFromLastRotation = newRotation - currentRotationRef.current;

      // Only scrub if the change isn't a massive jump (wraparound)
      if (Math.abs(deltaFromLastRotation) < 180) {
        const seekSensitivity = 0.0012;
        onScrub(Math.max(0, Math.min(1, progress + (deltaFromLastRotation * seekSensitivity))));
      }

      setRotation(newRotation);
      currentRotationRef.current = newRotation;
      lastAngleRef.current = angle;
      lastTimeRef.current = now;
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    // Calculate final inertia from velocity history
    if (velocityHistoryRef.current.length > 0) {
      const avgVelocity = velocityHistoryRef.current.reduce((a, b) => a + b, 0) / velocityHistoryRef.current.length;
      velocityRef.current = avgVelocity;
    }
  };

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Platter Base */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="relative w-56 h-56 rounded-full cursor-grab active:cursor-grabbing select-none z-10"
        style={{ touchAction: 'none' }}
      >
        <div
          className="absolute inset-0 rounded-full bg-[#080808] border border-white/10 overflow-hidden flex items-center justify-center shadow-2xl"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Mechanical Groove Texture */}
          <div className="absolute inset-0 opacity-40 bg-[repeating-radial-gradient(circle_at_center,_#111_0px,_#111_1px,_#000_2px)]" />

          {/* Stroboscopic Markings */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(72)].map((_, i) => (
              <div
                key={i}
                className="absolute h-full w-[1px]"
                style={{ transform: `rotate(${i * 5}deg)` }}
              >
                <div className="w-[1px] h-2 bg-white/5 absolute top-0" />
              </div>
            ))}
          </div>

          {/* Center Label Area */}
          <div className="relative w-24 h-24 rounded-full border border-white/10 bg-[#050505] overflow-hidden flex flex-col items-center justify-center">
            <img
              src={currentTrack.albumArt}
              alt=""
              className="absolute inset-0 w-full h-full object-cover grayscale brightness-50 contrast-150"
              style={{ imageRendering: 'pixelated' }}
              draggable={false}
            />
            <div className="absolute inset-0 bg-black/50" />

            <div className="z-10 flex flex-col items-center">
              <div className="bg-white px-1.5 py-0.5 text-[6px] font-pixel font-bold text-black uppercase tracking-tighter shadow-lg">
                {isPlaying ? 'RUN' : 'STP'}
              </div>
              <div className="w-1.5 h-1.5 bg-white/80 rounded-full mt-2 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Tonearm Visual Indicator */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-[1px] bg-white/20 z-0" />
    </div>
  );
};

export default VinylPlayer;
