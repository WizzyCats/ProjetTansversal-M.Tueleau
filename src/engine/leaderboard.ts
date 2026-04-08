// =============================================================================
// leaderboard.ts — Leaderboard + Champions sauvegardés en localStorage
// =============================================================================

import type { Player } from './gameTypes';

const LB_KEY = 'crawlventure_leaderboard';
const CHAMP_KEY = 'crawlventure_champions';

// ---------------------------------------------------------------------------
// LEADERBOARD
// ---------------------------------------------------------------------------

export interface LeaderboardEntry {
  name: string;
  className: string;
  score: number;
  level: number;
  dungeon: number;
  date: string;
}

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LB_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch { return []; }
}

export function addToLeaderboard(entry: LeaderboardEntry): { rank: number; board: LeaderboardEntry[] } {
  const board = getLeaderboard();
  board.push(entry);
  board.sort((a, b) => b.score - a.score);
  const rank = board.findIndex(e => e === entry) + 1;
  // Garder max 100 entrées
  const trimmed = board.slice(0, 100);
  localStorage.setItem(LB_KEY, JSON.stringify(trimmed));
  return { rank, board: trimmed };
}

export function getTop10(): LeaderboardEntry[] {
  return getLeaderboard().slice(0, 10);
}

export function getRank(score: number): number {
  const board = getLeaderboard();
  const rank = board.filter(e => e.score > score).length + 1;
  return rank;
}

// ---------------------------------------------------------------------------
// CHAMPIONS (héros sauvegardés pour le combat des champions)
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
}

export function getChampions(): ChampionSave[] {
  try {
    const raw = localStorage.getItem(CHAMP_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChampionSave[];
  } catch { return []; }
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
  const champs = getChampions();
  champs.push(champ);
  // Garder max 20 champions
  if (champs.length > 20) champs.shift();
  localStorage.setItem(CHAMP_KEY, JSON.stringify(champs));
  return champ;
}
