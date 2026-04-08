// WinScreen.tsx — Victoire de donjon + envoi score + sauvegarde champion

import { useEffect, useState } from 'react';
import { useGame } from '../engine/GameContext';
import { useSoundFX } from '../hooks/useSoundFX';
import { addToLeaderboard, saveChampion } from '../engine/leaderboard';
import PixelSprite, { getHeroSpriteName } from '../components/PixelSprite';

export default function WinScreen() {
  const { state, dispatch, selectDungeon } = useGame();
  const sfx = useSoundFX();
  const { player, currentDungeon } = state;

  const [scoreSent, setScoreSent] = useState(false);
  const [rank, setRank] = useState(0);
  const [championSaved, setChampionSaved] = useState(false);

  useEffect(() => { sfx.playLevelUp(); }, []);

  const nextDungeon = currentDungeon + 1;
  const hasNext = nextDungeon <= 10;
  const allComplete = currentDungeon >= 10;

  const sendScore = () => {
    if (!player || scoreSent) return;
    const result = addToLeaderboard({
      name: player.name,
      className: player.className,
      score: player.score,
      level: player.level,
      dungeon: currentDungeon,
      date: new Date().toLocaleDateString('fr-FR'),
    });
    setRank(result.rank);
    setScoreSent(true);
    sfx.playSparkle();
  };

  const saveChamp = () => {
    if (!player || championSaved) return;
    saveChampion(player, player.score);
    setChampionSaved(true);
    sfx.playLevelUp();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-4">
      <div className="text-center space-y-3">
        {player && <PixelSprite name={getHeroSpriteName(player.className)} scale={6} className="mx-auto" />}
        <h2 className="font-pixel text-3xl text-primary">
          {allComplete ? 'Tous les donjons conquis !' : 'Victoire !'}
        </h2>
        <p className="text-muted-foreground text-sm max-w-sm">{state.winMessage}</p>
        <p className="text-xs text-muted-foreground">
          Donjon {currentDungeon}/10 · Niveau {player?.level} · Tours : {state.turn}
        </p>
        {player && (
          <p className="font-pixel text-lg text-yellow-400">{player.score} points</p>
        )}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">

        {/* Envoyer le score */}
        {!scoreSent ? (
          <button onClick={sendScore}
            className="w-full px-8 py-3 bg-yellow-600 text-white rounded-md font-pixel text-sm hover:opacity-90 transition-all hover:scale-105">
            Envoyer le score au classement
          </button>
        ) : (
          <div className="w-full px-4 py-3 bg-yellow-600/20 border border-yellow-500/30 rounded-md text-center">
            <p className="font-pixel text-sm text-yellow-400">Score enregistre !</p>
            <p className="text-xs text-muted-foreground">Rang #{rank}</p>
          </div>
        )}

        {/* Sauvegarder champion (seulement si donjon 10 terminé) */}
        {allComplete && !championSaved && (
          <button onClick={saveChamp}
            className="w-full px-8 py-3 bg-purple-600 text-white rounded-md font-pixel text-sm hover:opacity-90 transition-all hover:scale-105">
            Sauvegarder pour le Combat des Champions
          </button>
        )}
        {allComplete && championSaved && (
          <div className="w-full px-4 py-3 bg-purple-600/20 border border-purple-500/30 rounded-md text-center">
            <p className="font-pixel text-sm text-purple-400">Champion sauvegarde !</p>
            <p className="text-xs text-muted-foreground">Defiable par les autres joueurs</p>
          </div>
        )}

        {/* Voir le classement */}
        <button onClick={() => dispatch({ type: 'OPEN_LEADERBOARD' })}
          className="w-full px-8 py-3 bg-secondary text-secondary-foreground rounded-md font-pixel text-xs hover:opacity-80">
          Voir le classement
        </button>

        {/* Donjon suivant */}
        {hasNext && (
          <button onClick={() => selectDungeon(nextDungeon)}
            className="w-full px-8 py-4 bg-primary text-primary-foreground rounded-md font-pixel text-sm hover:opacity-90 transition-all hover:scale-105">
            Donjon {nextDungeon} →
          </button>
        )}

        <button onClick={() => dispatch({ type: 'OPEN_DUNGEON_SELECT' })}
          className="w-full px-8 py-3 bg-secondary text-secondary-foreground rounded-md font-pixel text-xs hover:opacity-80">
          Choix du donjon
        </button>
      </div>
    </div>
  );
}
