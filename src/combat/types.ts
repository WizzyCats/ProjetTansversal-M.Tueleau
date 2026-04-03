// =============================================================================
// combat/types.ts — Types du système de combat & classes
// Lon — Module Combat & Classes
// =============================================================================

// ---------------------------------------------------------------------------
// CLASSES & RARETÉS
// ---------------------------------------------------------------------------

export type ClassName = 'barbare' | 'mage_chaos' | 'voleur' | 'necromancien';

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic';

export type StatusEffectType =
  | 'poison'
  | 'stun'
  | 'burn'
  | 'temp_hp'
  | 'shield'
  | 'debuff_atk'
  | 'debuff_def'
  | 'debuff_spd'
  | 'invisible'
  | 'berserk'
  | 'pet_active';

export type DamageType = 'physical' | 'magic' | 'poison' | 'chaos' | 'true';

// ---------------------------------------------------------------------------
// STATS
// ---------------------------------------------------------------------------

export interface BaseStats {
  hpMax: number;
  hp: number;
  atk: number;
  def: number;
  dodge: number;
  critChance: number;
  critMultiplier: number;
  cooldown: number;
  parryChance: number;
}

// ---------------------------------------------------------------------------
// EFFETS DE STATUT
// ---------------------------------------------------------------------------

export interface StatusEffect {
  type: StatusEffectType;
  stacks: number;
  duration: number;
  value: number;
  sourceId?: string;
}

// ---------------------------------------------------------------------------
// MINIONS (Nécromancien)
// ---------------------------------------------------------------------------

export interface Minion {
  id: string;
  name: string;
  hp: number;
  hpMax: number;
  atk: number;
  cooldown: number;
  debuffStat: 'atk' | 'def' | 'spd';
  debuffValue: number;
}

// ---------------------------------------------------------------------------
// EFFETS DES CARTES
// ---------------------------------------------------------------------------

export interface CardEffect {
  hpMax?: number;
  atk?: number;
  def?: number;
  dodge?: number;
  critChance?: number;
  critMultiplier?: number;
  cooldown?: number;
  parryChance?: number;
  rageThreshold?: number;
  rageDamageBonus?: number;
  postCombatHealBonus?: number;
  poisonStackMax?: number;
  poisonDamageBonus?: number;
  counterAttackChance?: number;
  counterAttackMultiplier?: number;
  firstHitMultiplier?: number;
  executionThreshold?: number;
  executionBonus?: number;
  minionHpBonus?: number;
  minionCountMax?: number;
  necroHealMin?: number;
  deathBarReduction?: number;
  chaosTableBonus?: number;
  chaosDamageBonus?: number;
  chaosBackfireReduction?: number;
  rerollOnNothing?: boolean;
  chooseBetween2?: boolean;
  petPermanent?: boolean;
  immortalOnce?: boolean;
  lichPassive?: boolean;
  armyGhost?: boolean;
  drainLife?: number;
  guaranteedDodgeFirst?: boolean;
  shadowChance?: number;
  unlockDoubleSpell?: boolean;
  resonanceBonus?: number;
}

// ---------------------------------------------------------------------------
// CARTES
// ---------------------------------------------------------------------------

export interface Card {
  id: string;
  name: string;
  description: string;
  rarity: CardRarity;
  className: ClassName;
  effect: CardEffect;
}

// ---------------------------------------------------------------------------
// TABLE CHAOS
// ---------------------------------------------------------------------------

export type ChaosResult =
  | 'small_heal'
  | 'temp_hp'
  | 'damage_medium'
  | 'damage_high'
  | 'damage_huge_backfire'
  | 'aoe_weak'
  | 'debuff'
  | 'summon_pet'
  | 'nothing'
  | 'double_spell';

export interface ChaosEntry {
  result: ChaosResult;
  weight: number;
  label: string;
}

// ---------------------------------------------------------------------------
// JOUEUR (état riche pendant le combat)
// ---------------------------------------------------------------------------

export interface PlayerState {
  id: string;
  name: string;
  className: ClassName;
  level: number;
  xp: number;
  xpToNextLevel: number;
  stats: BaseStats;
  statusEffects: StatusEffect[];
  activeCards: Card[];
  // Nécromancien
  minions: Minion[];
  minionCountMax: number;
  deathBar: number;
  isDeathBarActive: boolean;
  // Voleur
  poisonStackMax: number;
  currentPoisonStacks: number;
  // Mage du Chaos
  chaosTable: ChaosEntry[];
  lastChaosResult: ChaosResult | null;
  petActive: boolean;
  petHp: number;
  // Barbare
  immortalUsedThisCombat: boolean;
}

// ---------------------------------------------------------------------------
// ENNEMI (format interne combat — adapté depuis levels/types.ts)
// ---------------------------------------------------------------------------

export interface CombatEnemy {
  id: string;
  name: string;
  hp: number;
  hpMax: number;
  atk: number;
  def: number;
  xp: number;
  lootLabel: string;
  icon: string;
  statusEffects: StatusEffect[];
  currentHp: number;
}

// ---------------------------------------------------------------------------
// LOGS & RÉSULTATS
// ---------------------------------------------------------------------------

export interface CombatLog {
  tick: number;
  actor: string;
  action: string;
  value?: number;
  detail?: string;
}

export interface CombatResult {
  victory: boolean;
  xpGained: number;
  logs: CombatLog[];
  leveledUp: boolean;
  newLevel?: number;
  finalPlayerState: PlayerState;
}

export interface LevelUpOffer {
  cards: [Card, Card, Card];
}
