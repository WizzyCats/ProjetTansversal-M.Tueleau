import { Room } from '../levels/types';
import PixelSprite, { getEnemySpriteName } from './PixelSprite';

interface RoomDetailProps {
  room: Room | null;
}

const RARITY_STYLES: Record<string, string> = {
  common: 'text-loot-common',
  uncommon: 'text-loot-uncommon',
  rare: 'text-loot-rare',
  epic: 'text-loot-epic',
  legendary: 'text-loot-legendary',
};

export default function RoomDetail({ room }: RoomDetailProps) {
  if (!room) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
        <p className="font-pixel text-sm">Sélectionnez une salle sur la carte</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">
          {{ start: '🚪', normal: '💀', treasure: '💎', trap: '⚠️', boss: '👿' }[room.type]}
        </span>
        <div>
          <h3 className="font-pixel text-sm text-primary">
            Salle {room.type === 'start' ? 'de départ' : room.type === 'boss' ? 'du Boss' : room.type === 'treasure' ? 'au trésor' : room.type === 'trap' ? 'piégée' : 'normale'}
          </h3>
          <p className="text-xs text-muted-foreground">
            Position: ({room.position.x}, {room.position.y}) • {room.explored ? 'Explorée' : 'Inexplorée'}
          </p>
        </div>
      </div>

      <p className="text-sm text-foreground/80 italic">{room.description}</p>

      {/* Enemies */}
      {room.enemies.length > 0 && (
        <div>
          <h4 className="font-pixel text-xs text-accent mb-2">Ennemis ({room.enemies.length})</h4>
          <div className="space-y-1">
            {room.enemies.map(enemy => (
              <div key={enemy.id} className="flex items-center gap-2 text-sm bg-secondary/50 rounded px-2 py-1">
                <PixelSprite name={getEnemySpriteName(enemy.name)} scale={2} />
                <span className="text-foreground">{enemy.name}</span>
                <span className="text-muted-foreground ml-auto text-xs">
                  ❤️{enemy.hp} ⚔️{enemy.attack} 🛡️{enemy.defense}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loot */}
      {room.loot.length > 0 && (
        <div>
          <h4 className="font-pixel text-xs text-primary mb-2">Butin ({room.loot.length})</h4>
          <div className="space-y-1">
            {room.loot.map(item => (
              <div key={item.id} className="flex items-center gap-2 text-sm bg-secondary/50 rounded px-2 py-1">
                <span>{item.icon}</span>
                <span className={RARITY_STYLES[item.rarity]}>{item.name}</span>
                <span className="text-muted-foreground ml-auto text-xs">{item.value}g</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Doors */}
      <div>
        <h4 className="font-pixel text-xs text-dungeon-door mb-2">Portes ({room.doors.length})</h4>
        <div className="flex gap-2 flex-wrap">
          {room.doors.map((door, i) => (
            <span
              key={i}
              className={`text-xs px-2 py-1 rounded border ${door.locked ? 'border-accent text-accent' : 'border-dungeon-door text-dungeon-door'}`}
            >
              {door.direction === 'north' ? '⬆️' : door.direction === 'south' ? '⬇️' : door.direction === 'east' ? '➡️' : '⬅️'}
              {door.locked ? ' 🔒' : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
