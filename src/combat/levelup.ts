// =============================================================================
// combat/levelup.ts — Montée de niveau et tirage de cartes
// Lon — Module Combat & Classes
// =============================================================================

import type { Card, CardRarity, ClassName, LevelUpOffer, PlayerState, CardEffect } from './types';
import { ALL_CARDS, getRarityWeights } from './cards';

export const MAX_LEVEL = 20;

// ---------------------------------------------------------------------------
// COURBE XP : 100 * niveau^1.5
// ---------------------------------------------------------------------------

export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(100 * Math.pow(level, 1.5));
}

export function generateXpTable() {
  return Array.from({ length: MAX_LEVEL - 1 }, (_, i) => {
    const level = i + 2;
    let total = 0;
    for (let l = 2; l <= level; l++) total += xpRequiredForLevel(l);
    return { level, xpRequired: xpRequiredForLevel(level), totalXp: total };
  });
}

// ---------------------------------------------------------------------------
// TIRAGE PONDÉRÉ
// ---------------------------------------------------------------------------

function weightedRandom<T>(items: T[], weightFn: (item: T) => number): T {
  const total = items.reduce((sum, item) => sum + weightFn(item), 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= weightFn(item);
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

function pickRarity(weights: Record<CardRarity, number>): CardRarity {
  const entries = (Object.entries(weights) as [CardRarity, number][])
    .map(([rarity, weight]) => ({ rarity, weight }));
  return weightedRandom(entries, e => e.weight).rarity;
}

// ---------------------------------------------------------------------------
// TIRAGE 3 CARTES
// ---------------------------------------------------------------------------

export function drawLevelUpCards(
  className: ClassName,
  level: number,
  alreadyPickedIds: string[] = [],
): LevelUpOffer {
  const pool    = ALL_CARDS[className];
  const weights = getRarityWeights(level);
  const available = pool.filter(c => !alreadyPickedIds.includes(c.id));
  const drawFrom  = available.length >= 3 ? available : pool;

  const drawn: Card[] = [];
  const drawnIds = new Set<string>();
  let attempts = 0;

  while (drawn.length < 3 && attempts < 200) {
    attempts++;
    const rarity     = pickRarity(weights);
    const candidates = drawFrom.filter(c => c.rarity === rarity && !drawnIds.has(c.id));
    if (candidates.length === 0) continue;
    const card = candidates[Math.floor(Math.random() * candidates.length)];
    drawn.push(card);
    drawnIds.add(card.id);
  }

  // Fallback
  while (drawn.length < 3) {
    const remaining = drawFrom.filter(c => !drawnIds.has(c.id));
    if (remaining.length === 0) break;
    const card = remaining[Math.floor(Math.random() * remaining.length)];
    drawn.push(card);
    drawnIds.add(card.id);
  }

  return { cards: drawn as [Card, Card, Card] };
}

// ---------------------------------------------------------------------------
// APPLICATION D'UNE CARTE
// ---------------------------------------------------------------------------

export function applyCard(player: PlayerState, card: Card): PlayerState {
  const p = structuredClone(player);
  const e = card.effect;

  if (e.hpMax)          { p.stats.hpMax += e.hpMax; p.stats.hp += e.hpMax; }
  if (e.atk)            p.stats.atk          += e.atk;
  if (e.def)            p.stats.def          += e.def;
  if (e.dodge)          p.stats.dodge         = Math.min(p.stats.dodge + e.dodge, 75);
  if (e.critChance)     p.stats.critChance    = Math.min(p.stats.critChance + e.critChance, 80);
  if (e.critMultiplier) p.stats.critMultiplier += e.critMultiplier;
  if (e.cooldown)       p.stats.cooldown      = Math.max(p.stats.cooldown + e.cooldown, 0.8);
  if (e.parryChance)    p.stats.parryChance   = Math.min(p.stats.parryChance + e.parryChance, 60);
  if (e.minionCountMax) p.minionCountMax      += e.minionCountMax;
  if (e.poisonStackMax) p.poisonStackMax      += e.poisonStackMax;

  p.activeCards.push(card);
  return p;
}

// ---------------------------------------------------------------------------
// GAIN D'XP
// ---------------------------------------------------------------------------

export interface XpGainResult {
  player: PlayerState;
  leveledUp: boolean;
  levelsGained: number;
  offers: LevelUpOffer[];
}

export function grantXp(player: PlayerState, xp: number): XpGainResult {
  const p = structuredClone(player);
  p.xp += xp;

  const offers: LevelUpOffer[] = [];
  let levelsGained = 0;

  while (p.level < MAX_LEVEL && p.xp >= p.xpToNextLevel) {
    p.xp            -= p.xpToNextLevel;
    p.level         += 1;
    levelsGained    += 1;
    p.xpToNextLevel  = xpRequiredForLevel(p.level + 1);
    p.stats.hpMax   += 5;
    p.stats.hp       = Math.min(p.stats.hp + 5, p.stats.hpMax);
    p.stats.atk     += 1;
    const taken      = p.activeCards.map(c => c.id);
    offers.push(drawLevelUpCards(p.className, p.level, taken));
  }

  if (p.level >= MAX_LEVEL) { p.xp = 0; p.xpToNextLevel = 0; }

  return { player: p, leveledUp: levelsGained > 0, levelsGained, offers };
}
