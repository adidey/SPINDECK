
import { FocusMode, Track } from './types';

export const COLORS = {
  background: '#121212',
  surface: '#222222',
  aluminum: '#CCCCCC',
  signalRed: '#D91E18',
  textMuted: '#666666'
};

export const FOCUS_CONFIG = {
  [FocusMode.DEEP]: {
    duration: 50 * 60,
    rotationSpeed: 3,
    color: COLORS.signalRed,
    label: '01'
  },
  [FocusMode.LIGHT]: {
    duration: 25 * 60,
    rotationSpeed: 2,
    color: COLORS.aluminum,
    label: '02'
  },
  [FocusMode.BREAK]: {
    duration: 5 * 60,
    rotationSpeed: 1,
    color: '#444444',
    label: '03'
  }
};

export const MOCK_TRACKS: Track[] = [
  {
    id: '1',
    title: 'LINEAR OSCILLATION',
    artist: 'BRAUN AUDIO',
    albumArt: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400&h=400',
    durationMs: 215000
  },
  {
    id: '2',
    title: 'SQUARE WAVE',
    artist: 'SYSTEM-10',
    albumArt: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=400&h=400',
    durationMs: 180000
  },
  {
    id: '3',
    title: 'WHITE NOISE MOD',
    artist: 'RAMS DESIGNS',
    albumArt: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=400&h=400',
    durationMs: 240000
  },
  {
    id: '4',
    title: 'SIGNAL FEEDBACK',
    artist: 'ANALOG UNIT',
    albumArt: 'https://images.unsplash.com/photo-1496293455970-f8581aae0e3c?auto=format&fit=crop&q=80&w=400&h=400',
    durationMs: 195000
  }
];
