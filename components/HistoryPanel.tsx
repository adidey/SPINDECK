
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
          <h3 className="text-sm font-black text-white uppercase tracking-tighter">DATA_LOG</h3>
          <span className="text-[8px] font-mono text-white/20 uppercase">Module_Archive</span>
        </div>
        <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {history.length === 0 ? (
          <div className="text-center py-20 opacity-10 flex flex-col items-center">
            <div className="w-8 h-8 border border-white mb-4 rounded-full" />
            <p className="text-[10px] font-mono tracking-widest">NULL_DATA</p>
          </div>
        ) : (
          history.map((session) => (
            <div key={session.id} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[8px] font-mono text-white/40 uppercase">
                  {new Date(session.startTime).toLocaleDateString()}
                </span>
                <span className="text-[8px] font-mono text-white font-bold bg-white/10 px-1 rounded-sm">
                  {Math.floor(session.durationSeconds / 60)}M
                </span>
              </div>
              <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">{session.mode}</h4>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-10 pt-6 border-t border-white/5">
        <div className="text-center">
            <span className="text-[8px] font-mono text-white/10 font-black uppercase tracking-widest">TYPE_01_CORE / REV_3.1</span>
        </div>
      </div>
    </div>
  );
};

export default HistoryPanel;
