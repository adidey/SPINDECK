
import React from 'react';
import { Track } from '../types';

interface TrackInfoProps {
  track: Track;
  progress: number;
}

const TrackInfo: React.FC<TrackInfoProps> = ({ track, progress }) => {
  return (
    <div className="flex flex-col items-center text-center w-full max-w-sm">
      <h2 className="text-lg font-bold text-white tracking-widest uppercase mb-1">
        {track.title}
      </h2>
      <p className="text-[10px] font-mono text-[#666] tracking-widest uppercase">
        {track.artist}
      </p>
      
      {/* Industrial Progress Bar */}
      <div className="w-48 h-[2px] bg-[#222] mt-6 relative">
        <div 
          className="absolute inset-y-0 left-0 bg-[#CCCCCC] transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
        {/* Tick markers */}
        <div className="absolute top-1 left-0 w-full flex justify-between px-0">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-[1px] h-1 bg-[#333]" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrackInfo;
