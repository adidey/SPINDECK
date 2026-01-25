
import React from 'react';
import { Track } from '../types';
import VinylPlayer from './VinylPlayer.tsx';
import './DeviceDisplay.css';

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
    <div className="screen-container">
      <div className="pixel-overlay" />
      <div className="scanline-overlay" />

      <div className="screen-content">
        <div className="screen-header">
          <div className="header-meta">
            <div className="prgm-label">{focusMode}</div>
            <div className="rev-label">UNIT_REV_0912</div>
          </div>
          <div className={`active-dot ${isActive ? 'on' : 'off'}`} />
        </div>

        <div className="platter-area">
          <div className="grid-bg" />
          <VinylPlayer 
            currentTrack={track}
            progress={progress}
            isPlaying={isPlaying}
            onScrub={onScrub}
          />
        </div>

        <div className="screen-footer">
          <div className="track-meta-row">
            <div className="track-labels">
                <div className="title-display">{track.title}</div>
                <div className="artist-display">{track.artist}</div>
            </div>
            <div className="clock-display">{timeStr}</div>
          </div>
          
          <div className="progress-track">
            <div 
              className="progress-fill"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceDisplay;
