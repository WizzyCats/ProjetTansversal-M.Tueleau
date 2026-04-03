import { LootItem, LootRarity } from './types';

const WEAPONS: Omit<LootItem, 'id'>[] = [
  { name: 'Dague rouillée', rarity: 'common', type: 'weapon', value: 5, description: 'Une dague qui a connu des jours meilleurs.', icon: '🗡️' },
  { name: 'Épée courte', rarity: 'common', type: 'weapon', value: 12, description: 'Simple mais efficace.', icon: '⚔️' },
  { name: 'Hache de guerre', rarity: 'uncommon', type: 'weapon', value: 25, description: 'Lourde et dévastatrice.', icon: '🪓' },
  { name: 'Arc elfique', rarity: 'rare', type: 'weapon', value: 50, description: 'Forgé dans les bois anciens.', icon: '🏹' },
  { name: 'Lame du Crépuscule', rarity: 'epic', type: 'weapon', value: 120, description: 'Elle brille d\'une lueur sombre.', icon: '🌙' },
  { name: 'Excalibur', rarity: 'legendary', type: 'weapon', value: 300, description: 'L\'épée des rois.', icon: '👑' },
];

const ARMOR: Omit<LootItem, 'id'>[] = [
  { name: 'Bouclier en bois', rarity: 'common', type: 'armor', value: 8, description: 'Mieux que rien.', icon: '🛡️' },
  { name: 'Cotte de mailles', rarity: 'uncommon', type: 'armor', value: 30, description: 'Protection décente.', icon: '🦺' },
  { name: 'Armure de plates', rarity: 'rare', type: 'armor', value: 65, description: 'Forgée par un maître.', icon: '⚙️' },
  { name: 'Cape d\'ombre', rarity: 'epic', type: 'armor', value: 100, description: 'Rend partiellement invisible.', icon: '🧥' },
  { name: 'Égide divine', rarity: 'legendary', type: 'armor', value: 250, description: 'Bénie par les dieux.', icon: '✨' },
];

const POTIONS: Omit<LootItem, 'id'>[] = [
  { name: 'Potion de soin', rarity: 'common', type: 'potion', value: 10, description: 'Restaure 20 PV.', icon: '🧪' },
  { name: 'Potion de force', rarity: 'uncommon', type: 'potion', value: 20, description: 'ATQ +5 pendant 3 tours.', icon: '💪' },
  { name: 'Élixir de vie', rarity: 'rare', type: 'potion', value: 50, description: 'Restaure tous les PV.', icon: '💖' },
  { name: 'Larme de phénix', rarity: 'epic', type: 'potion', value: 100, description: 'Ressuscite une fois.', icon: '🔥' },
];

const SCROLLS: Omit<LootItem, 'id'>[] = [
  { name: 'Parchemin de feu', rarity: 'uncommon', type: 'scroll', value: 15, description: 'Lance une boule de feu.', icon: '📜' },
  { name: 'Parchemin de gel', rarity: 'uncommon', type: 'scroll', value: 15, description: 'Gèle un ennemi.', icon: '❄️' },
  { name: 'Parchemin de téléportation', rarity: 'rare', type: 'scroll', value: 40, description: 'Téléporte dans une salle aléatoire.', icon: '🌀' },
];

const ALL_ITEMS = [...WEAPONS, ...ARMOR, ...POTIONS, ...SCROLLS];

let itemIdCounter = 0;

const RARITY_WEIGHTS: Record<LootRarity, number> = {
  common: 50,
  uncommon: 30,
  rare: 13,
  epic: 5,
  legendary: 2,
};

function weightedRarityPick(difficulty: number, rng: () => number): LootRarity {
  const weights = { ...RARITY_WEIGHTS };
  // Increase rare+ chances with difficulty
  weights.uncommon += difficulty * 2;
  weights.rare += difficulty * 1.5;
  weights.epic += difficulty;
  weights.legendary += difficulty * 0.5;

  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = rng() * total;

  for (const [rarity, weight] of Object.entries(weights)) {
    roll -= weight;
    if (roll <= 0) return rarity as LootRarity;
  }
  return 'common';
}

export function generateLoot(count: number, difficulty: number, rng: () => number): LootItem[] {
  const items: LootItem[] = [];

  for (let i = 0; i < count; i++) {
    const rarity = weightedRarityPick(difficulty, rng);
    const pool = ALL_ITEMS.filter(item => item.rarity === rarity);
    if (pool.length === 0) continue;

    const template = pool[Math.floor(rng() * pool.length)];
    items.push({
      ...template,
      id: `loot_${++itemIdCounter}_${Date.now()}`,
    });
  }

  // Chance to add gold
  if (rng() < 0.7) {
    items.push({
      id: `gold_${++itemIdCounter}_${Date.now()}`,
      name: 'Pièces d\'or',
      rarity: 'common',
      type: 'gold',
      value: Math.floor(5 + rng() * difficulty * 10),
      description: 'Ça brille.',
      icon: '💰',
    });
  }

  return items;
}
