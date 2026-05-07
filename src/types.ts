export type ClassType = 
  'Warrior' | 'Paladin' | 'Assassin' | 'Mage' | 'Archer' | 
  'Berserker' | 'Priest' | 'Necromancer' | 'Gunner' | 'Monk' |
  'Shadow Monarch' | 'Dragon Knight' | 'Slayer' | 'Soul Eater' | 'Void Walker' | 
  'Storm Caller' | 'Holy Knight' | 'Phantom' | 'Grand Master' | 'Dual Blader';

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Unique' | 'Epic' | 'Legendary' | 'Ancient' | 'Divine' | 'Relic' | 'Mythical';

export type Element = 'Fire' | 'Water' | 'Electric' | 'Earth' | 'Wind' | 'Light' | 'Dark' | 'Poison' | 'Ice' | 'Spirit' | 'Void' | 'Holy' | 'Chaos' | 'Gravity' | 'Blood';

export type Slot = 'Weapon' | 'Headgear' | 'Suit' | 'Pants' | 'Shoes' | 'Gloves' | 'Necklace' | 'Earrings' | 'Ring' | 'Bracelet';

export interface Pet {
  id: string;
  name: string;
  type: 'Attack' | 'Defense' | 'Utility';
  bonus: Partial<Stats>;
  level: number;
}

export interface DungeonGate {
  id: number;
  name: string;
  minLevel: number;
  maxLevel: number;
  color: string;
  difficulty: number;
}

export interface Stats {
  STR: number;
  AGI: number;
  INT: number;
  VIT: number;
  DEX: number;
  LUK: number;
  DEF: number;
  ATK: number;
  HP: number;
  MAX_HP: number;
  MP: number;
  MAX_MP: number;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  target: number;
  current: number;
  rewardExp: number;
  rewardGold: number;
  rewardGems: number;
  levelReq: number;
  isCompleted: boolean;
}

export interface GameItem {
  id: string;
  name: string;
  type: Slot;
  rarity: Rarity;
  element: Element;
  level: number;
  statBonus: number;
  value: number;
  setName?: string;
}

export type SortOption = 'rarity' | 'level' | 'type' | 'name';

export interface SetBonus {
  setName: string;
  count: number;
  bonus: Partial<Stats>;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: 'active' | 'passive';
  cooldown: number; // in turns/ticks
  lastUsed: number;
  level: number;
  maxLevel: number;
  requiredLevel: number;
  stats_multiplier: Partial<Stats>;
}

export interface PlayerData {
  name: string;
  class: ClassType;
  level: number;
  exp: number;
  maxExp: number;
  gold: number;
  gems: number;
  stats: Stats;
  inventory: GameItem[];
  equipped: Partial<Record<Slot, GameItem>>;
  dungeonLevel: number;
  shadowArmy: number;
  sortOrder: SortOption;
  activeQuests: Quest[];
  skills: Skill[];
  skillPoints: number;
  attributePoints: number;
  activeSetBonuses: SetBonus[];
  currentPet?: Pet | null;
  lastDailyReward?: number;
  unlockedGates: number[];
  currentGateId: number;
  shopInventory: GameItem[];
  lastShopRefresh: number;
}
