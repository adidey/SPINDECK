
import { useState, useEffect, useMemo } from 'react';
import { FocusMode } from '../types';
import { FOCUS_CONFIG } from '../constants';

export const useFocusTimer = (mode: FocusMode, onComplete: () => void) => {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(FOCUS_CONFIG[mode].duration);

  // Reset timer when mode changes or when inactive
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(FOCUS_CONFIG[mode].duration);
    }
  }, [mode, isActive]);

  useEffect(() => {
    let timerId: number;
    if (isActive && timeLeft > 0) {
      timerId = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [isActive, timeLeft, onComplete]);

  const timeStr = useMemo(() => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  return { isActive, setIsActive, timeLeft, timeStr };
};
