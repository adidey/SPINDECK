
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FocusMode, Track, SessionRecord } from './types.ts';
import { FOCUS_CONFIG, MOCK_TRACKS } from './constants.tsx';
import DeviceDisplay from './components/DeviceDisplay.tsx';
import Knob from './components/Knob.tsx';
import HistoryPanel from './components/HistoryPanel.tsx';

/**
 * SPOTIFY PKCE HELPERS
 * Official secure flow for public/browser clients.
 */
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
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
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

  // Spotify Connection State
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('spotify_access_token'));
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const playerRef = useRef<any>(null);

  const currentTrack = useMemo(() => tracks[currentTrackIndex] || MOCK_TRACKS[0], [tracks, currentTrackIndex]);

  const timeStr = useMemo(() => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  // --- Spotify SDK Integration ---
  useEffect(() => {
    if (!accessToken) return;

    // Load SDK script if not already present
    if (!(window as any).Spotify) {
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    }

    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      const player = new (window as any).Spotify.Player({
        name: 'SpinDeck Type-01',
        getOAuthToken: (cb: (token: string) => void) => { cb(accessToken); },
        volume: volume
      });

      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('SpinDeck Ready on Device ID:', device_id);
        setDeviceId(device_id);
        setAiStatus("DEVICE_READY");
      });

      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
        setAiStatus("DEVICE_OFFLINE");
      });

      player.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error('Failed to authenticate:', message);
        localStorage.removeItem('spotify_access_token');
        setAccessToken(null);
        setAiStatus("AUTH_EXPIRED");
      });

      player.addListener('player_state_changed', (state: any) => {
        if (!state) return;
        
        setIsPlaying(!state.paused);
        setPlaybackProgress(state.position / state.duration);
        
        const track = state.track_window.current_track;
        if (track) {
          const mappedTrack: Track = {
            id: track.id,
            title: track.name,
            artist: track.artists[0].name,
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

    return () => {
      if (playerRef.current) playerRef.current.disconnect();
    };
  }, [accessToken]);

  // Dynamic Volume Control
  useEffect(() => {
    if (playerRef.current) playerRef.current.setVolume(volume);
  }, [volume]);

  // --- Spotify Auth Flow ---
  const handleSpotifyLogin = async () => {
    const clientId = process.env.SPOTIFY_CLIENT_ID || '0070c4647977442595714935909b3d19';
    const redirectUri = window.location.origin + window.location.pathname;
    
    const codeVerifier = generateRandomString(128);
    const challengeBuffer = await sha256(codeVerifier);
    const codeChallenge = base64encode(challengeBuffer);

    localStorage.setItem('spotify_code_verifier', codeVerifier);

    const scope = 'user-read-playback-state user-modify-playback-state streaming playlist-read-private user-read-currently-playing';
    const authUrl = new URL("https://accounts.spotify.com/authorize");

    const params = {
      response_type: 'code',
      client_id: clientId,
      scope: scope,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      redirect_uri: redirectUri,
    };

    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      const exchangeToken = async () => {
        setAiStatus("EXCHANGING_TOKENS");
        const codeVerifier = localStorage.getItem('spotify_code_verifier');
        const clientId = process.env.SPOTIFY_CLIENT_ID || '0070c4647977442595714935909b3d19';
        const redirectUri = window.location.origin + window.location.pathname;

        try {
          const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: clientId,
              grant_type: 'authorization_code',
              code: code,
              redirect_uri: redirectUri,
              code_verifier: codeVerifier || '',
            }),
          });

          const data = await response.json();
          if (data.access_token) {
            localStorage.setItem('spotify_access_token', data.access_token);
            setAccessToken(data.access_token);
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            setAiStatus("AUTHENTICATED");
          }
        } catch (err) {
          console.error("Token exchange failed:", err);
          setAiStatus("AUTH_FAILED");
        }
      };
      exchangeToken();
    }
  }, []);

  const handleSyncPlaylist = async () => {
    if (!accessToken) {
      handleSpotifyLogin();
      return;
    }

    setIsSyncing(true);
    setAiStatus("FETCHING_STREAM");

    try {
      // Extract Playlist ID from URL
      const playlistIdMatch = playlistUrl.match(/playlist\/([a-zA-Z0-9]+)/);
      const playlistId = playlistIdMatch ? playlistIdMatch[1] : null;
      if (!playlistId) throw new Error("Invalid Spotify Playlist URL");

      // Fetch Playlist Tracks from API
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!response.ok) throw new Error("Spotify API unreachable");
      const data = await response.json();

      const mappedTracks: Track[] = data.tracks.items
        .filter((item: any) => item.track)
        .slice(0, 20)
        .map((item: any, idx: number) => ({
          id: item.track.id,
          title: item.track.name,
          artist: item.track.artists[0].name,
          albumArt: item.track.album.images[0]?.url || '',
          durationMs: item.track.duration_ms,
          albumTitle: item.track.album.name,
          trackNumber: idx + 1
        }));

      setTracks(mappedTracks);
      setAiStatus("SYNC_COMPLETE");
      setTimeout(() => setIsSpotifyConnected(true), 800);

      // Trigger playback on the Web SDK device
      if (deviceId) {
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${accessToken}`, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ 
            context_uri: `spotify:playlist:${playlistId}`
          })
        });
      }

    } catch (err) {
      console.error("Playlist sync failed:", err);
      setAiStatus("HANDSHAKE_ERROR");
      setTracks(MOCK_TRACKS);
      setTimeout(() => setIsSpotifyConnected(true), 1500);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleNextTrack = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.nextTrack();
    } else {
      setCurrentTrackIndex(prev => (prev + 1) % tracks.length);
      setPlaybackProgress(0);
    }
  }, [tracks.length]);

  const toggleSession = async () => {
    if (playerRef.current) {
      await playerRef.current.togglePlay();
    } else {
      setIsActive(!isActive);
      setIsPlaying(!isActive);
    }
  };

  const handleSessionComplete = useCallback(() => {
    setIsActive(false);
    setIsPlaying(false);
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
    if (playerRef.current) {
      const position = Math.floor(newProgress * currentTrack.durationMs);
      playerRef.current.seek(position);
    }
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
          <p className="text-[10px] font-mono text-white/20 tracking-widest mb-10 uppercase font-bold">Official_Spotify_Interface</p>
          
          <input 
            type="text" 
            placeholder="SPOTIFY_PLAYLIST_URL"
            value={playlistUrl}
            onChange={(e) => setPlaylistUrl(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-white/5 p-4 rounded-xl text-xs font-mono text-white mb-6 focus:outline-none focus:border-white/20 transition-all text-center placeholder:opacity-10"
          />

          <button 
            onClick={handleSyncPlaylist}
            className="w-full py-4 bg-white text-black hover:bg-zinc-200 active:scale-95 transition-all font-black text-xs tracking-[0.2em] uppercase rounded-xl"
          >
            {accessToken ? 'SYNC & BOOT' : 'CONNECT SPOTIFY'}
          </button>
          
          <div className="mt-8 flex flex-col gap-2">
            {!accessToken && (
               <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Premium Account Required</p>
            )}
            <p className="text-[8px] font-mono text-white/10 tracking-widest uppercase">Direct_Spotify_SDK_Boot</p>
          </div>
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
          <div className={`absolute left-1 right-1 h-6 bg-black/40 rounded-lg shadow-inner transition-all duration-300 ${isPlaying ? 'bottom-2' : 'top-2'}`} />
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
              onChange={handleScrub}
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
                  <div className={`w-1 h-1 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-white/5'}`} />
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
          onClose={() => setShowHistory(false)} 
        />
      )}
    </div>
  );
};

export default App;
