import { useState, useCallback } from 'react';
import { generateDungeonFloor } from '../levels/dungeonGenerator';
import { DungeonFloor, DungeonConfig, Room } from '../levels/types';
import DungeonMap from '../components/DungeonMap';
import RoomDetail from '../components/RoomDetail';

const DEFAULT_CONFIG: DungeonConfig = {
  floorCount: 1,
  minRooms: 8,
  maxRooms: 15,
  difficulty: 3,
};

export default function Index() {
  const [config, setConfig] = useState<DungeonConfig>(DEFAULT_CONFIG);
  const [floor, setFloor] = useState<DungeonFloor>(() => generateDungeonFloor(DEFAULT_CONFIG, 1));
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(floor.rooms[0]);
  const [seed, setSeed] = useState<number>(Math.floor(Math.random() * 999999));

  const regenerate = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 999999);
    setSeed(newSeed);
    const newConfig = { ...config, seed: newSeed };
    const newFloor = generateDungeonFloor(newConfig, 1);
    setFloor(newFloor);
    setSelectedRoom(newFloor.rooms[0]);
  }, [config]);

  const handleRoomClick = useCallback((room: Room) => {
    // Reveal room on click
    room.explored = true;
    setSelectedRoom({ ...room });
    setFloor(prev => ({ ...prev, rooms: [...prev.rooms] }));
  }, []);

  const revealAll = useCallback(() => {
    floor.rooms.forEach(r => (r.explored = true));
    setFloor(prev => ({ ...prev, rooms: [...prev.rooms] }));
  }, [floor]);

  const stats = {
    total: floor.rooms.length,
    normal: floor.rooms.filter(r => r.type === 'normal').length,
    treasure: floor.rooms.filter(r => r.type === 'treasure').length,
    trap: floor.rooms.filter(r => r.type === 'trap').length,
    enemies: floor.rooms.reduce((sum, r) => sum + r.enemies.length, 0),
    loot: floor.rooms.reduce((sum, r) => sum + r.loot.length, 0),
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="font-pixel text-2xl text-primary">⚔️ Dungeon Generator ⚔️</h1>
          <p className="text-muted-foreground text-sm">Génération procédurale de donjons — Membre 3 : Niveaux</p>
        </header>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Salles min</label>
            <input
              type="range" min={4} max={20} value={config.minRooms}
              onChange={e => setConfig(c => ({ ...c, minRooms: +e.target.value }))}
              className="w-20 accent-primary"
            />
            <span className="text-xs text-foreground w-6">{config.minRooms}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Salles max</label>
            <input
              type="range" min={config.minRooms} max={30} value={config.maxRooms}
              onChange={e => setConfig(c => ({ ...c, maxRooms: +e.target.value }))}
              className="w-20 accent-primary"
            />
            <span className="text-xs text-foreground w-6">{config.maxRooms}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Difficulté</label>
            <input
              type="range" min={1} max={10} value={config.difficulty}
              onChange={e => setConfig(c => ({ ...c, difficulty: +e.target.value }))}
              className="w-20 accent-accent"
            />
            <span className="text-xs text-foreground w-6">{config.difficulty}</span>
          </div>
          <button
            onClick={regenerate}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-pixel text-xs hover:opacity-90 transition-opacity"
          >
            🎲 Générer
          </button>
          <button
            onClick={revealAll}
            className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground font-pixel text-xs hover:opacity-80 transition-opacity"
          >
            👁️ Tout révéler
          </button>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-4 text-center">
          {[
            { label: 'Salles', value: stats.total, icon: '🏰' },
            { label: 'Normales', value: stats.normal, icon: '💀' },
            { label: 'Trésors', value: stats.treasure, icon: '💎' },
            { label: 'Pièges', value: stats.trap, icon: '⚠️' },
            { label: 'Ennemis', value: stats.enemies, icon: '👹' },
            { label: 'Objets', value: stats.loot, icon: '🎒' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-md px-4 py-2 min-w-[80px]">
              <div className="text-lg">{s.icon}</div>
              <div className="font-pixel text-xs text-primary">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
          <div className="bg-card border border-border rounded-md px-4 py-2 min-w-[80px]">
            <div className="text-lg">🌱</div>
            <div className="font-pixel text-xs text-primary">{seed}</div>
            <div className="text-xs text-muted-foreground">Seed</div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DungeonMap
              floor={floor}
              currentRoomId={selectedRoom?.id}
              onRoomClick={handleRoomClick}
            />
          </div>
          <div>
            <RoomDetail room={selectedRoom} />
          </div>
        </div>
      </div>
    </div>
  );
}
