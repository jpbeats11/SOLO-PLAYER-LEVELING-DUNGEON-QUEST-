import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Skull, Zap, Heart, Flame, Ghost } from 'lucide-react';
import { PlayerData, Skill, Monster } from '../types';
import { audio } from '../services/audioService';
import { generateFloorMobs } from '../services/monsterService';

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
  const [mobs, setMobs] = useState<(Monster & { 
    state?: 'idle' | 'charging' | 'attacking',
    abilityCooldown?: number, 
    dangerZone?: { x: number, y: number, radius: number } | null 
  })[]>([]);
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
      const generatedMobs = generateFloorMobs(player.dungeonLevel, isBossFloor ? 1 : 5);
      const mappedMobs = generatedMobs.map(m => ({
        ...m,
        id: m.id + Math.random(), // Unique ID for state
        state: 'idle' as const,
        abilityCooldown: 20
      }));
      setMobs(mappedMobs as any);

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

  const currentBiome = mobs[0]?.biome || 'Void';
  const getBiomeColors = (biome: string) => {
    switch (biome) {
      case 'Dark Forest': return 'from-emerald-950/40 via-black to-black';
      case 'Volcanic Ashlands': return 'from-orange-950/40 via-black to-black';
      case 'Icebound Tundra': return 'from-cyan-950/40 via-black to-black';
      case 'Abyssal Depths': return 'from-blue-950/40 via-black to-black';
      case 'Undead Swarm': return 'from-purple-950/40 via-black to-black';
      default: return 'from-gray-950/40 via-black to-black';
    }
  };

  return (
    <motion.div 
      ref={viewportRef}
      animate={shake ? { x: [-2, 2, -2, 2, 0], y: [-2, 2, -2, 2, 0] } : {}}
      className={`relative w-full h-[500px] bg-[#050508] border-2 border-cyan-500/20 rounded-2xl overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,1)] group ${
        modifier?.name === 'Mana Leak' ? 'after:content-[""] after:absolute after:inset-0 after:bg-blue-500/10 after:pointer-events-none' : ''
      }`}
    >
      {/* High-Tech Grid & Scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] scale-150" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none" />
      </div>

      <div 
        className={`absolute inset-0 transition-all duration-[600ms] ease-out bg-gradient-to-t ${getBiomeColors(currentBiome)}`}
        style={{ transform: `translate(${-camera.x}%, ${-camera.y}%)` }}
      >
        {/* Hexagonal Tech Grid */}
        <div className="absolute inset-[-500%] opacity-[0.05]" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-opacity='0.2' fill='%2306b6d4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }} 
        />
        
        {/* World Particles */}
        <div className="absolute inset-[-200%] pointer-events-none">
           {Array.from({ length: 40 }).map((_, i) => (
              <div 
                key={i}
                className="absolute w-0.5 h-0.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_#06b6d4]"
                style={{ 
                  left: `${(Math.sin(i) * 1000 + 500) % 400 - 150}%`, 
                  top: `${(Math.cos(i) * 1000 + 500) % 400 - 150}%`,
                  opacity: Math.random() * 0.5 + 0.1
                }}
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
            transition={{ y: { type: 'tween', duration: 0.5 } }}
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
            transition={{ 
              type: 'spring', stiffness: 300, damping: 20,
              y: { type: 'tween', duration: 0.4 } 
            }}
            exit={{ opacity: 0, scale: 2 }}
            className={`absolute -ml-4 -mt-4 transition-all duration-100 ease-linear ${mob.isBoss ? 'z-20' : 'z-10'}`}
          >
            <div className="flex flex-col items-center">
              <div className={`relative ${mob.isBoss ? 'w-16 h-20' : 'w-10 h-12'} transition-all group/mob`}>
                  {/* Digital Glitch Effect for Bosses */}
                  {mob.isBoss && (
                    <div className="absolute inset-0 bg-red-500/20 animate-ping rounded-full scale-110" />
                  )}
                  {/* Sprite Skeleton Simulation */}
                  <div 
                    className={`absolute bottom-0 w-full h-1/2 bg-gray-900 rounded-lg border-x-2 border-b-2 ${mob.isBoss ? 'border-red-600 shadow-[0_0_20px_#ef4444]' : 'border-cyan-500/30'} transition-all`}
                    style={{ backgroundColor: mob.element === 'Fire' ? '#450a0a' : mob.element === 'Ice' ? '#0c4a6e' : mob.element === 'Electric' ? '#422006' : '#111827' }}
                  />
                  <div className={`absolute top-0 w-full h-2/3 bg-gray-800 rounded-full border-2 ${mob.isBoss ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'border-cyan-500/50'} flex flex-col items-center justify-center p-1`}>
                    <Skull className={`w-1/2 h-1/2 ${mob.isBoss ? 'text-red-400' : 'text-cyan-400/60'}`} />
                    <div className="text-[4px] font-black uppercase text-cyan-500/50 line-clamp-1">{mob.element}</div>
                  </div>
                  {mob.state === 'attacking' && (
                    <motion.div 
                      animate={{ rotate: [0, -45, 0], scale: [1, 1.5, 1] }}
                      transition={{ duration: 0.3 }}
                      className="absolute -right-4 top-0"
                    >
                      <Sword size={mob.isBoss ? 20 : 14} className="text-red-500" />
                    </motion.div>
                  )}
              </div>
              <div className="absolute -top-10 w-32 left-1/2 -translate-x-1/2 text-center flex flex-col items-center gap-0.5 pointer-events-none">
                <span className="text-[6px] font-black text-gray-400 uppercase tracking-widest bg-black/60 px-1 rounded">{mob.rank}</span>
                <span className={`text-[8px] font-black ${mob.isBoss ? 'text-red-500' : 'text-white'} italic drop-shadow-[0_2px_2px_rgba(0,0,0,1)] uppercase truncate w-full`}>{mob.name}</span>
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
                  transition={{ type: "tween", duration: 0.3 }}
                  className="absolute bottom-0 left-2 w-3 h-5 bg-cyan-900 border border-cyan-500/50 rounded-full" 
                />
                <motion.div 
                  animate={playerAnimState === 'walking' ? { rotate: [-15, 15, -15] } : { rotate: 0 }}
                  transition={{ type: "tween", duration: 0.3 }}
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
                  transition={{ type: "tween", duration: 0.3 }}
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
                    transition={{ 
                      rotate: { duration: 0.2, ease: "easeInOut" },
                      scale: { duration: 0.2 }
                    }}
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
      <div className="absolute inset-0 pointer-events-none z-50 p-6 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-3">
             <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 p-4 rounded-xl flex items-center gap-4 shadow-[0_0_30px_rgba(6,182,212,0.1)] relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-cyan-500/30 group-hover:bg-cyan-400 transition-colors" />
                <div className="w-12 h-12 bg-cyan-900/40 rounded-lg border border-cyan-500/30 flex items-center justify-center relative">
                   <Ghost className="text-cyan-400 w-7 h-7 animate-pulse" />
                   <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                </div>
                <div>
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-blink" />
                      <div className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em]">Sector {Math.floor(player.dungeonLevel / 10) + 1}</div>
                   </div>
                   <div className="text-xl font-black text-white italic tracking-tighter leading-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">FLOOR {player.dungeonLevel}</div>
                </div>
             </div>
             
             {modifier && (
                <div className="bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-full flex items-center gap-2 self-start animate-fade-in-down">
                   <Flame size={10} className="text-orange-500" />
                   <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest leading-none">{modifier.name} PROTOCOL</span>
                </div>
             )}
          </div>

          <div className="flex flex-col items-end gap-3">
             <div className="bg-black/60 backdrop-blur-md border border-red-500/30 p-4 rounded-xl flex items-center gap-4 shadow-[0_0_30px_rgba(239,68,68,0.1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-0.5 bg-red-500/30" />
                <div className="text-right">
                   <div className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">Targets Detected</div>
                   <div className="text-xl font-black text-white italic tracking-tighter leading-tight">{mobs.length} ENTITIES</div>
                </div>
                <div className="w-12 h-12 bg-red-900/40 rounded-lg border border-red-500/30 flex items-center justify-center">
                   <Skull className="text-red-500 w-7 h-7 animate-pulse" />
                </div>
             </div>
             
             <div className="text-[8px] font-mono text-gray-500 uppercase tracking-widest bg-black/40 px-2 py-0.5 border border-gray-800 rounded">
                LATENCY: 12ms | SYNC: OPTIMAL
             </div>
          </div>
        </div>

        <div className="flex justify-center items-end">
           <div className="w-full max-w-sm bg-black/60 backdrop-blur-md border border-cyan-500/20 p-2 rounded-lg flex flex-col gap-1">
              <div className="flex justify-between items-center px-1">
                 <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">Player Status: Online</span>
                 <span className="text-[8px] font-mono text-cyan-400/60 uppercase">Unit-01 // Level {player.level}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-950 rounded-full border border-gray-800 overflow-hidden relative">
                 <motion.div 
                   className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                   initial={{ width: '100%' }}
                   animate={{ width: `${(player.stats.HP / player.stats.MAX_HP) * 100}%` }}
                   transition={{ duration: 0.3 }}
                 />
              </div>
           </div>
        </div>
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] pointer-events-none" />
    </motion.div>
  );
};
