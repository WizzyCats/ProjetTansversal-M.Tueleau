// =============================================================================
// CombatScreen.tsx — Lon : système de combat AFK complet
// =============================================================================

import { useEffect, useState, useRef, useCallback } from 'react';
import { useGame } from '../engine/GameContext';
import {
  createPlayer, adaptEnemy, simulateCombat, drawLevelUpCards, applyCard,
  RARITY_COLORS, RARITY_LABELS, CLASS_LABELS,
} from '../combat/CombatSystem';
import type { PlayerState, CombatEnemy, CombatLog, LevelUpOffer } from '../combat/types';
import type { ClassName } from '../combat/types';
import type { Player } from '../engine/gameTypes';

// ---------------------------------------------------------------------------
// CONSTANTES
// ---------------------------------------------------------------------------

const LOG_REPLAY_MS = 80; // délai entre chaque log affiché (ms)

// ---------------------------------------------------------------------------
// HELPER : sync PlayerState → Player (pour le GameContext)
// ---------------------------------------------------------------------------

function syncToGamePlayer(ps: PlayerState, base: Player): Player {
  return {
    ...base,
    hp:            Math.max(ps.stats.hp, 0),
    maxHp:         ps.stats.hpMax,
    attack:        ps.stats.atk,
    defense:       ps.stats.def,
    level:         ps.level,
    xp:            ps.xp,
    xpToNextLevel: ps.xpToNextLevel,
  };
}

// ---------------------------------------------------------------------------
// BARRE DE PV
// ---------------------------------------------------------------------------

function HpBar({ hp, maxHp, color = 'bg-green-500' }: { hp: number; maxHp: number; color?: string }) {
  const pct      = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const barColor = pct > 50 ? 'bg-green-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
      <div
        className={`${color === 'bg-green-500' ? barColor : color} h-full transition-all duration-300`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// CARTE DE LEVEL UP
// ---------------------------------------------------------------------------

function CardChoice({ offer, onChoose }: { offer: LevelUpOffer; onChoose: (idx: 0 | 1 | 2) => void }) {
  const [chosen, setChosen] = useState<number | null>(null);

  const pick = (idx: 0 | 1 | 2) => {
    setChosen(idx);
    setTimeout(() => onChoose(idx), 400);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-2xl space-y-4">
        <h3 className="font-pixel text-lg text-primary text-center">⬆️ Level Up ! Choisissez une carte</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {offer.cards.map((card, i) => (
            <button
              key={card.id}
              onClick={() => pick(i as 0 | 1 | 2)}
              disabled={chosen !== null}
              className={`p-4 rounded-lg border-2 text-left transition-all hover:scale-[1.02]
                ${chosen === i ? 'border-primary bg-primary/20 scale-[1.02]' : 'border-border hover:border-primary/60'}
                ${chosen !== null && chosen !== i ? 'opacity-40' : ''}`}
            >
              <span
                className="text-xs font-pixel px-2 py-0.5 rounded mb-2 inline-block"
                style={{ backgroundColor: RARITY_COLORS[card.rarity] + '33', color: RARITY_COLORS[card.rarity] }}
              >
                {RARITY_LABELS[card.rarity]}
              </span>
              <p className="font-pixel text-sm text-foreground mt-1">{card.name}</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{card.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// COMPOSANT PRINCIPAL
// ---------------------------------------------------------------------------

export default function CombatScreen() {
  const { state, dispatch } = useGame();
  const { activeEnemy, player } = state;

  const [displayedLogs, setDisplayed]  = useState<CombatLog[]>([]);
  const [playerState, setPlayerState]  = useState<PlayerState | null>(null);
  const [enemyState, setEnemyState]    = useState<CombatEnemy | null>(null);
  const [phase, setPhase]              = useState<'idle' | 'running' | 'levelup' | 'done'>('idle');
  const [pendingOffers, setPending]    = useState<LevelUpOffer[]>([]);
  const [combatResult, setResult]      = useState<{ victory: boolean; xpGained: number } | null>(null);
  const logRef     = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---------------------------------------------------------------------------
  // INIT
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!activeEnemy || !player) return;

    const className = (sessionStorage.getItem('playerClassName') ?? 'barbare') as ClassName;
    const name      = sessionStorage.getItem('playerName') ?? player.name;

    const savedRaw = sessionStorage.getItem('combatPlayerState');
    let ps: PlayerState;
    if (savedRaw) {
      ps = JSON.parse(savedRaw) as PlayerState;
      ps.level         = player.level;
      ps.xp            = player.xp;
      ps.xpToNextLevel = player.xpToNextLevel;
      ps.stats.hp      = player.hp;
    } else {
      ps = createPlayer(name, className);
      ps.stats.hp      = player.hp;
      ps.stats.hpMax   = player.maxHp;
      ps.stats.atk     = player.attack;
      ps.stats.def     = player.defense;
      ps.level         = player.level;
      ps.xp            = player.xp;
      ps.xpToNextLevel = player.xpToNextLevel;
    }

    setPlayerState(ps);
    setEnemyState(adaptEnemy(activeEnemy));
    setDisplayed([]);
    setResult(null);
    setPhase('idle');
    setPending([]);
  }, [activeEnemy?.id]);

  // ---------------------------------------------------------------------------
  // LANCER LE COMBAT
  // ---------------------------------------------------------------------------

  const runCombat = useCallback(() => {
    if (!playerState || !enemyState) return;
    setPhase('running');
    setDisplayed([]);

    const result = simulateCombat(playerState, [enemyState]);
    setResult({ victory: result.victory, xpGained: result.xpGained });
    sessionStorage.setItem('combatPlayerState', JSON.stringify(result.finalPlayerState));
    setPlayerState(result.finalPlayerState);

    let idx = 0;
    intervalRef.current = setInterval(() => {
      idx++;
      setDisplayed(prev => [...prev, result.logs[idx - 1]]);
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;

      if (idx >= result.logs.length) {
        clearInterval(intervalRef.current!);
        setTimeout(() => {
          if (result.leveledUp && result.finalPlayerState) {
            const taken = result.finalPlayerState.activeCards.map(c => c.id);
            const offers: LevelUpOffer[] = [];
            for (let l = playerState.level + 1; l <= result.finalPlayerState.level; l++) {
              offers.push(drawLevelUpCards(result.finalPlayerState.className, l, taken));
            }
            setPending(offers);
            setPhase('levelup');
          } else {
            setPhase('done');
          }
        }, 500);
      }
    }, LOG_REPLAY_MS);
  }, [playerState, enemyState]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  // ---------------------------------------------------------------------------
  // CHOISIR UNE CARTE
  // ---------------------------------------------------------------------------

  const handleCardChoice = (idx: 0 | 1 | 2) => {
    if (!playerState || pendingOffers.length === 0) return;
    const updated = applyCard(playerState, pendingOffers[0].cards[idx]);
    setPlayerState(updated);
    sessionStorage.setItem('combatPlayerState', JSON.stringify(updated));
    const remaining = pendingOffers.slice(1);
    setPending(remaining);
    if (remaining.length === 0) setPhase('done');
  };

  // ---------------------------------------------------------------------------
  // FIN DE COMBAT
  // ---------------------------------------------------------------------------

  const handleEndCombat = () => {
    if (!player || !playerState || !combatResult) return;
    const updatedGamePlayer = syncToGamePlayer(playerState, player);

    if (combatResult.victory) {
      if (activeEnemy?.tier === 'boss') {
        dispatch({ type: 'BOSS_DEFEATED', bossName: activeEnemy.name });
      } else {
        dispatch({ type: 'END_COMBAT_WIN', player: updatedGamePlayer });
      }
    } else {
      dispatch({ type: 'END_COMBAT_LOSE', message: `${activeEnemy?.name} vous a vaincu...` });
    }
  };

  // ---------------------------------------------------------------------------
  // RENDU
  // ---------------------------------------------------------------------------

  if (!activeEnemy || !player || !playerState || !enemyState) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col p-4 gap-4 max-w-2xl mx-auto">

      {/* Level Up overlay */}
      {phase === 'levelup' && pendingOffers.length > 0 && (
        <CardChoice offer={pendingOffers[0]} onChoose={handleCardChoice} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-lg text-destructive">⚔️ Combat !</h2>
        <span className="text-xs text-muted-foreground font-pixel">
          {CLASS_LABELS[playerState.className]}
        </span>
      </div>

      {/* Combattants */}
      <div className="grid grid-cols-2 gap-4">

        {/* Joueur */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <p className="font-pixel text-xs text-primary truncate">{playerState.name}</p>
            <span className="text-xs text-muted-foreground">Nv.{playerState.level}</span>
          </div>
          <HpBar hp={playerState.stats.hp} maxHp={playerState.stats.hpMax} />
          <p className="text-xs text-muted-foreground">
            ❤️ {Math.max(playerState.stats.hp, 0)} / {playerState.stats.hpMax}
          </p>
          <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
            <span>⚔️ {playerState.stats.atk}</span>
            <span>🛡️ {playerState.stats.def}</span>
            <span>💨 {playerState.stats.dodge}%</span>
            <span>⏱️ {playerState.stats.cooldown.toFixed(1)}s</span>
          </div>
          {playerState.activeCards.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {playerState.activeCards.slice(-4).map(c => (
                <span key={c.id} className="text-xs px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: RARITY_COLORS[c.rarity] + '22', color: RARITY_COLORS[c.rarity] }}>
                  {c.name}
                </span>
              ))}
            </div>
          )}
          <div className="w-full bg-secondary rounded-full h-1 overflow-hidden">
            <div className="bg-yellow-500 h-full transition-all"
              style={{ width: `${playerState.xpToNextLevel > 0 ? (playerState.xp / playerState.xpToNextLevel) * 100 : 100}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">{playerState.xp} / {playerState.xpToNextLevel} XP</p>
        </div>

        {/* Ennemi */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <p className="font-pixel text-xs text-destructive truncate">{enemyState.name}</p>
            {activeEnemy.tier === 'boss' && <span className="text-xs text-destructive font-pixel">BOSS</span>}
          </div>
          <p className="text-3xl text-center">{enemyState.icon}</p>
          <HpBar hp={enemyState.currentHp} maxHp={enemyState.hpMax} color="bg-red-500" />
          <p className="text-xs text-muted-foreground">
            ❤️ {Math.max(enemyState.currentHp, 0)} / {enemyState.hpMax}
          </p>
          <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
            <span>⚔️ {enemyState.atk}</span>
            <span>🛡️ {enemyState.def}</span>
          </div>
          {enemyState.statusEffects.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {enemyState.statusEffects.map((eff, i) => (
                <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                  {eff.type} ×{eff.stacks}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Minions (Nécromancien) */}
      {playerState.minions.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {playerState.minions.map(m => (
            <div key={m.id} className="bg-card border border-border rounded px-3 py-2 text-xs space-y-1">
              <span className="font-pixel text-muted-foreground">💀 {m.name}</span>
              <HpBar hp={m.hp} maxHp={m.hpMax} />
            </div>
          ))}
        </div>
      )}

      {/* Logs de combat */}
      <div
        ref={logRef}
        className="flex-1 bg-card border border-border rounded-lg p-3 overflow-y-auto font-mono text-xs space-y-0.5 min-h-40 max-h-64"
      >
        {displayedLogs.length === 0 && phase === 'idle' && (
          <p className="text-muted-foreground italic text-center mt-8">
            Appuyez sur "Lancer le combat" pour commencer...
          </p>
        )}
        {displayedLogs.map((entry, i) => {
          const isPlayer = entry.actor === playerState.name;
          const isSystem = entry.actor === 'Système';
          return (
            <div key={i} className={
              isSystem                    ? 'text-yellow-400 font-bold' :
              isPlayer                    ? 'text-blue-400' :
              entry.actor === 'Poison'    ? 'text-purple-400' :
                                            'text-red-400'
            }>
              <span className="text-muted-foreground mr-1">[{(entry.tick / 1000).toFixed(1)}s]</span>
              <span className="font-bold">{entry.actor}</span>
              {' '}{entry.action}
              {entry.value !== undefined && <span className="text-yellow-300"> ({entry.value})</span>}
              {entry.detail && <span className="text-muted-foreground"> — {entry.detail}</span>}
            </div>
          );
        })}
        {phase === 'running' && (
          <div className="text-muted-foreground animate-pulse">⚡ Combat en cours...</div>
        )}
      </div>

      {/* Résultat */}
      {combatResult && phase === 'done' && (
        <div className={`p-4 rounded-lg border text-center font-pixel text-sm ${
          combatResult.victory
            ? 'border-green-500 bg-green-500/10 text-green-400'
            : 'border-destructive bg-destructive/10 text-destructive'
        }`}>
          {combatResult.victory ? '✅ VICTOIRE !' : '💀 DÉFAITE'}
          {combatResult.victory && combatResult.xpGained > 0 && (
            <span className="text-yellow-400 ml-2">+{combatResult.xpGained} XP</span>
          )}
        </div>
      )}

      {/* Boutons */}
      <div className="flex gap-3">
        {phase === 'idle' && (
          <button onClick={runCombat}
            className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-md font-pixel text-xs hover:opacity-90 transition-all">
            ⚔️ Lancer le combat
          </button>
        )}
        {phase === 'done' && (
          <button onClick={handleEndCombat}
            className={`flex-1 px-6 py-3 rounded-md font-pixel text-xs transition-all ${
              combatResult?.victory
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-destructive text-destructive-foreground hover:opacity-90'
            }`}>
            {combatResult?.victory ? "🏆 Continuer l'exploration" : '💀 Retour au menu'}
          </button>
        )}
      </div>

    </div>
  );
}
