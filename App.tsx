
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { FocusMode, Track, SessionRecord } from './types.ts';
import { FOCUS_CONFIG, MOCK_TRACKS } from './constants.tsx';
import DeviceDisplay from './components/DeviceDisplay.tsx';
import Knob from './components/Knob.tsx';
import HistoryPanel from './components/HistoryPanel.tsx';

const App: React.FC = () => {
  const [focusMode, setFocusMode] = useState<FocusMode>(FocusMode.LIGHT);
  const [isActive, setIsActive] = useState(false);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [groundingLinks, setGroundingLinks] = useState<{title: string, uri: string}[]>([]);
  
  const [tracks, setTracks] = useState<Track[]>(MOCK_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [volume, setVolume] = useState(0.7);
  const [timeLeft, setTimeLeft] = useState(FOCUS_CONFIG[focusMode].duration);

  const [aiStatus, setAiStatus] = useState("SYSTEM_IDLE");

  const currentTrack = useMemo(() => tracks[currentTrackIndex] || MOCK_TRACKS[0], [tracks, currentTrackIndex]);

  const timeStr = useMemo(() => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  const handleSyncPlaylist = async () => {
    const envKey = typeof process !== 'undefined' ? process.env?.API_KEY : undefined;
    const hasKey = envKey && envKey !== 'undefined' && envKey.length > 5;
    
    if (!playlistUrl || !hasKey) {
      setIsSyncing(true);
      setAiStatus("BOOTING_LOCAL_STORAGE");
      setTimeout(() => {
        setTracks(MOCK_TRACKS);
        setIsSpotifyConnected(true);
        setIsSyncing(false);
      }, 1200);
      return;
    }

    setIsSyncing(true);
    setAiStatus("SYNC_PROTOCOL_INIT");
    
    try {
      const ai = new GoogleGenAI({ apiKey: envKey || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Search for this Spotify playlist and identify its tracks: ${playlistUrl}. Extract 5 distinct songs from it. Return ONLY a JSON array of objects with keys: id, title, artist, albumArt (use a high-quality Unsplash music URL related to the track mood), durationMs (actual or random 180000-300000), albumTitle, trackNumber.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                artist: { type: Type.STRING },
                albumArt: { type: Type.STRING },
                durationMs: { type: Type.NUMBER },
                albumTitle: { type: Type.STRING },
                trackNumber: { type: Type.NUMBER }
              },
              required: ["id", "title", "artist", "albumArt", "durationMs", "albumTitle", "trackNumber"]
            }
          }
        }
      });

      // Extract Grounding Sources
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const links = chunks
          .filter(chunk => chunk.web)
          .map(chunk => ({
            title: chunk.web?.title || 'Source',
            uri: chunk.web?.uri || '#'
          }));
        setGroundingLinks(links);
      }

      const text = response.text;
      const newTracks = JSON.parse(text);
      if (Array.isArray(newTracks) && newTracks.length > 0) {
        setTracks(newTracks);
        setAiStatus("SYNC_COMPLETE");
      } else {
        throw new Error("Invalid track data");
      }
      setTimeout(() => setIsSpotifyConnected(true), 1000);
    } catch (err) {
      console.warn("AI Sync failed or no key, using default protocol.", err);
      setAiStatus("FALLBACK_TO_INTERNAL");
      setTracks(MOCK_TRACKS);
      setTimeout(() => setIsSpotifyConnected(true), 1500);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleNextTrack = useCallback(() => {
    setCurrentTrackIndex(prev => (prev + 1) % tracks.length);
    setPlaybackProgress(0);
  }, [tracks.length]);

  const toggleSession = () => {
    setIsActive(!isActive);
    setIsPlaying(!isActive);
  };

  const handleSessionComplete = useCallback(() => {
    setIsActive(false);
    setIsPlaying(false);
    const newRecord: SessionRecord = {
      id: Math.random().toString(36).substr(2, 9),
      mode: focusMode,
      startTime: Date.now(),
      durationSeconds: FOCUS_CONFIG[focusMode].duration,
      tracks: [currentTrack.title]
    };
    setHistory(prev => [newRecord, ...prev]);
    setTimeLeft(FOCUS_CONFIG[focusMode].duration);
  }, [focusMode, currentTrack.title]);

  const handleSlantKnob = (val: number) => {
    let nextMode = FocusMode.LIGHT;
    if (val < 0.33) nextMode = FocusMode.BREAK;
    else if (val > 0.66) nextMode = FocusMode.DEEP;
    if (nextMode !== focusMode) {
      setFocusMode(nextMode);
      if (!isActive) setTimeLeft(FOCUS_CONFIG[nextMode].duration);
    }
  };

  const handleScrub = (newProgress: number) => {
    setPlaybackProgress(newProgress);
  };

  useEffect(() => {
    let timer: number;
    if (isActive && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft, handleSessionComplete]);

  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setPlaybackProgress(prev => {
          const inc = 1000 / (currentTrack?.durationMs || 180000);
          const next = prev + inc;
          if (next >= 1) {
            handleNextTrack();
            return 0;
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack, handleNextTrack]);

  if (!isSpotifyConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080808] p-8">
        <div className="w-full max-w-sm bg-[#121212] rounded-[2.5rem] p-10 text-center flex flex-col items-center chassis-shadow border border-white/5 relative overflow-hidden">
          {isSyncing && (
            <div className="absolute inset-0 z-50 bg-[#080808] flex flex-col items-center justify-center p-8">
               <div className="w-full h-[1px] bg-white/5 mb-8">
                  <div className="h-full bg-white/40 animate-[loading_1.5s_infinite_linear]" style={{width: '20%'}} />
               </div>
               <span className="text-[12px] font-pixel text-white/80 mb-2 tracking-[0.4em] uppercase">{aiStatus}</span>
            </div>
          )}
          
          <div className="w-16 h-16 bg-[#080808] rounded-2xl border border-white/10 mb-8 flex items-center justify-center shadow-inner">
            <div className="w-3 h-3 bg-white shadow-[0_0_12px_white] rounded-full" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white mb-2 uppercase">SPINDECK TYPE-01</h1>
          <p className="text-[10px] font-mono text-white/20 tracking-widest mb-10 uppercase font-bold">Protocol_Sync_Interface</p>
          
          <input 
            type="text" 
            placeholder="SPOTIFY_PLAYLIST_URL (OPTIONAL)"
            value={playlistUrl}
            onChange={(e) => setPlaylistUrl(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-white/5 p-4 rounded-xl text-xs font-mono text-white mb-6 focus:outline-none focus:border-white/20 transition-all text-center placeholder:opacity-10"
          />

          <button 
            onClick={handleSyncPlaylist}
            className="w-full py-4 bg-white text-black hover:bg-zinc-200 active:scale-95 transition-all font-black text-xs tracking-[0.2em] uppercase rounded-xl"
          >
            {playlistUrl ? 'SYNC & BOOT' : 'BOOT DEFAULT'}
          </button>
          
          {!playlistUrl && (
            <p className="mt-6 text-[8px] font-mono text-white/10 tracking-widest uppercase">Direct_Internal_Boot_Enabled</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050505] flex items-center justify-center overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="relative w-full max-w-[460px] bg-[#1a1a1e] rounded-[3.5rem] p-4 flex flex-col gap-4 chassis-shadow border border-white/5 group shadow-[0_40px_100px_rgba(0,0,0,1)]">
        
        {/* Side Copper Play/Pause Switch */}
        <div 
          onClick={toggleSession}
          className="absolute -right-2 top-[35%] w-5 h-16 bg-gradient-to-r from-[#b87333] via-[#d2691e] to-[#8b4513] rounded-r-xl border-y border-r border-black/60 cursor-pointer hover:translate-x-0.5 transition-transform z-50 shadow-lg"
        >
          <div className={`absolute left-1 right-1 h-6 bg-black/40 rounded-lg shadow-inner transition-all duration-300 ${isActive ? 'bottom-2' : 'top-2'}`} />
        </div>

        {/* Device Screen Area - High Contrast Monochrome */}
        <div className="p-2 bg-[#020202] rounded-[2.8rem] shadow-inner border border-white/5">
          <DeviceDisplay 
            track={currentTrack} 
            progress={playbackProgress} 
            timeStr={timeStr}
            isActive={isActive}
            focusMode={FOCUS_CONFIG[focusMode].label}
            isPlaying={isPlaying}
            onScrub={handleScrub}
          />
        </div>

        {/* Chassis Controls Area */}
        <div className="px-8 py-8 flex flex-col gap-10">
          {/* Rotary Knobs Section */}
          <div className="flex justify-between items-center">
            <Knob 
              label="VOLUME" 
              value={volume} 
              onChange={setVolume}
            />
            <Knob 
              label="SEEK" 
              value={playbackProgress} 
              onChange={setPlaybackProgress}
            />
            <Knob 
              label="PROGRAM" 
              value={focusMode === FocusMode.DEEP ? 1.0 : focusMode === FocusMode.LIGHT ? 0.5 : 0.0} 
              onChange={handleSlantKnob}
            />
          </div>

          {/* Functional Navigation Bar */}
          <div className="flex justify-between items-center pt-2 px-2 border-t border-white/5">
            <div className="flex items-center gap-4">
               <div className="flex gap-1">
                  <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-white/5'}`} />
                  <div className="w-1 h-1 bg-white/5 rounded-full" />
                  <div className="w-1 h-1 bg-white/5 rounded-full" />
               </div>
               <span className="text-[8px] font-mono text-white/20 tracking-widest uppercase">TYPE_01_SYS</span>
            </div>
            <div className="flex items-center gap-6">
               <button onClick={handleNextTrack} className="text-white/20 hover:text-white transition-all p-2">
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
               </button>
               <button onClick={() => setShowHistory(true)} className="text-white/20 hover:text-white transition-all p-2">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
               </button>
            </div>
          </div>
        </div>

        {/* Port Detail at bottom */}
        <div className="flex justify-center gap-8 opacity-20 pb-6">
           <div className="w-8 h-1 bg-black rounded-full" />
           <div className="w-14 h-3 bg-black rounded-md border border-white/5 flex items-center justify-center p-1">
              <div className="w-full h-[1px] bg-white/10" />
           </div>
           <div className="w-8 h-1 bg-black rounded-full" />
        </div>
      </div>

      {showHistory && (
        <HistoryPanel 
          history={history} 
          groundingLinks={groundingLinks}
          onClose={() => setShowHistory(false)} 
        />
      )}
    </div>
  );
};

export default App;
