import { Element, MonsterRank, Monster } from '../types';

export interface MonsterData {
  id: string;
  name: string;
  rank: MonsterRank;
  hp: number;
  atk: number;
  def: number;
  element: Element;
  visualPrompt: string;
  lootDrop: string;
  biome: string;
}

const BIOMES = [
  { name: 'Dark Forest', elements: ['Earth', 'Poison', 'Wind', 'Spirit'] as Element[], boss: 'Solas the Corrupted' },
  { name: 'Volcanic Ashlands', elements: ['Fire', 'Chaos', 'Blood'] as Element[], boss: 'Phoenix Eternal' },
  { name: 'Icebound Tundra', elements: ['Ice', 'Water', 'Light'] as Element[], boss: 'Valkyrie Queen' },
  { name: 'Abyssal Depths', elements: ['Void', 'Dark', 'Gravity'] as Element[], boss: 'The Kraken' },
  { name: 'Undead Swarm', elements: ['Dark', 'Spirit', 'Blood'] as Element[], boss: 'Malacor the Lich' }
];

const PREFIXES = [
  'Spectral', 'Venomous', 'Cursed', 'Abyssal', 'Fiery', 'Glacial', 'Raging', 'Void', 
  'Eternal', 'Shadow', 'Radiant', 'Starlight', 'Nightmare', 'Draconic', 'Ancient'
];

const TYPES = [
  'Specter', 'Wraith', 'Golem', 'Construct', 'Serpent', 'Beast', 'Soldier', 'Assassin',
  'Guardian', 'Overlord', 'Demon', 'Chimera', 'Dragon', 'Stalker', 'Claw'
];

export function getMonster(seed: number): MonsterData {
  // Deterministic seed management for 1000 monsters
  const targetId = (Math.abs(seed) % 1000) || 1000;
  
  const biomeIndex = Math.floor((targetId - 1) / 200) % BIOMES.length;
  const biome = BIOMES[biomeIndex];
  
  const pIdx = (targetId * 7) % PREFIXES.length;
  const tIdx = (targetId * 13) % TYPES.length;
  const eIdx = targetId % biome.elements.length;
  
  const isLegendary = targetId % 100 === 0;
  const name = isLegendary ? biome.boss : `${PREFIXES[pIdx]} ${TYPES[tIdx]}`;
  const rank: MonsterRank = isLegendary ? 'World Boss' : (targetId % 20 === 0 ? 'Floor Boss' : (targetId % 5 === 0 ? 'Veteran Guard' : 'Common Mob'));
  
  const element = biome.elements[eIdx];
  const hp = (targetId * 10) + 100;
  const atk = Math.floor(targetId / 2) + 10;
  const def = Math.floor(targetId / 4) + 5;

  return {
    id: `MOB-${String(targetId).padStart(4, '0')}`,
    name: name,
    rank: rank,
    hp,
    atk,
    def,
    element,
    biome: biome.name,
    visualPrompt: `2D High-Resolution Game Sprite - ${biome.name} ${name} with ${element} essence, dark fantasy style`,
    lootDrop: `Essence of ${biome.name}`
  };
}

export function generateFloorMobs(level: number, count: number): Monster[] {
  // Use gate or level to determine biome seed
  return Array.from({ length: count }).map((_, i) => {
    const data = getMonster(level + i);
    const x = 20 + Math.random() * 60;
    const y = 20 + Math.random() * 60;
    
    return {
      id: data.id,
      name: data.name,
      rank: data.rank,
      biome: data.biome,
      level: level,
      hp: data.hp,
      maxHp: data.hp,
      atk: data.atk,
      def: data.def,
      element: data.element,
      visualPrompt: data.visualPrompt,
      lootDrop: data.lootDrop,
      x,
      y,
      spawnX: x,
      spawnY: y,
      facing: 'left' as const,
      isBoss: data.rank.includes('Boss')
    };
  });
}
