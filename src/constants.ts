import { ClassType, Rarity, Element, Slot, Stats } from './types';

export const CLASSES: ClassType[] = [
  'Warrior', 'Shadow Monarch', 'Mage', 'Dragon Knight', 'Archer', 
  'Berserker', 'Priest', 'Necromancer', 'Gunner', 'Monk',
  'Assassin', 'Paladin',
  'Flame Knight', 'Shadow Assassin', 'Ice Mage', 'Thunder Warrior', 'Holy Paladin',
  'Dark Necromancer', 'Dragon Slayer', 'Wind Ranger', 'Blood Samurai', 'Arcane Wizard',
  'Cyber Ninja', 'Titan Guardian', 'Poison Hunter', 'Phoenix Queen', 'Storm Monk',
  'Beast Tamer', 'Demon Berserker', 'Celestial Angel', 'Void Reaper', 'Mecha Soldier'
];

export const RARITIES: Rarity[] = [
  'Common', 'Uncommon', 'Rare', 'Unique', 'Epic', 
  'Legendary', 'Ancient', 'Divine', 'Relic', 'Mythical'
];

export const ELEMENTS: Element[] = [
  "Fire","Ice","Water","Wind","Earth",
  "Lightning","Light","Dark","Poison","Blood",
  "Spirit","Metal","Nature","Shadow","Holy",
  "Lava","Crystal","Storm","Void","Arcane",
  "Gravity","Time","Space","Plasma","Smoke",
  "Sand","Explosion","Frost","Venom","Steel",
  "Dragon","Ghost","Moon","Sun","Star",
  "Chaos","Magic","Beast","Thunder","Inferno",
  "Toxic","Curse","Dream","Nightmare","Soul",
  "Divine","Celestial","Cyber","Nuclear","Galaxy"
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

export const RARITY_MULTIPLIERS: Record<string, number> = {
  Common: 1,
  Uncommon: 2,
  Rare: 3,
  Unique: 5,
  Epic: 10,
  Legendary: 25,
  Ancient: 50,
  Divine: 100,
  Relic: 250,
  Mythical: 500,
};

export const ELEMENTAL_ADVANTAGES: Partial<Record<Element, Element[]>> = {
  Fire: ['Ice', 'Wind', 'Poison', 'Nature', 'Beast', 'Metal' as any],
  Ice: ['Earth', 'Spirit', 'Lightning', 'Dragon', 'Lava'],
  Lightning: ['Water', 'Metal' as any, 'Spirit', 'Cyber'],
  Earth: ['Lightning', 'Poison', 'Sand', 'Rock' as any],
  Wind: ['Earth', 'Lightning', 'Smoke'],
  Water: ['Fire', 'Earth', 'Lava', 'Plasma'],
  Light: ['Dark', 'Void', 'Chaos', 'Ghost', 'Curse', 'Nightmare'],
  Dark: ['Light', 'Spirit', 'Holy', 'Soul', 'Dream'],
  Poison: ['Water', 'Nature', 'Beast'],
  Spirit: ['Void', 'Soul', 'Dream'],
  Void: ['Spirit', 'Space', 'Time'],
  Holy: ['Dark', 'Chaos', 'Demon' as any, 'Undead' as any],
  Chaos: ['Holy', 'Order' as any, 'Divine'],
  Gravity: ['Wind', 'Space', 'Galaxy'],
  Blood: ['Fire', 'Nature', 'Beast', 'Life' as any],
  Dragon: ['Dragon', 'Steel', 'Inferno'],
  Divine: ['Chaos', 'Void', 'Cursed' as any],
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
  'Flame Knight': { STR: 5, INT: 3, ATK: 7, HP: 100 },
  'Shadow Assassin': { AGI: 8, LUK: 4, ATK: 10, DEX: 3 },
  'Ice Mage': { INT: 7, MP: 100, ATK: 8, DEX: 2 },
  'Thunder Warrior': { STR: 6, DEX: 4, ATK: 9, HP: 120 },
  'Holy Paladin': { VIT: 8, DEF: 8, HP: 150, INT: 3 },
  'Dark Necromancer': { INT: 8, LUK: 5, MP: 120, ATK: 7 },
  'Dragon Slayer': { STR: 9, VIT: 5, ATK: 12, HP: 200 },
  'Wind Ranger': { DEX: 7, AGI: 6, ATK: 6, HP: 80 },
  'Blood Samurai': { STR: 7, AGI: 5, ATK: 11, HP: 120 },
  'Arcane Wizard': { INT: 10, MP: 150, ATK: 12, VIT: 1 },
  'Cyber Ninja': { AGI: 10, DEX: 5, ATK: 9, HP: 90 },
  'Titan Guardian': { VIT: 10, DEF: 10, HP: 250, STR: 5 },
  'Poison Hunter': { DEX: 6, LUK: 6, ATK: 7, HP: 100 },
  'Phoenix Queen': { INT: 8, VIT: 4, ATK: 9, HP: 130 },
  'Storm Monk': { AGI: 6, STR: 6, VIT: 6, MP: 80 },
  'Beast Tamer': { LUK: 7, STR: 4, VIT: 4, HP: 110 },
  'Demon Berserker': { STR: 10, VIT: 2, ATK: 15, HP: 180 },
  'Celestial Angel': { INT: 7, VIT: 7, HP: 140, DEF: 5 },
  'Void Reaper': { AGI: 7, INT: 7, ATK: 11, MP: 90 },
  'Mecha Soldier': { STR: 6, DEX: 8, DEF: 6, HP: 130 },
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
    { name: 'ARISE', description: 'Summon the shadow army', type: 'active', cooldown: 10, stats_multiplier: { INT: 5, AGI: 2 } },
    { name: 'Monarch Dominance', description: 'Massive ATK boost', type: 'passive', stats_multiplier: { ATK: 200 } }
  ],
  Mage: [
    { name: 'Meteor Fall', description: 'Massive magic damage', type: 'active', cooldown: 8, stats_multiplier: { INT: 6 } },
    { name: 'Mana Flow', description: 'Increases Max MP', type: 'passive', stats_multiplier: { MP: 150 } }
  ],
  Berserker: [
    { name: 'Blood Rage', description: 'Exchange HP for ATK', type: 'active', cooldown: 7, stats_multiplier: { STR: 8 } },
    { name: 'Endurance', description: 'Increases VIT', type: 'passive', stats_multiplier: { VIT: 10 } }
  ],
  Paladin: [
    { name: 'Holy Shield', description: 'Absorb damage', type: 'active', cooldown: 12, stats_multiplier: { VIT: 10 } },
    { name: 'Divine Ward', description: 'Increases DEF', type: 'passive', stats_multiplier: { DEF: 50 } }
  ],
  Necromancer: [
    { name: 'Summon Undead', description: 'Defeat enemies with minions', type: 'active', cooldown: 15, stats_multiplier: { INT: 7 } },
    { name: 'Death Grip', description: 'Siphon life from targets', type: 'active', cooldown: 6, stats_multiplier: { INT: 3 } }
  ],
  'Flame Knight': [
    { name: 'Inferno Suture', description: 'Fire damage over time', type: 'active', cooldown: 5, stats_multiplier: { STR: 4, INT: 2 } },
    { name: 'Firebrand', description: 'Increases Fire Element damage', type: 'passive', stats_multiplier: { ATK: 50 } }
  ],
  'Shadow Assassin': [
    { name: 'Eclipse Slash', description: 'Attacks from the shadows', type: 'active', cooldown: 4, stats_multiplier: { AGI: 10 } },
    { name: 'Invisibility', description: 'Greatly increases Evasion', type: 'passive', stats_multiplier: { AGI: 15 } }
  ],
  'Dragon Slayer': [
    { name: 'Dragon Breath', description: 'AoE Fire damage', type: 'active', cooldown: 10, stats_multiplier: { STR: 12 } },
    { name: 'Scales of the Dragon', description: 'Increases HP', type: 'passive', stats_multiplier: { HP: 1000 } }
  ],
  'Thunder Warrior': [
    { name: 'Lightning Strike', description: 'Fast electric damage', type: 'active', cooldown: 3, stats_multiplier: { STR: 5, DEX: 5 } },
    { name: 'Overcharge', description: 'Increases AGI', type: 'passive', stats_multiplier: { AGI: 20 } }
  ],
  'Celestial Angel': [
    { name: 'Heavenly Light', description: 'Heal and damage', type: 'active', cooldown: 10, stats_multiplier: { INT: 8, VIT: 4 } },
    { name: 'Purity', description: 'Increases all stats', type: 'passive', stats_multiplier: { STR: 5, VIT: 5, INT: 5, AGI: 5 } }
  ],
  'Void Reaper': [
    { name: 'Void Scythe', description: 'Ignore target defense', type: 'active', cooldown: 6, stats_multiplier: { AGI: 6, INT: 6 } },
    { name: 'Entropy', description: 'Decreases enemy stats', type: 'passive', stats_multiplier: { ATK: 100 } }
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
