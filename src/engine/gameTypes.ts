// ============================================================
// gameTypes.ts — BAART (Game Engine & Core)
// Types partagés entre tous les modules du jeu.
// Lon : le type Player est ici, tu peux l'étendre dans combat/
// ============================================================

import { Enemy, LootItem, DungeonFloor, Room } from '../levels/types';
import type { Skill, ResourceType } from '../combat/skills';

// ── États possibles du jeu ──────────────────────────────────
export type GameScreen =
  | 'title'
  | 'game'
  | 'combat'
  | 'inventory'
  | 'gameover'
  | 'win';

// ── Joueur ──────────────────────────────────────────────────
export interface Player {
  name: string;
  className: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  inventory: LootItem[];
  gold: number;
  skills: Skill[];
  resource: number;
  maxResource: number;
  resourceRegen: number;
  resourceType: ResourceType;
}

// ── État global du jeu ──────────────────────────────────────
export interface GameState {
  screen: GameScreen;
  previousScreen: GameScreen | null;
  player: Player | null;
  floor: DungeonFloor | null;
  currentRoomId: string | null;
  activeEnemy: Enemy | null;
  turn: number;
  gameOverMessage: string;
  winMessage: string;
}

// ── Actions du reducer ──────────────────────────────────────
export type GameAction =
  | { type: 'START_GAME'; player: Player; floor: DungeonFloor }
  | { type: 'SET_FLOOR'; floor: DungeonFloor }
  | { type: 'SET_PLAYER'; player: Player }
  | { type: 'ENTER_ROOM'; room: Room }
  | { type: 'ENTER_COMBAT'; enemy: Enemy }
  | { type: 'END_COMBAT_WIN'; player: Player }
  | { type: 'END_COMBAT_LOSE'; message?: string }
  | { type: 'BOSS_DEFEATED'; bossName: string }
  | { type: 'OPEN_INVENTORY' }
  | { type: 'CLOSE_INVENTORY' }
  | { type: 'NEXT_TURN' }
  | { type: 'GAME_OVER'; message: string }
  | { type: 'WIN'; message: string }
  | { type: 'RESET' };

// ── Joueur par défaut (nouvelle partie) ─────────────────────
export const DEFAULT_PLAYER: Player = {
  name: 'Héros',
  className: 'barbare',
  hp: 160,
  maxHp: 160,
  attack: 22,
  defense: 8,
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  inventory: [],
  gold: 0,
  skills: [],
  resource: 5,
  maxResource: 5,
  resourceRegen: 1,
  resourceType: 'stamina',
};
