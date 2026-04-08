// =============================================================================
// skills.ts — Compétences de combat par classe
// =============================================================================

export type ResourceType = 'stamina' | 'mana';

export interface Skill {
  id: string;
  name: string;
  cost: number;
  description: string;
  icon: string;
  className: string;
  effect: SkillEffect;
}

export interface SkillEffect {
  damageMultiplier?: number;     // multiplicateur sur ATK (0 = pas de dégâts)
  healPercent?: number;          // % des dégâts infligés rendus en PV
  skipEnemyChance?: number;      // % de chance de skip le tour ennemi
  atkBuff?: number;              // bonus ATK pour le combat en cours
  defBuff?: number;              // bonus DEF pour le combat en cours
  poisonDmg?: number;            // dégâts poison par tour
  poisonDuration?: number;       // nombre de tours de poison
  shieldPercent?: number;        // % de réduction du prochain coup
  summonDmg?: number;            // dégâts du minion par tour
  summonDuration?: number;       // durée du minion en tours
  enemyAtkDebuff?: number;       // réduction ATK ennemi
  guaranteedDodge?: boolean;     // esquive garantie au prochain tour
  chaosMin?: number;             // dégâts chaos min (multiplicateur)
  chaosMax?: number;             // dégâts chaos max (multiplicateur)
}

// ---------------------------------------------------------------------------
// BARBARE — Stamina (max 5, regen 1/tour)
// ---------------------------------------------------------------------------

export const BARBARE_SKILLS: Skill[] = [
  {
    id: 'barb_headbutt', name: 'Coup de boule', cost: 1, className: 'barbare',
    description: 'Un coup de tête brutal.', icon: '💥',
    effect: { damageMultiplier: 0.8 },
  },
  {
    id: 'barb_axe', name: 'Coup de hache', cost: 2, className: 'barbare',
    description: 'Frappe puissante à la hache.', icon: '🪓',
    effect: { damageMultiplier: 1.4 },
  },
  {
    id: 'barb_grapple', name: 'Étreinte', cost: 3, className: 'barbare',
    description: '30% de chance de bloquer l\'ennemi un tour.', icon: '🤼',
    effect: { damageMultiplier: 0, skipEnemyChance: 30 },
  },
  {
    id: 'barb_roar', name: 'Hurlement', cost: 2, className: 'barbare',
    description: '+5 ATK pour le reste du combat.', icon: '🗣️',
    effect: { damageMultiplier: 0, atkBuff: 5 },
  },
];

// ---------------------------------------------------------------------------
// VOLEUR — Stamina (max 6, regen 1/tour)
// ---------------------------------------------------------------------------

export const VOLEUR_SKILLS: Skill[] = [
  {
    id: 'thief_quickstab', name: 'Coup rapide', cost: 1, className: 'voleur',
    description: 'Attaque rapide mais faible.', icon: '🗡️',
    effect: { damageMultiplier: 0.7 },
  },
  {
    id: 'thief_poison', name: 'Lame empoisonnée', cost: 2, className: 'voleur',
    description: 'Attaque + poison (4 dmg/tour, 3 tours).', icon: '🧪',
    effect: { damageMultiplier: 0.9, poisonDmg: 4, poisonDuration: 3 },
  },
  {
    id: 'thief_ambush', name: 'Embuscade', cost: 3, className: 'voleur',
    description: 'Coup dévastateur depuis les ombres.', icon: '🌑',
    effect: { damageMultiplier: 2.2 },
  },
  {
    id: 'thief_dodge', name: 'Évasion', cost: 2, className: 'voleur',
    description: 'Esquive garantie au prochain tour ennemi.', icon: '💨',
    effect: { damageMultiplier: 0, guaranteedDodge: true },
  },
];

// ---------------------------------------------------------------------------
// MAGE DU CHAOS — Mana (max 8, regen 2/tour)
// ---------------------------------------------------------------------------

export const MAGE_SKILLS: Skill[] = [
  {
    id: 'mage_firebolt', name: 'Trait de feu', cost: 2, className: 'mage_chaos',
    description: 'Projectile enflammé.', icon: '🔥',
    effect: { damageMultiplier: 1.2 },
  },
  {
    id: 'mage_lightning', name: 'Éclair', cost: 3, className: 'mage_chaos',
    description: 'Foudre dévastatrice.', icon: '⚡',
    effect: { damageMultiplier: 1.6 },
  },
  {
    id: 'mage_shield', name: 'Bouclier arcane', cost: 2, className: 'mage_chaos',
    description: 'Réduit le prochain coup de 50%.', icon: '🛡️',
    effect: { damageMultiplier: 0, shieldPercent: 50 },
  },
  {
    id: 'mage_chaos', name: 'Explosion chaotique', cost: 5, className: 'mage_chaos',
    description: 'Dégâts aléatoires : de faibles à dévastateurs.', icon: '🌀',
    effect: { chaosMin: 0.5, chaosMax: 3.0 },
  },
];

// ---------------------------------------------------------------------------
// NÉCROMANCIEN — Mana (max 8, regen 2/tour)
// ---------------------------------------------------------------------------

export const NECRO_SKILLS: Skill[] = [
  {
    id: 'necro_drain', name: 'Drain de vie', cost: 2, className: 'necromancien',
    description: 'Vole la vie de l\'ennemi (75% → PV).', icon: '🩸',
    effect: { damageMultiplier: 1.2, healPercent: 75 },
  },
  {
    id: 'necro_curse', name: 'Malédiction', cost: 3, className: 'necromancien',
    description: 'Réduit l\'ATK ennemi de 4.', icon: '☠️',
    effect: { damageMultiplier: 0, enemyAtkDebuff: 4 },
  },
  {
    id: 'necro_summon', name: 'Invocation spectrale', cost: 4, className: 'necromancien',
    description: 'Invoque un spectre (8 dmg/tour, 4 tours).', icon: '👻',
    effect: { damageMultiplier: 0, summonDmg: 8, summonDuration: 4 },
  },
  {
    id: 'necro_deathtouch', name: 'Toucher mortel', cost: 5, className: 'necromancien',
    description: 'Concentre toute l\'énergie nécrotique.', icon: '💀',
    effect: { damageMultiplier: 2.5 },
  },
];

// ---------------------------------------------------------------------------
// PARCHEMINS APPRENABLES (drops de combat)
// ---------------------------------------------------------------------------

export const LEARNABLE_SCROLLS: Skill[] = [
  // Barbare
  { id: 'scroll_charge', name: 'Charge furieuse', cost: 3, className: 'barbare',
    description: 'Fonce sur l\'ennemi. Dégâts + 25% skip.', icon: '🐂',
    effect: { damageMultiplier: 1.3, skipEnemyChance: 25 } },
  { id: 'scroll_warshout', name: 'Cri de guerre', cost: 2, className: 'barbare',
    description: '+3 ATK et +3 DEF pour le combat.', icon: '📯',
    effect: { damageMultiplier: 0, atkBuff: 3, defBuff: 3 } },

  // Voleur
  { id: 'scroll_backstab', name: 'Coup dans le dos', cost: 3, className: 'voleur',
    description: 'x2.5 dégâts. Létal.', icon: '🔪',
    effect: { damageMultiplier: 2.5 } },
  { id: 'scroll_smokebomb', name: 'Bombe fumigène', cost: 2, className: 'voleur',
    description: 'Esquive + empoisonne (3 tours).', icon: '💨',
    effect: { damageMultiplier: 0, guaranteedDodge: true, poisonDmg: 3, poisonDuration: 3 } },

  // Mage
  { id: 'scroll_blizzard', name: 'Blizzard', cost: 4, className: 'mage_chaos',
    description: 'Dégâts de glace + réduit ATK ennemi.', icon: '❄️',
    effect: { damageMultiplier: 1.4, enemyAtkDebuff: 3 } },
  { id: 'scroll_meteor', name: 'Météore', cost: 6, className: 'mage_chaos',
    description: 'Destruction massive.', icon: '☄️',
    effect: { damageMultiplier: 2.5 } },

  // Nécro
  { id: 'scroll_plague', name: 'Peste', cost: 3, className: 'necromancien',
    description: 'Poison violent (6 dmg/tour, 4 tours).', icon: '🦠',
    effect: { damageMultiplier: 0, poisonDmg: 6, poisonDuration: 4 } },
  { id: 'scroll_soulrip', name: 'Arracheur d\'âme', cost: 5, className: 'necromancien',
    description: 'Gros dégâts + vol de vie 60%.', icon: '👁️',
    effect: { damageMultiplier: 2.2, healPercent: 60 } },
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

export function getClassSkills(className: string): Skill[] {
  switch (className) {
    case 'barbare':      return [...BARBARE_SKILLS];
    case 'voleur':       return [...VOLEUR_SKILLS];
    case 'mage_chaos':   return [...MAGE_SKILLS];
    case 'necromancien': return [...NECRO_SKILLS];
    default:             return [...BARBARE_SKILLS];
  }
}

export function getClassResource(className: string): { type: ResourceType; max: number; regen: number } {
  switch (className) {
    case 'barbare':      return { type: 'stamina', max: 5, regen: 1 };
    case 'voleur':       return { type: 'stamina', max: 6, regen: 1 };
    case 'mage_chaos':   return { type: 'mana',    max: 8, regen: 2 };
    case 'necromancien': return { type: 'mana',    max: 8, regen: 2 };
    default:             return { type: 'stamina', max: 5, regen: 1 };
  }
}

export function getClassBaseStats(className: string) {
  switch (className) {
    case 'barbare':      return { hp: 160, atk: 22, def: 8 };
    case 'voleur':       return { hp: 75,  atk: 12, def: 3 };
    case 'mage_chaos':   return { hp: 90,  atk: 14, def: 4 };
    case 'necromancien': return { hp: 80,  atk: 10, def: 5 };
    default:             return { hp: 100, atk: 15, def: 5 };
  }
}

export function getScrollsForClass(className: string): Skill[] {
  return LEARNABLE_SCROLLS.filter(s => s.className === className);
}

export function getRandomScrollDrop(className: string): Skill | null {
  const pool = getScrollsForClass(className);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
