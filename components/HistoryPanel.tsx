
import React from 'react';
import { SessionRecord } from '../types';

interface HistoryPanelProps {
  history: SessionRecord[];
  onClose: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onClose }) => {
  return (
    <div className="fixed inset-y-0 right-0 w-80 glass border-l border-white/10 p-6 flex flex-col shadow-2xl z-50 animate-in slide-in-from-right duration-500">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-lg font-display font-bold text-white">Focus History</h3>
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {history.length === 0 ? (
          <div className="text-center py-20 opacity-30">
            <p className="text-sm font-pixel">NO DATA LOGGED</p>
          </div>
        ) : (
          history.map((session) => (
            <div key={session.id} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-pixel text-blue-400 uppercase tracking-tighter">
                  {new Date(session.startTime).toLocaleDateString()}
                </span>
                <span className="text-[10px] font-pixel text-pink-400">
                  {Math.floor(session.durationSeconds / 60)}m
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white/90">{session.mode}</h4>
              <p className="text-xs text-white/40 mt-1 italic">
                {session.tracks.length} tracks spun
              </p>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-8 pt-6 border-t border-white/10">
        <div className="text-center">
            <span className="text-[10px] font-pixel text-white/20">SPINDECK V1.0.4</span>
        </div>
      </div>
    </div>
  );
};

export default HistoryPanel;
