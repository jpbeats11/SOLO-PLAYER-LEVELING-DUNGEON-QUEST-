import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sword, Shield, Zap, Flame, User, Scroll, 
  Settings, ShoppingBag, Hammer, Play, Pause, RefreshCw, 
  ChevronRight, Brain, Wind, Droplets, Ghost, Target,
  Star, Coins, Gem, Heart, Trophy, Crown, Layers, HandMetal,
  CircleDot, Diamond, Circle, Award, ArrowLeft, X
} from 'lucide-react';
import { useGameState } from './gameState';
import { CLASSES, RARITY_COLORS, SLOTS } from './constants';
import { ClassType, Slot, Rarity } from './types';
import { DungeonMapView } from './components/DungeonMapView';
import { QuestList } from './components/QuestList';
import { SkillTree } from './components/SkillTree';
import { Gacha } from './components/Gacha';
import { audio } from './services/audioService';

export default function App() {
  const { 
    player, createCharacter, isAutoBattle, setIsAutoBattle, 
    ariseAvailable, arise, hasStarted, setHasStarted,
    battleLog, upgradeItem, buyChest, buySpecificItem, summonShadow, recycleItems, triggerAutoEquip,
    setSortOrder, sortedInventory, upgradeSkill, floorModifier, resetSave,
    claimDailyReward, switchGate, unequip, allocateAttribute, equipItem, discardItem
  } = useGameState() as any;

  const [view, setView] = useState<'dashboard' | 'dungeon' | 'inventory' | 'shop' | 'blacksmith' | 'quests' | 'skills' | 'summons' | 'gates'>('dashboard');
  const [logFilter, setLogFilter] = useState<'all' | 'victory' | 'loot' | 'system'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono p-4 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent opacity-50" />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center z-10"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="mb-8"
          >
             <h2 className="text-cyan-400 text-3xl font-black tracking-[0.5em] italic">SYNCING MANA</h2>
             <p className="text-[10px] text-cyan-700 tracking-[0.8em] mt-2 uppercase font-bold">Initializing Eternal System</p>
          </motion.div>
          
          <div className="w-64 h-1 bg-gray-900 rounded-full overflow-hidden mx-auto mb-4 relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "linear" }}
              className="h-full bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,1)]"
            />
          </div>
          <motion.div 
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="text-[8px] text-gray-500 tracking-widest"
          >
            ESTABLISHING CONNECTION TO THE VOID...
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (!player) {
    return <CharacterCreation onCreate={createCharacter} />;
  }

  if (view === 'dashboard' && !hasStarted) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 font-mono relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center z-10"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <h1 className="text-7xl font-black text-white italic tracking-tighter mb-2 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">SOLO PLAYER</h1>
            <h2 className="text-2xl font-black text-yellow-500 mb-20 tracking-[0.4em] uppercase drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">Eternal Ascent</h2>
          </motion.div>
          
          <div className="relative inline-block">
             <motion.div
               animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl"
             />
             <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setHasStarted(true);
                setView('dashboard');
              }}
              className="relative z-10 text-cyan-400 font-black tracking-[0.3em] text-sm uppercase px-12 py-5 border-2 border-cyan-500/50 rounded-full bg-cyan-950/40 backdrop-blur-md hover:bg-cyan-900/50 transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)]"
            >
              TAP TO ENTER SYSTEM
            </motion.button>
          </div>
          
          <div className="mt-20 flex gap-8 justify-center opacity-40">
             <div className="flex flex-col items-center">
                <Shield size={20} className="text-gray-500 mb-1" />
                <span className="text-[8px] uppercase font-bold tracking-widest text-gray-500">Secure Data</span>
             </div>
             <div className="flex flex-col items-center">
                <Zap size={20} className="text-gray-500 mb-1" />
                <span className="text-[8px] uppercase font-bold tracking-widest text-gray-500">Auto Save</span>
             </div>
             <div className="flex flex-col items-center">
                <Target size={20} className="text-gray-500 mb-1" />
                <span className="text-[8px] uppercase font-bold tracking-widest text-gray-500">Offline RPG</span>
             </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 font-sans selection:bg-red-500/30">
      {/* HUD Top */}
      <div className="fixed top-0 w-full z-50 bg-[#0f0f1a]/80 backdrop-blur-md border-b border-gray-800 p-3 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
          <div className="w-10 h-10 rounded-lg bg-red-950 border border-red-500 flex items-center justify-center text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            <User size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{player.class}</div>
            <div className="text-sm font-black text-white flex items-center gap-1 cursor-pointer hover:text-cyan-400 transition-colors" onClick={(e) => { e.stopPropagation(); setView('gates'); }}>
              {player.name} <span className="text-yellow-400">LVL {player.level}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-yellow-900/30 cursor-pointer" onClick={() => setView('shop')}>
            <Coins size={14} className="text-yellow-400" />
            <span className="text-xs font-mono text-yellow-400">{player.gold.toLocaleString()}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-cyan-900/30 cursor-pointer" onClick={() => setView('summons')}>
            <Gem size={14} className="text-cyan-400" />
            <span className="text-xs font-mono text-cyan-400">{player.gems.toLocaleString()}</span>
          </div>
          <button onClick={resetSave} className="p-2 text-gray-500 hover:text-white transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </div>

      <main className="pt-20 pb-24 px-4 max-w-lg mx-auto min-h-screen custom-scrollbar">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
              <Dashboard player={player} logs={battleLog} logFilter={logFilter} setLogFilter={setLogFilter} claimDaily={claimDailyReward} unequip={unequip} allocateAttribute={allocateAttribute} setView={setView} />
            </motion.div>
          )}
          {view === 'gates' && (
             <div className="space-y-4">
               <ViewHeader title="GATE SELECTION" onBack={() => setView('dashboard')} />
               <GateSelection player={player} onSelect={(id: string) => { audio.playSkill(); switchGate(id); setView('dungeon'); }} />
             </div>
          )}
          {view === 'dungeon' && (
            <motion.div key="dung" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ViewHeader title="BATTLE ZONE" onBack={() => setView('dashboard')} />
              <div className="mb-4">
                {floorModifier && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-xl"
                  >
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                       {floorModifier.icon === 'zap' && <Zap size={16} />}
                       {floorModifier.icon === 'star' && <Star size={16} />}
                       {floorModifier.icon === 'droplets' && <Droplets size={16} />}
                       {floorModifier.icon === 'heart' && <Heart size={16} />}
                       {floorModifier.icon === 'coins' && <Coins size={16} />}
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{floorModifier.name} Active</div>
                      <div className="text-[9px] text-gray-400 font-mono italic">{floorModifier.effect}</div>
                    </div>
                  </motion.div>
                )}
              </div>
              <Dungeon 
                player={player} 
                isAuto={isAutoBattle} 
                toggleAuto={() => setIsAutoBattle(!isAutoBattle)} 
                logs={battleLog} 
                ariseAvailable={ariseAvailable}
                onArise={arise}
              />
            </motion.div>
          )}
          {view === 'inventory' && (
            <motion.div key="inv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ViewHeader title="INVENTORY" onBack={() => setView('dashboard')} />
              <Inventory 
                player={player!} 
                sortedInventory={sortedInventory} 
                setSortOrder={setSortOrder} 
                recycle={recycleItems} 
                autoEquip={triggerAutoEquip}
                equipItem={equipItem}
                discardItem={discardItem}
                setView={setView}
              />
            </motion.div>
          )}
          {view === 'blacksmith' && (
            <motion.div key="smith" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ViewHeader title="BLACKSMITH" onBack={() => setView('dashboard')} />
              <Blacksmith player={player!} upgrade={upgradeItem} />
            </motion.div>
          )}
          {view === 'shop' && (
            <motion.div key="shop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ViewHeader title="MERCENARY SHOP" onBack={() => setView('dashboard')} />
              <Shop player={player} buyChest={buyChest} buyItem={buySpecificItem} />
            </motion.div>
          )}
          {view === 'quests' && (
            <motion.div key="quests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ViewHeader title="WORLD QUESTS" onBack={() => setView('dashboard')} />
              <Quests player={player!} />
            </motion.div>
          )}
          {view === 'skills' && (
            <motion.div key="skills" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ViewHeader title="SKILL AWAKENING" onBack={() => setView('dashboard')} />
              <SkillTree player={player!} onUpgrade={upgradeSkill} />
            </motion.div>
          )}
          {view === 'summons' && (
            <motion.div key="summons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ViewHeader title="SHADOW THRONE" onBack={() => setView('dashboard')} />
              <SummonView player={player!} buy={buyChest} summonShadow={() => { audio.playArise(); summonShadow(); }} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-[#0f0f1a] border-t border-gray-800 px-2 py-4 flex justify-between items-center z-50">
        <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<Scroll size={18} />} label="Stats" />
        <NavButton active={view === 'quests'} onClick={() => setView('quests')} icon={<Trophy size={18} />} label="Quests" />
        <NavButton active={view === 'skills'} onClick={() => setView('skills')} icon={<Brain size={18} />} label="Skills" />
        <NavButton active={view === 'summons'} onClick={() => setView('summons')} icon={<Ghost size={18} />} label="Summon" />
        <NavButton active={view === 'gates'} onClick={() => setView('gates')} icon={<Play size={18} />} label="Gate" />
        <NavButton active={view === 'inventory'} onClick={() => setView('inventory')} icon={<ShoppingBag size={18} />} label="Items" />
        <NavButton active={view === 'blacksmith'} onClick={() => setView('blacksmith')} icon={<Hammer size={18} />} label="Forge" />
      </nav>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: any) {
  return (
    <button 
      onClick={() => {
        audio.playAtk();
        onClick();
      }}
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-red-500 scale-110' : 'text-gray-500 hover:text-gray-300'}`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      {active && <motion.div layoutId="nav" className="w-1 h-1 bg-red-500 rounded-full mt-1" />}
    </button>
  );
}

function ViewHeader({ title, onBack }: { title: string, onBack: () => void }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <button 
        onClick={() => {
          audio.playAtk();
          onBack();
        }}
        className="flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-colors bg-gray-900/40 px-3 py-1.5 rounded-full border border-gray-800"
      >
        <ArrowLeft size={12} /> Back
      </button>
      <h3 className="text-sm font-black italic tracking-tighter text-gray-500">{title}</h3>
    </div>
  );
}

function CharacterCreation({ onCreate }: { onCreate: (n: string, c: ClassType) => void }) {
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassType>('Warrior');

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-8 overflow-y-auto">
      <div className="max-w-md mx-auto py-12">
        <h2 className="text-3xl font-black mb-8 text-center bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent italic">SELECT YOUR PATH</h2>
        
        <input 
          type="text" 
          placeholder="ENTER HERO NAME" 
          className="w-full bg-[#151520] border-2 border-gray-800 p-4 mb-8 text-center text-xl font-bold rounded-xl focus:border-red-600 outline-none transition-all placeholder:text-gray-700 uppercase"
          value={name}
          onChange={(e) => setName(e.target.value.toUpperCase())}
        />

        <div className="grid grid-cols-2 gap-3 mb-8">
          {CLASSES.map(c => (
            <button 
              key={c}
              onClick={() => setSelectedClass(c)}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${selectedClass === c ? 'border-red-600 bg-red-900/20' : 'border-gray-800 bg-[#0f0f1a] grayscale opacity-50 hover:opacity-80'}`}
            >
              <ClassIcon cls={c} size={32} />
              <span className="text-xs font-black tracking-widest">{c.toUpperCase()}</span>
            </button>
          ))}
        </div>

        <button 
          disabled={!name}
          onClick={() => {
            audio.playArise();
            onCreate(name, selectedClass);
          }}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-800 text-white font-black p-5 rounded-2xl shadow-[0_10px_20px_rgba(220,38,38,0.3)] transition-all active:scale-95"
        >
          AWAKEN AS {selectedClass.toUpperCase()}
        </button>
      </div>
    </div>
  );
}

function Dashboard({ player, logs, logFilter, setLogFilter, claimDaily, unequip, allocateAttribute, setView }: any) {
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);

  const STAT_DESC: any = {
    STR: "Strength: Increases raw Attack Power (ATK) by 5.",
    AGI: "Agility: Boosts weapon speed and evasion.",
    INT: "Intelligence: Enhances MP by 15 per point.",
    VIT: "Vitality: Increases Max HP by 20 per point.",
    DEX: "Dexterity: Improves precision and critical damage.",
    LUK: "Lux/Luck: Boosts rarity drop rates in the Dungeon."
  };

  const filteredLogs = logs.filter((log: string) => {
    if (logFilter === 'all') return true;
    if (logFilter === 'victory') return log.includes('Victory') || log.includes('DEFEATED');
    if (logFilter === 'loot') return log.includes('Found');
    if (logFilter === 'system') return log.includes('Level Up') || log.includes('BOSS');
    return true;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="relative group">
        <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full" />
        <motion.div 
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.2}
          whileTap={{ cursor: 'grabbing' }}
          className="relative bg-[#0f0f1a] border border-gray-800 rounded-3xl p-8 text-center overflow-hidden cursor-grab active:border-red-500/50 transition-colors"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <ClassIcon cls={player.class} size={120} />
          </div>
          <div className="flex justify-center gap-4 mb-4">
            <button 
              onClick={() => setView('summons')}
              className="text-xs font-black text-purple-500 uppercase tracking-widest bg-purple-950/30 px-3 py-1 rounded-full border border-purple-900/50 hover:bg-purple-900/40 transition-colors"
            >
              Shadow Army: {player.shadowArmy || 0}
            </button>
            {player.currentPet && (
              <span className="text-xs font-black text-cyan-400 uppercase tracking-widest bg-cyan-950/30 px-3 py-1 rounded-full border border-cyan-900/50">Pet: {player.currentPet.name}</span>
            )}
          </div>
          <h3 className="text-5xl font-black mb-2 tracking-tighter italic">{player.name}</h3>
          <p className="text-gray-400 font-mono italic mb-4">RANK SSS • {player.class.toUpperCase()}</p>
          
          {player.attributePoints > 0 && (
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="bg-red-600 text-white text-[10px] font-black py-1 px-4 rounded-full inline-block mb-4 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
            >
              {player.attributePoints} ATTRIBUTE POINTS AVAILABLE
            </motion.div>
          )}

          <div className="flex justify-center gap-2">
            <button 
              onClick={() => setView('gates')}
              className="inline-flex items-center gap-2 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/50 text-cyan-400 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            >
              <Layers size={14} /> Gate Status
            </button>
            <button 
              onClick={claimDaily}
              className="inline-flex items-center gap-2 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/50 text-yellow-500 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all active:scale-95"
            >
              <Star size={14} /> Daily Reward
            </button>
          </div>
        </motion.div>
      </div>

      <div className="bg-[#0f0f1a] border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-2">
              <Shield size={14} className="text-gray-500" />
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Armor Room</h4>
           </div>
           <button onClick={() => setView('inventory')} className="text-[8px] font-black text-cyan-500 uppercase flex items-center gap-1">Manage <ChevronRight size={10} /></button>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {['Weapon', 'Headgear', 'Suit', 'Pants', 'Shoes'].map(slot => {
            const item = player.equipped[slot];
            return (
              <div 
                key={slot}
                onClick={() => setView('inventory')}
                className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative group transition-all cursor-pointer ${item ? 'bg-gray-900/50 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]' : 'bg-black border-gray-800 border-dashed hover:border-gray-600'}`}
              >
                {item ? (
                  <>
                    <ItemIcon type={slot as any} size={18} rarity={item.rarity} />
                    <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                  </>
                ) : (
                  <span className="text-[8px] font-bold text-gray-700 uppercase">{slot.slice(0, 3)}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Nav Grid */}
      <div className="grid grid-cols-4 gap-3">
         <NavCard icon={<Trophy size={20} />} label="Quests" onClick={() => setView('quests')} color="from-yellow-900/20 to-transparent" />
         <NavCard icon={<Brain size={20} />} label="Skills" onClick={() => setView('skills')} color="from-blue-900/20 to-transparent" />
         <NavCard icon={<Ghost size={20} />} label="Summons" onClick={() => setView('summons')} color="from-purple-900/20 to-transparent" />
         <NavCard icon={<Hammer size={20} />} label="Forge" onClick={() => setView('blacksmith')} color="from-orange-900/20 to-transparent" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {['STR', 'AGI', 'INT', 'VIT', 'DEX', 'LUK'].map(stat => (
           <motion.div 
             key={stat}
             onMouseEnter={() => setHoveredStat(stat)}
             onMouseLeave={() => setHoveredStat(null)}
             drag
             dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
             dragElastic={0.1}
             className="relative cursor-grab active:z-50"
           >
              <div className="relative">
                <StatCard 
                  label={stat === 'LUK' ? 'LUX' : stat} 
                  value={(player.stats as any)[stat]} 
                  icon={stat === 'STR' ? <Sword size={16}/> : stat === 'AGI' ? <Wind size={16}/> : stat === 'INT' ? <Flame size={16}/> : stat === 'VIT' ? <Heart size={16}/> : stat === 'DEX' ? <Target size={16}/> : <Star size={16}/>} 
                  color={stat === 'STR' ? 'text-red-400' : stat === 'AGI' ? 'text-cyan-400' : stat === 'INT' ? 'text-blue-400' : stat === 'VIT' ? 'text-green-400' : stat === 'DEX' ? 'text-yellow-400' : 'text-purple-400'} 
                />
                {player.attributePoints > 0 && (
                  <button 
                    onClick={() => allocateAttribute(stat)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center hover:bg-red-500 shadow-lg z-10"
                  >
                    +
                  </button>
                )}
              </div>
              <AnimatePresence>
                {hoveredStat === stat && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute bottom-full left-0 right-0 mb-2 z-50 bg-[#12121a] border border-red-500/50 p-2 rounded-lg text-[10px] text-gray-300 shadow-2xl backdrop-blur-md"
                  >
                    {STAT_DESC[stat]}
                  </motion.div>
                )}
              </AnimatePresence>
           </motion.div>
        ))}
      </div>

      {player.activeSetBonuses && player.activeSetBonuses.length > 0 && (
        <div className="bg-[#0f0f1a] border border-cyan-500/30 rounded-2xl p-6 space-y-4 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
           <div className="flex items-center gap-2 mb-2">
              <Star size={14} className="text-cyan-400" />
              <h4 className="text-xs font-black text-cyan-400 uppercase tracking-[0.2em]">Active Set Resonance</h4>
           </div>
           <div className="space-y-3">
              {player.activeSetBonuses.map((set: any) => (
                <div key={set.setName} className="flex flex-col gap-1 border-l-2 border-cyan-500/50 pl-4 py-1">
                   <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-white italic">{set.setName}</span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-full border border-cyan-900/50">{set.count}/4 PIECES</span>
                   </div>
                   <div className="flex gap-2">
                      {Object.entries(set.bonus).map(([stat, val]) => (
                        <span key={stat} className="text-[10px] font-bold text-gray-500">+{val} {stat}</span>
                      ))}
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="bg-[#0f0f1a] border border-gray-800 rounded-2xl p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
            <span>EXP Progression</span>
            <span className="text-red-500">{Math.floor((player.exp / player.maxExp) * 100)}%</span>
          </div>
          <div className="h-2 bg-black rounded-full overflow-hidden border border-gray-800">
            <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${(player.exp / player.maxExp) * 100}%` }} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Operational Logs</h4>
            <div className="flex gap-1">
              {(['all', 'victory', 'loot', 'system'] as const).map(f => (
                <button 
                  key={f}
                  onClick={() => setLogFilter(f)}
                  className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border transition-all ${logFilter === f ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-black border-gray-800 text-gray-500 hover:border-gray-600'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-black/50 border border-gray-800/40 rounded-xl p-4 h-48 overflow-y-auto space-y-2 font-mono text-[10px] custom-scrollbar">
            {filteredLogs.map((log: string, i: number) => (
              <div key={i} className="flex gap-2 items-start border-l border-gray-800 pl-2">
                <span className={log.includes('Victory') || log.includes('DEFEATED') ? 'text-green-500' : log.includes('Found') ? 'text-cyan-400' : 'text-red-400 opacity-80'}>{log}</span>
              </div>
            ))}
            {filteredLogs.length === 0 && <p className="text-center text-gray-700 mt-16 tracking-widest uppercase">No matching events...</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Dungeon({ player, isAuto, toggleAuto, logs, ariseAvailable, onArise }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <DungeonMapView 
        player={player} 
        isAutoBattle={isAuto} 
        onBattleTick={() => {}} // Integration handled by gameState.ts effect
      />

      <AnimatePresence>
        {ariseAvailable && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 bg-black/90 backdrop-blur-sm"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                filter: ['brightness(1)', 'brightness(2)', 'brightness(1)']
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-center"
            >
              <h2 className="text-6xl md:text-8xl font-black text-purple-500 italic tracking-tighter drop-shadow-[0_0_30px_rgba(168,85,247,0.8)] mb-4">
                A R I S E
              </h2>
              <p className="text-xs text-purple-400 font-black uppercase tracking-[0.6em] mb-12">Shadow Extraction Sequence Ready</p>
              
              <button 
                onClick={onArise}
                className="group relative px-12 py-5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xl rounded-full transition-all shadow-[0_0_20px_rgba(168,85,247,0.5)] active:scale-95"
              >
                <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-20 pointer-events-none" />
                EXTRACT SHADOW
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        disabled={ariseAvailable}
        onClick={toggleAuto}
        className={`w-full p-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all ${isAuto ? 'bg-red-900/50 border-2 border-red-600 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-red-600 hover:bg-red-700 text-white shadow-lg disabled:opacity-50'}`}
      >
        {isAuto ? <><Pause /> AUTO-ATTACK ON</> : <><Play /> START AUTO-LEVELING</>}
      </button>

      <div className="bg-black/50 border border-gray-800 rounded-2xl p-4 h-48 overflow-y-auto space-y-2 font-mono text-xs custom-scrollbar">
        {logs.map((log: string, i: number) => (
          <div key={i} className="flex gap-2">
            <span className="text-gray-600 italic">[{new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}]</span>
            <span className={log.includes('Victory') || log.includes('DEFEATED') ? 'text-green-400' : 'text-red-400'}>{log}</span>
          </div>
        ))}
        {logs.length === 0 && <p className="text-center text-gray-700 mt-16 tracking-widest uppercase">Ready for deployment...</p>}
      </div>
    </motion.div>
  );
}

function Inventory({ player, sortedInventory, setSortOrder, recycle, autoEquip, equipItem, discardItem, setView }: any) {
  const [selectedItem, setSelectedItem] = useState<any>(null);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-black italic tracking-tighter">ARMORY <span className="text-[10px] text-gray-600 not-italic ml-2">{player.inventory.length}/100</span></h3>
          <p className="text-[8px] text-cyan-500 font-bold uppercase tracking-widest animate-pulse">Millions of procedural variations possible</p>
        </div>
        <div className="flex gap-4">
          <button onClick={autoEquip} className="flex items-center gap-2 text-xs font-black text-cyan-400 hover:text-cyan-300 uppercase tracking-tighter">
            <Sword size={14} /> Auto Equip
          </button>
          <div className="flex gap-2">
            <button onClick={() => recycle('Common')} className="w-6 h-6 rounded bg-gray-800 border border-gray-700 flex items-center justify-center text-[8px] font-black text-gray-500 hover:text-white" title="Recycle Common">C</button>
            <button onClick={() => recycle('AllBelowEpic')} className="w-6 h-6 rounded bg-gray-800 border border-red-900/50 flex items-center justify-center text-[8px] font-black text-red-500 hover:text-white" title="Recycle All Below Epic">R</button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
        {['rarity', 'level', 'type', 'name'].map((sort) => (
          <button
            key={sort}
            onClick={() => setSortOrder(sort as any)}
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${player.sortOrder === sort ? 'bg-red-600 border-red-600 text-white' : 'bg-gray-900 border-gray-800 text-gray-500'}`}
          >
            {sort}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2 mb-8">
         {Array.from({ length: 48 }).map((_, i) => {
           const item = sortedInventory[i];
           return (
             <div 
               key={i} 
               onClick={() => setSelectedItem(item)}
               className={`aspect-square rounded-lg border flex items-center justify-center relative overflow-hidden transition-all cursor-pointer ${item ? 'bg-[#151520] border-gray-700 hover:border-white' : 'bg-black/20 border-gray-800/30'}`}
             >
                {item ? (
                  <>
                    <ItemIcon type={item.type} rarity={item.rarity} size={20} />
                    <div className={`absolute bottom-0 w-full h-[2px] ${item.rarity === 'Mythical' ? 'bg-red-500' : 'bg-gray-500 opacity-20'}`} />
                  </>
                ) : <span className="text-[10px] text-gray-900">{i + 1}</span>}
             </div>
           );
         })}
      </div>

      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-4 bottom-24 z-50 bg-[#0f0f1a] border border-gray-700 p-6 rounded-3xl shadow-2xl backdrop-blur-xl"
          >
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <Zap size={20} />
            </button>
            <div className="flex gap-4 items-start">
               <div className="p-4 bg-black rounded-2xl border border-gray-800">
                  <ItemIcon type={selectedItem.type} rarity={selectedItem.rarity} size={40} />
               </div>
               <div className="flex-1">
                  <div className={`text-xs font-black uppercase tracking-widest mb-1 ${RARITY_COLORS[selectedItem.rarity as keyof typeof RARITY_COLORS]}`}>{selectedItem.rarity}</div>
                  <h4 className="text-2xl font-black italic leading-none mb-1">{selectedItem.name}</h4>
                  {selectedItem.setName && (
                    <div className="text-[10px] text-cyan-400 font-black uppercase tracking-widest mb-2 italic">Part of: {selectedItem.setName}</div>
                  )}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <p className="text-gray-500 uppercase">Level: <span className="text-white font-mono">{selectedItem.level}</span></p>
                    <p className="text-gray-500 uppercase">Element: <span className="text-white font-mono">{selectedItem.element}</span></p>
                    <p className="text-gray-500 uppercase">Bonus: <span className="text-cyan-400 font-mono">+{selectedItem.statBonus}</span></p>
                    <p className="text-gray-500 uppercase">Value: <span className="text-yellow-400 font-mono">{selectedItem.value.toLocaleString()} G</span></p>
                  </div>
                  <div className="flex gap-4 mt-6">
                     <button 
                       onClick={() => { equipItem(selectedItem); setSelectedItem(null); }}
                       className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-black py-3 rounded-xl uppercase tracking-widest text-sm shadow-lg shadow-cyan-900/20"
                     >
                       Equip
                     </button>
                     <button 
                       onClick={() => { setView('blacksmith'); setSelectedItem(null); }}
                       className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-black py-3 rounded-xl uppercase tracking-widest text-sm"
                     >
                       Forge
                     </button>
                     <button 
                       onClick={() => { discardItem(selectedItem.id); setSelectedItem(null); }}
                       className="w-12 bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 text-red-500 font-black py-3 rounded-xl flex items-center justify-center transition-all"
                     >
                       <Shield size={14} />
                     </button>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Active Equipment</h4>
        {SLOTS.map(slot => (
          <EquipSlot key={slot} slot={slot} item={player.equipped[slot]} />
        ))}
      </div>
    </motion.div>
  );
}

function EquipSlot({ slot, item }: any) {
  return (
    <div className="flex items-center justify-between bg-[#0f0f1a] border border-gray-800 p-3 rounded-xl shadow-sm hover:border-gray-700 transition-all">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-black rounded-lg border border-gray-800 flex items-center justify-center text-gray-500">
           <ItemIcon type={slot} size={20} />
        </div>
        <div>
          <div className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">{slot}</div>
          <div className={`text-xs font-bold ${item ? RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] : 'text-gray-400 opacity-20 italic'}`}>
            {item ? item.name : 'EMPTY SLOT'}
          </div>
        </div>
      </div>
      {item && <span className="text-xs font-mono text-cyan-400">+{item.statBonus}</span>}
    </div>
  );
}

function Quests({ player }: { player: any }) {
  return (
    <QuestList quests={player.activeQuests} />
  );
}

function Blacksmith({ player, upgrade }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="bg-[#1a1a25] border-2 border-dashed border-gray-800 rounded-3xl p-12 text-center relative overflow-hidden group">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-600/10 via-transparent to-transparent opacity-50" />
         <Hammer size={64} className="mx-auto mb-4 text-gray-700 group-hover:text-orange-500 transition-colors" />
         <h4 className="text-xl font-black italic mb-2">ANCIENT FORGE</h4>
         <p className="text-xs text-gray-500 uppercase tracking-widest">Mastery up to Level 500</p>
      </div>

      <div className="space-y-3">
        {SLOTS.map(slot => (
          player.equipped[slot] && (
            <div key={slot} className="bg-[#0f0f1a] border border-gray-800 p-4 rounded-xl hover:border-orange-900/50 transition-all group">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                     <div className="p-3 bg-black rounded-lg border border-gray-800">
                        <ItemIcon type={slot} size={24} rarity={player.equipped[slot]!.rarity} />
                     </div>
                     <div>
                        <div className={`text-xs font-black uppercase tracking-widest ${RARITY_COLORS[player.equipped[slot]!.rarity as keyof typeof RARITY_COLORS]}`}>{player.equipped[slot]!.name}</div>
                        <div className="flex items-center gap-2">
                           <span className="text-sm font-black text-orange-500">LVL {player.equipped[slot]!.level}</span>
                           <ChevronRight size={12} className="text-gray-700" />
                           <span className="text-sm font-black text-green-500">LVL {player.equipped[slot]!.level + 1}</span>
                        </div>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="text-[10px] font-black text-gray-600 uppercase">Success Rate</div>
                     <div className="text-sm font-bold text-cyan-400">{Math.max(5, 100 - ((player.equipped[slot]!.level % 100) * 5))}%</div>
                  </div>
               </div>
               
               <button 
                onClick={() => {
                  audio.playAtk();
                  upgrade(slot);
                }}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-3 rounded-lg text-xs flex justify-between px-6 items-center shadow-lg active:scale-95 transition-all"
               >
                 <span>UPGRADE FORGE</span>
                 <span className="flex items-center gap-1 font-mono">
                    <Coins size={12} /> {Math.floor(((player.equipped[slot]!.level % 100) + 1) * 10000).toLocaleString()}
                 </span>
               </button>
            </div>
          )
        ))}
      </div>
    </motion.div>
  );
}

function Shop({ player, buyChest, buyItem }: any) {
  const [opening, setOpening] = useState<any>(null);
  const [tab, setTab] = useState<'items' | 'chests'>('items');

  const handleBuyChest = (cost: number, type: string) => {
    const loot = buyChest(cost);
    if (loot) {
      setOpening({ loot, type });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex gap-2 p-1 bg-black rounded-xl border border-gray-800">
         <button onClick={() => setTab('items')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'items' ? 'bg-cyan-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Black Market</button>
         <button onClick={() => setTab('chests')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'chests' ? 'bg-yellow-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Supply Crates</button>
      </div>

      {tab === 'chests' ? (
        <div className="grid grid-cols-1 gap-6">
          <ChestCard 
            type="WOODEN" 
            price="1,000" 
            color="from-amber-900/40 to-black" 
            onBuy={() => handleBuyChest(1000, 'WOODEN')} 
            rates={['75%', '20%', '5%']}
          />
          <ChestCard 
            type="GOLDEN" 
            price="10,000" 
            color="from-yellow-600/40 to-black" 
            onBuy={() => handleBuyChest(10000, 'GOLDEN')} 
            rates={['10%', '60%', '30%']}
          />
          <ChestCard 
            type="MYTHIC" 
            price="100,000" 
            color="from-red-600/40 to-black" 
            onBuy={() => handleBuyChest(100000, 'MYTHIC')} 
            rates={['0%', '10%', '90%']}
          />
        </div>
      ) : (
        <div className="space-y-4">
           <div className="bg-cyan-900/10 border border-cyan-500/30 p-4 rounded-2xl">
              <div className="flex justify-between items-center mb-1">
                 <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest">Shadow Dealer</h4>
                 <span className="text-[8px] font-mono text-gray-500">REFRESHES EVERY HOUR</span>
              </div>
              <p className="text-[10px] text-gray-500 leading-tight">Authentic gear from high-rank gates. Rare inventory, high prices.</p>
           </div>
           
           <div className="grid grid-cols-1 gap-3">
              {(player.shopInventory || []).map((item: any) => (
                <div key={item.id} className="bg-[#0f0f1a] border border-gray-800 p-4 rounded-2xl flex items-center justify-between group hover:border-cyan-900 transition-all">
                   <div className="flex items-center gap-3">
                      <div className="p-3 bg-black rounded-xl border border-gray-800">
                         <ItemIcon type={item.type} size={20} rarity={item.rarity} />
                      </div>
                      <div>
                         <div className={`text-xs font-black uppercase tracking-widest ${RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS]}`}>{item.name}</div>
                         <div className="flex gap-2 text-[10px] font-mono text-gray-500">
                            <span>LVL {item.level}</span>
                            <span>{item.element}</span>
                            <span className="text-cyan-400">+{item.statBonus} STATS</span>
                         </div>
                      </div>
                   </div>
                   <button 
                    onClick={() => buyItem(item)}
                    className="bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-600 text-cyan-400 hover:text-white px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1 active:scale-95"
                   >
                     <Coins size={12} /> {(item.value * 5).toLocaleString()}
                   </button>
                </div>
              ))}
           </div>
        </div>
      )}

      <AnimatePresence>
        {opening && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-8 backdrop-blur-xl"
          >
             <motion.div
               animate={{ 
                 rotate: [0, -10, 10, -10, 10, 0],
                 scale: [1, 1.1, 1]
               }}
               transition={{ duration: 0.5, repeat: 2 }}
               className="mb-8"
             >
                <ShoppingBag size={120} className="text-yellow-400" />
             </motion.div>

             <motion.div 
               initial={{ scale: 0, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ delay: 1, type: 'spring' }}
               className="text-center"
             >
               <div className={`text-sm font-black uppercase tracking-widest mb-2 ${RARITY_COLORS[opening.loot.rarity as keyof typeof RARITY_COLORS]}`}>{opening.loot.rarity}</div>
               <h3 className="text-4xl font-black italic mb-6 leading-none">{opening.loot.name}</h3>
               
               <div className="p-12 bg-[#0f0f1a] border border-gray-700 rounded-3xl mb-8 relative">
                  <ItemIcon type={opening.loot.type} rarity={opening.loot.rarity} size={80} />
                  <div className="absolute inset-0 bg-white/5 animate-pulse rounded-3xl" />
               </div>

               <button 
                 onClick={() => setOpening(null)}
                 className="bg-white text-black font-black px-12 py-4 rounded-2xl tracking-widest"
               >
                 COLLECT
               </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ChestCard({ type, price, color, onBuy, rates }: any) {
  return (
    <div className={`bg-gradient-to-br ${color} border border-gray-800 p-8 rounded-3xl relative overflow-hidden group h-56 flex flex-col justify-between transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-xl`} onClick={onBuy}>
       <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform">
         <ShoppingBag size={80} />
       </div>
       
       <div className="relative">
         <h4 className="text-3xl font-black italic tracking-tighter mb-1 leading-none">{type} CHEST</h4>
         <div className="flex items-center gap-2 text-yellow-400 font-mono text-sm">
            <Coins size={14} /> {price}
         </div>
       </div>

       <div className="relative flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Drop Rates</p>
            <div className="flex gap-4">
               <RateItem label="Com" value={rates[0]} color="text-gray-400" />
               <RateItem label="Rare+" value={rates[1]} color="text-blue-400" />
               <RateItem label="Legend+" value={rates[2]} color="text-red-500" />
            </div>
          </div>
          <ChevronRight size={32} className="text-gray-500" />
       </div>
    </div>
  );
}

function RateItem({ label, value, color }: any) {
  return (
    <div className="flex flex-col">
      <span className="text-[8px] font-bold text-gray-600 uppercase">{label}</span>
      <span className={`text-xs font-mono font-black ${color}`}>{value}</span>
    </div>
  );
}

function NavCard({ icon, label, onClick, color }: any) {
  return (
    <button 
      onClick={onClick}
      className={`bg-gradient-to-b ${color} bg-[#0f0f1a] border border-gray-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:border-gray-500 transition-all active:scale-95 group shadow-lg`}
    >
      <div className="text-gray-400 group-hover:text-white transition-colors">{icon}</div>
      <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-300">{label}</span>
    </button>
  );
}

function SummonView({ player, buy, summonShadow }: any) {
  const [activeTab, setActiveTab] = useState<'army' | 'summon'>('army');

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
         <button 
           onClick={() => setActiveTab('army')}
           className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all border ${activeTab === 'army' ? 'bg-purple-900/30 border-purple-500 text-purple-400' : 'bg-[#0f0f1a] border-gray-800 text-gray-500'}`}
         >
           Shadow Army
         </button>
         <button 
           onClick={() => setActiveTab('summon')}
           className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all border ${activeTab === 'summon' ? 'bg-cyan-900/30 border-cyan-500 text-cyan-400' : 'bg-[#0f0f1a] border-gray-800 text-gray-500'}`}
         >
           Summon Hub
         </button>
      </div>

      {activeTab === 'army' ? (
        <div className="space-y-4">
           <div className="bg-[#0f0f1a] border border-purple-600/30 rounded-3xl p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent opacity-50" />
              <Ghost size={64} className="mx-auto mb-4 text-purple-500 animate-pulse shadow-[0_0_20px_rgba(168,85,247,0.5)]" />
              <h3 className="text-4xl font-black italic tracking-tighter mb-2">SHADOW MONARCH</h3>
              <p className="text-xs text-purple-400 font-bold uppercase tracking-widest">Master of {player.shadowArmy} Shadows</p>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0f0f1a] border border-gray-800 p-4 rounded-xl">
                 <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Combat Power</div>
                 <div className="text-xl font-black text-white">{player.shadowArmy * 250} CP</div>
              </div>
              <div className="bg-[#0f0f1a] border border-gray-800 p-4 rounded-xl">
                 <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Shadow Legion</div>
                 <div className="text-xl font-black text-white">Tier {Math.floor(player.shadowArmy / 10) + 1}</div>
              </div>
           </div>

           <button 
             onClick={summonShadow}
             disabled={player.gems < 500}
             className="w-full py-5 bg-gradient-to-r from-purple-900 to-indigo-900 border border-purple-500/50 rounded-2xl flex items-center justify-center gap-3 group overflow-hidden relative shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
           >
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 italic font-black text-[30px] opacity-20 pointer-events-none">ARISE</div>
              <Ghost className="text-purple-400 group-hover:animate-bounce" />
              <div className="text-left">
                 <div className="text-xs font-black text-white uppercase tracking-widest italic leading-none">Summon Shadow</div>
                 <div className="flex items-center gap-1 mt-1">
                    <Gem size={10} className="text-cyan-400" />
                    <span className="text-[10px] font-mono text-cyan-400">500 GEMS</span>
                 </div>
              </div>
           </button>

           <div className="p-4 bg-black/40 border border-purple-900/30 rounded-2xl italic text-[10px] text-purple-400/80 leading-relaxed">
             "The shadows do not fear death, for they are death itself. Every boss extracted strengthens the connection between dimensions."
           </div>
        </div>
      ) : (
        <Gacha player={player} buy={buy} />
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-[#0f0f1a] border border-gray-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
      <div className={`p-2 rounded-lg bg-black border border-gray-800 ${color}`}>{icon}</div>
      <div>
        <div className="text-[10px] font-black text-gray-500 tracking-widest uppercase">{label}</div>
        <div className="text-lg font-bold tabular-nums">{value}</div>
      </div>
    </div>
  );
}

function ClassIcon({ cls, size, className }: any) {
  switch(cls) {
    case 'Warrior': return <Sword size={size} className={className + " text-orange-400"} />;
    case 'Paladin': return <Shield size={size} className={className + " text-yellow-500"} />;
    case 'Assassin': return <Ghost size={size} className={className + " text-indigo-400"} />;
    case 'Mage': return <Flame size={size} className={className + " text-cyan-400"} />;
    case 'Archer': return <Target size={size} className={className + " text-green-400"} />;
    case 'Berserker': return <Zap size={size} className={className + " text-red-500 animate-pulse"} />;
    case 'Necromancer': return <Brain size={size} className={className + " text-purple-600"} />;
    default: return <User size={size} className={className} />;
  }
}

function ItemIcon({ type, size = 18, rarity = 'Common', className = "" }: { type: Slot; size?: number; rarity?: Rarity; className?: string }) {
  const color = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || 'text-gray-500';
  const isMythical = rarity === 'Mythical';
  const finalClass = `${color} ${className} ${isMythical ? 'drop-shadow-[0_0_12px_rgba(139,92,246,0.8)] animate-pulse' : 'drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]'}`;
  
  switch (type) {
    case 'Weapon': return <Sword size={size} className={finalClass} />;
    case 'Headgear': return <Crown size={size} className={finalClass} />;
    case 'Suit': return <Shield size={size} className={finalClass} />;
    case 'Pants': return <Layers size={size} className={finalClass} />;
    case 'Shoes': return <Zap size={size} className={finalClass} />;
    case 'Gloves': return <HandMetal size={size} className={finalClass} />;
    case 'Necklace': return <CircleDot size={size} className={finalClass} />;
    case 'Earrings': return <Diamond size={size} className={finalClass} />;
    case 'Ring': return <Circle size={size} className={finalClass} />;
    case 'Bracelet': return <RefreshCw size={size} className={finalClass} />;
    default: return <Settings size={size} className={finalClass} />;
  }
}

function GateSelection({ player, onSelect }: any) {
  const GATES = [
    { id: 'E', name: 'E-RANK GATE', level: 1, difficulty: 'EXTREMELY LOW', color: 'border-gray-500 text-gray-500' },
    { id: 'D', name: 'D-RANK GATE', level: 50, difficulty: 'VERY LOW', color: 'border-green-500 text-green-500' },
    { id: 'C', name: 'C-RANK GATE', level: 100, difficulty: 'LOW', color: 'border-blue-500 text-blue-500' },
    { id: 'B', name: 'B-RANK GATE', level: 200, difficulty: 'NORMAL', color: 'border-purple-500 text-purple-500' },
    { id: 'A', name: 'A-RANK GATE', level: 400, difficulty: 'HIGH', color: 'border-red-500 text-red-500' },
    { id: 'S', name: 'S-RANK GATE', level: 600, difficulty: 'FATAL', color: 'border-cyan-500 text-cyan-500 shadow-[0_0_15px_#06b6d4]' },
    { id: 'M', name: 'MONARCH GATE', level: 800, difficulty: 'CALAMITY', color: 'border-orange-500 text-orange-500 shadow-[0_0_15px_#f97316]' },
    { id: 'V', name: 'SOVEREIGN GATE', level: 1000, difficulty: 'END OF THE WORLD', color: 'border-yellow-400 text-yellow-400 shadow-[0_0_20px_#facc15]' },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-black italic tracking-tighter">SELECT DUNGEON GATE</h3>
      <div className="grid grid-cols-1 gap-4">
        {GATES.map(gate => {
          const isUnlocked = player.level >= gate.level;
          return (
            <button
              key={gate.id}
              disabled={!isUnlocked}
              onClick={() => onSelect(gate.id)}
              className={`p-6 rounded-2xl border-2 bg-[#0f0f1a] flex flex-col items-start gap-1 transition-all ${isUnlocked ? `${gate.color} hover:bg-white/5` : 'border-gray-800 opacity-40 cursor-not-allowed'}`}
            >
              <div className="flex justify-between w-full items-center">
                <span className="text-lg font-black">{gate.name}</span>
                {!isUnlocked && <Shield size={16} />}
              </div>
              <div className="text-[10px] uppercase font-bold tracking-widest opacity-60">Req. Lvl {gate.level} • Difficulty: {gate.difficulty}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
