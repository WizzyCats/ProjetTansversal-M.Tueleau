// ============================================================
// GameScreen.tsx
// Écran principal : carte du donjon + HUD joueur.
// ============================================================

import { useCallback } from 'react';
import { useGame } from '../engine/GameContext';
import { Room } from '../levels/types';
import DungeonMap from '../components/DungeonMap';
import RoomDetail from '../components/RoomDetail';
import PixelSprite, { getHeroSpriteName } from '../components/PixelSprite';
import { useSoundFX } from '../hooks/useSoundFX';

export default function GameScreen() {
  const { state, dispatch } = useGame();
  const { player, floor, currentRoomId } = state;
  const sfx = useSoundFX();

  const handleRoomClick = useCallback((room: Room) => {
    if (!floor || !currentRoomId) return;

    // Vérifier que la salle est adjacente (connectée par une porte)
    const currentRoom = floor.rooms.find(r => r.id === currentRoomId);
    if (!currentRoom) return;

    // La salle cliquée est-elle la salle courante ?
    if (room.id === currentRoomId) {
      // On peut re-sélectionner la salle courante pour voir ses détails
      return;
    }

    // Vérifier l'adjacence via les portes
    const hasPath = currentRoom.doors.some(d => d.targetRoomId === room.id);
    if (!hasPath) return; // Pas de porte vers cette salle → bloqué

    // Révéler la salle et y entrer
    room.explored = true;
    dispatch({ type: 'ENTER_ROOM', room });
    dispatch({ type: 'NEXT_TURN' });

    // Son contextuel
    if (room.type === 'treasure') sfx.playLoot();
    else if (room.type === 'trap') sfx.playHit();
    else if (room.type === 'boss') sfx.playDeath();
    else sfx.playMenu();

    // Collecte auto du loot dans les salles trésor
    if (room.type === 'treasure' && room.loot.length > 0 && player) {
      const updatedPlayer = {
        ...player,
        inventory: [...player.inventory, ...room.loot.filter(l => l.type !== 'gold')],
        gold: player.gold + room.loot.filter(l => l.type === 'gold').reduce((s, l) => s + l.value, 0),
      };
      room.loot = [];
      dispatch({ type: 'SET_PLAYER', player: updatedPlayer });
    }

    // S'il y a des ennemis non vaincus → combat auto
    const activeEnemies = room.enemies.filter(e => e.hp > 0);
    if (activeEnemies.length > 0 && !room.cleared) {
      dispatch({ type: 'ENTER_COMBAT', enemy: activeEnemies[0] });
    }
    // Salles cleared : on peut cliquer pour voir les détails, pas de combat auto
  }, [floor, currentRoomId, dispatch, sfx, player]);

  const selectedRoom = floor?.rooms.find(r => r.id === currentRoomId) ?? null;

  if (!floor || !player) return null;

  return (
    <div className="min-h-screen bg-background p-4 space-y-4">

      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="font-pixel text-lg text-primary">CrawlVenture</h1>
        <span className="text-xs text-muted-foreground font-pixel">Tour {state.turn}</span>
      </header>

      {/* HUD Joueur */}
      <div className="flex gap-3 flex-wrap items-center">
        <PixelSprite name={getHeroSpriteName(player.className)} scale={3} />
        <div className="bg-card border border-border rounded-md px-3 py-2 text-xs font-pixel">
          {player.hp} / {player.maxHp} PV
        </div>
        <div className="bg-card border border-border rounded-md px-3 py-2 text-xs font-pixel">
          ATK {player.attack}
        </div>
        <div className="bg-card border border-border rounded-md px-3 py-2 text-xs font-pixel">
          DEF {player.defense}
        </div>
        <div className="bg-card border border-border rounded-md px-3 py-2 text-xs font-pixel">
          Niv.{player.level}
        </div>
        <div className="bg-card border border-border rounded-md px-3 py-2 text-xs font-pixel">
          {player.gold} or
        </div>
        <div className="bg-card border border-border rounded-md px-3 py-2 text-xs font-pixel">
          XP {player.xp}/{player.xpToNextLevel}
        </div>

        {player.statPoints > 0 && (
          <button
            onClick={() => dispatch({ type: 'OPEN_LEVELUP' })}
            className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-xs font-pixel animate-pulse"
          >
            +{player.statPoints} pts
          </button>
        )}

        <button
          onClick={() => dispatch({ type: 'OPEN_INVENTORY' })}
          className="ml-auto bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-xs font-pixel hover:opacity-80"
        >
          Inventaire ({player.inventory.length})
        </button>
      </div>

      {/* Carte + Détail salle */}
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
          {/* Bouton recommencer si salle cleared */}
          {selectedRoom && selectedRoom.cleared && selectedRoom.type !== 'start' && selectedRoom.type !== 'treasure' && selectedRoom.enemies.length > 0 && selectedRoom.id === currentRoomId && (
            <button
              onClick={() => {
                selectedRoom.enemies.forEach(e => { e.hp = Math.round(e.maxHp * 0.6); });
                selectedRoom.cleared = false;
                sfx.playSlash();
                dispatch({ type: 'ENTER_COMBAT', enemy: selectedRoom.enemies[0] });
              }}
              className="w-full mt-3 py-2 bg-destructive/80 text-destructive-foreground rounded-md font-pixel text-xs hover:opacity-90"
            >
              Recommencer la salle
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
