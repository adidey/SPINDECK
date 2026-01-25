
import React, { useEffect, useState } from 'react';
import { FocusMode } from '../types';
import { FOCUS_CONFIG } from '../constants';

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

  const strokeDasharray = 2 * Math.PI * 195;
  const strokeDashoffset = strokeDasharray * (1 - timeLeft / total);

  return (
    <div className="relative flex items-center justify-center">
      {/* Industrial Meter Ring */}
      <svg className="w-[480px] h-[480px] -rotate-90 pointer-events-none">
        <circle
          cx="240" cy="240" r="195"
          fill="transparent"
          stroke="#27272A"
          strokeWidth="1"
          strokeDasharray="4, 6"
        />
        <circle
          cx="240" cy="240" r="195"
          fill="transparent"
          stroke={isActive ? FOCUS_CONFIG[mode].color : '#3F3F46'}
          strokeWidth="2"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>

      {/* Center Readout Display */}
      <div className="absolute top-[12%] flex flex-col items-center">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-zinc-800'}`} />
          <span className="text-[10px] font-mono text-zinc-500 tracking-[0.3em] uppercase font-bold">
            SIGNAL_READOUT
          </span>
        </div>
        <span className="text-5xl font-mono font-medium text-white tracking-tighter tabular-nums">
          {formatTime(timeLeft)}
        </span>
      </div>
    </div>
  );
};

export default FocusTimer;
