// ============================================================
// GameScreen.tsx — BAART
// Écran principal : carte du donjon + HUD joueur.
// Intègre DungeonMap (Jenn) et le HUD (Lon/Noura).
// ============================================================

import { useCallback } from 'react';
import { useGame } from '../engine/GameContext';
import { Room } from '../levels/types';
import DungeonMap from '../components/DungeonMap';
import RoomDetail from '../components/RoomDetail';
import { useSoundFX } from '../hooks/useSoundFX';

export default function GameScreen() {
  const { state, dispatch } = useGame();
  const { player, floor, currentRoomId } = state;
  const sfx = useSoundFX();

  // Quand le joueur clique sur une salle
  const handleRoomClick = useCallback((room: Room) => {
    if (!floor) return;

    // Révéler la salle
    room.explored = true;
    dispatch({ type: 'ENTER_ROOM', room });

    // Son contextuel selon le type de salle
    if (room.type === 'treasure') sfx.playLoot();
    else if (room.type === 'trap') sfx.playHit();
    else if (room.type === 'boss') sfx.playDeath();
    else sfx.playMenu();

    // S'il y a des ennemis non vaincus → combat
    const activeEnemies = room.enemies.filter(e => e.hp > 0);
    if (activeEnemies.length > 0 && !room.cleared) {
      dispatch({ type: 'ENTER_COMBAT', enemy: activeEnemies[0] });
    }
  }, [floor, dispatch, sfx]);

  const selectedRoom = floor?.rooms.find(r => r.id === currentRoomId) ?? null;

  if (!floor || !player) return null;

  return (
    <div className="min-h-screen bg-background p-4 space-y-4">

      {/* ── Header ── */}
      <header className="flex items-center justify-between">
        <h1 className="font-pixel text-lg text-primary">⚔️ CrawlVenture</h1>
        <span className="text-xs text-muted-foreground font-pixel">Tour {state.turn}</span>
      </header>

      {/* ── HUD Joueur — Lon : remplace ce bloc par ton composant ── */}
      <div className="flex gap-3 flex-wrap">
        <div className="bg-card border border-border rounded-md px-3 py-2 text-xs font-pixel">
          ❤️ {player.hp} / {player.maxHp}
        </div>
        <div className="bg-card border border-border rounded-md px-3 py-2 text-xs font-pixel">
          ⚔️ ATK {player.attack}
        </div>
        <div className="bg-card border border-border rounded-md px-3 py-2 text-xs font-pixel">
          🛡️ DEF {player.defense}
        </div>
        <div className="bg-card border border-border rounded-md px-3 py-2 text-xs font-pixel">
          ✨ Niv.{player.level}
        </div>
        <div className="bg-card border border-border rounded-md px-3 py-2 text-xs font-pixel">
          💰 {player.gold} or
        </div>

        {/* Bouton inventaire — Lon : tu peux le déplacer dans ton HUD */}
        <button
          onClick={() => dispatch({ type: 'OPEN_INVENTORY' })}
          className="ml-auto bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-xs font-pixel hover:opacity-80"
        >
          🎒 Inventaire ({player.inventory.length})
        </button>
      </div>

      {/* ── Carte + Détail salle ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <DungeonMap
            floor={floor}
            currentRoomId={currentRoomId ?? undefined}
            onRoomClick={handleRoomClick}
          />
        </div>
        <div>
          <RoomDetail room={selectedRoom} />
        </div>
      </div>

    </div>
  );
}
