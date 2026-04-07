import { LootItem, LootRarity } from './types';

const WEAPONS: Omit<LootItem, 'id'>[] = [
  { name: 'Dague rouillée', rarity: 'common', type: 'weapon', value: 5, description: '+2 ATK', icon: '🗡️',
    equipSlot: 'weapon', equipStats: { atk: 2 } },
  { name: 'Épée courte', rarity: 'common', type: 'weapon', value: 12, description: '+4 ATK', icon: '⚔️',
    equipSlot: 'weapon', equipStats: { atk: 4 } },
  { name: 'Hache de guerre', rarity: 'uncommon', type: 'weapon', value: 25, description: '+7 ATK', icon: '🪓',
    equipSlot: 'weapon', equipStats: { atk: 7 } },
  { name: 'Arc elfique', rarity: 'rare', type: 'weapon', value: 50, description: '+10 ATK', icon: '🏹',
    equipSlot: 'weapon', equipStats: { atk: 10 } },
  { name: 'Lame du Crépuscule', rarity: 'epic', type: 'weapon', value: 120, description: '+15 ATK', icon: '🌙',
    equipSlot: 'weapon', equipStats: { atk: 15 } },
  { name: 'Excalibur', rarity: 'legendary', type: 'weapon', value: 300, description: '+22 ATK, +10 PV', icon: '👑',
    equipSlot: 'weapon', equipStats: { atk: 22, hp: 10 } },
];

const HELMETS: Omit<LootItem, 'id'>[] = [
  { name: 'Capuche de cuir', rarity: 'common', type: 'armor', value: 6, description: '+1 DEF', icon: '🧢',
    equipSlot: 'helmet', equipStats: { def: 1 } },
  { name: 'Casque de fer', rarity: 'uncommon', type: 'armor', value: 18, description: '+3 DEF', icon: '⛑️',
    equipSlot: 'helmet', equipStats: { def: 3 } },
  { name: 'Heaume de chevalier', rarity: 'rare', type: 'armor', value: 45, description: '+5 DEF, +8 PV', icon: '🪖',
    equipSlot: 'helmet', equipStats: { def: 5, hp: 8 } },
  { name: 'Couronne maudite', rarity: 'epic', type: 'armor', value: 90, description: '+4 DEF, +3 Mana/Stamina', icon: '👑',
    equipSlot: 'helmet', equipStats: { def: 4, resource: 3 } },
];

const CHEST_ARMOR: Omit<LootItem, 'id'>[] = [
  { name: 'Plastron de cuir', rarity: 'common', type: 'armor', value: 8, description: '+2 DEF', icon: '🦺',
    equipSlot: 'chest', equipStats: { def: 2 } },
  { name: 'Cotte de mailles', rarity: 'uncommon', type: 'armor', value: 30, description: '+4 DEF, +5 PV', icon: '🛡️',
    equipSlot: 'chest', equipStats: { def: 4, hp: 5 } },
  { name: 'Armure de plates', rarity: 'rare', type: 'armor', value: 65, description: '+7 DEF, +10 PV', icon: '⚙️',
    equipSlot: 'chest', equipStats: { def: 7, hp: 10 } },
  { name: 'Cape d\'ombre', rarity: 'epic', type: 'armor', value: 100, description: '+5 DEF, +5 ATK', icon: '🧥',
    equipSlot: 'chest', equipStats: { def: 5, atk: 5 } },
  { name: 'Égide divine', rarity: 'legendary', type: 'armor', value: 250, description: '+12 DEF, +20 PV', icon: '✨',
    equipSlot: 'chest', equipStats: { def: 12, hp: 20 } },
];

const ACCESSORIES: Omit<LootItem, 'id'>[] = [
  { name: 'Anneau de cuivre', rarity: 'common', type: 'armor', value: 5, description: '+1 ATK, +1 DEF', icon: '💍',
    equipSlot: 'accessory', equipStats: { atk: 1, def: 1 } },
  { name: 'Amulette de vitalité', rarity: 'uncommon', type: 'armor', value: 20, description: '+12 PV', icon: '📿',
    equipSlot: 'accessory', equipStats: { hp: 12 } },
  { name: 'Talisman arcanique', rarity: 'rare', type: 'armor', value: 55, description: '+2 Mana/Stamina, +3 ATK', icon: '🔮',
    equipSlot: 'accessory', equipStats: { resource: 2, atk: 3 } },
  { name: 'Oeil du Néant', rarity: 'epic', type: 'armor', value: 110, description: '+8 ATK, +3 DEF', icon: '👁️',
    equipSlot: 'accessory', equipStats: { atk: 8, def: 3 } },
];

const POTIONS: Omit<LootItem, 'id'>[] = [
  { name: 'Potion de soin', rarity: 'common', type: 'potion', value: 10, description: 'Restaure 20 PV.', icon: '🧪' },
  { name: 'Potion de force', rarity: 'uncommon', type: 'potion', value: 20, description: 'ATQ +5 pendant 3 tours.', icon: '💪' },
  { name: 'Élixir de vie', rarity: 'rare', type: 'potion', value: 50, description: 'Restaure tous les PV.', icon: '💖' },
  { name: 'Larme de phénix', rarity: 'epic', type: 'potion', value: 100, description: 'Ressuscite une fois.', icon: '🔥' },
];

const SCROLLS: Omit<LootItem, 'id'>[] = [
  { name: 'Parchemin de feu', rarity: 'uncommon', type: 'scroll', value: 15, description: 'Apprend une capacité de feu.', icon: '📜' },
  { name: 'Parchemin de gel', rarity: 'uncommon', type: 'scroll', value: 15, description: 'Apprend une capacité de glace.', icon: '❄️' },
  { name: 'Parchemin ancien', rarity: 'rare', type: 'scroll', value: 40, description: 'Apprend une capacité rare.', icon: '🌀' },
];

const ALL_ITEMS = [...WEAPONS, ...HELMETS, ...CHEST_ARMOR, ...ACCESSORIES, ...POTIONS, ...SCROLLS];

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
