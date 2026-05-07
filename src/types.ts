export type ClassType = 
  | 'Warrior' | 'Shadow Monarch' | 'Mage' | 'Dragon Knight' | 'Archer' 
  | 'Berserker' | 'Priest' | 'Necromancer' | 'Gunner' | 'Monk'
  | 'Assassin' | 'Paladin'
  | 'Flame Knight' | 'Shadow Assassin' | 'Ice Mage' | 'Thunder Warrior' | 'Holy Paladin'
  | 'Dark Necromancer' | 'Dragon Slayer' | 'Wind Ranger' | 'Blood Samurai' | 'Arcane Wizard'
  | 'Cyber Ninja' | 'Titan Guardian' | 'Poison Hunter' | 'Phoenix Queen' | 'Storm Monk'
  | 'Beast Tamer' | 'Demon Berserker' | 'Celestial Angel' | 'Void Reaper' | 'Mecha Soldier';

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Unique' | 'Epic' | 'Legendary' | 'Ancient' | 'Divine' | 'Relic' | 'Mythical';

export type MonsterRank = 'Common Mob' | 'Elite Scout' | 'Veteran Guard' | 'Floor Boss' | 'World Boss';

export type Element = 
  | 'Fire' | 'Ice' | 'Water' | 'Wind' | 'Earth' 
  | 'Lightning' | 'Light' | 'Dark' | 'Poison' | 'Blood'
  | 'Spirit' | 'Metal' | 'Nature' | 'Shadow' | 'Holy'
  | 'Lava' | 'Crystal' | 'Storm' | 'Void' | 'Arcane'
  | 'Gravity' | 'Time' | 'Space' | 'Plasma' | 'Smoke'
  | 'Sand' | 'Explosion' | 'Frost' | 'Venom' | 'Steel'
  | 'Dragon' | 'Ghost' | 'Moon' | 'Sun' | 'Star'
  | 'Chaos' | 'Magic' | 'Beast' | 'Thunder' | 'Inferno'
  | 'Toxic' | 'Curse' | 'Dream' | 'Nightmare' | 'Soul'
  | 'Divine' | 'Celestial' | 'Cyber' | 'Nuclear' | 'Galaxy';

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
  upgradeLevel: number;
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

export interface Monster {
  id: string;
  name: string;
  rank: MonsterRank;
  biome: string;
  level: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  element: string;
  visualPrompt: string;
  lootDrop: string;
  x: number;
  y: number;
  spawnX: number;
  spawnY: number;
  facing: 'left' | 'right';
  isBoss?: boolean;
}
