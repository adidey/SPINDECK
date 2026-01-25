
import React, { useMemo } from 'react';
import { SessionRecord } from '../types';

interface HistoryPanelProps {
  history: SessionRecord[];
  onClose: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onClose }) => {
  const dailyTotalMinutes = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    return history
      .filter(s => new Date(s.startTime).setHours(0, 0, 0, 0) === today)
      .reduce((acc, s) => acc + (s.durationSeconds / 60), 0);
  }, [history]);

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-[#0a0a0a] border-l border-white/5 p-8 flex flex-col shadow-2xl z-[100] panel-slide-in">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
        <div className="flex flex-col">
          <h3 className="text-sm font-black text-white uppercase tracking-tighter">FOCUS_MANIFEST</h3>
          <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">UNIT_SERIAL_LOG_01</span>
        </div>
        <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Daily Summary Stats */}
      <div className="mb-8 p-4 bg-[#111] rounded-xl border border-white/5 flex flex-col gap-2">
        <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">DAILY_PROTOCOL_TOTAL</span>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-pixel text-white leading-none">{Math.floor(dailyTotalMinutes)}</span>
          <span className="text-[10px] font-mono text-white/20 uppercase mb-1">Minutes_Synced</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {history.length === 0 ? (
          <div className="text-center py-20 opacity-10 flex flex-col items-center">
            <div className="w-12 h-[1px] bg-white mb-4" />
            <p className="text-[9px] font-mono tracking-widest uppercase">EMPTY_MANIFEST</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((session) => (
              <div key={session.id} className="relative group border border-white/5 bg-[#0d0d0d] p-4 rounded-lg overflow-hidden transition-all hover:bg-white/[0.02]">
                <div className="absolute top-0 left-0 w-[2px] h-full bg-white/10 group-hover:bg-white transition-colors" />
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[7px] font-mono text-white/40 uppercase tracking-widest">
                    {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[7px] font-mono text-white/20 uppercase">
                    MOD_{session.id.slice(0, 4)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black text-white/80 uppercase tracking-[0.15em]">{session.mode}</h4>
                  <span className="text-[10px] font-pixel text-white/40">{Math.floor(session.durationSeconds / 60)}:00</span>
                </div>
                <div className="mt-2 text-[8px] font-mono text-white/20 uppercase truncate italic">
                  {session.tracks[0] || 'DATA_MISSING'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-2 opacity-10">
        <span className="text-[8px] font-mono text-white tracking-[0.4em] uppercase">DEYSIGNS_CORE_ENGINE</span>
        <span className="text-[7px] font-mono text-white tracking-widest uppercase">SPINPOD_REV_3.5_STABLE</span>
      </div>
    </div>
  );
};

export default HistoryPanel;
