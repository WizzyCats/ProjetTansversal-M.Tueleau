// =============================================================================
// combat/player.ts — Création du joueur par classe
// Lon — Module Combat & Classes
// =============================================================================

import type { PlayerState, ClassName, BaseStats, ChaosEntry, CardEffect } from './types';
import { xpRequiredForLevel } from './levelup';
import type { Card } from './types';

// ---------------------------------------------------------------------------
// TABLE CHAOS DE BASE
// ---------------------------------------------------------------------------

export const BASE_CHAOS_TABLE: ChaosEntry[] = [
  { result: 'small_heal',           weight: 10, label: 'Petit Soin'               },
  { result: 'temp_hp',              weight: 10, label: 'Vie Temporaire'            },
  { result: 'damage_medium',        weight: 25, label: 'Dégâts Moyens'             },
  { result: 'damage_high',          weight: 20, label: 'Dégâts Puissants'          },
  { result: 'damage_huge_backfire', weight: 10, label: 'GROS Dégâts + Retour Flamme'},
  { result: 'aoe_weak',             weight: 10, label: 'AOE Faible'                },
  { result: 'debuff',               weight: 8,  label: 'Débuff Ennemi'             },
  { result: 'summon_pet',           weight: 5,  label: 'Invocation Pet'            },
  { result: 'nothing',              weight: 2,  label: 'Fizzle (Rien)'             },
];

// ---------------------------------------------------------------------------
// STATS DE BASE PAR CLASSE
// ---------------------------------------------------------------------------

const CLASS_BASE_STATS: Record<ClassName, BaseStats> = {
  barbare: {
    hpMax: 160, hp: 160, atk: 22, def: 8,
    dodge: 5, critChance: 8, critMultiplier: 1.8,
    cooldown: 3.5, parryChance: 20,
  },
  mage_chaos: {
    hpMax: 90, hp: 90, atk: 14, def: 4,
    dodge: 8, critChance: 10, critMultiplier: 2.0,
    cooldown: 2.5, parryChance: 0,
  },
  voleur: {
    hpMax: 75, hp: 75, atk: 12, def: 3,
    dodge: 22, critChance: 15, critMultiplier: 2.2,
    cooldown: 1.8, parryChance: 0,
  },
  necromancien: {
    hpMax: 80, hp: 80, atk: 10, def: 5,
    dodge: 6, critChance: 6, critMultiplier: 1.6,
    cooldown: 2.5, parryChance: 0,
  },
};

// ---------------------------------------------------------------------------
// FACTORY
// ---------------------------------------------------------------------------

export function createPlayer(name: string, className: ClassName, id?: string): PlayerState {
  const stats = structuredClone(CLASS_BASE_STATS[className]);
  return {
    id: id ?? `player_${Date.now()}`,
    name,
    className,
    level: 1,
    xp: 0,
    xpToNextLevel: xpRequiredForLevel(2),
    stats,
    statusEffects: [],
    activeCards: [],
    minions: [],
    minionCountMax: 2,
    deathBar: 0,
    isDeathBarActive: false,
    poisonStackMax: 3,
    currentPoisonStacks: 0,
    chaosTable: structuredClone(BASE_CHAOS_TABLE),
    lastChaosResult: null,
    petActive: false,
    petHp: 0,
    immortalUsedThisCombat: false,
  };
}

// ---------------------------------------------------------------------------
// HELPERS DE LECTURE DES CARTES
// ---------------------------------------------------------------------------

export function sumCardValue(player: PlayerState, key: keyof CardEffect): number {
  return player.activeCards.reduce((acc, card) => {
    const val = card.effect[key];
    return typeof val === 'number' ? acc + (val as number) : acc;
  }, 0);
}

export function getCardValue(player: PlayerState, key: keyof CardEffect): number {
  return player.activeCards.reduce((acc, card) => {
    const val = card.effect[key];
    return typeof val === 'number' ? Math.max(acc, val as number) : acc;
  }, 0);
}

export function hasCardFlag(player: PlayerState, key: keyof CardEffect): boolean {
  return player.activeCards.some(c => c.effect[key] === true);
}

export const CLASS_LABELS: Record<ClassName, string> = {
  barbare:      '⚔️ Guerrier Barbare',
  mage_chaos:   '🔮 Mage du Chaos',
  voleur:       '🗡️ Voleur',
  necromancien: '💀 Nécromancien',
};

export const CLASS_DESCRIPTIONS: Record<ClassName, string> = {
  barbare:      'Gros PV, gros dégâts, parade et soin post-combat. Tape fort et encaisse.',
  mage_chaos:   'Toutes ses actions sont tirées aléatoirement. Puissant mais imprévisible.',
  voleur:       'Rapide, poison stackable, haute esquive et contre-attaques.',
  necromancien: 'Invoque des minions, se nourrit des morts et défie la mort elle-même.',
};
