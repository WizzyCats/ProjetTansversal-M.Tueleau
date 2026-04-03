import { Enemy, EnemyTier } from './types';
import { generateLoot } from './lootTables';

interface EnemyTemplate {
  name: string;
  tier: EnemyTier;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  baseXp: number;
  icon: string;
}

const ENEMY_TEMPLATES: EnemyTemplate[] = [
  // Minions
  { name: 'Rat géant', tier: 'minion', baseHp: 15, baseAttack: 3, baseDefense: 1, baseXp: 5, icon: '🐀' },
  { name: 'Squelette', tier: 'minion', baseHp: 20, baseAttack: 5, baseDefense: 2, baseXp: 8, icon: '💀' },
  { name: 'Chauve-souris', tier: 'minion', baseHp: 10, baseAttack: 4, baseDefense: 0, baseXp: 4, icon: '🦇' },
  { name: 'Slime', tier: 'minion', baseHp: 25, baseAttack: 2, baseDefense: 3, baseXp: 6, icon: '🟢' },
  { name: 'Gobelin', tier: 'minion', baseHp: 18, baseAttack: 6, baseDefense: 2, baseXp: 10, icon: '👺' },

  // Elites
  { name: 'Chevalier noir', tier: 'elite', baseHp: 60, baseAttack: 12, baseDefense: 8, baseXp: 30, icon: '🗡️' },
  { name: 'Ogre', tier: 'elite', baseHp: 80, baseAttack: 15, baseDefense: 5, baseXp: 35, icon: '👹' },
  { name: 'Nécromancien', tier: 'elite', baseHp: 45, baseAttack: 18, baseDefense: 4, baseXp: 40, icon: '🧙' },
  { name: 'Minotaure', tier: 'elite', baseHp: 70, baseAttack: 14, baseDefense: 7, baseXp: 35, icon: '🐂' },

  // Boss
  { name: 'Dragon ancien', tier: 'boss', baseHp: 200, baseAttack: 25, baseDefense: 15, baseXp: 150, icon: '🐉' },
  { name: 'Liche suprême', tier: 'boss', baseHp: 150, baseAttack: 30, baseDefense: 10, baseXp: 180, icon: '☠️' },
  { name: 'Démon des abysses', tier: 'boss', baseHp: 250, baseAttack: 22, baseDefense: 18, baseXp: 200, icon: '😈' },
];

let enemyIdCounter = 0;

export function createEnemy(tier: EnemyTier, difficulty: number, rng: () => number): Enemy {
  const pool = ENEMY_TEMPLATES.filter(e => e.tier === tier);
  const template = pool[Math.floor(rng() * pool.length)];

  const scale = 1 + (difficulty - 1) * 0.15;
  const hp = Math.floor(template.baseHp * scale);

  return {
    id: `enemy_${++enemyIdCounter}_${Date.now()}`,
    name: template.name,
    tier: template.tier,
    hp,
    maxHp: hp,
    attack: Math.floor(template.baseAttack * scale),
    defense: Math.floor(template.baseDefense * scale),
    xpReward: Math.floor(template.baseXp * scale),
    lootTable: generateLoot(tier === 'boss' ? 3 : tier === 'elite' ? 2 : 1, difficulty, rng),
    icon: template.icon,
  };
}

export function generateEnemiesForRoom(
  difficulty: number,
  isBoss: boolean,
  rng: () => number
): Enemy[] {
  if (isBoss) {
    return [createEnemy('boss', difficulty, rng)];
  }

  const enemies: Enemy[] = [];
  const count = 1 + Math.floor(rng() * Math.min(difficulty, 4));

  for (let i = 0; i < count; i++) {
    const tier: EnemyTier = rng() < 0.15 + difficulty * 0.02 ? 'elite' : 'minion';
    enemies.push(createEnemy(tier, difficulty, rng));
  }

  return enemies;
}
