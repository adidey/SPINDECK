
export enum ProgramState {
  STANDBY = 'STANDBY',
  ENGAGED = 'ENGAGED',
  HOLD = 'HOLD'
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  durationMs: number;
  albumTitle: string;
  trackNumber: number;
}

export interface PlaybackState {
  currentTrack: Track;
  isPlaying: boolean;
  progressMs: number;
}
