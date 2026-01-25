
import { FocusMode, Track } from './types';

export const COLORS = {
  background: '#080808',
  chassis: '#121212',
  accent: '#d4af37', // Brass/Gold
  copper: '#d2691e',
  textDim: 'rgba(255,255,255,0.3)'
};

export const FOCUS_CONFIG = {
  [FocusMode.DEEP]: {
    duration: 50 * 60,
    label: 'PRGM_DEEP',
    color: '#FFFFFF'
  },
  [FocusMode.LIGHT]: {
    duration: 15 * 60,
    label: 'PRGM_LIGHT',
    color: '#FFFFFF'
  },
  [FocusMode.BREAK]: {
    duration: 5 * 60,
    label: 'PRGM_BREAK',
    color: '#FFFFFF'
  }
};

export const MOCK_TRACKS: Track[] = [
  {
    id: '1',
    title: 'NIGHT_DRIVE',
    artist: 'SYNTH_WAVE',
    albumArt: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400&h=400',
    durationMs: 215000,
    albumTitle: 'NEON_HORIZON',
    trackNumber: 1
  },
  {
    id: '2',
    title: 'VOID_ECHO',
    artist: 'AMBIENT_UNIT',
    albumArt: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=400&h=400',
    durationMs: 180000,
    albumTitle: 'STATIC_SPACE',
    trackNumber: 2
  },
  {
    id: '3',
    title: 'PULSE_WIDTH',
    artist: 'LOGIC_GATE',
    albumArt: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=400&h=400',
    durationMs: 240000,
    albumTitle: 'MODULAR_SOUL',
    trackNumber: 3
  }
];
