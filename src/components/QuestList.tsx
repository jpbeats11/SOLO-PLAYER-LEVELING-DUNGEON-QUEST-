import React from 'react';
import { motion } from 'motion/react';
import { Trophy, CheckCircle2, ChevronRight, Target } from 'lucide-react';
import { Quest } from '../types';
import { audio } from '../services/audioService';

interface QuestListProps {
  quests: Quest[];
  onQuestClick?: (quest: Quest) => void;
}

export const QuestList: React.FC<QuestListProps> = ({ quests = [], onQuestClick }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <h3 className="text-sm font-black text-white tracking-[0.2em] uppercase">System Quests</h3>
      </div>
      
      {Array.isArray(quests) && quests.map((quest) => (
        <motion.div
          key={quest.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            audio.playAtk();
            if (onQuestClick) onQuestClick(quest);
          }}
          className={`relative group overflow-hidden bg-gray-900/40 border cursor-pointer ${quest.isCompleted ? 'border-green-500/50' : 'border-gray-800'} rounded-xl p-4 transition-all hover:bg-gray-800/60 shadow-lg hover:shadow-cyan-900/10`}
        >
          {quest.isCompleted && (
            <div className="absolute top-0 right-0 p-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
          )}
          
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className={`text-sm font-black italic tracking-tight ${quest.isCompleted ? 'text-green-400' : 'text-cyan-400'}`}>
                {quest.name}
              </h4>
              <p className="text-[10px] text-gray-500 font-mono mt-1">{quest.description}</p>
            </div>
          </div>

          <div className="flex items-end justify-between mt-4">
            <div className="flex-1 mr-6">
              <div className="flex justify-between text-[8px] font-mono text-gray-400 mb-1 uppercase tracking-tighter">
                <span>Progress</span>
                <span>{quest.isCompleted ? 'COMPLETE' : `${quest.current} / ${quest.target}`}</span>
              </div>
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (quest.current / quest.target) * 100)}%` }}
                  className={`h-full ${quest.isCompleted ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]'}`}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="text-right">
                  <div className="text-[8px] text-gray-500 font-black uppercase">Reward</div>
                  <div className="text-[10px] text-yellow-400 font-mono font-bold">+{quest.rewardExp} EXP</div>
               </div>
               <ChevronRight className="w-4 h-4 text-gray-700" />
            </div>
          </div>

          {/* Background Highlight */}
          <div className="absolute -bottom-2 -left-2 opacity-10 rotate-12">
            <Target className="w-12 h-12 text-gray-400" />
          </div>
        </motion.div>
      ))}

      {quests.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-900 rounded-2xl">
          <p className="text-gray-600 text-xs font-mono uppercase tracking-widest">No Quests Available</p>
        </div>
      )}
    </div>
  );
};
