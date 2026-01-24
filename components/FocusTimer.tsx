
import React, { useEffect, useState } from 'react';
import { FocusMode } from '../types';
import { FOCUS_CONFIG, COLORS } from '../constants';

interface FocusTimerProps {
  mode: FocusMode;
  isActive: boolean;
  onComplete: () => void;
  onTick?: (remaining: number) => void;
}

const FocusTimer: React.FC<FocusTimerProps> = ({ mode, isActive, onComplete, onTick }) => {
  const [timeLeft, setTimeLeft] = useState(FOCUS_CONFIG[mode].duration);
  const total = FOCUS_CONFIG[mode].duration;
  
  useEffect(() => {
    setTimeLeft(FOCUS_CONFIG[mode].duration);
  }, [mode]);

  useEffect(() => {
    let timer: number;
    if (isActive && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft(prev => {
          const next = prev - 1;
          if (onTick) onTick(next);
          if (next <= 0) {
            clearInterval(timer);
            onComplete();
            return 0;
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft, onComplete, onTick]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const strokeDasharray = 2 * Math.PI * 185;
  const strokeDashoffset = strokeDasharray * (1 - timeLeft / total);

  return (
    <div className="relative flex items-center justify-center">
      {/* Precision Meter */}
      <svg className="w-[440px] h-[440px] -rotate-90 pointer-events-none">
        <circle
          cx="220" cy="220" r="185"
          fill="transparent"
          stroke="#1A1A1A"
          strokeWidth="1"
        />
        <circle
          cx="220" cy="220" r="185"
          fill="transparent"
          stroke={FOCUS_CONFIG[mode].color}
          strokeWidth="2"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      
      {/* Digital Readout */}
      <div className="absolute top-[15%] flex flex-col items-center">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-red-600' : 'bg-[#333]'}`} />
          <span className="text-[10px] font-mono text-[#444] tracking-[0.2em] uppercase">
            System Monitoring
          </span>
        </div>
        <span className="text-4xl font-mono font-medium text-white tracking-tight">
          {formatTime(timeLeft)}
        </span>
      </div>
    </div>
  );
};

export default FocusTimer;
