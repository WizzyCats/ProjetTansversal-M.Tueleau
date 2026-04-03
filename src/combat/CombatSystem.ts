// =============================================================================
// combat/CombatSystem.ts — Façade publique du système de combat
// Lon — Module Combat & Classes
// Compatible Vite + ESM : pas de module.exports
// =============================================================================

import type { PlayerState, CombatEnemy, Card, ClassName, LevelUpOffer, CombatResult, CombatLog } from './types';
import { createPlayer, CLASS_LABELS, CLASS_DESCRIPTIONS } from './player';
import { applyCard, drawLevelUpCards, grantXp, generateXpTable, MAX_LEVEL } from './levelup';
import { simulateCombat } from './combat';
import { ALL_CARDS } from './cards';
import type { Enemy } from '../levels/types';

// ---------------------------------------------------------------------------
// ADAPTATION : Enemy (LevelGenerator) → CombatEnemy
// ---------------------------------------------------------------------------

export function adaptEnemy(e: Enemy): CombatEnemy {
  return {
    id:           e.id,
    name:         e.name,
    hp:           e.maxHp,
    hpMax:        e.maxHp,
    atk:          e.attack,
    def:          e.defense,
    xp:           e.xpReward,
    lootLabel:    e.lootTable?.[0]?.name ?? 'Rien',
    icon:         e.icon,
    statusEffects:[],
    currentHp:    e.hp,
  };
}

// ---------------------------------------------------------------------------
// EXPORT DES CONSTANTES UI
// ---------------------------------------------------------------------------

export const RARITY_COLORS: Record<string, string> = {
  common:   '#9e9e9e',
  uncommon: '#4caf50',
  rare:     '#2196f3',
  epic:     '#9c27b0',
};

export const RARITY_LABELS: Record<string, string> = {
  common:   'Commun',
  uncommon: 'Peu commun',
  rare:     'Rare',
  epic:     'Épique',
};

export const CLASS_NAMES: ClassName[] = ['barbare', 'mage_chaos', 'voleur', 'necromancien'];

// ---------------------------------------------------------------------------
// RE-EXPORTS
// ---------------------------------------------------------------------------

export {
  createPlayer, applyCard, drawLevelUpCards, grantXp,
  generateXpTable, simulateCombat, MAX_LEVEL,
  CLASS_LABELS, CLASS_DESCRIPTIONS, ALL_CARDS,
};

export type {
  PlayerState, CombatEnemy, Card, ClassName,
  LevelUpOffer, CombatResult, CombatLog,
};
