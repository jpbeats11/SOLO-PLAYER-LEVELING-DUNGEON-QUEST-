import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Skull, Zap, Heart, Flame, Ghost } from 'lucide-react';
import { PlayerData, Skill } from '../types';
import { audio } from '../services/audioService';

interface DungeonMapViewProps {
  player: PlayerData;
  isAutoBattle: boolean;
  onBattleTick: () => void;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  targetId: number;
  type: 'fireball' | 'arrow' | 'shadow';
}

export const DungeonMapView: React.FC<DungeonMapViewProps> = ({ player, isAutoBattle, onBattleTick }) => {
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 50 });
  const [playerAnimState, setPlayerAnimState] = useState<'idle' | 'walking' | 'attacking'>('idle');
  const [mobs, setMobs] = useState<{ 
    id: number, x: number, y: number, hp: number, maxHp: number, 
    spawnX: number, spawnY: number, isBoss?: boolean, state?: 'idle' | 'charging' | 'attacking',
    abilityCooldown?: number, dangerZone?: { x: number, y: number, radius: number } | null,
    facing: 'left' | 'right'
  }[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [effects, setEffects] = useState<{ id: number, x: number, y: number, type: 'slash' | 'damage' | 'fireball' | 'impact' | 'warning', value?: number }[]>([]);
  const [playerFrame, setPlayerFrame] = useState(0);
  const [playerFacing, setPlayerFacing] = useState<'left' | 'right'>('right');
  const [shadows, setShadows] = useState<{ id: number, x: number, y: number, targetId: number | null, state: 'idle' | 'attacking' }[]>([]);
  const [shake, setShake] = useState(false);
  const [mobFrame, setMobFrame] = useState(0);

  // Camera System
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const viewportRef = React.useRef<HTMLDivElement>(null);
  
  // Calculate camera based on player position
  useEffect(() => {
    // We want the player to stay roughly in the center
    // Since everything is 0-100, the viewport is essentially 100 units wide
    // But we are expanding the world to be larger
    setCamera({
      x: playerPos.x - 50,
      y: playerPos.y - 40
    });
  }, [playerPos]);

  const isBossFloor = player.dungeonLevel % 10 === 0;
  const modifier = (player as any).floorModifier;

  // Animation Frame Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setPlayerFrame(f => (f + 1) % 4);
      setMobFrame(f => (f + 1) % 4);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  }, []);

  // Generate mobs or Boss (Expanded Map Areas)
  useEffect(() => {
    if (mobs.length === 0) {
      if (isBossFloor) {
        setMobs([{
          id: Date.now(),
          x: 50, y: 50,
          maxHp: 500 + (player.dungeonLevel * 50),
          hp: 500 + (player.dungeonLevel * 50),
          spawnX: 50, spawnY: 50,
          isBoss: true,
          state: 'idle',
          facing: 'left',
          abilityCooldown: 20
        }]);
      } else {
        const newMobs = Array.from({ length: 5 }).map((_, i) => {
          const rx = Math.random() * 200 - 50; // Map range -50 to 150
          const ry = Math.random() * 200 - 50;
          return {
            id: Math.random() + i,
            x: rx,
            y: ry,
            spawnX: rx,
            spawnY: ry,
            maxHp: 100, hp: 100,
            facing: Math.random() > 0.5 ? 'right' : 'left',
            abilityCooldown: 30 + i * 10
          };
        });
        setMobs(newMobs);
      }

      // Spawn shadow soldiers
      if (player.shadowArmy > 0) {
        const shadowCount = Math.min(player.shadowArmy, 8); // Slightly more shadows visually
        setShadows(Array.from({ length: shadowCount }).map((_, i) => ({
          id: Math.random() + i,
          x: playerPos.x + (Math.random() - 0.5) * 30,
          y: playerPos.y + (Math.random() - 0.5) * 30,
          targetId: null,
          state: 'idle'
        })));
      }
    }
  }, [mobs.length, isBossFloor, player.dungeonLevel, player.shadowArmy]);

  // Skill Casting Logic
  useEffect(() => {
    if (!isAutoBattle || mobs.length === 0) return;

    const interval = setInterval(() => {
      const activeSkill = (player.skills || []).find(s => s.type === 'active');
      if (activeSkill && mobs.length > 0 && Math.random() > 0.4) {
        const target = mobs[Math.floor(Math.random() * mobs.length)];
        if (target) {
          setPlayerAnimState('attacking');
          setTimeout(() => setPlayerAnimState('walking'), 500);
          setProjectiles(prev => [...prev, {
            id: Math.random(),
            x: playerPos.x,
            y: playerPos.y,
            targetId: target.id,
            type: player.class === 'Mage' ? 'fireball' : player.class === 'Archer' ? 'arrow' : 'shadow'
          }]);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isAutoBattle, mobs, playerPos.x, playerPos.y, player.skills, player.class]);

  // Movement & Battle Logic
  useEffect(() => {
    if (!isAutoBattle) {
      setPlayerAnimState('idle');
      return;
    }

    setPlayerAnimState('walking');

    const interval = setInterval(() => {
      // 1. Update Mob AI
      setMobs(prevMobs => {
        return prevMobs.map(mob => {
          const dx = playerPos.x - mob.x;
          const dy = playerPos.y - mob.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let newsX = mob.x;
          let newsY = mob.y;
          let newState = mob.state || 'idle';
          let abilityCd = (mob.abilityCooldown || 0) - 1;

          // Advanced AI: Boss Phases & Behaviors
          if (mob.isBoss) {
            const hpRatio = mob.hp / mob.maxHp;
            const speed = hpRatio < 0.3 ? 0.8 : 0.4; // Enraged speed

            // Boss Phase 1: Normal Chasing (HP > 70%)
            // Boss Phase 2: Flanking & Charging (HP 30-70%)
            // Boss Phase 3: Enraged (HP < 30%)
            
            if (hpRatio > 0.7) {
              if (dist > 30) {
                newsX += (dx / dist) * speed;
                newsY += (dy / dist) * speed;
              }
            } else if (hpRatio > 0.3) {
              // Flanking behavior: orbit the player
              const angle = Math.atan2(dy, dx) + 0.1;
              const orbitDist = 25;
              const tx = playerPos.x - Math.cos(angle) * orbitDist;
              const ty = playerPos.y - Math.sin(angle) * orbitDist;
              newsX += (tx - mob.x) * 0.1;
              newsY += (ty - mob.y) * 0.1;
              
              if (abilityCd <= 0) {
                 newState = 'charging';
                 abilityCd = 15;
              }
            } else {
              // Enraged: Aggressive Chasing
              newsX += (dx / dist) * speed * 2;
              newsY += (dy / dist) * speed * 2;
              newState = 'attacking';
            }

            if (abilityCd <= 0) {
              // Special Boss Abilities
              if (hpRatio < 0.5 && Math.random() > 0.6) {
                // AoE Blast
                setEffects(eff => [...eff, { id: Date.now(), x: mob.x, y: mob.y, type: 'warning' }]);
                setTimeout(() => {
                  setEffects(eff => [...eff, { id: Date.now() + 1, x: mob.x, y: mob.y, type: 'fireball', value: 100 }]);
                  triggerShake();
                  audio.playHit();
                }, 800);
                abilityCd = 40;
              } else {
                abilityCd = 20;
              }
            }
          } else {
            // Normal Mob AI with Flanking
            const speed = 1.2;
            if (dist < 30) {
              if (dist < 15) {
                // Flanking maneuver when close
                const angle = Math.atan2(dy, dx) + (mob.id % 2 === 0 ? 0.5 : -0.5);
                const tx = playerPos.x - Math.cos(angle) * dist;
                const ty = playerPos.y - Math.sin(angle) * dist;
                newsX += (tx - mob.x) * 0.1;
                newsY += (ty - mob.y) * 0.1;
              } else {
                newsX += (dx / dist) * speed;
                newsY += (dy / dist) * speed;
              }

              if (dist < 8) newState = 'attacking';
              else if (dist < 20) newState = 'charging';
              else newState = 'idle';
            } else {
              const rdx = mob.spawnX - mob.x;
              const rdy = mob.spawnY - mob.y;
              const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
              if (rdist > 1) {
                newsX += (rdx / rdist) * 0.8;
                newsY += (rdy / rdist) * 0.8;
              }
              newState = 'idle';
            }
          }

          return { 
            ...mob, 
            x: newsX, 
            y: newsY, 
            state: newState, 
            facing: dx > 0 ? 'right' : 'left',
            abilityCooldown: abilityCd
          };
        });
      });

      // 2. Update Shadow Army AI
      setShadows(prevShadows => {
        if (mobs.length === 0) return prevShadows;
        return prevShadows.map(shadow => {
          const target = mobs[0]; // Shadows focus the main target
          const dx = target.x - shadow.x;
          const dy = target.y - shadow.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let nx = shadow.x;
          let ny = shadow.y;
          let ns = shadow.state;

          if (dist > 5) {
            nx += (dx / dist) * 2;
            ny += (dy / dist) * 2;
            ns = 'idle';
          } else {
            ns = 'attacking';
            // Shadows deal small chip damage
            if (Math.random() > 0.8) {
              setMobs(m => m.map(mob => mob.id === target.id ? { ...mob, hp: mob.hp - 5 } : mob));
            }
          }

          return { ...shadow, x: nx, y: ny, state: ns as any };
        });
      });

      // 3. Update Player Position & Battle
      if (mobs.length > 0) {
        const target = mobs[0];
        const dx = target.x - playerPos.x;
        const dy = target.y - playerPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        setPlayerFacing(dx > 0 ? 'right' : 'left');

        if (dist > 8) {
          setPlayerPos(prev => ({
            x: prev.x + (dx / dist) * 1.5,
            y: prev.y + (dy / dist) * 1.5
          }));
          setPlayerAnimState('walking');
        } else {
          setPlayerAnimState('attacking');
          if (playerFrame === 0) audio.playAtk();
          onBattleTick();
          triggerShake();
          // Small knockback on mob
          setMobs(m => m.map(mob => mob.id === target.id ? { 
            ...mob, 
            x: mob.x + (mob.x - playerPos.x) * 0.2, 
            y: mob.y + (mob.y - playerPos.y) * 0.2 
          } : mob));
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isAutoBattle, mobs, playerPos.x, playerPos.y, onBattleTick]);

  // Projectiles
  useEffect(() => {
    if (projectiles.length === 0) return;

    const interval = setInterval(() => {
      setProjectiles(prev => prev.map(p => {
        const target = mobs.find(m => m.id === p.targetId);
        if (!target) return { ...p, x: -100 };
        
        const dx = target.x - p.x;
        const dy = target.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 4) {
          const effectId = Math.random();
          audio.playHit();
          setEffects(eff => [...eff, 
            { id: effectId, x: target.x, y: target.y, type: 'impact' as any },
            { id: effectId + 1, x: target.x, y: target.y - 5, type: 'damage', value: Math.floor(player.stats.ATK * 2.5) }
          ]);
          setMobs(m => m.map(mob => mob.id === target.id ? { ...mob, hp: mob.hp - 100 } : mob).filter(mob => mob.hp > 0));
          setTimeout(() => setEffects(eff => eff.filter(e => e.id !== effectId && e.id !== effectId + 1)), 600);
          return { ...p, x: -100 };
        }

        return { ...p, x: p.x + (dx / dist) * 6, y: p.y + (dy / dist) * 6 };
      }).filter(p => p.x !== -100));
    }, 40);

    return () => clearInterval(interval);
  }, [projectiles, mobs, player.stats.ATK]);

  // Shadow Army Combat Behavior Sync
  useEffect(() => {
    if (effects.length > 20) {
      setEffects(prev => prev.slice(-10));
    }
  }, [effects.length]);

  return (
    <motion.div 
      ref={viewportRef}
      animate={shake ? { x: [-2, 2, -2, 2, 0], y: [-2, 2, -2, 2, 0] } : {}}
      className={`relative w-full h-[400px] bg-[#050508] border-2 border-cyan-500/20 rounded-2xl overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,1)] ${
        modifier?.name === 'Mana Leak' ? 'after:content-[""] after:absolute after:inset-0 after:bg-blue-500/10 after:pointer-events-none' : ''
      }`}
    >
      <div 
        className="absolute inset-0 transition-transform duration-[400ms] ease-out will-change-transform"
        style={{ transform: `translate(${-camera.x}%, ${-camera.y}%)` }}
      >
        {/* Infinite Grid Background */}
        <div className="absolute inset-[-500%] opacity-10" 
          style={{ 
            backgroundImage: `radial-gradient(circle, #06b6d4 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} 
        />
        
        {/* World Particles / Dust */}
        <div className="absolute inset-[-200%] pointer-events-none opacity-20">
           {Array.from({ length: 20 }).map((_, i) => (
              <div 
                key={i}
                className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
                style={{ left: `${Math.random() * 400 - 150}%`, top: `${Math.random() * 400 - 150}%` }}
              />
           ))}
        </div>

      <div className="absolute top-10 left-10 w-20 h-16 bg-[#1a1a25] rounded-t-xl border-x-2 border-t-2 border-gray-800 flex items-center justify-center shadow-lg">
        <div className="absolute -bottom-2 w-10 h-10 bg-red-950/40 border border-red-900 rounded-lg" />
        <div className="absolute top-2 w-4 h-4 bg-cyan-900/40 border border-cyan-500/20 rounded-full animate-pulse" />
        <span className="text-[8px] text-gray-500 uppercase font-black z-10">Shadow Forge</span>
      </div>
      
      <div className="absolute top-40 right-10 w-16 h-16 bg-[#0f0f1a] rounded-full border-4 border-gray-800/50 flex items-center justify-center">
         <div className="w-8 h-8 rounded-full border border-red-500/30 animate-spin" />
         <span className="absolute -top-4 text-[6px] text-red-500 font-bold uppercase">Blood Fountain</span>
      </div>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-48 h-8 bg-gray-800/10 border-x border-gray-700/30 skew-x-12" />
      <div className="absolute bottom-10 right-10 w-32 h-6 bg-gray-800/20 border-y border-gray-700/50 -rotate-12" />
      
      {/* Rocks / Debris */}
      <div className="absolute bottom-20 left-10 w-4 h-4 bg-gray-800 rounded-sm rotate-45 border border-gray-700" />
      <div className="absolute top-4 right-1/4 w-3 h-3 bg-gray-800 rounded-full border border-gray-700" />
      <div className="absolute bottom-1/3 left-1/4 w-5 h-2 bg-gray-800 rounded-full opacity-50" />
      
      {/* Shadows */}
      <AnimatePresence>
        {shadows.map(shadow => (
          <motion.div
            key={shadow.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 0.6, 
              scale: 0.8,
              left: `${shadow.x}%`, 
              top: `${shadow.y}%`,
              filter: 'blur(1px) brightness(0.5) sepia(1) saturate(5) hue-rotate(240deg)',
              y: shadow.state === 'attacking' ? [0, -5, 0] : 0
            }}
            className="absolute -ml-3 -mt-3 z-20 pointer-events-none"
          >
            <div className="w-6 h-6 bg-purple-900/50 border border-purple-500 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.5)]">
               <Ghost className="w-4 h-4 text-purple-400" />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Enemies */}
      <AnimatePresence>
        {mobs.map(mob => (
          <motion.div
            key={mob.id}
            initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: 1, 
                scale: mob.isBoss ? 2.5 : 1.2, 
                left: `${mob.x}%`, 
                top: `${mob.y}%`,
                x: mob.state === 'attacking' ? (mob.facing === 'right' ? 10 : -10) : 0,
                y: mob.state === 'charging' ? [0, -5, 0] : (mobFrame % 2 === 0 ? 2 : 0),
                filter: mob.hp < (mob.maxHp * 0.4) ? 'brightness(1.5) saturate(2) contrast(1.2)' : 'none',
                scaleX: mob.facing === 'right' ? -1 : 1
              }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            exit={{ opacity: 0, scale: 2 }}
            className={`absolute -ml-4 -mt-4 transition-all duration-100 ease-linear ${mob.isBoss ? 'z-20' : 'z-10'}`}
          >
            <div className="flex flex-col items-center">
              <div className={`relative ${mob.isBoss ? 'w-14 h-16' : 'w-10 h-12'} transition-all`}>
                  {/* Sprite Skeleton Simulation */}
                  <div className={`absolute bottom-0 w-full h-1/2 bg-gray-900 rounded-lg border-x-2 border-b-2 ${mob.isBoss ? 'border-red-600 shadow-[0_0_20px_#ef4444]' : 'border-gray-700'} transition-all`} />
                  <div className={`absolute top-0 w-full h-2/3 bg-gray-800 rounded-full border-2 ${mob.isBoss ? 'border-red-500' : 'border-gray-600'} flex items-center justify-center`}>
                    <Skull className={`w-1/2 h-1/2 ${mob.isBoss ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  {mob.state === 'attacking' && (
                    <motion.div 
                      animate={{ rotate: [0, -45, 0], scale: [1, 1.5, 1] }}
                      className="absolute -right-4 top-0"
                    >
                      <Sword size={mob.isBoss ? 20 : 14} className="text-red-500" />
                    </motion.div>
                  )}
              </div>
              <div className="mt-1 w-full h-1 bg-gray-800/80 rounded-full overflow-hidden border border-gray-700">
                <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${(mob.hp / mob.maxHp) * 100}%` }} />
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Projectiles (Optimized Pool Rendering) */}
      <div className="absolute inset-0 pointer-events-none">
        {projectiles.map(p => (
          <div 
            key={p.id}
            className={`absolute w-3 h-3 rounded-full -ml-1.5 -mt-1.5 transition-all duration-40 ${
              p.type === 'fireball' ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,1)]' :
              p.type === 'arrow' ? 'bg-yellow-200 w-4 h-1 rotate-45' :
              'bg-purple-600 shadow-[0_0_15px_rgba(147,51,234,1)]'
            }`}
            style={{ 
              left: `${p.x}%`, 
              top: `${p.y}%`,
              transform: `scale(${1 + Math.sin(Date.now() / 100) * 0.2})`
            }}
          >
            {p.type === 'fireball' && <div className="absolute inset-0 bg-white/50 animate-pulse rounded-full" />}
          </div>
        ))}
      </div>

      {/* Effects */}
      <AnimatePresence>
        {effects.map(effect => (
          <motion.div
            key={effect.id}
            initial={{ opacity: 1, scale: 0.5, y: 0 }}
            animate={{ 
              opacity: 0, 
              scale: effect.type === 'damage' ? 1.5 : 2.5,
              y: effect.type === 'damage' ? -40 : 0
            }}
            transition={{ duration: 0.6 }}
            className="absolute -ml-8 -mt-8 pointer-events-none z-40"
            style={{ left: `${effect.x}%`, top: `${effect.y}%` }}
          >
            {effect.type === 'slash' ? (
              <Zap className="w-16 h-16 text-cyan-400 opacity-50 rotate-45" />
            ) : effect.type === 'fireball' ? (
              <div className="w-16 h-16 bg-orange-500/20 rounded-full border-2 border-orange-400 animate-ping shadow-[0_0_30px_rgba(249,115,22,0.4)]" />
            ) : effect.type === 'impact' ? (
              <div className="w-20 h-20 bg-white/20 rounded-full border-4 border-white/50 animate-out fade-out zoom-out duration-300" />
            ) : effect.type === 'warning' ? (
              <div className="w-48 h-48 -ml-16 -mt-16 bg-red-600/10 border-2 border-red-600 border-dashed rounded-full animate-pulse" />
            ) : (
              <div className="flex flex-col items-center">
                 <span className="text-yellow-400 font-black text-2xl italic drop-shadow-[0_0_8px_rgba(0,0,0,1)] tracking-tighter">
                   {effect.value}
                 </span>
                 <div className="w-10 h-1 bg-white/20 rounded-full mt-1" />
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Player (Animated Sprite) */}
      <motion.div
        animate={{ 
          left: `${playerPos.x}%`, 
          top: `${playerPos.y}%`,
          y: playerAnimState === 'walking' ? (playerFrame % 2 === 0 ? -4 : 0) : 0,
          scale: playerAnimState === 'attacking' ? 1.3 : 1,
          scaleX: playerFacing === 'right' ? 1 : -1
        }}
        transition={{ 
          y: { duration: 0.15 },
          scale: { duration: 0.1 }
        }}
        className="absolute -ml-6 -mt-6 z-30"
      >
        <div className="flex flex-col items-center">
          <div className="relative">
             {/* Character Sprite Simulation */}
             <div className={`relative w-14 h-16 transition-all ${playerAnimState === 'attacking' ? 'brightness-125' : ''}`}>
                {/* Legs */}
                <motion.div 
                  animate={playerAnimState === 'walking' ? { rotate: [15, -15, 15] } : { rotate: 0 }}
                  className="absolute bottom-0 left-2 w-3 h-5 bg-cyan-900 border border-cyan-500/50 rounded-full" 
                />
                <motion.div 
                  animate={playerAnimState === 'walking' ? { rotate: [-15, 15, -15] } : { rotate: 0 }}
                  className="absolute bottom-0 right-2 w-3 h-5 bg-cyan-900 border border-cyan-500/50 rounded-full" 
                />
                {/* Body */}
                <div className="absolute bottom-4 w-full h-2/3 bg-cyan-950 border-2 border-cyan-400 rounded-xl shadow-[0_0_15px_#06b6d4]">
                   {/* Chest Symbol */}
                   <div className="w-4 h-4 bg-red-600/20 rounded-full mx-auto mt-2 animate-pulse flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                   </div>
                </div>
                {/* Head */}
                <motion.div 
                  animate={playerAnimState === 'walking' ? { y: [0, -2, 0] } : { y: 0 }}
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-8 bg-black border-2 border-cyan-400 rounded-full shadow-[0_0_10px_#06b6d4]"
                >
                   {/* Glowing Eyes */}
                   <div className="flex justify-around mt-2 px-1">
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_5px_#06b6d4]" />
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_5px_#06b6d4]" />
                   </div>
                </motion.div>
                
                {/* Arms / Weapons */}
                {player.equipped.Weapon && (
                  <motion.div 
                    animate={{ 
                      rotate: playerAnimState === 'attacking' ? [0, -120, 20, 0] : [0, 5, 0],
                      scale: playerAnimState === 'attacking' ? 1.5 : 1
                    }}
                    transition={{ duration: 0.2 }}
                    className="absolute -right-2 top-4 origin-bottom"
                  >
                     <Sword className="text-yellow-400 drop-shadow-[0_0_10px_#eab308]" />
                  </motion.div>
                )}
             </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 bg-black/80 px-3 py-0.5 rounded-full border border-cyan-500/50 shadow-xl">
             <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
             <span className="text-[10px] text-white font-black font-mono tracking-tighter">
               {player.stats.HP} / {player.stats.MAX_HP}
             </span>
          </div>
        </div>
      </motion.div>

      {/* World Particles (Atmospheric) */}
      <div 
        className="absolute inset-0 pointer-events-none transition-transform duration-[600ms] ease-out"
        style={{ transform: `translate(${-camera.x * 0.5}%, ${-camera.y * 0.5}%)` }} // Parallax effect
      >
         <div className="absolute inset-[-100%] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
      </div>

      </div>

      {/* Static HUD Overlay (Fixed to Viewport) */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none z-50">
        <div className="flex flex-col gap-2">
           <div className="bg-black/90 backdrop-blur-xl border border-cyan-500/30 px-5 py-2 rounded-2xl flex items-center gap-4 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
              <div className="w-10 h-10 bg-cyan-900/40 rounded-xl border border-cyan-500/30 flex items-center justify-center">
                 <Ghost className="text-cyan-400 w-6 h-6 animate-pulse" />
              </div>
              <div>
                 <div className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em]">Current Gate</div>
                 <div className="text-lg font-black text-white italic leading-tight">FLOOR {player.dungeonLevel}</div>
              </div>
           </div>
           
           {modifier && (
              <div className="bg-orange-500/10 border border-orange-500/40 px-4 py-1.5 rounded-full flex items-center gap-2 animate-bounce">
                 <Flame size={12} className="text-orange-500" />
                 <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">{modifier.name} ACTIVE</span>
              </div>
           )}
        </div>

        <div className="flex flex-col items-end gap-2">
           <div className="bg-black/90 backdrop-blur-xl border border-red-500/30 px-5 py-2 rounded-2xl flex items-center gap-4 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <div className="text-right">
                 <div className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Mob Count</div>
                 <div className="text-lg font-black text-white italic leading-tight">{mobs.length} REMAINING</div>
              </div>
              <div className="w-10 h-10 bg-red-900/40 rounded-xl border border-red-500/30 flex items-center justify-center">
                 <Skull className="text-red-500 w-6 h-6 animate-pulse" />
              </div>
           </div>
        </div>
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] pointer-events-none" />
    </motion.div>
  );
};
