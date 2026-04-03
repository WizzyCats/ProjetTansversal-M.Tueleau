import { DungeonFloor, DungeonConfig, Room, RoomType, Position, Direction, Door } from './types';
import { generateEnemiesForRoom } from './enemyFactory';
import { generateLoot } from './lootTables';

// Simple seeded RNG (mulberry32)
function createRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const OPPOSITE: Record<Direction, Direction> = {
  north: 'south',
  south: 'north',
  east: 'west',
  west: 'east',
};

const DIR_OFFSET: Record<Direction, Position> = {
  north: { x: 0, y: -1 },
  south: { x: 0, y: 1 },
  east: { x: 1, y: 0 },
  west: { x: -1, y: 0 },
};

const DIRECTIONS: Direction[] = ['north', 'south', 'east', 'west'];

const ROOM_DESCRIPTIONS: Record<RoomType, string[]> = {
  start: ['L\'entrée du donjon. L\'air est humide et froid.'],
  normal: [
    'Une salle sombre éclairée par des torches mourantes.',
    'Les murs sont couverts de mousse et de toiles d\'araignées.',
    'Des os craquent sous vos pieds.',
    'L\'écho de vos pas résonne dans l\'obscurité.',
    'Des runes mystérieuses brillent faiblement sur les murs.',
  ],
  treasure: [
    'Un coffre ancien trône au centre de la pièce !',
    'Des monceaux d\'or scintillent dans la pénombre.',
  ],
  trap: [
    'Le sol est couvert de dalles suspectes...',
    'Vous entendez un mécanisme se déclencher.',
    'Des lames sortent des murs à intervalles réguliers.',
  ],
  boss: [
    'Une immense salle s\'ouvre devant vous. Le boss vous attend.',
    'L\'air vibre de puissance. Un adversaire redoutable est ici.',
  ],
};

let roomIdCounter = 0;

function pickDescription(type: RoomType, rng: () => number): string {
  const pool = ROOM_DESCRIPTIONS[type];
  return pool[Math.floor(rng() * pool.length)];
}

export function generateDungeonFloor(config: DungeonConfig, floorLevel: number): DungeonFloor {
  const seed = (config.seed ?? Math.floor(Math.random() * 999999)) + floorLevel * 1000;
  const rng = createRng(seed);

  const roomCount = config.minRooms + Math.floor(rng() * (config.maxRooms - config.minRooms + 1));
  const gridSize = Math.max(10, roomCount * 2);
  const rooms: Room[] = [];
  const grid = new Map<string, Room>();

  const posKey = (p: Position) => `${p.x},${p.y}`;

  // Place start room at center
  const startPos: Position = { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) };
  const startRoom: Room = {
    id: `room_${++roomIdCounter}`,
    type: 'start',
    position: startPos,
    width: 1,
    height: 1,
    doors: [],
    enemies: [],
    loot: [],
    explored: true,
    cleared: true,
    description: pickDescription('start', rng),
  };
  rooms.push(startRoom);
  grid.set(posKey(startPos), startRoom);

  // Random walk to place rooms
  let current = startPos;
  let attempts = 0;

  while (rooms.length < roomCount && attempts < roomCount * 10) {
    attempts++;
    const dir = DIRECTIONS[Math.floor(rng() * DIRECTIONS.length)];
    const offset = DIR_OFFSET[dir];
    const newPos: Position = { x: current.x + offset.x, y: current.y + offset.y };

    if (newPos.x < 0 || newPos.y < 0 || newPos.x >= gridSize || newPos.y >= gridSize) continue;
    if (grid.has(posKey(newPos))) {
      current = newPos;
      continue;
    }

    // Determine room type
    let type: RoomType = 'normal';
    if (rooms.length === roomCount - 1) {
      type = 'boss';
    } else if (rng() < 0.12) {
      type = 'treasure';
    } else if (rng() < 0.1) {
      type = 'trap';
    }

    const difficulty = config.difficulty + (floorLevel - 1) * 0.5;
    const isBoss = type === 'boss';

    const newRoom: Room = {
      id: `room_${++roomIdCounter}`,
      type,
      position: newPos,
      width: 1,
      height: 1,
      doors: [],
      enemies: type !== 'normal' && type !== 'trap' && type !== 'treasure' ? [] : generateEnemiesForRoom(difficulty, false, rng),
      loot: type === 'treasure' ? generateLoot(3 + Math.floor(rng() * 3), difficulty, rng) : [],
      explored: false,
      cleared: false,
      description: pickDescription(type, rng),
    };

    // Create doors between current room and new room
    const currentRoom = grid.get(posKey(current))!;
    const doorToNew: Door = { direction: dir, targetRoomId: newRoom.id, locked: type === 'boss' && rng() < 0.5 };
    const doorBack: Door = { direction: OPPOSITE[dir], targetRoomId: currentRoom.id, locked: doorToNew.locked };

    currentRoom.doors.push(doorToNew);
    newRoom.doors.push(doorBack);

    rooms.push(newRoom);
    grid.set(posKey(newPos), newRoom);
    current = newPos;
  }

  // Add connections between adjacent rooms that don't have doors yet (20% chance)
  for (const room of rooms) {
    for (const dir of DIRECTIONS) {
      if (room.doors.some(d => d.direction === dir)) continue;
      const offset = DIR_OFFSET[dir];
      const neighborPos = { x: room.position.x + offset.x, y: room.position.y + offset.y };
      const neighbor = grid.get(posKey(neighborPos));
      if (!neighbor) continue;
      if (neighbor.doors.some(d => d.direction === OPPOSITE[dir])) continue;
      if (rng() < 0.2) {
        room.doors.push({ direction: dir, targetRoomId: neighbor.id, locked: false });
        neighbor.doors.push({ direction: OPPOSITE[dir], targetRoomId: room.id, locked: false });
      }
    }
  }

  const bossRoom = rooms.find(r => r.type === 'boss');

  return {
    id: `floor_${floorLevel}_${seed}`,
    level: floorLevel,
    rooms,
    startRoomId: startRoom.id,
    bossRoomId: bossRoom?.id ?? rooms[rooms.length - 1].id,
    gridWidth: gridSize,
    gridHeight: gridSize,
  };
}

export function generateDungeon(config: DungeonConfig): DungeonFloor[] {
  const floors: DungeonFloor[] = [];
  for (let i = 1; i <= config.floorCount; i++) {
    floors.push(generateDungeonFloor(config, i));
  }
  return floors;
}
