
import React from 'react';
import { SessionRecord } from '../types';

interface HistoryPanelProps {
  history: SessionRecord[];
  onClose: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onClose }) => {
  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-[#0a0a0a] border-l border-white/5 p-8 flex flex-col shadow-2xl z-[100] animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center mb-10 pb-4 border-b border-white/5">
        <div className="flex flex-col">
          <h3 className="text-sm font-black text-white uppercase tracking-tighter">FOCUS_MANIFEST</h3>
          <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">SESSION_ARCHIVE_TYPE_01</span>
        </div>
        <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {history.length === 0 ? (
          <div className="text-center py-20 opacity-10 flex flex-col items-center">
            <div className="w-12 h-[1px] bg-white mb-4" />
            <p className="text-[9px] font-mono tracking-widest uppercase">NO_SESSION_DATA</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((session, idx) => (
              <div key={session.id} className="relative group border border-white/5 bg-[#111] p-4 rounded-lg overflow-hidden transition-all hover:bg-white/5 hover:border-white/10">
                <div className="absolute top-0 left-0 w-[2px] h-full bg-white/20 group-hover:bg-white transition-colors" />
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[7px] font-mono text-white/40 uppercase tracking-widest">
                    {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[7px] font-mono text-white/80 bg-white/10 px-1.5 py-0.5 rounded uppercase">
                    ID_{session.id.slice(0,4)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{session.mode}</h4>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full border border-white/20" />
                     <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">{Math.floor(session.durationSeconds / 60)}:00_MINS</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5 flex flex-col gap-1">
                   <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest">LAST_SIGNAL_FEED:</span>
                   <span className="text-[8px] font-mono text-white/60 uppercase truncate">{session.tracks[0] || 'NONE'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-10 pt-6 border-t border-white/5 flex flex-col items-center gap-2 opacity-10">
          <span className="text-[8px] font-mono text-white tracking-[0.4em] uppercase">DEYSIGNS_CORE_ENGINE</span>
          <span className="text-[7px] font-mono text-white tracking-widest uppercase">REV_3.5_STABLE</span>
      </div>
    </div>
  );
};

export default HistoryPanel;
