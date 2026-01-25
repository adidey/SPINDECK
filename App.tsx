
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FocusMode, Track, SessionRecord } from './types.ts';
import { FOCUS_CONFIG, MOCK_TRACKS } from './constants.tsx';
import DeviceDisplay from './components/DeviceDisplay.tsx';
import Knob from './components/Knob.tsx';
import HistoryPanel from './components/HistoryPanel.tsx';
import PlaylistLibrary from './components/PlaylistLibrary.tsx';

/**
 * SPINPOD: OFFICIAL SPOTIFY MODULE
 * Client ID: 0070c4647977442595714935909b3d19
 * Manufacturer: DEYSIGNS
 */

const SPOTIFY_CLIENT_ID = '0070c4647977442595714935909b3d19';

const generateRandomString = (length: number) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values).map((x) => possible[x % possible.length]).join('');
};

const sha256 = async (plain: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

const base64encode = (input: ArrayBuffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

const App: React.FC = () => {
  const [focusMode, setFocusMode] = useState<FocusMode>(FocusMode.LIGHT);
  const [isActive, setIsActive] = useState(false);
  const [history, setHistory] = useState<SessionRecord[]>(() => {
    const saved = localStorage.getItem('spinpod_history_v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  
  const [tracks, setTracks] = useState<Track[]>(MOCK_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState('https://open.spotify.com/playlist/7umeyatM5nQqwZYNVKD8YT?si=30701122b57e4d35');
  const [volume, setVolume] = useState(0.7);
  const [timeLeft, setTimeLeft] = useState(FOCUS_CONFIG[focusMode].duration);
  const [aiStatus, setAiStatus] = useState("SYSTEM_IDLE");

  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('spotify_access_token'));
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const playerRef = useRef<any>(null);

  const currentTrack = useMemo(() => tracks[currentTrackIndex] || MOCK_TRACKS[0], [tracks, currentTrackIndex]);

  const timeStr = useMemo(() => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  // Persist history immediately on change
  useEffect(() => {
    localStorage.setItem('spinpod_history_v2', JSON.stringify(history));
  }, [history]);

  // Handle Focus Timer - only runs if active AND music is playing
  useEffect(() => {
    let timer: number;
    if (isActive && isPlaying && timeLeft > 0) {
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
  }, [isActive, isPlaying, timeLeft]);

  const handleSessionComplete = useCallback(() => {
    setIsActive(false);
    if (playerRef.current) playerRef.current.pause();
    
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

  // Spotify SDK Logic
  useEffect(() => {
    if (!accessToken) return;

    const initializePlayer = () => {
      const player = new (window as any).Spotify.Player({
        name: 'Spinpod',
        getOAuthToken: (cb: (token: string) => void) => { cb(accessToken); },
        volume: volume
      });

      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        setDeviceId(device_id);
        setAiStatus("READY");
        fetch('https://api.spotify.com/v1/me/player', {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_ids: [device_id], play: false })
        }).catch(() => {});
      });

      player.addListener('player_state_changed', (state: any) => {
        if (!state) return;
        setIsPlaying(!state.paused);
        setPlaybackProgress(state.position / state.duration);
        const track = state.track_window.current_track;
        if (track) {
          const mappedTrack: Track = {
            id: track.id,
            title: track.name.toUpperCase().replace(/\s/g, '_'),
            artist: track.artists[0].name.toUpperCase().replace(/\s/g, '_'),
            albumArt: track.album.images[0]?.url || '',
            durationMs: state.duration,
            albumTitle: track.album.name,
            trackNumber: 1
          };
          setTracks(prev => {
            const exists = prev.find(t => t.id === mappedTrack.id);
            if (!exists) return [mappedTrack, ...prev];
            return prev;
          });
          setTracks(current => {
            const idx = current.findIndex(t => t.id === mappedTrack.id);
            if (idx !== -1) setCurrentTrackIndex(idx);
            return current;
          });
        }
      });

      player.connect();
      playerRef.current = player;
    };

    if (!(window as any).Spotify) {
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
      (window as any).onSpotifyWebPlaybackSDKReady = initializePlayer;
    } else {
      initializePlayer();
    }

    return () => { if (playerRef.current) playerRef.current.disconnect(); };
  }, [accessToken]);

  useEffect(() => { if (playerRef.current) playerRef.current.setVolume(volume); }, [volume]);

  const handleSpotifyLogin = async () => {
    const redirectUri = window.location.origin + window.location.pathname;
    const codeVerifier = generateRandomString(128);
    const challengeBuffer = await sha256(codeVerifier);
    const codeChallenge = base64encode(challengeBuffer);
    localStorage.setItem('spotify_code_verifier', codeVerifier);
    const scope = 'user-read-playback-state user-modify-playback-state streaming playlist-read-private user-read-currently-playing user-read-private user-read-email';
    const authUrl = new URL("https://accounts.spotify.com/authorize");
    authUrl.search = new URLSearchParams({
      response_type: 'code', client_id: SPOTIFY_CLIENT_ID, scope,
      code_challenge_method: 'S256', code_challenge: codeChallenge, redirect_uri: redirectUri,
    }).toString();
    window.location.href = authUrl.toString();
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      const exchangeToken = async () => {
        const codeVerifier = localStorage.getItem('spotify_code_verifier');
        const redirectUri = window.location.origin + window.location.pathname;
        try {
          const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: SPOTIFY_CLIENT_ID, grant_type: 'authorization_code',
              code, redirect_uri: redirectUri, code_verifier: codeVerifier || '',
            }),
          });
          const data = await response.json();
          if (data.access_token) {
            localStorage.setItem('spotify_access_token', data.access_token);
            setAccessToken(data.access_token);
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (err) { setAiStatus("AUTH_ERROR"); }
      };
      exchangeToken();
    }
  }, []);

  const handleSyncPlaylist = async (url?: string) => {
    const targetUrl = url || playlistUrl;
    if (!accessToken) { handleSpotifyLogin(); return; }
    setIsSyncing(true);
    setAiStatus("SYNCING");
    try {
      const playlistIdMatch = targetUrl.match(/playlist\/([a-zA-Z0-9]+)/);
      const playlistId = playlistIdMatch ? playlistIdMatch[1] : null;
      if (!playlistId) throw new Error("ID_MISSING");
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!response.ok) throw new Error("API_ERROR");
      const data = await response.json();
      const mappedTracks: Track[] = data.tracks.items
        .filter((i: any) => i.track)
        .slice(0, 20)
        .map((item: any, idx: number) => ({
          id: item.track.id,
          title: item.track.name.toUpperCase().replace(/\s/g, '_'),
          artist: item.track.artists[0].name.toUpperCase().replace(/\s/g, '_'),
          albumArt: item.track.album.images[0]?.url || '',
          durationMs: item.track.duration_ms,
          albumTitle: item.track.album.name,
          trackNumber: idx + 1
        }));
      setTracks(mappedTracks);
      if (deviceId) {
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ context_uri: `spotify:playlist:${playlistId}` })
        });
      }
      setIsSpotifyConnected(true);
    } catch (err) { setAiStatus("BOOT_ERROR"); }
    finally { setIsSyncing(false); setShowLibrary(false); }
  };

  const handleNextTrack = useCallback(async () => {
    if (playerRef.current) await playerRef.current.nextTrack();
  }, []);

  const toggleSession = useCallback(async () => {
    if (!isActive) {
      setIsActive(true);
      if (playerRef.current && !isPlaying) await playerRef.current.resume();
    } else {
      if (playerRef.current) await playerRef.current.togglePlay();
    }
  }, [isActive, isPlaying]);

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
    if (playerRef.current) playerRef.current.seek(Math.floor(newProgress * currentTrack.durationMs));
    setPlaybackProgress(newProgress);
  };

  // Space bar functionality
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        toggleSession();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSession]);

  if (!isSpotifyConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080808] p-8">
        <div className="w-full max-w-sm bg-[#121212] rounded-[2.5rem] p-10 text-center flex flex-col items-center chassis-shadow border border-white/5 relative overflow-hidden">
          {isSyncing && (
            <div className="absolute inset-0 z-50 bg-[#080808] flex flex-col items-center justify-center p-8">
               <div className="w-full h-[1px] bg-white/5 mb-8"><div className="h-full bg-white/40 animate-[loading_1.5s_infinite_linear]" style={{width: '20%'}} /></div>
               <span className="text-[12px] font-pixel text-white/80 mb-2 tracking-[0.4em] uppercase">{aiStatus}</span>
            </div>
          )}
          <div className="w-16 h-16 bg-[#080808] rounded-2xl border border-white/10 mb-8 flex items-center justify-center shadow-inner">
            <div className={`w-3 h-3 rounded-full shadow-[0_0_12px_white] ${accessToken ? 'bg-green-500 shadow-green-500/50' : 'bg-white'}`} />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white mb-2 uppercase">SPINPOD</h1>
          <p className="text-[10px] font-mono text-white/20 tracking-widest mb-10 uppercase font-bold">CORE_REV: 3.5.0</p>
          <input 
            type="text" 
            placeholder="SPOTIFY_PLAYLIST_URL"
            value={playlistUrl}
            onChange={(e) => setPlaylistUrl(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-white/5 p-4 rounded-xl text-[10px] font-mono text-white mb-6 focus:outline-none focus:border-white/20 text-center"
          />
          <button 
            onClick={() => handleSyncPlaylist()}
            disabled={isSyncing}
            className="w-full py-4 bg-white text-black hover:bg-zinc-200 active:scale-95 transition-all font-black text-xs tracking-[0.2em] uppercase rounded-xl"
          >
            {accessToken ? 'SYNC & BOOT' : 'CONNECT SPOTIFY'}
          </button>
          
          <div className="mt-12 flex flex-col items-center gap-6">
             <div className="relative w-28 h-12 rounded-full flex items-center justify-center border border-white/5 overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] bg-[#222]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#222]" />
                <span className="relative text-[12px] font-black text-white/10 tracking-tighter uppercase" style={{ fontStyle: 'italic' }}>DEYSIGNS</span>
             </div>
             <div className="flex gap-4">
                <a href="https://open.spotify.com/user/adidey?si=82ca83d694b04b31" target="_blank" className="text-[8px] font-mono text-white/20 hover:text-white uppercase tracking-widest transition-colors">S_ID</a>
                <a href="https://www.behance.net/aditya_dey" target="_blank" className="text-[8px] font-mono text-white/20 hover:text-white uppercase tracking-widest transition-colors">B_LOG</a>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050505] flex items-center justify-center overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)] pointer-events-none" />
      <div className="relative w-full max-w-[460px] bg-[#1a1a1e] rounded-[3.5rem] p-4 flex flex-col gap-4 chassis-shadow border border-white/5 group shadow-[0_40px_100px_rgba(0,0,0,1)]">
        
        <div onClick={toggleSession} className="absolute -right-2 top-[35%] w-5 h-16 bg-gradient-to-r from-[#b87333] via-[#d2691e] to-[#8b4513] rounded-r-xl border-y border-r border-black/60 cursor-pointer hover:translate-x-0.5 transition-transform z-50 shadow-lg">
          <div className={`absolute left-1 right-1 h-6 bg-black/40 rounded-lg shadow-inner transition-all duration-300 ${isPlaying ? 'bottom-2' : 'top-2'}`} />
        </div>

        <div className="p-2 bg-[#020202] rounded-[2.8rem] shadow-inner border border-white/5">
          <DeviceDisplay 
            track={currentTrack} progress={playbackProgress} timeStr={timeStr} 
            isActive={isActive} focusMode={FOCUS_CONFIG[focusMode].label} isPlaying={isPlaying} onScrub={handleScrub}
          />
        </div>

        <div className="px-8 py-8 flex flex-col gap-10">
          <div className="flex justify-between items-center">
            <Knob label="VOLUME" value={volume} onChange={setVolume} />
            <Knob label="SEEK" value={playbackProgress} onChange={handleScrub} />
            <Knob label="PROGRAM" value={focusMode === FocusMode.DEEP ? 1.0 : focusMode === FocusMode.LIGHT ? 0.5 : 0.0} onChange={handleSlantKnob} />
          </div>

          <div className="flex justify-between items-center pt-2 px-2 border-t border-white/5">
            <div className="flex items-center gap-4">
               <div className="flex gap-1">
                  <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-white/5'}`} />
                  <div className={`w-1 h-1 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-white/5'}`} />
               </div>
               <span className="text-[8px] font-mono text-white/20 tracking-widest uppercase">SYST_ACTIVE</span>
            </div>
            <div className="flex items-center gap-6">
               <button onClick={() => setShowLibrary(true)} className="text-white/20 hover:text-white transition-all p-2">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
               </button>
               <button onClick={handleNextTrack} className="text-white/20 hover:text-white transition-all p-2">
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
               </button>
               <button onClick={() => setShowHistory(true)} className="text-white/20 hover:text-white transition-all p-2">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </button>
            </div>
          </div>
        </div>

        {/* Recessed Matte Silver Branding Badge */}
        <div className="flex flex-col items-center gap-4 pb-10">
           <div className="relative w-40 h-14 bg-[#121212] rounded-full flex items-center justify-center shadow-[inset_0_2px_8px_rgba(0,0,0,1)] border border-white/5">
              <div className="absolute w-[92%] h-[82%] rounded-full bg-gradient-to-br from-[#888] via-[#aaa] to-[#666] shadow-[0_4px_10px_rgba(0,0,0,0.4)] border border-white/20 flex items-center justify-center overflow-hidden">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2),transparent)]" />
                 <span className="relative text-[15px] font-black text-black/80 tracking-tighter uppercase" style={{ fontStyle: 'italic', fontFamily: 'Inter' }}>DEYSIGNS</span>
              </div>
           </div>
           <div className="flex gap-8 opacity-20">
              <a href="https://open.spotify.com/user/adidey?si=82ca83d694b04b31" target="_blank" className="text-[7px] font-mono text-white hover:text-white transition-colors uppercase tracking-[0.4em]">ADIDEY_UNIT</a>
              <div className="w-[1px] h-2 bg-white/20" />
              <a href="https://www.behance.net/aditya_dey" target="_blank" className="text-[7px] font-mono text-white hover:text-white transition-colors uppercase tracking-[0.4em]">RECORDS_MNG</a>
           </div>
        </div>
      </div>

      {showHistory && <HistoryPanel history={history} onClose={() => setShowHistory(false)} />}
      {showLibrary && <PlaylistLibrary onSelect={handleSyncPlaylist} onClose={() => setShowLibrary(false)} />}
    </div>
  );
};

export default App;
