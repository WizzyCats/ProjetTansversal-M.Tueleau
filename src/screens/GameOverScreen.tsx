// GameOverScreen.tsx — Defaite + envoi score

import { useEffect, useState } from 'react';
import { useGame } from '../engine/GameContext';
import { useSoundFX } from '../hooks/useSoundFX';
import { addToLeaderboard } from '../engine/leaderboard';

export default function GameOverScreen() {
  const { state, dispatch, selectDungeon } = useGame();
  const sfx = useSoundFX();
  const [scoreSent, setScoreSent] = useState(false);
  const [rank, setRank] = useState(0);

  useEffect(() => { sfx.playDeath(); }, []);

  const sendScore = () => {
    if (!state.player || scoreSent) return;
    const result = addToLeaderboard({
      name: state.player.name,
      className: state.player.className,
      score: state.player.score,
      level: state.player.level,
      dungeon: state.currentDungeon,
      date: new Date().toLocaleDateString('fr-FR'),
    });
    setRank(result.rank);
    setScoreSent(true);
    sfx.playSparkle();
  };

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
        {state.player && (
          <p className="font-pixel text-sm text-yellow-400">{state.player.score} points</p>
        )}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {!scoreSent ? (
          <button onClick={sendScore}
            className="w-full px-8 py-3 bg-yellow-600 text-white rounded-md font-pixel text-sm hover:opacity-90">
            Envoyer le score
          </button>
        ) : (
          <div className="w-full px-4 py-3 bg-yellow-600/20 border border-yellow-500/30 rounded-md text-center">
            <p className="font-pixel text-sm text-yellow-400">Rang #{rank}</p>
          </div>
        )}

        <button onClick={() => dispatch({ type: 'OPEN_LEADERBOARD' })}
          className="w-full px-8 py-3 bg-secondary text-secondary-foreground rounded-md font-pixel text-xs hover:opacity-80">
          Voir le classement
        </button>

        <button onClick={retry}
          className="w-full px-8 py-4 bg-primary text-primary-foreground rounded-md font-pixel text-sm hover:opacity-90 transition-all hover:scale-105">
          Recommencer le donjon
        </button>
        <button onClick={() => dispatch({ type: 'OPEN_DUNGEON_SELECT' })}
          className="w-full px-8 py-3 bg-secondary text-secondary-foreground rounded-md font-pixel text-xs hover:opacity-80">
          Choix du donjon
        </button>
      </div>
    </div>
  );
}
