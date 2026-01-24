
import React, { useState } from 'react';

interface PlaylistLibraryProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

const PlaylistLibrary: React.FC<PlaylistLibraryProps> = ({ onSelect, onClose }) => {
  const [inputUrl, setInputUrl] = useState('');
  
  const suggestions = [
    { name: 'DEY_TEST_FEED', url: 'https://open.spotify.com/playlist/7umeyatM5nQqwZYNVKD8YT?si=30701122b57e4d35' },
    { name: 'LOFI_LOGIC', url: 'https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0Ex7X' },
    { name: 'DEEP_FOCUS_UNIT', url: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKHA6V9v9m' },
    { name: 'CHILL_VIBES_SYS', url: 'https://open.spotify.com/playlist/37i9dQZF1DX88900ZqmsMT' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-[#121212] border border-white/10 rounded-[2.5rem] p-10 chassis-shadow flex flex-col gap-8">
        <div className="flex justify-between items-center">
           <div className="flex flex-col">
              <h3 className="text-sm font-black text-white uppercase tracking-tighter">SOURCE_LIBRARY</h3>
              <span className="text-[8px] font-mono text-white/20 uppercase">Global_Feed_Select</span>
           </div>
           <button onClick={onClose} className="text-white/20 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        <div className="flex flex-col gap-4">
           <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">MANUAL_OVERRIDE</span>
           <div className="flex flex-col gap-2">
              <input 
                type="text" 
                placeholder="PASTE_NEW_URL"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/5 p-3 rounded-lg text-[9px] font-mono text-white focus:outline-none focus:border-white/20"
              />
              <button 
                onClick={() => onSelect(inputUrl)}
                className="w-full py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-zinc-200 transition-colors"
              >
                CONNECT_SOURCE
              </button>
           </div>
        </div>

        <div className="flex flex-col gap-4">
           <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">PRE_CONFIG_BANKS</span>
           <div className="grid grid-cols-1 gap-2">
              {suggestions.map((p) => (
                <button 
                  key={p.url}
                  onClick={() => onSelect(p.url)}
                  className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all text-left group"
                >
                   <span className="text-[9px] font-mono text-white/60 group-hover:text-white uppercase tracking-widest">{p.name}</span>
                   <div className="w-1 h-1 bg-white/10 rounded-full group-hover:bg-white" />
                </button>
              ))}
           </div>
        </div>
        
        <div className="flex justify-center opacity-10">
           <div className="w-12 h-[0.5px] bg-white" />
        </div>
      </div>
    </div>
  );
};

export default PlaylistLibrary;
