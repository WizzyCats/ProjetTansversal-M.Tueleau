// =============================================================================
// CombatScreen.tsx — Système de combat tour par tour
// =============================================================================

import { useEffect, useState, useRef } from 'react';
import { useGame } from '../engine/GameContext';
import type { Player } from '../engine/gameTypes';
import type { Enemy, LootItem } from '../levels/types';
import { generateLoot } from '../levels/lootTables';
import PixelCanvas, { type PixelCanvasHandle } from '../components/PixelCanvas';
import { useSoundFX } from '../hooks/useSoundFX';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

interface CombatLogEntry {
  text: string;
  type: 'player' | 'enemy' | 'system' | 'heal' | 'loot';
}

type CombatPhase = 'player_turn' | 'enemy_turn' | 'victory' | 'defeat' | 'loot';

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const chance = (pct: number) => Math.random() * 100 < pct;

function calcDamage(atk: number, def: number, critChance: number = 10): { dmg: number; crit: boolean } {
  const crit = chance(critChance);
  let base = atk - def;
  if (crit) base = Math.floor(base * 1.8);
  return { dmg: Math.max(base, 1), crit };
}

// Palier XP pour level up
function xpForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5));
}

// Générer des drops après un combat (scrolls, potions, or)
function generateCombatDrops(enemyTier: string, difficulty: number): LootItem[] {
  const count = enemyTier === 'boss' ? rand(3, 5) : enemyTier === 'elite' ? rand(1, 3) : rand(0, 1);
  if (count === 0 && Math.random() > 0.4) return []; // 40% chance de drop même sans count
  const rngState = { val: Math.random() };
  const rng = () => { rngState.val = (rngState.val * 16807 + 0.5) % 1; return rngState.val; };
  return generateLoot(Math.max(count, 1), difficulty, rng);
}

// ---------------------------------------------------------------------------
// BARRE DE PV
// ---------------------------------------------------------------------------

function HpBar({ hp, maxHp, color = 'green' }: { hp: number; maxHp: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const barColor = color === 'red' ? 'bg-red-500' :
    pct > 50 ? 'bg-green-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
      <div className={`${barColor} h-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// COMPOSANT PRINCIPAL
// ---------------------------------------------------------------------------

export default function CombatScreen() {
  const { state, dispatch } = useGame();
  const { activeEnemy, player } = state;
  const sfx = useSoundFX();
  const pixelRef = useRef<PixelCanvasHandle>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // État local du combat
  const [playerHp, setPlayerHp] = useState(0);
  const [enemyHp, setEnemyHp] = useState(0);
  const [enemyMaxHp, setEnemyMaxHp] = useState(0);
  const [phase, setPhase] = useState<CombatPhase>('player_turn');
  const [logs, setLogs] = useState<CombatLogEntry[]>([]);
  const [turn, setTurn] = useState(1);
  const [xpGained, setXpGained] = useState(0);
  const [drops, setDrops] = useState<LootItem[]>([]);
  const [busy, setBusy] = useState(false); // empêche le double-clic

  // Init combat
  useEffect(() => {
    if (!activeEnemy || !player) return;
    setPlayerHp(player.hp);
    setEnemyHp(activeEnemy.hp);
    setEnemyMaxHp(activeEnemy.maxHp);
    setPhase('player_turn');
    setLogs([{ text: `${activeEnemy.name} apparaît !`, type: 'system' }]);
    setTurn(1);
    setXpGained(0);
    setDrops([]);
    setBusy(false);
  }, [activeEnemy?.id]);

  // Auto scroll logs
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  if (!activeEnemy || !player) return null;

  const addLog = (text: string, type: CombatLogEntry['type'] = 'system') => {
    setLogs(prev => [...prev, { text, type }]);
  };

  // ----- ACTIONS DU JOUEUR -----

  const doPlayerAttack = () => {
    if (busy || phase !== 'player_turn') return;
    setBusy(true);

    const { dmg, crit } = calcDamage(player.attack, activeEnemy.defense);
    const newEnemyHp = Math.max(enemyHp - dmg, 0);
    setEnemyHp(newEnemyHp);

    if (crit) {
      addLog(`Coup critique ! Vous infligez ${dmg} dégâts !`, 'player');
      pixelRef.current?.showDamage(dmg, 'crit', 420, 160);
      pixelRef.current?.addEffect('explosion', 420, 180);
      sfx.playLightning();
    } else {
      addLog(`Vous attaquez et infligez ${dmg} dégâts.`, 'player');
      pixelRef.current?.showDamage(dmg, 'enemy', 420, 180);
      pixelRef.current?.addEffect('slash', 420, 180);
      sfx.playHit();
    }

    if (newEnemyHp <= 0) {
      setTimeout(() => handleVictory(), 600);
    } else {
      setTimeout(() => doEnemyTurn(newEnemyHp), 800);
    }
  };

  const doUsePotion = () => {
    if (busy || phase !== 'player_turn') return;

    const potionIndex = player.inventory.findIndex(i => i.type === 'potion');
    if (potionIndex === -1) return;

    setBusy(true);
    const potion = player.inventory[potionIndex];

    // Effet selon la potion
    let healAmount = 20;
    if (potion.name.includes('vie') || potion.name.includes('Élixir')) healAmount = player.maxHp;
    else if (potion.name.includes('force')) healAmount = 0; // buff géré autrement

    const newHp = Math.min(playerHp + healAmount, player.maxHp);
    setPlayerHp(newHp);

    // Retirer la potion de l'inventaire
    const newInventory = [...player.inventory];
    newInventory.splice(potionIndex, 1);
    dispatch({ type: 'SET_PLAYER', player: { ...player, inventory: newInventory } });

    addLog(`Vous utilisez ${potion.name}. +${healAmount} PV !`, 'heal');
    pixelRef.current?.showDamage(healAmount, 'heal', 150, 180);
    pixelRef.current?.addEffect('heal', 150, 180);
    sfx.playHeal();

    setTimeout(() => doEnemyTurn(enemyHp), 800);
  };

  const doUseScroll = () => {
    if (busy || phase !== 'player_turn') return;

    const scrollIndex = player.inventory.findIndex(i => i.type === 'scroll');
    if (scrollIndex === -1) return;

    setBusy(true);
    const scroll = player.inventory[scrollIndex];

    // Dégâts du parchemin (ignore la défense)
    let scrollDmg = rand(20, 40);
    if (scroll.name.includes('feu')) scrollDmg = rand(25, 45);
    else if (scroll.name.includes('gel')) scrollDmg = rand(20, 35);
    else if (scroll.name.includes('téléportation')) {
      // Fuir le combat
      addLog(`Vous utilisez ${scroll.name} et vous téléportez !`, 'system');
      const newInventory = [...player.inventory];
      newInventory.splice(scrollIndex, 1);
      dispatch({ type: 'SET_PLAYER', player: { ...player, inventory: newInventory, hp: playerHp } });
      dispatch({ type: 'END_COMBAT_WIN', player: { ...player, inventory: newInventory, hp: playerHp } });
      return;
    }

    const newEnemyHp = Math.max(enemyHp - scrollDmg, 0);
    setEnemyHp(newEnemyHp);

    // Retirer le scroll
    const newInventory = [...player.inventory];
    newInventory.splice(scrollIndex, 1);
    dispatch({ type: 'SET_PLAYER', player: { ...player, inventory: newInventory } });

    addLog(`${scroll.name} inflige ${scrollDmg} dégâts magiques !`, 'player');
    pixelRef.current?.showDamage(scrollDmg, 'crit', 420, 160);
    pixelRef.current?.addEffect('lightning', 420, 160);
    sfx.playLightning();

    if (newEnemyHp <= 0) {
      setTimeout(() => handleVictory(), 600);
    } else {
      setTimeout(() => doEnemyTurn(newEnemyHp), 800);
    }
  };

  const doFlee = () => {
    if (busy || phase !== 'player_turn') return;
    setBusy(true);

    // 50% de chance de fuir (impossible contre un boss)
    if (activeEnemy.tier === 'boss') {
      addLog('Impossible de fuir face au boss !', 'system');
      setBusy(false);
      return;
    }

    if (chance(50)) {
      addLog('Vous prenez la fuite !', 'system');
      sfx.playMenu();
      setTimeout(() => {
        dispatch({ type: 'END_COMBAT_WIN', player: { ...player, hp: playerHp } });
      }, 500);
    } else {
      addLog('La fuite échoue !', 'system');
      setTimeout(() => doEnemyTurn(enemyHp), 800);
    }
  };

  // ----- TOUR ENNEMI -----

  const doEnemyTurn = (currentEnemyHp: number) => {
    if (currentEnemyHp <= 0) {
      handleVictory();
      return;
    }

    setPhase('enemy_turn');

    // Esquive du joueur (basée sur la classe)
    const dodgeChance = 8;
    if (chance(dodgeChance)) {
      addLog(`${activeEnemy.name} attaque mais vous esquivez !`, 'system');
      pixelRef.current?.showDamage(0, 'miss', 150, 160);
      sfx.playMenu();
      setTimeout(() => {
        setTurn(t => t + 1);
        setPhase('player_turn');
        setBusy(false);
      }, 600);
      return;
    }

    const { dmg, crit } = calcDamage(activeEnemy.attack, player.defense, 5);
    const newPlayerHp = Math.max(playerHp - dmg, 0);
    setPlayerHp(newPlayerHp);

    if (crit) {
      addLog(`${activeEnemy.name} porte un coup critique ! ${dmg} dégâts !`, 'enemy');
      pixelRef.current?.showDamage(dmg, 'crit', 150, 160);
      pixelRef.current?.addEffect('explosion', 150, 180);
    } else {
      addLog(`${activeEnemy.name} attaque et inflige ${dmg} dégâts.`, 'enemy');
      pixelRef.current?.showDamage(dmg, 'player', 150, 180);
      pixelRef.current?.addEffect('slash', 150, 180);
    }
    sfx.playHit();

    if (newPlayerHp <= 0) {
      setTimeout(() => {
        setPhase('defeat');
        sfx.playDeath();
        addLog('Vous avez été vaincu...', 'system');
      }, 600);
    } else {
      setTimeout(() => {
        setTurn(t => t + 1);
        setPhase('player_turn');
        setBusy(false);
      }, 600);
    }
  };

  // ----- VICTOIRE -----

  const handleVictory = () => {
    const xp = activeEnemy.xpReward;
    const goldDrop = rand(5, 15 + activeEnemy.xpReward);
    const combatDrops = generateCombatDrops(activeEnemy.tier, 3);
    setXpGained(xp);
    setDrops(combatDrops);
    setPhase('loot');
    sfx.playLevelUp();

    addLog(`${activeEnemy.name} est vaincu !`, 'system');
    addLog(`+${xp} XP, +${goldDrop} or`, 'loot');
    if (combatDrops.length > 0) {
      combatDrops.forEach(d => addLog(`Trouvé : ${d.icon} ${d.name}`, 'loot'));
    }

    pixelRef.current?.addEffect('explosion', 420, 180);

    // Calcul du level up
    let newXp = player.xp + xp;
    let newLevel = player.level;
    let newMaxHp = player.maxHp;
    let newAtk = player.attack;
    let newDef = player.defense;
    let xpNeeded = player.xpToNextLevel;

    while (newXp >= xpNeeded && newLevel < 20) {
      newXp -= xpNeeded;
      newLevel++;
      newMaxHp += 8;
      newAtk += 2;
      newDef += 1;
      xpNeeded = xpForLevel(newLevel + 1);
      addLog(`LEVEL UP ! Niveau ${newLevel} !`, 'system');
      sfx.playLevelUp();
    }

    // Mettre à jour le joueur
    const updatedPlayer: Player = {
      ...player,
      hp: Math.min(playerHp, newMaxHp),
      maxHp: newMaxHp,
      attack: newAtk,
      defense: newDef,
      level: newLevel,
      xp: newXp,
      xpToNextLevel: xpNeeded,
      gold: player.gold + goldDrop,
      inventory: [...player.inventory, ...combatDrops],
    };

    // On stocke pour le bouton "Continuer"
    setPlayerHp(updatedPlayer.hp);
    dispatch({ type: 'SET_PLAYER', player: updatedPlayer });
  };

  // ----- FIN DE COMBAT -----

  const handleEndCombat = () => {
    const updatedPlayer = { ...player, hp: playerHp };

    if (phase === 'victory' || phase === 'loot') {
      if (activeEnemy.tier === 'boss') {
        dispatch({ type: 'BOSS_DEFEATED', bossName: activeEnemy.name });
      } else {
        dispatch({ type: 'END_COMBAT_WIN', player: updatedPlayer });
      }
    } else {
      dispatch({ type: 'END_COMBAT_LOSE', message: `${activeEnemy.name} vous a vaincu...` });
    }
  };

  // ----- RENDU -----

  const potionCount = player.inventory.filter(i => i.type === 'potion').length;
  const scrollCount = player.inventory.filter(i => i.type === 'scroll').length;

  return (
    <div className="min-h-screen bg-background flex flex-col p-4 gap-4 max-w-2xl mx-auto relative">

      {/* Canvas overlay pour les effets visuels */}
      <PixelCanvas ref={pixelRef} active={phase === 'player_turn' || phase === 'enemy_turn'} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-lg text-destructive">Combat !</h2>
        <span className="text-xs text-muted-foreground font-pixel">Tour {turn}</span>
      </div>

      {/* Combattants */}
      <div className="grid grid-cols-2 gap-4">

        {/* Joueur */}
        <div className={`bg-card border rounded-lg p-4 space-y-2 transition-all ${
          phase === 'player_turn' ? 'border-primary' : 'border-border'
        }`}>
          <div className="flex justify-between items-center">
            <p className="font-pixel text-xs text-primary truncate">{player.name}</p>
            <span className="text-xs text-muted-foreground">Nv.{player.level}</span>
          </div>
          <HpBar hp={playerHp} maxHp={player.maxHp} />
          <p className="text-xs text-muted-foreground">
            {Math.max(playerHp, 0)} / {player.maxHp} PV
          </p>
          <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
            <span>ATK {player.attack}</span>
            <span>DEF {player.defense}</span>
          </div>
          {/* Barre XP */}
          <div className="w-full bg-secondary rounded-full h-1 overflow-hidden">
            <div className="bg-yellow-500 h-full transition-all"
              style={{ width: `${player.xpToNextLevel > 0 ? (player.xp / player.xpToNextLevel) * 100 : 100}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">{player.xp} / {player.xpToNextLevel} XP</p>
        </div>

        {/* Ennemi */}
        <div className={`bg-card border rounded-lg p-4 space-y-2 transition-all ${
          phase === 'enemy_turn' ? 'border-destructive' : 'border-border'
        }`}>
          <div className="flex justify-between items-center">
            <p className="font-pixel text-xs text-destructive truncate">{activeEnemy.name}</p>
            {activeEnemy.tier === 'boss' && <span className="text-xs text-destructive font-pixel">BOSS</span>}
          </div>
          <p className="text-3xl text-center">{activeEnemy.icon}</p>
          <HpBar hp={enemyHp} maxHp={enemyMaxHp} color="red" />
          <p className="text-xs text-muted-foreground">
            {Math.max(enemyHp, 0)} / {enemyMaxHp} PV
          </p>
          <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
            <span>ATK {activeEnemy.attack}</span>
            <span>DEF {activeEnemy.defense}</span>
          </div>
        </div>
      </div>

      {/* Log de combat */}
      <div
        ref={logRef}
        className="flex-1 bg-card border border-border rounded-lg p-3 overflow-y-auto font-mono text-xs space-y-0.5 min-h-32 max-h-48"
      >
        {logs.map((entry, i) => (
          <div key={i} className={
            entry.type === 'player'  ? 'text-blue-400' :
            entry.type === 'enemy'   ? 'text-red-400' :
            entry.type === 'heal'    ? 'text-green-400' :
            entry.type === 'loot'    ? 'text-yellow-400' :
                                       'text-muted-foreground'
          }>
            {entry.text}
          </div>
        ))}
      </div>

      {/* Drops après victoire */}
      {phase === 'loot' && drops.length > 0 && (
        <div className="bg-card border border-yellow-500/30 rounded-lg p-3 space-y-2">
          <p className="font-pixel text-xs text-yellow-400">Butin obtenu :</p>
          <div className="flex flex-wrap gap-2">
            {drops.map((item, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded bg-secondary text-foreground">
                {item.icon} {item.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Résultat */}
      {(phase === 'loot') && (
        <div className="p-3 rounded-lg border border-green-500 bg-green-500/10 text-center font-pixel text-sm text-green-400">
          VICTOIRE ! +{xpGained} XP
        </div>
      )}
      {phase === 'defeat' && (
        <div className="p-3 rounded-lg border border-destructive bg-destructive/10 text-center font-pixel text-sm text-destructive">
          DEFAITE
        </div>
      )}

      {/* Actions du joueur */}
      <div className="flex gap-2 flex-wrap">
        {phase === 'player_turn' && (
          <>
            <button onClick={doPlayerAttack} disabled={busy}
              className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-md font-pixel text-xs hover:opacity-90 transition-all disabled:opacity-40">
              Attaquer
            </button>
            <button onClick={doUseScroll} disabled={busy || scrollCount === 0}
              className="px-4 py-3 bg-purple-600 text-white rounded-md font-pixel text-xs hover:opacity-90 transition-all disabled:opacity-30"
              title={scrollCount > 0 ? `${scrollCount} parchemin(s)` : 'Aucun parchemin'}>
              Capacite ({scrollCount})
            </button>
            <button onClick={doUsePotion} disabled={busy || potionCount === 0}
              className="px-4 py-3 bg-green-600 text-white rounded-md font-pixel text-xs hover:opacity-90 transition-all disabled:opacity-30"
              title={potionCount > 0 ? `${potionCount} potion(s)` : 'Aucune potion'}>
              Potion ({potionCount})
            </button>
            <button onClick={doFlee} disabled={busy}
              className="px-4 py-3 bg-secondary text-secondary-foreground rounded-md font-pixel text-xs hover:opacity-80 transition-all disabled:opacity-40">
              Fuir
            </button>
          </>
        )}
        {phase === 'enemy_turn' && (
          <div className="flex-1 text-center py-3 font-pixel text-xs text-muted-foreground animate-pulse">
            Tour de l'ennemi...
          </div>
        )}
        {(phase === 'loot' || phase === 'defeat') && (
          <button onClick={handleEndCombat}
            className={`flex-1 px-6 py-3 rounded-md font-pixel text-xs transition-all ${
              phase === 'loot'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-destructive text-destructive-foreground hover:opacity-90'
            }`}>
            {phase === 'loot' ? "Continuer" : 'Retour au menu'}
          </button>
        )}
      </div>

    </div>
  );
}
