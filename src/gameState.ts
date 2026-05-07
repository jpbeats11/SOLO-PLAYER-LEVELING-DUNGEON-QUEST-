import { useState, useCallback, useEffect, useMemo } from 'react';
import { PlayerData, ClassType, GameItem, Rarity, Element, Slot, Stats, SortOption, Skill, Quest, SetBonus } from './types';
import { 
  CLASS_GROWTH, CLASS_SKILLS, RARITIES, ELEMENTS, 
  SLOTS, RARITY_WEIGHTS, CLASSES, SETS, ELEMENTAL_ADVANTAGES 
} from './constants';
import { audio } from './services/audioService';

const INITIAL_WEALTH = 999999999999;

const QUEST_POOL = [
  { name: 'The Awakening', description: 'Clear Level 10 Dungeon', target: 10, rewardExp: 1000, rewardGold: 5000, rewardGems: 100, levelReq: 1 },
  { name: 'Skeleton Slayer', description: 'Defeat 50 Mobs', target: 50, rewardExp: 2000, rewardGold: 10000, rewardGems: 200, levelReq: 50 },
  { name: 'Blacksmith’s Favor', description: 'Clear Level 100 Dungeon', target: 100, rewardExp: 5000, rewardGold: 50000, rewardGems: 500, levelReq: 100 },
  { name: 'The Red Gate', description: 'Clear Level 500 Dungeon', target: 500, rewardExp: 50000, rewardGold: 500000, rewardGems: 1000, levelReq: 500 },
  { name: 'God of the Dungeon', description: 'Clear Level 1000 Dungeon', target: 1000, rewardExp: 100000, rewardGold: 1000000, rewardGems: 5000, levelReq: 1000 }
];

export function useGameState() {
  const [player, setPlayer] = useState<PlayerData | null>(() => {
    try {
      const saved = localStorage.getItem('player_save');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (!parsed.name || !parsed.stats || !parsed.equipped) {
        localStorage.removeItem('player_save');
        return null;
      }
      
      // Migration
      const level = parsed.level || 1;
      
      if (!parsed.skills || !Array.isArray(parsed.skills)) {
        parsed.skills = (CLASS_SKILLS[parsed.class] || []).map((s: any) => ({
          ...s,
          id: Math.random().toString(36).substr(2, 9),
          level: 1,
          maxLevel: 10,
          requiredLevel: 1,
          lastUsed: 0
        }));
        parsed.skillPoints = Math.floor(level / 2);
      }
      
      if (!parsed.activeQuests || !Array.isArray(parsed.activeQuests)) {
        parsed.activeQuests = QUEST_POOL.filter(q => q.levelReq <= level).map(q => ({
          ...q, id: Math.random().toString(36).substr(2, 9), current: 0, isCompleted: false
        }));
      }

      if (parseFloat(parsed.gold) < 5000000 || parsed.gold === undefined) parsed.gold = 5000000;
      if (parseFloat(parsed.gems) < 100000 || parsed.gems === undefined) parsed.gems = 100000;
      if (!parsed.inventory) parsed.inventory = [];
      if (!parsed.equipped) parsed.equipped = {};
      
      if (!parsed.unlockedGates) parsed.unlockedGates = [1];
      if (!parsed.currentGateId) parsed.currentGateId = 1;

      if (!parsed.attributePoints) parsed.attributePoints = 0;

      return parsed;
    } catch (e) {
      localStorage.removeItem('player_save');
      return null;
    }
  });

  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [isAutoBattle, setIsAutoBattle] = useState(false);
  const [ariseAvailable, setAriseAvailable] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const claimDailyReward = useCallback(() => {
    setPlayer(prev => {
      if (!prev) return null;
      const now = Date.now();
      const last = prev.lastDailyReward || 0;
      if (now - last < 86400000) {
        setBattleLog(logs => [`⚠️ Daily reward already claimed!`, ...logs]);
        return prev;
      }
      
      const goldReward = 500000;
      const gemReward = 1000;
      setBattleLog(logs => [`🎁 Daily Reward: +${goldReward} Gold, +${gemReward} Gems!`, ...logs]);
      return { 
        ...prev, 
        gold: prev.gold + goldReward, 
        gems: prev.gems + gemReward, 
        lastDailyReward: now 
      };
    });
  }, []);

  const switchGate = useCallback((gateId: string) => {
    setPlayer(prev => {
      if (!prev) return null;
      const gateConfigs: Record<string, number> = { 'E': 1, 'D': 50, 'C': 100, 'B': 200, 'A': 400, 'S': 600, 'M': 800, 'V': 1000 };
      const levelReq = gateConfigs[gateId] || 1;
      if (prev.level < levelReq) {
        setBattleLog(logs => [`⚠️ Level ${levelReq} required for this gate!`, ...logs]);
        return prev;
      }
      setBattleLog(logs => [`🌌 Warping to ${gateId}-Rank Gate...`, ...logs]);
      return { ...prev, currentGateId: gateId, dungeonLevel: 1 };
    });
  }, []);

  useEffect(() => {
    if (player) localStorage.setItem('player_save', JSON.stringify(player));
  }, [player]);

  const [floorModifier, setFloorModifier] = useState<{ name: string, effect: string, icon: string } | null>(null);

  const MODIFIERS = [
    { name: 'Speed Frenzy', effect: 'Enemies move 50% faster', icon: 'zap' },
    { name: 'Loot Fever', effect: 'Double loot drop chance', icon: 'star' },
    { name: 'Mana Leak', effect: 'Slowly drain MP over time', icon: 'droplets' },
    { name: 'Healer Guardian', effect: 'Enemies regenerate HP', icon: 'heart' },
    { name: 'Treasure Room', effect: 'Increased Gold and Gems', icon: 'coins' }
  ];

  const generateLoot = useCallback((dungeonLevel: number): GameItem => {
    let rand = Math.random() * 10000;
    let rarity: Rarity = 'Common';
    let cumulative = 0;
    const weightsArray = Object.entries(RARITY_WEIGHTS);
    
    for (const [r, weight] of weightsArray) {
      cumulative += weight;
      if (rand <= cumulative) {
        rarity = r as Rarity;
        break;
      }
    }

    const type = SLOTS[Math.floor(Math.random() * SLOTS.length)];
    const element = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    const rarityIndex = RARITIES.indexOf(rarity);
    const rarityMultiplier = (rarityIndex + 1) * 2;
    
    // Million variation procedural generation: Base * Level * RandomNoise * Rarity
    const noise = Math.random() * 0.5 + 0.5; // 0.5 to 1
    const baseStat = (dungeonLevel * 15) + (Math.random() * 100);
    const statBonus = Math.round(baseStat * rarityMultiplier * noise);

    const isSet = (rarityIndex >= 4) && Math.random() < 0.25;
    const itemSet = isSet ? SETS[Math.floor(Math.random() * SETS.length)] : null;

    return {
      id: Math.random().toString(36).substr(2, 9),
      name: `${itemSet ? itemSet.name + ' ' : ''}${element} ${rarity} ${type}`,
      type,
      rarity,
      element,
      level: dungeonLevel,
      statBonus,
      value: dungeonLevel * 200,
      setName: itemSet?.name
    };
  }, []);

  const refreshShop = useCallback((p: PlayerData): PlayerData => {
    const shopInventory = SLOTS.map(slot => generateLoot(p.level + 10)); // Shop items are slightly higher level than player
    return { ...p, shopInventory, lastShopRefresh: Date.now() };
  }, [generateLoot]);

  useEffect(() => {
    if (player && (!player.shopInventory || !player.lastShopRefresh || Date.now() - player.lastShopRefresh > 3600000)) {
       setPlayer(p => p ? refreshShop(p) : null);
    }
  }, [player?.lastShopRefresh, refreshShop]);

  const buySpecificItem = useCallback((item: GameItem) => {
    setPlayer(prev => {
      if (!prev || prev.gold < item.value * 5) {
        setBattleLog(logs => [`❌ Not enough gold to buy ${item.name}!`, ...logs]);
        return prev;
      }
      audio.playPickup();
      const updatedInventory = [...prev.inventory, item].slice(0, 100);
      const updatedShop = prev.shopInventory.filter(i => i.id !== item.id);
      setBattleLog(logs => [`🛒 Purchased ${item.name} for ${item.value * 5} Gold!`, ...logs]);
      return { ...prev, gold: prev.gold - item.value * 5, inventory: updatedInventory, shopInventory: updatedShop };
    });
  }, []);

  const autoEquip = useCallback((p: PlayerData): PlayerData => {
    const updatedEquipped = { ...p.equipped };
    let changed = false;
    p.inventory.forEach(item => {
      const current = updatedEquipped[item.type];
      if (!current || item.statBonus > current.statBonus) {
        updatedEquipped[item.type] = item;
        changed = true;
      }
    });
    return changed ? { ...p, equipped: updatedEquipped } : p;
  }, []);

  const calculateEffectiveStats = useCallback((p: PlayerData): { stats: Stats, activeSets: SetBonus[] } => {
    let effective = { ...p.stats };
    const equipped = Object.values(p.equipped).filter(Boolean) as GameItem[];
    
    equipped.forEach(item => {
      effective.ATK += item.statBonus;
      effective.DEF += Math.floor(item.statBonus / 3);
    });

    const setCounts: Record<string, number> = {};
    equipped.forEach(item => {
       if (item.setName) setCounts[item.setName] = (setCounts[item.setName] || 0) + 1;
    });

    const activeSets: SetBonus[] = [];
    Object.entries(setCounts).forEach(([setName, count]) => {
       const setDef = SETS.find(s => s.name === setName);
       if (setDef && count >= 2) {
          const bonus = count >= 4 ? setDef.bonus4 : setDef.bonus2;
          Object.entries(bonus).forEach(([stat, val]) => {
             (effective as any)[stat] += val;
          });
          activeSets.push({ setName, count, bonus });
       }
    });

    p.skills.forEach(skill => {
      if (skill.level > 0) {
        Object.entries(skill.stats_multiplier).forEach(([stat, mult]) => {
          (effective as any)[stat] = Math.floor((effective as any)[stat] * (1 + (mult * (skill.level - 1))));
        });
      }
    });

    effective.ATK += (effective.STR * 5);
    effective.MAX_HP = 500 + (effective.VIT * 20);
    effective.MAX_MP = 200 + (effective.INT * 15);
    effective.HP = Math.min(p.stats.HP, effective.MAX_HP);
    effective.MP = Math.min(p.stats.MP, effective.MAX_MP);

    if (floorModifier?.name === 'Mana Leak') effective.MP = Math.floor(effective.MP * 0.7);
    if (floorModifier?.name === 'Speed Frenzy') effective.AGI = Math.floor(effective.AGI * 1.5);

    return { stats: effective, activeSets };
  }, [floorModifier]);

  const effectivePlayer = useMemo(() => {
    if (!player) return null;
    const { stats, activeSets } = calculateEffectiveStats(player);
    return { ...player, stats, activeSetBonuses: activeSets };
  }, [player, calculateEffectiveStats]);

  const createCharacter = (name: string, charClass: ClassType) => {
    const growth = CLASS_GROWTH[charClass] || { STR: 5, VIT: 3, ATK: 5, HP: 50 };
    const stats: Stats = {
      STR: 10 + (growth.STR || 0),
      AGI: 10 + (growth.AGI || 0),
      INT: 10 + (growth.INT || 0),
      VIT: 10 + (growth.VIT || 0),
      DEX: 10 + (growth.DEX || 0),
      LUK: 10 + (growth.LUK || 0),
      DEF: 5 + (growth.DEF || 0),
      ATK: 15 + (growth.ATK || 0),
      HP: 500 + (growth.HP || 0),
      MAX_HP: 500 + (growth.HP || 0),
      MP: 200 + (growth.MP || 0),
      MAX_MP: 200 + (growth.MP || 0)
    };

    const initialSkills = (CLASS_SKILLS[charClass] || []).map((s: any) => ({
      ...s,
      id: Math.random().toString(36).substr(2, 9),
      level: 1,
      maxLevel: 10,
      requiredLevel: 1,
      lastUsed: 0
    }));

    setPlayer({
      name, class: charClass, level: 1, exp: 0, maxExp: 100, gold: 5000000, gems: 100000,
      stats, inventory: [], equipped: {}, dungeonLevel: 1, shadowArmy: 0, sortOrder: 'rarity',
      activeQuests: QUEST_POOL.filter(q => q.levelReq <= 1).map(q => ({
        ...q, id: Math.random().toString(36).substr(2, 9), current: 0, isCompleted: false
      })),
      skills: initialSkills,
      skillPoints: 5,
      attributePoints: 10,
      unlockedGates: [1],
      currentGateId: 1
    });
  };

  const upgradeSkill = (skillId: string) => {
    setPlayer(prev => {
      if (!prev || prev.skillPoints <= 0) return prev;
      audio.playSkill();
      const updatedSkills = prev.skills.map(s => 
        s.id === skillId ? { ...s, level: s.level + 1 } : s
      );
      return { ...prev, skills: updatedSkills, skillPoints: prev.skillPoints - 1 };
    });
  };

  const processBattle = useCallback(() => {
    setPlayer(prev => {
      if (!prev) return null;
      const { stats: eff } = calculateEffectiveStats(prev);
      
      // Gate Difficulty Multiplier
      const gateDiffMap: Record<string, number> = { 'E': 1, 'D': 5, 'C': 15, 'B': 40, 'A': 100, 'S': 250, 'M': 1000, 'V': 5000 };
      const gateMult = gateDiffMap[prev.currentGateId as string] || 1;
      
      const monsterHp = (prev.dungeonLevel * 100 * gateMult) * (floorModifier?.name === 'Healer Guardian' ? 1.5 : 1);
      const monsterAtk = prev.dungeonLevel * 10 * gateMult;
      
      const playerDamage = eff.ATK;
      
      // Elemental Advantage
      const weaponElement = prev.equipped.Weapon?.element || 'Physical';
      const monsterElement = (['Fire', 'Ice', 'Electric', 'Earth', 'Wind', 'Water', 'Dark', 'Light'] as Element[])[Math.floor(Math.random() * 8)]; // Mimic monster element
      
      let elementMultiplier = 1;
      
      if (ELEMENTAL_ADVANTAGES[weaponElement as Element]?.includes(monsterElement)) {
        elementMultiplier = 1.5;
      } else if (ELEMENTAL_ADVANTAGES[monsterElement as Element]?.includes(weaponElement as Element)) {
        elementMultiplier = 0.5;
      }

      const finalPlayerDamage = playerDamage * elementMultiplier;
      const turnsToKill = Math.ceil(monsterHp / finalPlayerDamage);
      const damageTaken = turnsToKill * monsterAtk;

      if (eff.HP > damageTaken) {
        const dropCount = (floorModifier?.name === 'Loot Fever' && Math.random() > 0.5) ? 2 : 1;
        const newLoot = Array.from({ length: dropCount }).map(() => generateLoot(prev.dungeonLevel * gateMult));
        const isBoss = prev.dungeonLevel % 10 === 0;
        
        let p = { 
            ...prev, 
            gold: prev.gold + (floorModifier?.name === 'Treasure Room' ? 500 : 100) * gateMult,
            gems: prev.gems + (floorModifier?.name === 'Treasure Room' ? 5 : 1) * gateMult,
            dungeonLevel: prev.dungeonLevel + 1, 
            inventory: [...prev.inventory, ...newLoot].slice(0, 100) 
        };

        // New Modifier for next floor
        setFloorModifier(isBoss ? null : MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)]);
        
        if (isBoss) {
            setAriseAvailable(true);
            setIsAutoBattle(false);
            setBattleLog(logs => [`🔥 BOSS DEFEATED! Level ${prev.dungeonLevel} Cleared!`, ...logs]);
        } else {
            const lootNames = newLoot.map(l => l.name).join(', ');
            setBattleLog(logs => [`⚔️ Victory! Found ${lootNames}`, ...logs].slice(0, 20));
        }

        p.exp += (isBoss ? 200 : 20);
        
        // Level Up Logic
        if (p.exp >= p.maxExp) {
          audio.playLevelUp();
          const classGrowth = CLASS_GROWTH[p.class] || { STR: 1, AGI: 1, INT: 1, VIT: 1, DEX: 1, LUK: 1 };
          p.level += 1;
          p.exp -= p.maxExp;
          p.maxExp = Math.round(p.maxExp * 1.5);
          p.skillPoints += 1;
          p.attributePoints += 10;
          
          // Automatic growth for ALL primary stats
          p.stats.STR += 1;
          p.stats.AGI += 1;
          p.stats.INT += 1;
          p.stats.VIT += 1;
          p.stats.DEX += 1;
          p.stats.LUK += 1;

          // Bonus class-specific growth
          Object.keys(classGrowth).forEach(key => {
            if (['STR', 'AGI', 'INT', 'VIT', 'DEX', 'LUK', 'ATK', 'DEF'].includes(key)) {
              (p.stats as any)[key] += (classGrowth as any)[key] || 0;
            }
          });

          // Core Recalculation
          p.stats.MAX_HP = 500 + (p.stats.VIT * 20);
          p.stats.MAX_MP = 200 + (p.stats.INT * 15);
          p.stats.HP = p.stats.MAX_HP;
          p.stats.MP = p.stats.MAX_MP;
          
          setBattleLog(logs => [`✨ LEVEL UP! You are now Level ${p.level}!`, ...logs]);
        }
        return autoEquip(p);
      } else {
        setBattleLog(logs => [`💀 Defeat at Lvl ${prev.dungeonLevel}! Retreating...`, ...logs]);
        setIsAutoBattle(false);
        return { ...prev, dungeonLevel: 1, stats: { ...prev.stats, HP: prev.stats.MAX_HP } };
      }
    });
  }, [generateLoot, autoEquip]);

  useEffect(() => {
    let interval: any;
    if (isAutoBattle) interval = setInterval(processBattle, 1500);
    return () => clearInterval(interval);
  }, [isAutoBattle, processBattle]);

  const recycleItems = useCallback((targetRarity: Rarity | 'AllBelowEpic') => {
    setPlayer(prev => {
      if (!prev) return null;
      const raritiesBelowEpic = ['Common', 'Uncommon', 'Rare', 'Unique'];
      const toRecycle = targetRarity === 'AllBelowEpic' 
        ? prev.inventory.filter(i => raritiesBelowEpic.includes(i.rarity))
        : prev.inventory.filter(i => i.rarity === targetRarity);
      const remaining = prev.inventory.filter(i => !toRecycle.includes(i));
      const totalExp = toRecycle.reduce((acc, i) => acc + (RARITIES.indexOf(i.rarity) + 1) * 10, 0);
      return { ...prev, inventory: remaining, exp: prev.exp + totalExp };
    });
  }, []);

  const upgradeItem = (slot: Slot) => {
    setPlayer(prev => {
      if (!prev || !prev.equipped[slot]) return prev;
      const item = { ...prev.equipped[slot]! };
      const currentLevel = item.level % 100; // Use level within tier for upgrade logic
      const cost = Math.floor((currentLevel + 1) * 10000);
      
      if (prev.gold < cost) {
        setBattleLog(logs => [`❌ Not enough gold to forge (+${cost})!`, ...logs]);
        return prev;
      }

      const successRate = Math.max(5, 100 - (currentLevel * 5));
      const roll = Math.random() * 100;
      
      if (roll <= successRate) {
        audio.playLevelUp();
        item.level++;
        item.statBonus = Math.round(item.statBonus * 1.1);
        setBattleLog(logs => [`✨ SUCCESS! ${item.name} is now Level ${item.level}!`, ...logs]);
      } else {
        audio.playHit();
        const failurePenalty = Math.random() > 0.7; // 30% chance to drop a level
        if (failurePenalty && item.level > 1) {
          item.level--;
          item.statBonus = Math.round(item.statBonus / 1.1);
          setBattleLog(logs => [`💢 FAILURE! ${item.name} dropped to Level ${item.level}!`, ...logs]);
        } else {
          setBattleLog(logs => [`💨 FORGE FAILED! ${item.name} level maintained.`, ...logs]);
        }
      }

      return { ...prev, gold: prev.gold - cost, equipped: { ...prev.equipped, [slot]: item } };
    });
  };

  const sortedInventory = useMemo(() => {
    if (!player) return [];
    return [...player.inventory].sort((a, b) => {
      if (player.sortOrder === 'rarity') return RARITIES.indexOf(b.rarity) - RARITIES.indexOf(a.rarity);
      return b.level - a.level;
    });
  }, [player]);

  const buyChest = (cost: number) => {
    if (!player || player.gold < cost) return null;
    const loot = generateLoot(player.dungeonLevel + 100);
    setPlayer(prev => {
      if (!prev) return null;
      return autoEquip({ ...prev, gold: prev.gold - cost, inventory: [...prev.inventory, loot].slice(0, 100) });
    });
    return loot;
  };

  const unequip = useCallback((slot: Slot) => {
    setPlayer(prev => {
      if (!prev || !prev.equipped[slot]) return prev;
      const item = prev.equipped[slot]!;
      const updatedEquipped = { ...prev.equipped };
      delete updatedEquipped[slot];
      return { ...prev, equipped: updatedEquipped, inventory: [...prev.inventory, item].slice(0, 100) };
    });
  }, []);

  const equipItem = useCallback((item: GameItem) => {
    audio.playPickup();
    setPlayer(prev => {
      if (!prev) return null;
      const slot = item.type;
      const currentEquipped = prev.equipped[slot];
      const updatedInventory = prev.inventory.filter(i => i.id !== item.id);
      const newInventory = currentEquipped ? [...updatedInventory, currentEquipped] : updatedInventory;
      return {
        ...prev,
        inventory: newInventory.slice(0, 100),
        equipped: { ...prev.equipped, [slot]: item }
      };
    });
  }, []);

  const discardItem = useCallback((itemId: string) => {
    setPlayer(prev => {
      if (!prev) return null;
      return {
        ...prev,
        inventory: prev.inventory.filter(i => i.id !== itemId)
      };
    });
  }, []);

  const allocateAttribute = useCallback((stat: keyof Stats) => {
    setPlayer(prev => {
      if (!prev || prev.attributePoints <= 0) return prev;
      return {
        ...prev,
        attributePoints: prev.attributePoints - 1,
        stats: {
          ...prev.stats,
          [stat]: (prev.stats as any)[stat] + 1
        }
      };
    });
  }, []);

  return {
    player: effectivePlayer, createCharacter, isAutoBattle, setIsAutoBattle, ariseAvailable, 
    arise: () => {
      setPlayer(prev => prev ? { ...prev, shadowArmy: prev.shadowArmy + 1 } : null);
      setAriseAvailable(false);
      setBattleLog(logs => [`🌑 SHADOW EXTRACTED! Your army grows...`, ...logs]);
    },
    hasStarted, setHasStarted, battleLog, upgradeItem, recycleItems, buyChest, buySpecificItem, unequip, allocateAttribute, equipItem, discardItem,
    triggerAutoEquip: () => {
      audio.playPickup();
      setPlayer(p => p ? autoEquip(p) : null);
    },
    summonShadow: () => {
      setPlayer(prev => {
        if (!prev || prev.gems < 500) return prev;
        setBattleLog(logs => [`🌒 A new shadow rises from the void!`, ...logs]);
        return { ...prev, gems: prev.gems - 500, shadowArmy: prev.shadowArmy + 1 };
      });
    },
    setSortOrder: (order: SortOption) => setPlayer(p => p ? { ...p, sortOrder: order } : null),
    sortedInventory, upgradeSkill, floorModifier, claimDailyReward, switchGate,
    resetSave: () => { localStorage.removeItem('player_save'); setPlayer(null); }
  };
}
