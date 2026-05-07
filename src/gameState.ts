import { useState, useCallback, useEffect, useMemo } from 'react';
import { PlayerData, ClassType, GameItem, Rarity, Element, Slot, Stats, SortOption, Skill, Quest, SetBonus } from './types';
import { 
  CLASS_GROWTH, CLASS_SKILLS, RARITIES, ELEMENTS, 
  SLOTS, RARITY_WEIGHTS, CLASSES, SETS, ELEMENTAL_ADVANTAGES, RARITY_MULTIPLIERS
} from './constants';
import { audio } from './services/audioService';
import { getMonster } from './services/monsterService';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const INITIAL_WEALTH = 999999999999;

const QUEST_POOL = [
  { name: 'The Awakening', description: 'Clear Level 10 Dungeon', target: 10, rewardExp: 1000, rewardGold: 5000, rewardGems: 100, levelReq: 1 },
  { name: 'Skeleton Slayer', description: 'Defeat 50 Mobs', target: 50, rewardExp: 2000, rewardGold: 10000, rewardGems: 200, levelReq: 50 },
  { name: 'Blacksmith’s Favor', description: 'Clear Level 100 Dungeon', target: 100, rewardExp: 5000, rewardGold: 50000, rewardGems: 500, levelReq: 100 },
  { name: 'The Red Gate', description: 'Clear Level 500 Dungeon', target: 500, rewardExp: 50000, rewardGold: 500000, rewardGems: 1000, levelReq: 500 },
  { name: 'God of the Dungeon', description: 'Clear Level 1000 Dungeon', target: 1000, rewardExp: 100000, rewardGold: 1000000, rewardGems: 5000, levelReq: 1000 }
];

export function useGameState() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<PlayerData | null>(null);

  // Auth Listener
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  // Firestore Sync Listener
  useEffect(() => {
    if (!user) {
      // Offline mode or not logged in - check localStorage for guest play
      const saved = localStorage.getItem('player_save');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (!data.activeQuests) {
            data.activeQuests = QUEST_POOL.map((q: any) => ({
              ...q, id: Math.random().toString(36).substr(2, 9), current: 0, isCompleted: false
            }));
          }
          setPlayer(data);
        } catch (e) {
          console.error("Error parsing local save", e);
        }
      } else {
        setPlayer(null);
      }
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as PlayerData;
        // Migration: Ensure activeQuests exists
        if (!data.activeQuests) {
          data.activeQuests = QUEST_POOL.map(q => ({
            ...q, id: Math.random().toString(36).substr(2, 9), current: 0, isCompleted: false
          }));
        }
        setPlayer(data);
      } else {
        // Check if we can migrate from localStorage
        const saved = localStorage.getItem('player_save');
        if (saved) {
          try {
            const localData = JSON.parse(saved);
            // Migrate to Firestore
            setDoc(userDocRef, {
              ...localData,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`));
            setPlayer(localData);
          } catch (e) {
            setPlayer(null);
          }
        } else {
          setPlayer(null);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    return () => unsubscribe();
  }, [user]);

  // Persist local state (for guests) OR sync to Firestore (for users)
  // Actually, with onSnapshot, we only need to write WHEN state changes locally (if we don't do optimistic UI, but here we are using local state setters)
  // To avoid circular loops with onSnapshot, we should ideally write to Firestore in our action handlers instead of a global useEffect
  
  const saveGameState = useCallback(async (newData: PlayerData | null) => {
    if (!newData) return;
    
    // Always update local storage for redundancy/guest mode
    localStorage.setItem('player_save', JSON.stringify(newData));

    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          ...newData,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
      }
    }
  }, [user]);

  // We'll wrap setPlayer to also save
  const updatePlayer = useCallback((updater: (prev: PlayerData | null) => PlayerData | null) => {
    setPlayer(prev => {
      const next = updater(prev);
      saveGameState(next);
      return next;
    });
  }, [saveGameState]);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Login Error", e);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('player_save');
      setPlayer(null);
    } catch (e) {
      console.error("Logout Error", e);
    }
  };

  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [isAutoBattle, setIsAutoBattle] = useState(false);
  const [ariseAvailable, setAriseAvailable] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const claimDailyReward = useCallback(() => {
    updatePlayer(prev => {
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
  }, [updatePlayer]);

  const switchGate = useCallback((gateId: string) => {
    updatePlayer(prev => {
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
  }, [updatePlayer]);

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
    const rarityMultiplier = RARITY_MULTIPLIERS[rarity as string] || 1;
    
    // Logic from script: statBonus = monsterLevel * Random.Range(10, 50) * rarityMultiplier
    const rangeVal = Math.floor(Math.random() * 41) + 10; // 10 to 50
    const statBonus = Math.round(dungeonLevel * rangeVal * rarityMultiplier);

    const isSet = (rarityMultiplier >= 10) && Math.random() < 0.25;
    const itemSet = isSet ? SETS[Math.floor(Math.random() * SETS.length)] : null;

    return {
      id: Math.random().toString(36).substr(2, 9),
      name: `${itemSet ? itemSet.name + ' ' : ''}${element} ${rarity} ${type}`,
      type,
      rarity,
      element,
      level: dungeonLevel,
      upgradeLevel: 0,
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
       updatePlayer(p => p ? refreshShop(p) : null);
    }
  }, [player?.lastShopRefresh, refreshShop, updatePlayer]);

  const buySpecificItem = useCallback((item: GameItem) => {
    updatePlayer(prev => {
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
  }, [updatePlayer]);

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
    effective.MAX_HP = 1000 + (effective.VIT * 20) + (p.level * 100);
    effective.MAX_MP = 500 + (effective.INT * 15) + (p.level * 50);
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

    updatePlayer(() => ({
      name, class: charClass, level: 1, exp: 0, maxExp: 100, gold: INITIAL_WEALTH, gems: INITIAL_WEALTH,
      stats, inventory: [], equipped: {}, dungeonLevel: 1, shadowArmy: 0, sortOrder: 'rarity',
      activeQuests: QUEST_POOL.filter(q => q.levelReq <= 1).map(q => ({
        ...q, id: Math.random().toString(36).substr(2, 9), current: 0, isCompleted: false
      })),
      skills: initialSkills,
      skillPoints: 5,
      attributePoints: 10,
      unlockedGates: [1],
      currentGateId: 1,
      shopInventory: SLOTS.map(slot => generateLoot(10)), // Initial shop
      lastShopRefresh: Date.now(),
      activeSetBonuses: []
    }));
  };

  const upgradeSkill = (skillId: string) => {
    updatePlayer(prev => {
      if (!prev || prev.skillPoints <= 0) return prev;
      audio.playSkill();
      const updatedSkills = prev.skills.map(s => 
        s.id === skillId ? { ...s, level: s.level + 1 } : s
      );
      return { ...prev, skills: updatedSkills, skillPoints: prev.skillPoints - 1 };
    });
  };

  const processBattle = useCallback(() => {
    updatePlayer(prev => {
      if (!prev) return null;
      const { stats: eff } = calculateEffectiveStats(prev);
      
      // Get unique monster for this level/gate
      const seed = prev.dungeonLevel + (RARITIES.indexOf(prev.currentGateId as any || 'Common') * 100);
      const monster = getMonster(seed);
      
      // Scale monster based on gate
      const gateDiffMap: Record<string, number> = { 'E': 1, 'D': 5, 'C': 15, 'B': 40, 'A': 100, 'S': 250, 'M': 1000, 'V': 5000 };
      const gateMult = gateDiffMap[prev.currentGateId as string] || 1;
      
      const isBoss = prev.dungeonLevel % 10 === 0;
      let monsterHp = monster.hp * gateMult * (floorModifier?.name === 'Healer Guardian' ? 1.5 : 1);
      let monsterAtk = monster.atk * gateMult;

      let expReward = (isBoss ? 200 : 20) * gateMult;
      let goldReward = (floorModifier?.name === 'Treasure Room' ? 500 : 100) * gateMult;
      let gemReward = (floorModifier?.name === 'Treasure Room' ? 5 : 1) * gateMult;

      if (isBoss) {
        monsterHp *= 10; 
        monsterAtk *= 3; // Unity script says 3x ATK for boss
        expReward *= 10; // Unity script says 10x EXP for boss
        goldReward *= 20; // Unity script says 20x Gold for boss
        setBattleLog(logs => [`⚠️ WARNING: BOSS detected! Prepare for combat!`, ...logs]);
      }
      
      let playerDamage = eff.ATK;
      
      // Critical Hit System (from Unity script logic: Random(1,100) <= LUK)
      const isCritical = Math.random() * 100 <= eff.LUK;
      if (isCritical) {
        playerDamage *= 2;
        setBattleLog(logs => [`💥 CRITICAL HIT!`, ...logs].slice(0, 20));
      }
      
      // Elemental Advantage
      const weaponElement = prev.equipped.Weapon?.element || 'Physical';
      const monsterElement = monster.element;
      
      let elementMultiplier = 1;
      
      if (ELEMENTAL_ADVANTAGES[weaponElement as Element]?.includes(monsterElement)) {
        elementMultiplier = 1.5;
        setBattleLog(logs => [`✨ Elemental Advantage! (${weaponElement} > ${monsterElement})`, ...logs].slice(0, 20));
      } else if (ELEMENTAL_ADVANTAGES[monsterElement as Element]?.includes(weaponElement as Element)) {
        elementMultiplier = 0.5;
        setBattleLog(logs => [`⚠️ Elemental Disadvantage! (${monsterElement} > ${weaponElement})`, ...logs].slice(0, 20));
      }

      const finalPlayerDamage = playerDamage * elementMultiplier;
      const turnsToKill = Math.ceil(monsterHp / finalPlayerDamage);
      const damageTaken = turnsToKill * monsterAtk;

      if (eff.HP > damageTaken) {
        const dropCount = (floorModifier?.name === 'Loot Fever' && Math.random() > 0.5) ? 2 : 1;
        const newLoot = Array.from({ length: dropCount }).map(() => generateLoot(prev.dungeonLevel * gateMult));
        const isBoss = prev.dungeonLevel % 10 === 0;
        
        // Log battle start
        setBattleLog(logs => [`⚔️ Fighting ${monster.name} (${monster.rank})`, ...logs].slice(0, 20));

        let p = { 
            ...prev, 
            gold: prev.gold + goldReward,
            gems: prev.gems + gemReward,
            dungeonLevel: prev.dungeonLevel + 1, 
            inventory: [...prev.inventory, ...newLoot].slice(0, 100) 
        };

        // Update Quests
        const updatedQuests = (p.activeQuests || []).map(q => {
          if (q.isCompleted) return q;
          
          let updatedCurrent = q.current;
          if (q.name === 'Skeleton Slayer') updatedCurrent += 1;
          if (q.name === 'The Awakening') updatedCurrent = Math.max(updatedCurrent, p.dungeonLevel);
          if (q.name === 'Blacksmith’s Favor') updatedCurrent = Math.max(updatedCurrent, p.dungeonLevel);
          if (q.name === 'The Red Gate') updatedCurrent = Math.max(updatedCurrent, p.dungeonLevel);
          if (q.name === 'God of the Dungeon') updatedCurrent = Math.max(updatedCurrent, p.dungeonLevel);

          const isNowCompleted = updatedCurrent >= q.target;
          if (isNowCompleted && !q.isCompleted) {
            setBattleLog(logs => [`🏆 QUEST COMPLETED: ${q.name}!`, ...logs]);
            audio.playLevelUp();
            p.gold += q.rewardGold;
            p.gems += q.rewardGems;
            p.exp += q.rewardExp;
          }
          
          return { ...q, current: updatedCurrent, isCompleted: isNowCompleted };
        });
        p.activeQuests = updatedQuests;

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

        p.exp += expReward;
        
        // Level Up Logic from Unity Script
        while (p.exp >= p.maxExp) {
          audio.playLevelUp();
          p.level += 1;
          p.exp -= p.maxExp;
          p.maxExp = p.level * 500; // Next level exp = level * 500
          p.skillPoints += 1;
          p.attributePoints += 10;
          
          // Specific stat gains from Unity script
          p.stats.STR += 2;
          p.stats.AGI += 2;
          p.stats.INT += 2;
          p.stats.VIT += 2;
          p.stats.DEX += 2;
          p.stats.LUK += 1;
          p.stats.DEF += 2;
          p.stats.ATK += 3;
          p.stats.HP += 100; // Unity says HP+10, but context is different. Script sets hp = stats.HP * 100.
          p.stats.MP += 50;

          const classGrowth = CLASS_GROWTH[p.class] || {};
          Object.keys(classGrowth).forEach(key => {
            if (['STR', 'AGI', 'INT', 'VIT', 'DEX', 'LUK', 'ATK', 'DEF'].includes(key)) {
              (p.stats as any)[key] += (classGrowth as any)[key] || 0;
            }
          });

          // Core Recalculation
          p.stats.MAX_HP = 1000 + (p.stats.HP); // Simplified but aligned with script's starting values
          p.stats.MAX_MP = 500 + (p.stats.MP);
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
    updatePlayer(prev => {
      if (!prev) return null;
      const raritiesBelowEpic = ['Common', 'Uncommon', 'Rare', 'Unique'];
      const toRecycle = targetRarity === 'AllBelowEpic' 
        ? prev.inventory.filter(i => raritiesBelowEpic.includes(i.rarity))
        : prev.inventory.filter(i => i.rarity === targetRarity);
      const remaining = prev.inventory.filter(i => !toRecycle.includes(i));
      const totalExp = toRecycle.reduce((acc, i) => acc + (RARITIES.indexOf(i.rarity) + 1) * 10, 0);
      return { ...prev, inventory: remaining, exp: prev.exp + totalExp };
    });
  }, [updatePlayer]);

  const upgradeItem = (slot: Slot) => {
    updatePlayer(prev => {
      if (!prev || !prev.equipped[slot]) return prev;
      const item = { ...prev.equipped[slot]! };
      
      if (item.upgradeLevel >= 500) {
        setBattleLog(logs => [`✨ ${item.name} is already at MAX LEVEL!`, ...logs]);
        return prev;
      }

      // Cost starts at 50,000 and scales with upgrade level
      const cost = 50000 + (item.upgradeLevel * 10000);
      
      if (prev.gold < cost) {
        setBattleLog(logs => [`❌ Not enough gold for forge (+${cost})!`, ...logs]);
        return prev;
      }

      // Success chance: 70% as per snippet
      const success = Math.random() < 0.7;
      
      if (success) {
        audio.playLevelUp();
        item.upgradeLevel++;
        // Boost stats by 15% per upgrade level
        item.statBonus = Math.round(item.statBonus * 1.15);
        setBattleLog(logs => [`✨ SUCCESS! ${item.name} is now +${item.upgradeLevel}!`, ...logs]);
      } else {
        audio.playHit();
        if (item.upgradeLevel > 0) {
          item.upgradeLevel--;
          item.statBonus = Math.round(item.statBonus / 1.15);
          setBattleLog(logs => [`💢 FAILED! ${item.name} dropped to +${item.upgradeLevel}!`, ...logs]);
        } else {
          setBattleLog(logs => [`💨 FORGE FAILED! ${item.name} remained at +0.`, ...logs]);
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
    updatePlayer(prev => {
      if (!prev) return null;
      return autoEquip({ ...prev, gold: prev.gold - cost, inventory: [...prev.inventory, loot].slice(0, 100) });
    });
    return loot;
  };

  const unequip = useCallback((slot: Slot) => {
    updatePlayer(prev => {
      if (!prev || !prev.equipped[slot]) return prev;
      const item = prev.equipped[slot]!;
      const updatedEquipped = { ...prev.equipped };
      delete updatedEquipped[slot];
      return { ...prev, equipped: updatedEquipped, inventory: [...prev.inventory, item].slice(0, 100) };
    });
  }, [updatePlayer]);

  const equipItem = useCallback((item: GameItem) => {
    audio.playPickup();
    updatePlayer(prev => {
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
  }, [updatePlayer]);

  const discardItem = useCallback((itemId: string) => {
    updatePlayer(prev => {
      if (!prev) return null;
      return {
        ...prev,
        inventory: prev.inventory.filter(i => i.id !== itemId)
      };
    });
  }, [updatePlayer]);

  const allocateAttribute = useCallback((stat: keyof Stats, amount: number = 1) => {
    updatePlayer(prev => {
      if (!prev || prev.attributePoints <= 0) return prev;
      const pointsToAllocate = Math.min(amount, prev.attributePoints);
      return {
        ...prev,
        attributePoints: prev.attributePoints - pointsToAllocate,
        stats: {
          ...prev.stats,
          [stat]: (prev.stats as any)[stat] + pointsToAllocate
        }
      };
    });
  }, [updatePlayer]);

  return {
    player: effectivePlayer, createCharacter, isAutoBattle, setIsAutoBattle, ariseAvailable, 
    arise: () => {
      updatePlayer(prev => prev ? { ...prev, shadowArmy: prev.shadowArmy + 1 } : null);
      setAriseAvailable(false);
      setBattleLog(logs => [`🌑 SHADOW EXTRACTED! Your army grows...`, ...logs]);
    },
    hasStarted, setHasStarted, battleLog, upgradeItem, recycleItems, buyChest, buySpecificItem, unequip, allocateAttribute, equipItem, discardItem,
    triggerAutoEquip: () => {
      audio.playPickup();
      updatePlayer(p => p ? autoEquip(p) : null);
    },
    summonShadow: () => {
      updatePlayer(prev => {
        if (!prev || prev.gems < 500) return prev;
        setBattleLog(logs => [`🌒 A new shadow rises from the void!`, ...logs]);
        return { ...prev, gems: prev.gems - 500, shadowArmy: prev.shadowArmy + 1 };
      });
    },
    setSortOrder: (order: SortOption) => updatePlayer(p => p ? { ...p, sortOrder: order } : null),
    sortedInventory, upgradeSkill, floorModifier, claimDailyReward, switchGate,
    user, login, logout, resetSave: () => logout(), loading
  };
}
