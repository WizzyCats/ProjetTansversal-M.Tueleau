// ============================================================
// CombatScreen.tsx — STUB pour LON
// Baart a créé la structure. Lon implémente le combat ici.
//
// Accès aux données :
//   const { state, dispatch } = useGame();
//   state.activeEnemy  → l'ennemi en cours
//   state.player       → le joueur
//
// Pour terminer le combat :
//   dispatch({ type: 'END_COMBAT_WIN', player: joueurMisAJour })
//   dispatch({ type: 'END_COMBAT_LOSE', message: '...' })
//   dispatch({ type: 'BOSS_DEFEATED', bossName: ennemi.name })
// ============================================================

import { useGame } from '../engine/GameContext';

export default function CombatScreen() {
  const { state, dispatch } = useGame();
  const { activeEnemy, player } = state;

  if (!activeEnemy || !player) return null;

  // ── Victoire rapide (placeholder — LON remplace tout ça) ──
  const handleWin = () => {
    const updatedPlayer = {
      ...player,
      xp: player.xp + activeEnemy.xpReward,
      gold: player.gold + Math.floor(Math.random() * 20 + 5),
    };

    if (activeEnemy.tier === 'boss') {
      dispatch({ type: 'BOSS_DEFEATED', bossName: activeEnemy.name });
    } else {
      dispatch({ type: 'END_COMBAT_WIN', player: updatedPlayer });
    }
  };

  const handleLose = () => {
    dispatch({ type: 'END_COMBAT_LOSE', message: `${activeEnemy.name} vous a vaincu...` });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8 p-6">

      <h2 className="font-pixel text-2xl text-destructive">⚔️ Combat !</h2>

      {/* Ennemi */}
      <div className="bg-card border border-border rounded-lg p-6 text-center space-y-2 w-64">
        <div className="text-4xl">{activeEnemy.icon}</div>
        <p className="font-pixel text-sm text-primary">{activeEnemy.name}</p>
        <p className="text-xs text-muted-foreground">
          ❤️ {activeEnemy.hp} / {activeEnemy.maxHp}
        </p>
        <p className="text-xs text-muted-foreground">
          ⚔️ {activeEnemy.attack} ATK · 🛡️ {activeEnemy.defense} DEF
        </p>
        {activeEnemy.tier === 'boss' && (
          <span className="text-xs text-destructive font-pixel">👿 BOSS</span>
        )}
      </div>

      {/* Joueur */}
      <div className="text-xs text-muted-foreground text-center">
        Votre HP : {player.hp} / {player.maxHp}
      </div>

      {/* LON : remplace ces boutons par ton vrai système de combat */}
      <p className="text-xs text-muted-foreground italic">
        [ LON : implémente le système de combat ici ]
      </p>

      <div className="flex gap-4">
        <button
          onClick={handleWin}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-pixel text-xs hover:opacity-90"
        >
          ⚔️ Attaquer (gagner)
        </button>
        <button
          onClick={handleLose}
          className="px-6 py-3 bg-destructive text-destructive-foreground rounded-md font-pixel text-xs hover:opacity-90"
        >
          💀 Mourir (perdre)
        </button>
      </div>

    </div>
  );
}
