import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerData, Skill } from '../types';
import { Sparkles, ArrowBigUp, Lock, Brain } from 'lucide-react';
import { audio } from '../services/audioService';

interface SkillTreeProps {
  player: PlayerData;
  onUpgrade: (skillId: string) => void;
}

export const SkillTree: React.FC<SkillTreeProps> = ({ player, onUpgrade }) => {
  return (
    <div className="relative space-y-6">
      {/* SVG Connecting Lines */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg className="w-full h-full stroke-cyan-500/20 stroke-2 fill-none">
          {player.skills.map((_, i) => i < player.skills.length - 1 && (
            <line 
              key={`line-${i}`}
              x1="50%" 
              y1={`${100 + i * 128}px`} 
              x2="50%" 
              y2={`${180 + i * 128}px`} 
            />
          ))}
        </svg>
      </div>

      <div className="relative z-10 flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-gray-800">
        <div>
          <h3 className="text-xl font-black italic tracking-tighter">SKILL TREE</h3>
          <p className="text-xs text-cyan-400 font-bold uppercase tracking-widest">Available Points: {player.skillPoints}</p>
        </div>
        <Brain className="text-cyan-500 animate-pulse" size={32} />
      </div>

      <div className="relative z-10 grid gap-6">
        {player.skills.map((skill) => {
          const canUpgrade = player.skillPoints > 0 && skill.level < skill.maxLevel;
          
          return (
            <motion.div
              key={skill.id}
              layout
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`p-5 rounded-2xl border-2 transition-all duration-500 ${
                canUpgrade ? 'border-cyan-500/40 bg-gray-900/60 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'border-gray-800 bg-black/60'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                       <Sparkles size={16} className="text-cyan-400" />
                    </div>
                    <div>
                      <span className="text-sm font-black uppercase text-white tracking-tight">{skill.name}</span>
                      <div className="text-[9px] text-gray-500 font-mono">RANK {skill.level >= skill.maxLevel ? 'MAX' : skill.level}</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-tight italic">{skill.description}</p>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => onUpgrade(skill.id)}
                    disabled={!canUpgrade}
                    className={`group relative w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-300 ${
                      canUpgrade 
                      ? 'bg-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:bg-cyan-500' 
                      : 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <AnimatePresence>
                      {canUpgrade && (
                        <motion.div 
                          className="absolute inset-0 bg-white/20"
                          initial={{ scale: 0 }}
                          animate={{ scale: [0, 2] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        />
                      )}
                    </AnimatePresence>
                    <ArrowBigUp size={24} className="relative z-10 group-hover:scale-110 transition-transform" />
                  </button>
                  <div className="text-[10px] font-black text-white/40">{skill.level}/{skill.maxLevel}</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 w-full h-1 bg-gray-900 rounded-full overflow-hidden">
                <motion.div 
                   animate={{ width: `${(skill.level / skill.maxLevel) * 100}%` }}
                   className="h-full bg-cyan-500"
                />
              </div>

              {/* Stat Multipliers */}
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(skill.stats_multiplier).map(([stat, val]) => (
                  <div key={stat} className="flex items-center gap-1.5 bg-cyan-950/40 px-2 py-1 rounded border border-cyan-900/30">
                    <span className="text-[8px] font-black text-cyan-400 uppercase tracking-tighter">
                      {stat} FOCUS
                    </span>
                    <span className="text-[9px] font-mono text-cyan-200">+{val}x</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {player.skills.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-gray-800 rounded-2xl">
          <Lock className="mx-auto text-gray-700 mb-2" size={32} />
          <p className="text-xs text-gray-600 uppercase font-black">No Class Skills Found</p>
        </div>
      )}
    </div>
  );
};
