
import React, { useState } from 'react';

interface PlaylistLibraryProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

const PlaylistLibrary: React.FC<PlaylistLibraryProps> = ({ onSelect, onClose }) => {
  const [inputUrl, setInputUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onSelect(inputUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-[#121212] border border-white/10 rounded-[3rem] p-10 chassis-shadow flex flex-col gap-12">
        <div className="flex justify-between items-center">
           <div className="flex flex-col">
              <h3 className="text-sm font-black text-white uppercase tracking-tighter">SIGNAL_OVERRIDE</h3>
              <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.2em]">Manual_Handshake_Required</span>
           </div>
           <button onClick={onClose} className="text-white/20 hover:text-white transition-colors p-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
           <div className="flex flex-col gap-3">
              <label className="text-[8px] font-mono text-white/30 uppercase tracking-widest px-1">SOURCE_PLAYLIST_URL</label>
              <input 
                autoFocus
                type="text" 
                placeholder="https://open.spotify.com/playlist/..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="w-full bg-[#080808] border border-white/5 p-4 rounded-xl text-[10px] font-mono text-white focus:outline-none focus:border-white/20 transition-all placeholder:opacity-10 shadow-inner"
              />
           </div>
           
           <button 
             type="submit"
             disabled={!inputUrl.trim()}
             className="w-full py-4 bg-white text-black text-[10px] font-black uppercase tracking-[0.4em] rounded-xl hover:bg-zinc-200 active:scale-95 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
           >
             BOOT_FEED
           </button>
        </form>

        <div className="flex flex-col items-center gap-3 opacity-10">
           <div className="w-16 h-[0.5px] bg-white" />
           <span className="text-[7px] font-mono text-white tracking-[0.5em] uppercase">DEYSIGNS_SECURE_ENCLAVE</span>
        </div>
      </div>
    </div>
  );
};

export default PlaylistLibrary;
