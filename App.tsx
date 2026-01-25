
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FocusMode, SessionRecord } from './types.ts';
import { FOCUS_CONFIG } from './constants.tsx';
import { useSpotify } from './hooks/useSpotify.ts';
import { useFocusTimer } from './hooks/useFocusTimer.ts';
import DeviceDisplay from './components/DeviceDisplay.tsx';
import Knob from './components/Knob.tsx';
import HistoryPanel from './components/HistoryPanel.tsx';
import PlaylistLibrary from './components/PlaylistLibrary.tsx';
import './App.css';

const App: React.FC = () => {
  const [focusMode, setFocusMode] = useState<FocusMode>(FocusMode.LIGHT);
  const [history, setHistory] = useState<SessionRecord[]>(() => JSON.parse(localStorage.getItem('spinpod_history_v2') || '[]'));
  const [showHistory, setShowHistory] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [volume, setVolume] = useState(0.7);

  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const processingCode = useRef(false);

  const spotify = useSpotify();

  const handleComplete = useCallback(() => {
    const record: SessionRecord = {
      id: Math.random().toString(36).substring(2, 9),
      mode: focusMode,
      startTime: Date.now(),
      durationSeconds: FOCUS_CONFIG[focusMode].duration,
      tracks: [spotify.currentTrack?.title || 'UNKNOWN']
    };
    setHistory(prev => [record, ...prev]);
    timer.setIsActive(false);
  }, [focusMode, spotify.currentTrack]);

  const timer = useFocusTimer(focusMode, handleComplete);

  useEffect(() => localStorage.setItem('spinpod_history_v2', JSON.stringify(history)), [history]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        // Ignore if user is typing in an input text field
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault(); // Prevent scrolling
        spotify.toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [spotify]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code && !processingCode.current) {
      processingCode.current = true;
      spotify.handleAuthCode(code);
    }
  }, [spotify]);

  const handleSync = async (url: string) => {
    const target = url || playlistUrl;
    if (!spotify.accessToken) {
      spotify.login();
      return;
    }

    setIsSyncing(true);
    try {
      const id = target.match(/playlist\/([a-zA-Z0-9]+)/)?.[1];
      if (id && spotify.deviceId) {
        // Ensure volume is up before playing
        await spotify.setVolume(1.0);

        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${spotify.deviceId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${spotify.accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ context_uri: `spotify:playlist:${id}` })
        }).then(async res => {
          if (!res.ok) {
            throw new Error(`PLAYBACK_ERROR_${res.status}`);
          }
        });
        setIsSpotifyConnected(true);
      } else if (!id) {
        setIsSpotifyConnected(true);
      }
    } catch (err: any) {
      console.error("Sync failed", err);
      // Alert user but stay on boot screen
      alert(`SYNC FAILED: ${err.message || 'UNKNOWN_ERROR'}. TRY OPENING SPOTIFY ON ANOTHER DEVICE IF THIS PERSISTS.`);
    } finally {
      setIsSyncing(false);
      setShowLibrary(false);
    }
  };

  // Moved hooks to top level to prevent crash
  const [localProgress, setLocalProgress] = useState<number | null>(null);

  // Optimistic scrub handler
  const handleScrub = useCallback((val: number) => {
    setLocalProgress(val);
    spotify.seek(val);
  }, [spotify]);

  useEffect(() => {
    if (localProgress !== null) {
      const t = setTimeout(() => setLocalProgress(null), 1000);
      return () => clearTimeout(t);
    }
  }, [localProgress]);

  const displayProgress = localProgress !== null ? localProgress : spotify.progress;

  if (!isSpotifyConnected) {
    return (
      <div className="boot-screen">
        <div className="boot-card">
          <div className="boot-well">
            <div className={`boot-led ${spotify.accessToken ? 'bg-[#1ed760] shadow-[0_0_15px_rgba(30,215,96,0.8)]' : 'bg-white/5'}`} />
          </div>

          <div className="boot-header text-center">
            <h1>SPINPOD</h1>
            <p>CORE_REV: 3.5.0</p>
          </div>

          <div className="w-full flex flex-col gap-6 px-4">
            <div className="boot-input-well">
              <input
                type="text"
                placeholder="https://open.spotify.com/playlist/..."
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                className="boot-input"
              />
            </div>
            <button
              onClick={() => handleSync(playlistUrl)}
              disabled={isSyncing || (!!spotify.accessToken && !spotify.isPlayerReady && !spotify.playerError)}
              className={`boot-btn ${spotify.playerError ? 'boot-btn-error' : ''}`}
            >
              {isSyncing ? 'SYNCING...' :
                spotify.playerError ? spotify.playerError :
                  (spotify.accessToken && !spotify.isPlayerReady) ? 'INITIALIZING...' :
                    spotify.accessToken ? 'SYNC & BOOT' : 'CONNECT SPOTIFY'}
            </button>
          </div>

          <div className="branding-footer">
            <div className="boot-badge-recess">
              <div className="boot-badge-inner">
                <span>DEYSIGNS</span>
              </div>
            </div>
            <div className="boot-technical-labels">
              <span>S_ID</span>
              <span>B_LOG</span>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="app-root">
      <div className="chassis">
        <div onClick={spotify.toggle} className="side-switch">
          <div className={`switch-nub ${spotify.isPlaying ? 'switch-nub-down' : 'switch-nub-up'}`} />
        </div>

        <div className="display-well">
          <DeviceDisplay
            track={spotify.currentTrack || { title: 'READY', artist: 'SYSTEM', id: '0', albumArt: '', durationMs: 0, albumTitle: '', trackNumber: 0 }}
            progress={displayProgress}
            timeStr={timer.timeStr}
            isActive={timer.isActive}
            focusMode={FOCUS_CONFIG[focusMode].label}
            isPlaying={spotify.isPlaying}
            onScrub={handleScrub}
          />
        </div>

        <div className="controls-well">
          <div className="knob-row">
            <Knob label="VOLUME" value={volume} onChange={(v) => { setVolume(v); spotify.setVolume(v); }} />
            <Knob label="SEEK" value={displayProgress} onChange={handleScrub} />
            <Knob label="PROGRAM" value={focusMode === FocusMode.DEEP ? 1 : focusMode === FocusMode.LIGHT ? 0.5 : 0} onChange={(val) => {
              if (val < 0.33) setFocusMode(FocusMode.BREAK);
              else if (val > 0.66) setFocusMode(FocusMode.DEEP);
              else setFocusMode(FocusMode.LIGHT);
            }} />
          </div>

          <div className="status-section">
            <div className="divider" />
            <div className="status-footer">
              <div className="indicator-group">
                <div className="led-cluster">
                  <div className={`led ${isSpotifyConnected ? 'led-active blink-active bg-[#1ed760] shadow-[0_0_15px_rgba(30,215,96,0.8)]' : ''}`} />
                  <div className="led" />
                </div>
                <span className="syst-label">SYST_ACTIVE</span>
              </div>
              <div className="transport-btns">
                <button onClick={() => setShowLibrary(true)} className="transport-icon"><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h10v2H4z" /></svg></button>
                <button onClick={spotify.next} className="transport-icon"><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg></button>
                <button onClick={() => setShowHistory(true)} className="transport-icon"><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" /></svg></button>
              </div>
            </div>
            <div className="branding-footer">
              <div className="badge-recess">
                <div className="silver-badge">
                  <span className="badge-text">DEYSIGNS</span>
                </div>
              </div>
              <div className="technical-footer">
                <span className="footer-link cursor-pointer hover:text-white transition-colors" onClick={() => window.open('https://github.com/adidey', '_blank')}>ADIDEY_UNIT</span>
                <span className="footer-link cursor-pointer hover:text-white transition-colors" onClick={() => window.open('https://deysigns.com', '_blank')}>RECORDS_MNG</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showHistory && <HistoryPanel history={history} onClose={() => setShowHistory(false)} />}
      {showLibrary && <PlaylistLibrary onSelect={handleSync} onClose={() => setShowLibrary(false)} />}
    </div>
  );
};

export default App;
