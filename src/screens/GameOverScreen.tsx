// GameOverScreen.tsx

import { useEffect } from 'react';
import { useGame } from '../engine/GameContext';
import { useSoundFX } from '../hooks/useSoundFX';

export default function GameOverScreen() {
  const { state, dispatch, selectDungeon } = useGame();
  const sfx = useSoundFX();

  useEffect(() => { sfx.playDeath(); }, []);

  // Relancer le même donjon (le joueur garde ses stats/level/inventaire, HP restaurés)
  const retry = () => {
    if (state.player) {
      dispatch({ type: 'SET_PLAYER', player: { ...state.player, hp: state.player.maxHp } });
    }
    selectDungeon(state.currentDungeon);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
      <div className="text-center space-y-3">
        <div className="text-6xl">💀</div>
        <h2 className="font-pixel text-3xl text-destructive">Game Over</h2>
        <p className="text-muted-foreground text-sm max-w-xs">{state.gameOverMessage}</p>
        <p className="text-xs text-muted-foreground">
          Donjon {state.currentDungeon} · Tours : {state.turn}
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={retry}
          className="w-full px-8 py-4 bg-primary text-primary-foreground rounded-md font-pixel text-sm hover:opacity-90 transition-all hover:scale-105"
        >
          Recommencer le donjon
        </button>
        <button
          onClick={() => dispatch({ type: 'OPEN_DUNGEON_SELECT' })}
          className="w-full px-8 py-3 bg-secondary text-secondary-foreground rounded-md font-pixel text-xs hover:opacity-80 transition-all"
        >
          Choix du donjon
        </button>
      </div>
    </div>
  );
}
