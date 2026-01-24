
export enum FocusMode {
  DEEP = 'DEEP FOCUS',
  LIGHT = 'LIGHT FOCUS',
  BREAK = 'BREAK MODE'
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  durationMs: number;
}

export interface SessionRecord {
  id: string;
  mode: FocusMode;
  startTime: number;
  durationSeconds: number;
  tracks: string[];
}

export interface PlaybackState {
  currentTrack: Track;
  isPlaying: boolean;
  progressMs: number;
}
