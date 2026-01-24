
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { FocusMode, Track, SessionRecord } from './types';
import { COLORS, FOCUS_CONFIG, MOCK_TRACKS } from './constants';
import VinylPlayer from './components/VinylPlayer';
import FocusTimer from './components/FocusTimer';
import TrackInfo from './components/TrackInfo';
import HistoryPanel from './components/HistoryPanel';

const App: React.FC = () => {
  const [focusMode, setFocusMode] = useState<FocusMode>(FocusMode.LIGHT);
  const [isActive, setIsActive] = useState(false);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);

  const [aiTip, setAiTip] = useState("SYSTEM READY");
  const [isGeneratingTip, setIsGeneratingTip] = useState(false);

  const currentTrack = MOCK_TRACKS[currentTrackIndex];

  const handleNextTrack = useCallback(() => {
    setCurrentTrackIndex(prev => (prev + 1) % MOCK_TRACKS.length);
    setPlaybackProgress(0);
  }, []);

  const handleScrub = useCallback((newProgress: number) => {
    setPlaybackProgress(newProgress);
  }, []);

  const handleModeChange = (mode: FocusMode) => {
    setFocusMode(mode);
    setIsActive(false);
  };

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
  }, [focusMode, currentTrack.title]);

  const generateFocusTip = async () => {
    setIsGeneratingTip(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Industrial focus tip. Max 5 words. Professional, technical, no fluff. Mode: ${focusMode}.`,
      });
      setAiTip(response.text.toUpperCase().trim());
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingTip(false);
    }
  };

  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setPlaybackProgress(prev => {
          const inc = 1000 / currentTrack.durationMs;
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
  }, [isPlaying, currentTrack.durationMs, handleNextTrack]);

  if (!isSpotifyConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212] p-8">
        <div className="w-full max-w-sm border border-[#222] p-12 bg-[#1A1A1A] text-center flex flex-col items-center">
          <div className="w-12 h-12 border border-[#444] mb-8 flex items-center justify-center">
            <div className="w-4 h-4 bg-white" />
          </div>
          <h1 className="text-xl font-bold tracking-[0.4em] mb-2 uppercase">SPINDECK</h1>
          <p className="text-[10px] font-mono text-[#555] tracking-widest mb-12 uppercase">Industrial Focus Module v1.0</p>
          <button 
            onClick={() => setIsSpotifyConnected(true)}
            className="w-full py-4 border border-white text-white hover:bg-white hover:text-black transition-all font-bold text-xs tracking-widest uppercase"
          >
            Connect Interface
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#121212] flex flex-col font-sans">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#FFF 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Header Bar */}
      <nav className="relative z-10 h-20 border-b border-[#222] flex justify-between items-center px-10">
        <div className="flex items-center gap-6">
          <span className="text-sm font-black tracking-[0.3em] uppercase">SPINDECK</span>
          <div className="w-[1px] h-4 bg-[#222]" />
          <span className="text-[9px] font-mono text-[#444] tracking-widest uppercase">Module_01 / Analog_Digital_Hybrid</span>
        </div>
        
        <button 
          onClick={() => setShowHistory(true)}
          className="text-[10px] font-mono text-[#666] hover:text-white transition-colors tracking-widest uppercase"
        >
          [ Log_History ]
        </button>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center gap-12 py-10">
        {/* Mode Selectors - Functional Rectangles */}
        <div className="flex gap-4 z-20">
          {(Object.values(FocusMode)).map((mode) => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              className={`px-6 py-2 border transition-all text-[10px] font-mono tracking-widest ${
                focusMode === mode 
                  ? 'bg-white text-black border-white' 
                  : 'bg-transparent text-[#444] border-[#222] hover:border-[#444]'
              }`}
            >
              {FOCUS_CONFIG[mode].label} // {mode}
            </button>
          ))}
        </div>

        {/* Central Unit */}
        <div className="relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
             <FocusTimer mode={focusMode} isActive={isActive} onComplete={handleSessionComplete} />
          </div>
          <div className="relative z-10">
            <VinylPlayer 
              currentTrack={currentTrack}
              progress={playbackProgress}
              isPlaying={isPlaying}
              onScrub={handleScrub}
              rotationSpeed={FOCUS_CONFIG[focusMode].rotationSpeed}
            />
          </div>
        </div>

        {/* Playback Controls & Info */}
        <div className="flex flex-col items-center w-full">
          <TrackInfo track={currentTrack} progress={playbackProgress} />
          
          <div className="flex items-center gap-10 mt-10">
            {/* Skip Control */}
            <button 
              onClick={handleNextTrack}
              className="group p-4 border border-[#222] hover:border-[#444] transition-all"
              title="Next Signal"
            >
              <svg className="w-5 h-5 text-[#666] group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>

            {/* Main Action - Signal Red */}
            <button 
              onClick={toggleSession}
              className={`h-16 w-16 flex items-center justify-center border transition-all ${
                isActive 
                  ? 'border-[#444] bg-transparent' 
                  : 'border-[#D91E18] bg-[#D91E18] hover:scale-105'
              }`}
            >
              {isActive ? (
                <div className="w-4 h-4 bg-white" />
              ) : (
                <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1" />
              )}
            </button>

            {/* AI Generator Button */}
            <button 
              onClick={generateFocusTip}
              className="group p-4 border border-[#222] hover:border-[#444] transition-all"
              title="Generate Protocol"
            >
              <svg className="w-5 h-5 text-[#666] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
          </div>
        </div>
      </main>

      {/* Footer Status */}
      <footer className="h-16 border-t border-[#222] flex items-center justify-between px-10">
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full ${isGeneratingTip ? 'bg-[#D91E18] animate-pulse' : 'bg-[#444]'}`} />
          <span className="text-[9px] font-mono text-[#444] tracking-[0.3em] uppercase">
            {aiTip}
          </span>
        </div>
        <div className="text-[9px] font-mono text-[#222] tracking-widest uppercase">
          RAMS-INSPIRED CORE / VERSION 1.0.4
        </div>
      </footer>

      {showHistory && (
        <HistoryPanel history={history} onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
};

export default App;
