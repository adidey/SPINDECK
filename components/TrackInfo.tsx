
import React from 'react';
import { Track } from '../types';

interface TrackInfoProps {
  track: Track;
  progress: number;
}

const TrackInfo: React.FC<TrackInfoProps> = ({ track, progress }) => {
  return (
    <div className="flex flex-col items-center text-center w-full max-w-sm space-y-4">
      <div className="flex flex-col items-center space-y-1">
        <div className="flex items-center gap-4 text-zinc-600">
           <span className="text-[9px] font-mono tracking-widest uppercase font-bold">CODE_{track.trackNumber.toString().padStart(2, '0')}</span>
           <div className="w-[1px] h-2 bg-zinc-800" />
           <span className="text-[9px] font-mono tracking-widest uppercase">{track.albumTitle}</span>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight uppercase leading-none">
          {track.title}
        </h2>
        <p className="text-[10px] font-mono text-zinc-400 tracking-[0.2em] uppercase font-bold">
          {track.artist}
        </p>
      </div>
      
      {/* Industrial Linear Meter */}
      <div className="w-72 flex flex-col gap-2">
        <div className="h-[3px] bg-zinc-900 w-full relative">
          <div 
            className="absolute inset-y-0 left-0 bg-white transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex justify-between w-full">
          <span className="text-[8px] font-mono text-zinc-600 uppercase">Input_Feed</span>
          <span className="text-[8px] font-mono text-zinc-600 uppercase">Process_Status: Normal</span>
        </div>
      </div>
    </div>
  );
};

export default TrackInfo;
