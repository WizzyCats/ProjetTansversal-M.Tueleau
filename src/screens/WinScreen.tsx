// WinScreen.tsx — Victoire de donjon

import { useEffect } from 'react';
import { useGame } from '../engine/GameContext';
import { useSoundFX } from '../hooks/useSoundFX';
import PixelSprite, { getHeroSpriteName } from '../components/PixelSprite';

export default function WinScreen() {
  const { state, dispatch, selectDungeon } = useGame();
  const sfx = useSoundFX();
  const { player, currentDungeon, maxDungeonUnlocked } = state;

  useEffect(() => { sfx.playLevelUp(); }, []);

  const nextDungeon = currentDungeon + 1;
  const hasNext = nextDungeon <= 10;
  const allComplete = currentDungeon >= 10;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-4">
      <div className="text-center space-y-3">
        {player && <PixelSprite name={getHeroSpriteName(player.className)} scale={6} className="mx-auto" />}
        <h2 className="font-pixel text-3xl text-primary">
          {allComplete ? 'Jeu Termine !' : 'Victoire !'}
        </h2>
        <p className="text-muted-foreground text-sm max-w-sm">{state.winMessage}</p>
        <p className="text-xs text-muted-foreground">
          Donjon {currentDungeon}/10 · Niveau {player?.level} · Tours : {state.turn}
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {hasNext && (
          <button
            onClick={() => selectDungeon(nextDungeon)}
            className="w-full px-8 py-4 bg-primary text-primary-foreground rounded-md font-pixel text-sm hover:opacity-90 transition-all hover:scale-105"
          >
            Donjon {nextDungeon} →
          </button>
        )}

        <button
          onClick={() => dispatch({ type: 'OPEN_DUNGEON_SELECT' })}
          className="w-full px-8 py-3 bg-secondary text-secondary-foreground rounded-md font-pixel text-xs hover:opacity-80 transition-all"
        >
          Choix du donjon
        </button>

        {allComplete && (
          <p className="text-xs text-yellow-400 text-center font-pixel mt-2">
            Vous avez conquis les 10 donjons !
          </p>
        )}
      </div>
    </div>
  );
}
