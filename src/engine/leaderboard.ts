// =============================================================================
// leaderboard.ts — Leaderboard + Champions
// Données hardcodées (partagées via le repo) + scores locaux (localStorage)
// =============================================================================

import type { Player } from './gameTypes';
import { getClassSkills } from '../combat/skills';

const LB_KEY = 'crawlventure_leaderboard';
const CHAMP_KEY = 'crawlventure_champions';

// ---------------------------------------------------------------------------
// LEADERBOARD ENTRIES
// ---------------------------------------------------------------------------

export interface LeaderboardEntry {
  name: string;
  className: string;
  score: number;
  level: number;
  dungeon: number;
  date: string;
  hardcoded?: boolean;
}

// ---------------------------------------------------------------------------
// DONNÉES HARDCODÉES — visibles par tous les joueurs sur toutes les machines
// Pour ajouter un score : ajoutez une entrée ici et commitez
// ---------------------------------------------------------------------------

const HARDCODED_LEADERBOARD: LeaderboardEntry[] = [
  { name: 'Baart',     className: 'barbare',      score: 2450, level: 18, dungeon: 10, date: '08/04/2026', hardcoded: true },
  { name: 'Lon',       className: 'necromancien',  score: 2180, level: 17, dungeon: 10, date: '07/04/2026', hardcoded: true },
  { name: 'Noura',     className: 'mage_chaos',    score: 1920, level: 16, dungeon: 9,  date: '06/04/2026', hardcoded: true },
  { name: 'Jenn',      className: 'voleur',        score: 1750, level: 15, dungeon: 8,  date: '05/04/2026', hardcoded: true },
  { name: 'DarkLord',  className: 'necromancien',  score: 1540, level: 14, dungeon: 8,  date: '04/04/2026', hardcoded: true },
  { name: 'Pixel',     className: 'mage_chaos',    score: 1280, level: 12, dungeon: 7,  date: '03/04/2026', hardcoded: true },
  { name: 'Shadow',    className: 'voleur',        score: 980,  level: 11, dungeon: 6,  date: '02/04/2026', hardcoded: true },
  { name: 'Tank',      className: 'barbare',       score: 720,  level: 9,  dungeon: 5,  date: '01/04/2026', hardcoded: true },
  { name: 'Newbie',    className: 'barbare',       score: 340,  level: 5,  dungeon: 3,  date: '31/03/2026', hardcoded: true },
  { name: 'TestBot',   className: 'mage_chaos',    score: 120,  level: 3,  dungeon: 1,  date: '30/03/2026', hardcoded: true },
];

// ---------------------------------------------------------------------------
// CHAMPIONS HARDCODÉS — défiables par tous les joueurs
// ---------------------------------------------------------------------------

export interface ChampionSave {
  name: string;
  className: string;
  level: number;
  attack: number;
  defense: number;
  maxHp: number;
  maxResource: number;
  resourceRegen: number;
  resourceType: string;
  score: number;
  skills: Player['skills'];
  equipment: Player['equipment'];
  date: string;
  hardcoded?: boolean;
}

const HARDCODED_CHAMPIONS: ChampionSave[] = [
  {
    name: 'Baart', className: 'barbare', level: 18,
    attack: 52, defense: 18, maxHp: 280, maxResource: 9, resourceRegen: 2, resourceType: 'stamina',
    score: 2450,
    skills: [
      ...getClassSkills('barbare').slice(0, 2),
      { id: 'scroll_charge', name: 'Charge furieuse', cost: 3, className: 'barbare', description: 'Fonce + 25% skip', icon: '🐂', effect: { damageMultiplier: 1.3, skipEnemyChance: 25 } },
      { id: 'scroll_warshout', name: 'Cri de guerre', cost: 2, className: 'barbare', description: '+3 ATK +3 DEF', icon: '📯', effect: { damageMultiplier: 0, atkBuff: 3, defBuff: 3 } },
    ],
    equipment: { weapon: null, helmet: null, chest: null, accessory: null },
    date: '08/04/2026', hardcoded: true,
  },
  {
    name: 'Lon', className: 'necromancien', level: 17,
    attack: 38, defense: 14, maxHp: 220, maxResource: 14, resourceRegen: 4, resourceType: 'mana',
    score: 2180,
    skills: [
      ...getClassSkills('necromancien').slice(0, 2),
      { id: 'scroll_plague', name: 'Peste', cost: 3, className: 'necromancien', description: 'Poison 6/tour 4 tours', icon: '🦠', effect: { damageMultiplier: 0, poisonDmg: 6, poisonDuration: 4 } },
      { id: 'scroll_soulrip', name: 'Arracheur d\'ame', cost: 5, className: 'necromancien', description: '2.2x + 60% heal', icon: '👁️', effect: { damageMultiplier: 2.2, healPercent: 60 } },
    ],
    equipment: { weapon: null, helmet: null, chest: null, accessory: null },
    date: '07/04/2026', hardcoded: true,
  },
  {
    name: 'Noura', className: 'mage_chaos', level: 16,
    attack: 42, defense: 12, maxHp: 200, maxResource: 15, resourceRegen: 5, resourceType: 'mana',
    score: 1920,
    skills: [
      ...getClassSkills('mage_chaos').slice(0, 2),
      { id: 'scroll_blizzard', name: 'Blizzard', cost: 4, className: 'mage_chaos', description: '1.4x + ATK ennemi -3', icon: '❄️', effect: { damageMultiplier: 1.4, enemyAtkDebuff: 3 } },
      { id: 'scroll_meteor', name: 'Meteore', cost: 6, className: 'mage_chaos', description: '2.5x degats', icon: '☄️', effect: { damageMultiplier: 2.5 } },
    ],
    equipment: { weapon: null, helmet: null, chest: null, accessory: null },
    date: '06/04/2026', hardcoded: true,
  },
  {
    name: 'Jenn', className: 'voleur', level: 15,
    attack: 36, defense: 10, maxHp: 180, maxResource: 10, resourceRegen: 2, resourceType: 'stamina',
    score: 1750,
    skills: [
      ...getClassSkills('voleur').slice(0, 2),
      { id: 'scroll_backstab', name: 'Coup dans le dos', cost: 3, className: 'voleur', description: '2.5x degats', icon: '🔪', effect: { damageMultiplier: 2.5 } },
      { id: 'scroll_smokebomb', name: 'Bombe fumigene', cost: 2, className: 'voleur', description: 'Esquive + poison', icon: '💨', effect: { damageMultiplier: 0, guaranteedDodge: true, poisonDmg: 3, poisonDuration: 3 } },
    ],
    equipment: { weapon: null, helmet: null, chest: null, accessory: null },
    date: '05/04/2026', hardcoded: true,
  },
];

// ---------------------------------------------------------------------------
// FONCTIONS — merge hardcodé + localStorage
// ---------------------------------------------------------------------------

function getLocalLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LB_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch { return []; }
}

export function getLeaderboard(): LeaderboardEntry[] {
  const all = [...HARDCODED_LEADERBOARD, ...getLocalLeaderboard()];
  all.sort((a, b) => b.score - a.score);
  return all;
}

export function addToLeaderboard(entry: LeaderboardEntry): { rank: number; board: LeaderboardEntry[] } {
  const local = getLocalLeaderboard();
  local.push(entry);
  localStorage.setItem(LB_KEY, JSON.stringify(local));
  const full = getLeaderboard();
  const rank = full.findIndex(e => e.name === entry.name && e.score === entry.score && !e.hardcoded) + 1;
  return { rank: rank || full.length, board: full };
}

export function getTop10(): LeaderboardEntry[] {
  return getLeaderboard().slice(0, 10);
}

export function getRank(score: number): number {
  const board = getLeaderboard();
  return board.filter(e => e.score > score).length + 1;
}

// ---------------------------------------------------------------------------
// CHAMPIONS — merge hardcodé + localStorage
// ---------------------------------------------------------------------------

function getLocalChampions(): ChampionSave[] {
  try {
    const raw = localStorage.getItem(CHAMP_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChampionSave[];
  } catch { return []; }
}

export function getChampions(): ChampionSave[] {
  return [...HARDCODED_CHAMPIONS, ...getLocalChampions()];
}

export function saveChampion(player: Player, score: number): ChampionSave {
  const champ: ChampionSave = {
    name: player.name,
    className: player.className,
    level: player.level,
    attack: player.attack,
    defense: player.defense,
    maxHp: player.maxHp,
    maxResource: player.maxResource,
    resourceRegen: player.resourceRegen,
    resourceType: player.resourceType,
    score,
    skills: player.skills,
    equipment: player.equipment,
    date: new Date().toLocaleDateString('fr-FR'),
  };
  const local = getLocalChampions();
  local.push(champ);
  if (local.length > 20) local.shift();
  localStorage.setItem(CHAMP_KEY, JSON.stringify(local));
  return champ;
}
