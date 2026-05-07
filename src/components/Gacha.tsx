import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerData, GameItem } from '../types';
import { Star, Gem, Sparkles, Box, Trophy, ArrowRight } from 'lucide-react';
import { RARITY_COLORS } from '../constants';

interface GachaProps {
  player: PlayerData;
  buy: (cost: number) => GameItem | null;
}

export const Gacha: React.FC<GachaProps> = ({ player, buy }) => {
  const [outcome, setOutcome] = useState<GameItem | null>(null);
  const [rolling, setRolling] = useState(false);

  const COST = 50;

  const handleRoll = () => {
    if (player.gems < COST || rolling) return;
    
    setRolling(true);
    setOutcome(null);
    
    // Fake rolling delay
    setTimeout(() => {
      const item = buy(COST);
      setOutcome(item);
      setRolling(false);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-[#12121a] to-black p-8 rounded-3xl border-2 border-cyan-500/20 shadow-2xl overflow-hidden relative">
         <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy size={120} />
         </div>
         
         <div className="relative z-10 text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-cyan-950/50 px-4 py-1.5 rounded-full border border-cyan-500/30">
               <Sparkles className="text-cyan-400" size={14} />
               <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Divine Summon System</span>
            </div>
            
            <h2 className="text-5xl font-black italic text-white leading-tight tracking-tighter">CHEST OF THE <br/>MONARCH</h2>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
              Unlock legendary relics and mythical gear using Soul Gems. High luck increases chances for Mythical artifacts.
            </p>
         </div>

         <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
            <div className="bg-black/50 p-4 rounded-2xl border border-gray-800 text-center">
               <div className="text-[8px] text-gray-500 uppercase font-black mb-1">Common - Epic</div>
               <div className="text-lg font-black text-white">95%</div>
            </div>
            <div className="bg-black/50 p-4 rounded-2xl border border-yellow-500/20 text-center">
               <div className="text-[8px] text-yellow-500/50 uppercase font-black mb-1">Legndary - Mythic</div>
               <div className="text-lg font-black text-yellow-500">5%</div>
            </div>
         </div>

         <button 
           onClick={handleRoll}
           disabled={rolling || player.gems < COST}
           className={`w-full mt-8 py-6 rounded-2xl font-black italic text-xl tracking-tighter flex items-center justify-center gap-3 transition-all ${
             rolling || player.gems < COST 
             ? 'bg-gray-800 text-gray-600 grayscale' 
             : 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:scale-[0.98]'
           }`}
         >
           {rolling ? (
             <RefreshCw className="animate-spin" />
           ) : (
             <>
               SUMMON RELIC
               <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
                  <Gem size={14} className="text-purple-400" />
                  <span className="text-sm font-mono">{COST}</span>
               </div>
             </>
           )}
         </button>
      </div>

      <AnimatePresence>
        {rolling && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-8 text-center"
          >
             <motion.div 
               animate={{ rotate: 360, scale: [1, 1.2, 1] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="w-32 h-32 rounded-full border-4 border-cyan-500/50 border-t-cyan-500 shadow-[0_0_50px_rgba(6,182,212,0.5)]"
             />
             <h2 className="mt-12 text-3xl font-black text-white italic animate-pulse">RESONATING WITH THE SYSTEM...</h2>
             <p className="text-xs text-cyan-400 font-mono mt-4 uppercase tracking-[0.4em]">Decrypting Loot Table</p>
          </motion.div>
        )}

        {outcome && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[101] bg-black/95 flex flex-col items-center justify-center p-8"
          >
             <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 blur-[120px] rounded-full" />
             </div>

             <motion.div 
               initial={{ y: 50 }}
               animate={{ y: 0 }}
               className="bg-[#0f0f1a] border-2 border-cyan-500/30 p-12 rounded-[40px] text-center relative max-w-sm w-full"
             >
                <div className={`text-xs font-black uppercase tracking-[0.4em] mb-4 ${RARITY_COLORS[outcome.rarity]}`}>
                  {outcome.rarity} ACQUIRED
                </div>
                <h3 className="text-4xl font-black text-white italic mb-2 leading-none">{outcome.name}</h3>
                <div className="text-gray-500 text-[10px] font-mono italic mb-8 uppercase tracking-widest">{outcome.type} • {outcome.element}</div>
                
                <div className="bg-black/50 p-6 rounded-2xl border border-gray-800 mb-10">
                   <div className="text-xs text-gray-500 font-black uppercase mb-1">Power Rating</div>
                   <div className="text-5xl font-black text-cyan-400 font-mono tracking-tighter">+{outcome.statBonus}</div>
                </div>

                <button 
                  onClick={() => setOutcome(null)}
                  className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Confirm Registration
                </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function RefreshCw({ className }: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
  );
}
