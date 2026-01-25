
import React from 'react';
import { Track } from '../types';
import VinylPlayer from './VinylPlayer.tsx';

interface DeviceDisplayProps {
  track: Track;
  progress: number;
  timeStr: string;
  isActive: boolean;
  focusMode: string;
  isPlaying: boolean;
  onScrub: (newProgress: number) => void;
}

const DeviceDisplay: React.FC<DeviceDisplayProps> = ({ track, progress, timeStr, isActive, focusMode, isPlaying, onScrub }) => {
  return (
    <div className="relative w-full aspect-square bg-[#0a0a0a] rounded-[2.2rem] overflow-hidden flex flex-col p-8 select-none shadow-[inset_0_0_80px_rgba(0,0,0,1)]">
      {/* Heavy Pixel Grid */}
      <div className="absolute inset-0 pixel-grid z-30 pointer-events-none opacity-20" />

      {/* CRT Scanline Bars */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] z-40 pointer-events-none opacity-10" />

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col justify-between text-white/90 animate-pixel-glow">
        {/* Status Header */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-pixel tracking-[0.2em] font-bold text-white/50 uppercase">{focusMode}</span>
            <span className="text-[9px] font-mono tracking-widest text-[#ff9d00]/40 uppercase">UNIT_REV_0912</span>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white shadow-[0_0_10px_white] blink-active' : 'bg-white/10'}`} />
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-[#ff9d00] shadow-[0_0_15px_#ff9d00]' : 'bg-[#333]'}`} />
          </div>
        </div>

        {/* High-Contrast Interactive Vinyl Platter */}
        <div className="relative self-center w-64 h-64 border-[0.5px] border-white/5 bg-[#050505] overflow-hidden flex items-center justify-center">
          <VinylPlayer
            currentTrack={track}
            progress={progress}
            isPlaying={isPlaying}
            onScrub={onScrub}
          />

          {/* Depth Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-40 pointer-events-none" />

          {/* Subtle Dither Pattern Over Platter */}
          <div className="absolute inset-0 opacity-10 pointer-events-none z-20 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>

        {/* Footer Info - New Layout */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div className="flex flex-col max-w-[50%]">
              <span className="text-[16px] font-pixel tracking-[0.1em] font-bold uppercase truncate text-[#ff9d00]">{track.title}</span>
              <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase truncate">{track.artist}</span>
            </div>

            <span className="text-[42px] font-pixel tabular-nums tracking-tighter leading-none text-[#ff9d00]">{timeStr}</span>
          </div>

          {/* High-Res Progress Bar */}
          <div className="h-[3px] w-full bg-[#333] overflow-hidden rounded-full">
            <div
              className="h-full bg-[#ff9d00] transition-all duration-75 shadow-[0_0_10px_#ff9d00]"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Screen Glare Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-50 opacity-20" />
    </div>
  );
};

export default DeviceDisplay;
