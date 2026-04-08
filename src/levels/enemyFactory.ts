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
  { name: 'Chevalier noir', tier: 'elite', baseHp: 40, baseAttack: 8, baseDefense: 5, baseXp: 25, icon: '🗡️' },
  { name: 'Ogre', tier: 'elite', baseHp: 55, baseAttack: 10, baseDefense: 3, baseXp: 28, icon: '👹' },
  { name: 'Nécromancien', tier: 'elite', baseHp: 35, baseAttack: 12, baseDefense: 3, baseXp: 30, icon: '🧙' },
  { name: 'Minotaure', tier: 'elite', baseHp: 50, baseAttack: 9, baseDefense: 4, baseXp: 28, icon: '🐂' },

  // Boss
  { name: 'Dragon ancien', tier: 'boss', baseHp: 120, baseAttack: 16, baseDefense: 8, baseXp: 80, icon: '🐉' },
  { name: 'Liche suprême', tier: 'boss', baseHp: 100, baseAttack: 18, baseDefense: 6, baseXp: 90, icon: '☠️' },
  { name: 'Démon des abysses', tier: 'boss', baseHp: 140, baseAttack: 14, baseDefense: 10, baseXp: 100, icon: '😈' },
];

let enemyIdCounter = 0;

export function createEnemy(tier: EnemyTier, difficulty: number, rng: () => number): Enemy {
  const pool = ENEMY_TEMPLATES.filter(e => e.tier === tier);
  const template = pool[Math.floor(rng() * pool.length)];

  const scale = 1 + (difficulty - 1) * 0.1;
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
  // Max 1 ennemi si difficulté < 2, sinon scale doucement
  const maxCount = difficulty < 2 ? 1 : Math.min(Math.floor(difficulty / 2) + 1, 3);
  const count = 1 + Math.floor(rng() * maxCount);

  for (let i = 0; i < count; i++) {
    // Pas d'elite avant difficulté 3
    const eliteChance = difficulty < 3 ? 0 : 0.1 + (difficulty - 3) * 0.05;
    const tier: EnemyTier = rng() < eliteChance ? 'elite' : 'minion';
    enemies.push(createEnemy(tier, difficulty, rng));
  }

  return enemies;
}
