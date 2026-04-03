import { Room, DungeonFloor } from '../levels/types';

interface DungeonMapProps {
  floor: DungeonFloor;
  currentRoomId?: string;
  onRoomClick?: (room: Room) => void;
}

const ROOM_SIZE = 48;
const GAP = 8;

const ROOM_COLORS: Record<Room['type'], string> = {
  start: 'bg-room-start',
  normal: 'bg-room-normal',
  treasure: 'bg-room-treasure',
  trap: 'bg-room-trap',
  boss: 'bg-room-boss',
};

const ROOM_ICONS: Record<Room['type'], string> = {
  start: '🚪',
  normal: '💀',
  treasure: '💎',
  trap: '⚠️',
  boss: '👿',
};

export default function DungeonMap({ floor, currentRoomId, onRoomClick }: DungeonMapProps) {
  // Calculate bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const room of floor.rooms) {
    minX = Math.min(minX, room.position.x);
    minY = Math.min(minY, room.position.y);
    maxX = Math.max(maxX, room.position.x);
    maxY = Math.max(maxY, room.position.y);
  }

  const width = (maxX - minX + 1) * (ROOM_SIZE + GAP) + GAP;
  const height = (maxY - minY + 1) * (ROOM_SIZE + GAP) + GAP;

  // Build a lookup for doors/connections
  const roomById = new Map(floor.rooms.map(r => [r.id, r]));

  return (
    <div className="overflow-auto rounded-lg border border-border bg-dungeon-wall p-4">
      <div
        className="relative mx-auto"
        style={{ width, height }}
      >
        {/* Draw connections first */}
        <svg className="absolute inset-0" width={width} height={height}>
          {floor.rooms.map(room =>
            room.doors.map(door => {
              const target = roomById.get(door.targetRoomId);
              if (!target) return null;
              // Only draw once (from lower id to higher id)
              if (room.id > target.id) return null;

              const x1 = (room.position.x - minX) * (ROOM_SIZE + GAP) + GAP + ROOM_SIZE / 2;
              const y1 = (room.position.y - minY) * (ROOM_SIZE + GAP) + GAP + ROOM_SIZE / 2;
              const x2 = (target.position.x - minX) * (ROOM_SIZE + GAP) + GAP + ROOM_SIZE / 2;
              const y2 = (target.position.y - minY) * (ROOM_SIZE + GAP) + GAP + ROOM_SIZE / 2;

              return (
                <line
                  key={`${room.id}-${door.targetRoomId}`}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={door.locked ? 'hsl(0, 60%, 40%)' : 'hsl(38, 70%, 40%)'}
                  strokeWidth={door.locked ? 2 : 3}
                  strokeDasharray={door.locked ? '4 4' : undefined}
                  opacity={room.explored || target.explored ? 0.8 : 0.2}
                />
              );
            })
          )}
        </svg>

        {/* Draw rooms */}
        {floor.rooms.map(room => {
          const x = (room.position.x - minX) * (ROOM_SIZE + GAP) + GAP;
          const y = (room.position.y - minY) * (ROOM_SIZE + GAP) + GAP;
          const isCurrent = room.id === currentRoomId;
          const isExplored = room.explored;

          return (
            <button
              key={room.id}
              className={`absolute flex items-center justify-center rounded-md border-2 transition-all duration-200 font-pixel text-xs
                ${ROOM_COLORS[room.type]}
                ${isCurrent ? 'border-primary ring-2 ring-primary/50 scale-110 z-10' : 'border-border/50'}
                ${isExplored ? 'opacity-100' : 'opacity-30'}
                ${room.cleared ? '' : 'animate-pulse'}
                hover:opacity-100 hover:scale-105 cursor-pointer
              `}
              style={{ left: x, top: y, width: ROOM_SIZE, height: ROOM_SIZE }}
              onClick={() => onRoomClick?.(room)}
              title={isExplored ? `${room.type} — ${room.enemies.length} ennemis` : '???'}
            >
              <span className="text-lg">{isExplored ? ROOM_ICONS[room.type] : '?'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
