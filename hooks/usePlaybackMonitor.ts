
import { useMemo } from 'react';

/**
 * Monitor for audio playback position.
 * Converts raw progress into MM:SS format for hardware display.
 */
export const usePlaybackMonitor = (progressMs: number) => {
    const timeStr = useMemo(() => {
        const totalSeconds = Math.floor(progressMs / 1000);
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }, [progressMs]);

    return { timeStr };
};
