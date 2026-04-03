// === TYPES DU SYSTÈME DE GÉNÉRATION DE NIVEAUX ===

export type RoomType = 'start' | 'normal' | 'treasure' | 'trap' | 'boss';
export type LootRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type EnemyTier = 'minion' | 'elite' | 'boss';
export type Direction = 'north' | 'south' | 'east' | 'west';

export interface Position {
  x: number;
  y: number;
}

export interface LootItem {
  id: string;
  name: string;
  rarity: LootRarity;
  type: 'weapon' | 'armor' | 'potion' | 'scroll' | 'gold';
  value: number;
  description: string;
  icon: string;
}

export interface Enemy {
  id: string;
  name: string;
  tier: EnemyTier;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  xpReward: number;
  lootTable: LootItem[];
  icon: string;
}

export interface Door {
  direction: Direction;
  targetRoomId: string;
  locked: boolean;
}

export interface Room {
  id: string;
  type: RoomType;
  position: Position;
  width: number;
  height: number;
  doors: Door[];
  enemies: Enemy[];
  loot: LootItem[];
  explored: boolean;
  cleared: boolean;
  description: string;
}

export interface DungeonFloor {
  id: string;
  level: number;
  rooms: Room[];
  startRoomId: string;
  bossRoomId: string;
  gridWidth: number;
  gridHeight: number;
}

export interface DungeonConfig {
  floorCount: number;
  minRooms: number;
  maxRooms: number;
  difficulty: number; // 1-10
  seed?: number;
}
