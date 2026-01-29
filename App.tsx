import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ProgramState } from './types.ts';
import { useSpotify } from './hooks/useSpotify.ts';
import { usePlaybackMonitor } from './hooks/usePlaybackMonitor.ts';
import DeviceDisplay from './components/DeviceDisplay.tsx';
import Knob from './components/Knob.tsx';
import PlaylistLibrary from './components/PlaylistLibrary.tsx';
import './App.css';
import { spatialEngine } from './hooks/SpatialEngine.ts';

const App: React.FC = () => {
  const [listeningMode, setListeningMode] = useState(0.5); // 0.0 -> 1.0 (spatial control)
  const [showLibrary, setShowLibrary] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [volume, setVolume] = useState(0.7);
  const [isSyncing, setIsSyncing] = useState(false);
  const processingCode = useRef(false);

  // Development bypass logic removed
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);

  const spotify = useSpotify();

  // Sync listening mode and playback state to spatial engine
  useEffect(() => {
    spatialEngine.update(listeningMode);
  }, [listeningMode]);

  useEffect(() => {
    spatialEngine.setPlaybackActive(spotify.isPlaying);
  }, [spotify.isPlaying]);

  // Global interaction handler to unlock Web Audio
  useEffect(() => {
    const unlock = () => {
      spatialEngine.resume();
      window.removeEventListener('click', unlock);
    };
    window.addEventListener('click', unlock);
    return () => window.removeEventListener('click', unlock);
  }, []);

  // Real-time Program State monitoring
  const programState = !isSpotifyConnected ? ProgramState.STANDBY :
    spotify.isPlaying ? ProgramState.ENGAGED :
      ProgramState.HOLD;

  // Monitor playback progress for MM:SS display (using live ticking elapsedMs)
  const { timeStr } = usePlaybackMonitor(spotify.elapsedMs);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        e.preventDefault();
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
    console.log("Starting sync for:", target);

    if (!spotify.accessToken) {
      console.log("No access token, logging in...");
      spotify.login();
      return;
    }

    setIsSyncing(true);
    try {
      const id = target.match(/playlist\/([a-zA-Z0-9]+)/)?.[1];
      console.log("Found playlist ID:", id, "Device ID:", spotify.deviceId);

      if (id) {
        if (spotify.deviceId) {
          await spotify.setVolume(1.0);
          const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${spotify.deviceId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${spotify.accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ context_uri: `spotify:playlist:${id}` })
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error?.message || 'SPOTIFY_API_ERROR');
          }
          setIsSpotifyConnected(true);
        } else {
          console.warn("Playlist ID found but Device ID missing. Forcing connection anyway.");
          setIsSpotifyConnected(true);
        }
      } else {
        console.log("No playlist ID found, entering manual mode.");
        setIsSpotifyConnected(true);
      }
    } catch (err: any) {
      console.error("Sync failed", err);
      alert(`SYNC FAILED: ${err.message || 'UNKNOWN_ERROR'}`);
    } finally {
      setIsSyncing(false);
      setShowLibrary(false);
    }
  };

  const [localProgress, setLocalProgress] = useState<number | null>(null);
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
            <p>CORE_REV: 4.0.0</p>
          </div>
          <div className="w-full flex flex-col gap-6 px-4">
            <div className="boot-input-well">
              <input
                type="text"
                placeholder="paste playlist link"
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                className="boot-input"
              />
            </div>
            <button
              onClick={() => handleSync(playlistUrl)}
              disabled={isSyncing || (!!spotify.accessToken && !spotify.isPlayerReady && !spotify.playerError)}
              className="boot-btn"
            >
              {isSyncing ? 'SYNCING...' : spotify.accessToken ? 'BOOT_FEED' : 'CONNECT_UNIT'}
            </button>
            {spotify.accessToken && (
              <button
                onClick={spotify.logout}
                className="text-[8px] font-mono text-white/20 uppercase tracking-widest hover:text-white/60 transition-colors"
              >
                [ RESET_SESSION ]
              </button>
            )}
          </div>
          <div className="branding-footer">
            <div className="boot-badge-recess"><div className="boot-badge-inner"><span>DEYSIGNS</span></div></div>
            <div className="boot-technical-labels"><span>S_ID</span><span>B_LOG</span></div>
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
            timeStr={timeStr}
            isActive={spotify.isPlaying}
            modeValue={listeningMode}
            isPlaying={spotify.isPlaying}
            onScrub={handleScrub}
          />
        </div>

        <div className="controls-well">
          <div className="knob-row">
            <Knob label="VOLUME" value={volume} onChange={(v) => { setVolume(v); spotify.setVolume(v); }} />
            <Knob label="SEEK" value={displayProgress} onChange={handleScrub} />
            <Knob label="LISTENING" value={listeningMode} onChange={setListeningMode} />
          </div>

          <div className="status-section">
            <div className="divider" />
            <div className="status-footer">
              <div className="indicator-group">
                <div className="led-cluster">
                  <div
                    className={`led ${isSpotifyConnected ? 'led-active blink-active' : ''}`}
                    style={isSpotifyConnected ? {
                      backgroundColor: programState === ProgramState.ENGAGED ? '#1ed760' : '#ff0000',
                      boxShadow: `0 0 15px ${programState === ProgramState.ENGAGED ? 'rgba(30,215,96,0.8)' : 'rgba(255,0,0,0.8)'}`
                    } : {}}
                  />
                  <div className="led" />
                </div>
                <span className="syst-label">PRGM_{programState}</span>
              </div>
              <div className="transport-btns">
                <button onClick={() => setShowLibrary(true)} className="transport-icon"><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h10v2H4z" /></svg></button>
                <button onClick={spotify.next} className="transport-icon"><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg></button>
                <button
                  onClick={() => spotify.toggleShuffle()}
                  className={`transport-icon ${spotify.isShuffleEnabled ? 'text-white opacity-100' : 'opacity-30'}`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M4 4l5 5M15 15l6 6" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="branding-footer">
              <div className="badge-recess"><div className="silver-badge"><span className="badge-text">DEYSIGNS</span></div></div>
              <div className="technical-footer">
                <span className="footer-link cursor-pointer" onClick={() => window.open('https://github.com/adidey')}>ADIDEY_UNIT</span>
                <span className="footer-link cursor-pointer" onClick={() => window.open('https://deysigns.com')}>RECORDS_MNG</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showLibrary && <PlaylistLibrary onSelect={handleSync} onClose={() => setShowLibrary(false)} />}
    </div>
  );
};

export default App;
