
import { useState, useEffect, useCallback, useRef } from 'react';
import { Track } from '../types';

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

export const useSpotify = () => {
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('spotify_access_token'));
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const playerRef = useRef<any>(null);

  const [playerError, setPlayerError] = useState<string | null>(null);

  const login = useCallback(async () => {
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
  }, []);

  const handleAuthCode = useCallback(async (code: string) => {
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
    } catch (err) {
      console.error("Auth exchange failed", err);
      setPlayerError("AUTH_FAILED");
    }
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    const init = () => {
      if (playerRef.current) return; // Prevent double init

      const player = new (window as any).Spotify.Player({
        name: 'Spinpod',
        getOAuthToken: (cb: (token: string) => void) => { cb(accessToken); },
        volume: 0.7
      });

      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        setDeviceId(device_id);
      });

      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
      });

      player.addListener('initialization_error', ({ message }: { message: string }) => {
        console.error('Failed to initialize', message);
        setPlayerError("INIT_FAILED: " + message);
      });

      player.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error('Failed to authenticate', message);
        setPlayerError("AUTH_ERROR");
        localStorage.removeItem('spotify_access_token');
        setAccessToken(null);
        setPlayerError(null);
      });

      player.addListener('account_error', ({ message }: { message: string }) => {
        console.error('Failed to validate Spotify account', message);
        setPlayerError("PREMIUM_REQUIRED");
      });

      player.addListener('player_state_changed', (state: any) => {
        if (!state) return;
        setIsPlaying(!state.paused);
        setProgress(state.position / state.duration);
        const track = state.track_window.current_track;
        if (track) {
          setCurrentTrack({
            id: track.id,
            title: track.name.toUpperCase().replace(/\s/g, '_'),
            artist: track.artists[0].name.toUpperCase().replace(/\s/g, '_'),
            albumArt: track.album.images[0]?.url || '',
            durationMs: state.duration,
            albumTitle: track.album.name,
            trackNumber: 1
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
      (window as any).onSpotifyWebPlaybackSDKReady = init;
    } else {
      init();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
    };
  }, [accessToken]);

  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);

  const toggleShuffle = useCallback(async () => {
    if (!accessToken || !deviceId) return;
    try {
      await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${!isShuffleEnabled}&device_id=${deviceId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      setIsShuffleEnabled(!isShuffleEnabled);
    } catch (err) {
      console.error("Shuffle toggle failed", err);
    }
  }, [accessToken, deviceId, isShuffleEnabled]);

  const toggle = useCallback(() => playerRef.current?.togglePlay(), []);
  const next = useCallback(() => playerRef.current?.nextTrack(), []);
  const seek = useCallback((p: number) => {
    if (playerRef.current && currentTrack) {
      playerRef.current.seek(Math.floor(p * currentTrack.durationMs));
    }
  }, [currentTrack]);
  const setVolume = useCallback((v: number) => playerRef.current?.setVolume(v), []);

  return {
    accessToken,
    deviceId,
    isPlaying,
    isShuffleEnabled,
    progress,
    currentTrack,
    playerError,
    isPlayerReady: !!deviceId,
    login,
    handleAuthCode,
    toggle,
    next,
    seek,
    setVolume,
    toggleShuffle
  };
};
