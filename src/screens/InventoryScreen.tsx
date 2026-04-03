// ============================================================
// InventoryScreen.tsx — STUB pour LON
// Lon : implémente la gestion d'inventaire ici.
//
// Pour fermer l'inventaire :
//   dispatch({ type: 'CLOSE_INVENTORY' })
// ============================================================

import { useGame } from '../engine/GameContext';

const RARITY_COLORS: Record<string, string> = {
  common: 'text-muted-foreground',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
};

export default function InventoryScreen() {
  const { state, dispatch } = useGame();
  const { player } = state;

  if (!player) return null;

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">

      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-xl text-primary">🎒 Inventaire</h2>
        <button
          onClick={() => dispatch({ type: 'CLOSE_INVENTORY' })}
          className="text-xs text-muted-foreground hover:text-foreground font-pixel"
        >
          ✕ Fermer
        </button>
      </div>

      <div className="text-xs text-muted-foreground">💰 Or : {player.gold}</div>

      {player.inventory.length === 0 ? (
        <p className="text-sm text-muted-foreground italic text-center py-12">
          Votre sac est vide. Explorez des salles pour trouver du loot !
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {player.inventory.map(item => (
            <div
              key={item.id}
              className="bg-card border border-border rounded-md p-3 space-y-1"
            >
              <div className="text-2xl">{item.icon}</div>
              <p className={`text-xs font-pixel ${RARITY_COLORS[item.rarity]}`}>{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
              <p className="text-xs text-muted-foreground">💰 {item.value}</p>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground italic text-center">
        [ LON : ajoute use/drop/équipement ici ]
      </p>

    </div>
  );
}
