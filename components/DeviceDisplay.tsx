
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
    <div className="relative w-full aspect-square bg-[#010101] rounded-[2.2rem] overflow-hidden flex flex-col p-8 select-none shadow-[inset_0_0_80px_rgba(0,0,0,1)]">
      {/* Heavy Pixel Grid */}
      <div className="absolute inset-0 pixel-grid z-30 pointer-events-none opacity-30" />
      
      {/* CRT Scanline Bars */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_6px] z-40 pointer-events-none opacity-20" />

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col justify-between text-white/90 animate-pixel-glow">
        {/* Status Header */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-pixel tracking-[0.3em] font-bold text-white/30 uppercase">{focusMode}</span>
            <span className="text-[8px] font-mono tracking-widest text-white/20 uppercase">UNIT_REV_0912</span>
          </div>
          <div className="flex flex-col items-end">
             <div className={`w-2.5 h-2.5 rounded-full mb-1 ${isActive ? 'bg-white shadow-[0_0_15px_white]' : 'bg-white/5'}`} />
          </div>
        </div>

        {/* High-Contrast Interactive Vinyl Platter */}
        <div className="relative self-center w-56 h-56 border-[0.5px] border-white/5 bg-[#050505] overflow-hidden flex items-center justify-center">
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

        {/* Footer Info */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div className="flex flex-col max-w-[60%]">
                <span className="text-[14px] font-pixel tracking-[0.2em] font-bold uppercase truncate">{track.title}</span>
                <span className="text-[9px] font-mono tracking-widest text-white/30 uppercase truncate">{track.artist}</span>
            </div>
            <span className="text-5xl font-pixel tabular-nums tracking-tighter leading-none">{timeStr}</span>
          </div>
          
          {/* High-Res Progress Bar */}
          <div className="h-[2px] w-full bg-white/5 overflow-hidden rounded-full">
            <div 
              className="h-full bg-white transition-all duration-300 shadow-[0_0_10px_white]"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Screen Glare Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-50 opacity-40" />
    </div>
  );
};

export default DeviceDisplay;
