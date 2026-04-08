// =============================================================================
// LeaderboardScreen.tsx — Classement + Combat des Champions
// =============================================================================

import { useState } from 'react';
import { useGame } from '../engine/GameContext';
import { useSoundFX } from '../hooks/useSoundFX';
import { getTop10, getRank, type LeaderboardEntry } from '../engine/leaderboard';
import { getChampions, type ChampionSave } from '../engine/leaderboard';
import PixelSprite, { getHeroSpriteName } from '../components/PixelSprite';

const CLASS_LABELS: Record<string, string> = {
  barbare: 'Barbare', mage_chaos: 'Mage', voleur: 'Voleur', necromancien: 'Necro',
};

export default function LeaderboardScreen() {
  const { state, dispatch } = useGame();
  const sfx = useSoundFX();
  const [tab, setTab] = useState<'leaderboard' | 'champions'>('leaderboard');

  const top10 = getTop10();
  const champions = getChampions();
  const myScore = state.player?.score ?? 0;
  const myRank = getRank(myScore);

  return (
    <div className="min-h-screen bg-background p-4 space-y-4 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-pixel text-xl text-primary">Classement</h1>
        <button onClick={() => dispatch({ type: 'CLOSE_LEADERBOARD' })}
          className="text-xs text-muted-foreground hover:text-foreground font-pixel px-3 py-1 border border-border rounded">
          Fermer
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('leaderboard')}
          className={`px-4 py-2 rounded-md font-pixel text-xs transition-all ${
            tab === 'leaderboard' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
          Top 10
        </button>
        <button onClick={() => setTab('champions')}
          className={`px-4 py-2 rounded-md font-pixel text-xs transition-all ${
            tab === 'champions' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
          Champions ({champions.length})
        </button>
      </div>

      {/* Mon score */}
      {state.player && (
        <div className="bg-card border border-primary/30 rounded-lg p-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <PixelSprite name={getHeroSpriteName(state.player.className)} scale={3} />
            <div>
              <p className="font-pixel text-xs text-primary">{state.player.name}</p>
              <p className="text-xs text-muted-foreground">Nv.{state.player.level}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-pixel text-sm text-yellow-400">{myScore} pts</p>
            <p className="text-xs text-muted-foreground">Rang #{myRank}</p>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {tab === 'leaderboard' && (
        <div className="space-y-2">
          {top10.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8 italic">Aucun score enregistre.</p>
          )}
          {top10.map((entry, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${
              i === 0 ? 'border-yellow-500 bg-yellow-500/10' :
              i === 1 ? 'border-gray-400 bg-gray-400/10' :
              i === 2 ? 'border-amber-600 bg-amber-600/10' :
              'border-border bg-card'
            }`}>
              <span className={`font-pixel text-lg w-8 text-center ${
                i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-500' : 'text-muted-foreground'
              }`}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </span>
              <PixelSprite name={getHeroSpriteName(entry.className)} scale={2} />
              <div className="flex-1 min-w-0">
                <p className="font-pixel text-xs text-foreground truncate">{entry.name}</p>
                <p className="text-xs text-muted-foreground">
                  {CLASS_LABELS[entry.className] ?? entry.className} Nv.{entry.level} · Donjon {entry.dungeon}
                </p>
              </div>
              <div className="text-right">
                <p className="font-pixel text-sm text-yellow-400">{entry.score}</p>
                <p className="text-xs text-muted-foreground">{entry.date}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Champions */}
      {tab === 'champions' && (
        <div className="space-y-2">
          {champions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8 italic">
              Aucun champion. Finissez les 10 donjons pour sauvegarder un champion.
            </p>
          )}
          {champions.map((champ, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-3">
                <PixelSprite name={getHeroSpriteName(champ.className)} scale={3} />
                <div className="flex-1">
                  <p className="font-pixel text-xs text-primary">{champ.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {CLASS_LABELS[champ.className]} Nv.{champ.level} · {champ.score} pts
                  </p>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  <p>ATK {champ.attack} DEF {champ.defense}</p>
                  <p>{champ.maxHp} PV</p>
                </div>
              </div>
              {state.player && (
                <button
                  onClick={() => {
                    sfx.playSlash();
                    dispatch({ type: 'START_CHAMPION_FIGHT', champion: champ });
                  }}
                  className="w-full py-2 bg-red-600/80 text-white rounded font-pixel text-xs hover:opacity-90"
                >
                  Defier ce champion
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
