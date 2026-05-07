import { ClassType, Rarity, Element, Slot, Stats } from './types';

export const CLASSES: ClassType[] = [
  'Warrior', 'Paladin', 'Assassin', 'Mage', 'Archer', 
  'Berserker', 'Priest', 'Necromancer', 'Gunner', 'Monk',
  'Shadow Monarch', 'Dragon Knight', 'Slayer', 'Soul Eater', 'Void Walker', 
  'Storm Caller', 'Holy Knight', 'Phantom', 'Grand Master', 'Dual Blader'
];

export const RARITIES: Rarity[] = [
  'Common', 'Uncommon', 'Rare', 'Unique', 'Epic', 
  'Legendary', 'Ancient', 'Divine', 'Relic', 'Mythical'
];

export const ELEMENTS: Element[] = [
  'Fire', 'Water', 'Electric', 'Earth', 'Wind', 
  'Light', 'Dark', 'Poison', 'Ice', 'Spirit', 'Void', 'Holy', 'Chaos', 'Gravity', 'Blood'
];

export const SLOTS: Slot[] = [
  'Weapon', 'Headgear', 'Suit', 'Pants', 
  'Shoes', 'Gloves', 'Necklace', 'Earrings', 'Ring', 'Bracelet'
];

export const GATES: any[] = [
  { id: 1, name: 'E-Rank Gate', minLevel: 1, maxLevel: 20, color: 'text-blue-400', difficulty: 1 },
  { id: 2, name: 'D-Rank Gate', minLevel: 21, maxLevel: 40, color: 'text-green-400', difficulty: 2 },
  { id: 3, name: 'C-Rank Gate', minLevel: 41, maxLevel: 60, color: 'text-yellow-400', difficulty: 3 },
  { id: 4, name: 'B-Rank Gate', minLevel: 61, maxLevel: 80, color: 'text-purple-400', difficulty: 5 },
  { id: 5, name: 'A-Rank Gate', minLevel: 81, maxLevel: 100, color: 'text-red-400', difficulty: 8 },
  { id: 6, name: 'S-Rank Gate', minLevel: 101, maxLevel: 200, color: 'text-cyan-400', difficulty: 15 },
  { id: 7, name: 'Abyss Gate', minLevel: 201, maxLevel: 500, color: 'text-purple-600', difficulty: 30 },
  { id: 8, name: 'Divine Gate', minLevel: 501, maxLevel: 1000, color: 'text-yellow-300', difficulty: 100 },
];

export const RARITY_WEIGHTS: Record<string, number> = {
  Common: 7000,
  Uncommon: 500,
  Rare: 2000,
  Unique: 200,
  Epic: 700,
  Legendary: 250,
  Ancient: 50,
  Divine: 20,
  Relic: 5,
  Mythical: 50,
};

export const ELEMENTAL_ADVANTAGES: Record<Element, Element[]> = {
  Fire: ['Ice', 'Wind', 'Poison'],
  Ice: ['Earth', 'Spirit', 'Electric'],
  Electric: ['Water', 'Metal' as any, 'Air' as any, 'Spirit'],
  Earth: ['Electric', 'Poison'],
  Wind: ['Earth', 'Electric'],
  Water: ['Fire', 'Earth'],
  Light: ['Dark', 'Void', 'Chaos'],
  Dark: ['Light', 'Spirit', 'Holy'],
  Poison: ['Water', 'Life' as any],
  Spirit: ['Mind' as any, 'Void'],
  Void: ['Material' as any, 'Spirit'],
  Holy: ['Dark', 'Chaos'],
  Chaos: ['Holy', 'Order' as any],
  Gravity: ['Wind', 'Air' as any],
  Blood: ['Life' as any],
};

export const CLASS_GROWTH: Record<string, Partial<Stats>> = {
  Warrior: { STR: 5, VIT: 3, ATK: 5, HP: 50 },
  Paladin: { VIT: 5, DEF: 5, HP: 80 },
  Assassin: { AGI: 5, LUK: 4, ATK: 7 },
  Mage: { INT: 5, MP: 30, ATK: 6 },
  Archer: { DEX: 5, AGI: 3, ATK: 4 },
  Berserker: { STR: 6, HP: 40, ATK: 8 },
  Priest: { INT: 3, VIT: 3, HP: 40, MP: 40 },
  Necromancer: { INT: 6, LUK: 3, MP: 50 },
  Gunner: { DEX: 4, LUK: 4, ATK: 6 },
  Monk: { AGI: 4, STR: 4, VIT: 4 },
  'Shadow Monarch': { AGI: 6, ATK: 10, STR: 5 },
  'Dragon Knight': { STR: 5, VIT: 5, HP: 70 },
  Slayer: { STR: 7, AGI: 3, ATK: 10 },
  'Soul Eater': { INT: 5, LUK: 5, MP: 60 },
  'Void Walker': { AGI: 5, INT: 5 },
  'Storm Caller': { INT: 7, MP: 50 },
  'Holy Knight': { VIT: 6, DEF: 4, HP: 100 },
  Phantom: { AGI: 7, LUK: 5, ATK: 8 },
  'Grand Master': { STR: 4, DEX: 4, AGI: 4, INT: 4 },
  'Dual Blader': { AGI: 8, ATK: 5 },
};

export const CLASS_SKILLS: Record<string, any[]> = {
  Warrior: [
    { name: 'Ground Slam', description: 'Heavy area damage', type: 'active', cooldown: 5, stats_multiplier: { STR: 3 } },
    { name: 'Tenacity', description: 'Increases HP slightly', type: 'passive', stats_multiplier: { HP: 100 } }
  ],
  Assassin: [
    { name: 'Shadow Strike', description: 'High critical hit', type: 'active', cooldown: 3, stats_multiplier: { AGI: 4, LUK: 2 } },
    { name: 'Fleet Foot', description: 'Increases Evasion', type: 'passive', stats_multiplier: { AGI: 5 } }
  ],
  'Shadow Monarch': [
    { name: 'ARRISE', description: 'Summon the shadow army', type: 'active', cooldown: 10, stats_multiplier: { INT: 5, AGI: 2 } },
    { name: 'Monarch Dominance', description: 'Massive ATK boost', type: 'passive', stats_multiplier: { ATK: 200 } }
  ],
  Mage: [
    { name: 'Meteor Fall', description: 'Massive magic damage', type: 'active', cooldown: 8, stats_multiplier: { INT: 6 } },
    { name: 'Mana Flow', description: 'Increases Max MP', type: 'passive', stats_multiplier: { MP: 150 } }
  ]
};

export const SETS = [
  { name: 'Shadow Monarch', bonus2: { ATK: 50 }, bonus4: { AGI: 20, ATK: 100 } },
  { name: 'Dragon Slayer', bonus2: { DEF: 30 }, bonus4: { VIT: 25, HP: 500 } },
  { name: 'Void Walker', bonus2: { LUK: 15 }, bonus4: { AGI: 40, INT: 30 } },
  { name: 'Abyssal Knight', bonus2: { STR: 20 }, bonus4: { STR: 50, VIT: 50 } }
];

export const RARITY_COLORS: Record<string, string> = {
  Common: 'text-gray-400',
  Uncommon: 'text-green-400',
  Rare: 'text-blue-400',
  Unique: 'text-purple-400',
  Epic: 'text-orange-400',
  Legendary: 'text-yellow-400',
  Ancient: 'text-amber-500',
  Divine: 'text-cyan-400',
  Relic: 'text-pink-500',
  Mythical: 'text-red-500',
};
