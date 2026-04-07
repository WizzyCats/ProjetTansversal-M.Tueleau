// =============================================================================
// CombatScreen.tsx — Combat tour par tour avec compétences
// =============================================================================

import { useEffect, useState, useRef } from 'react';
import { useGame } from '../engine/GameContext';
import type { Player } from '../engine/gameTypes';
import type { LootItem } from '../levels/types';
import { generateLoot } from '../levels/lootTables';
import { getRandomScrollDrop, type Skill } from '../combat/skills';
import PixelCanvas, { type PixelCanvasHandle } from '../components/PixelCanvas';
import { useSoundFX } from '../hooks/useSoundFX';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

interface LogEntry { text: string; type: 'player' | 'enemy' | 'system' | 'heal' | 'loot'; }
type Phase = 'player_turn' | 'enemy_turn' | 'victory' | 'defeat' | 'loot' | 'learn_skill';

interface StatusEffects {
  poisonDmg: number;
  poisonTurns: number;
  summonDmg: number;
  summonTurns: number;
  atkBuff: number;
  defBuff: number;
  enemyAtkDebuff: number;
  shieldPercent: number;
  guaranteedDodge: boolean;
  skipEnemyTurn: boolean;
}

const EMPTY_STATUS: StatusEffects = {
  poisonDmg: 0, poisonTurns: 0, summonDmg: 0, summonTurns: 0,
  atkBuff: 0, defBuff: 0, enemyAtkDebuff: 0, shieldPercent: 0,
  guaranteedDodge: false, skipEnemyTurn: false,
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const chance = (pct: number) => Math.random() * 100 < pct;

function xpForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5));
}

function generateCombatDrops(tier: string): LootItem[] {
  const count = tier === 'boss' ? rand(3, 5) : tier === 'elite' ? rand(1, 3) : rand(0, 1);
  if (count === 0) return [];
  const rng = () => Math.random();
  return generateLoot(count, 3, rng);
}

// ---------------------------------------------------------------------------
// BARRE
// ---------------------------------------------------------------------------

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
      <div className={`${color} h-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function HpBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const pct = (hp / maxHp) * 100;
  const color = pct > 50 ? 'bg-green-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500';
  return <Bar value={hp} max={maxHp} color={color} />;
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

  const [playerHp, setPlayerHp] = useState(0);
  const [resource, setResource] = useState(0);
  const [enemyHp, setEnemyHp] = useState(0);
  const [enemyMaxHp, setEnemyMaxHp] = useState(0);
  const [phase, setPhase] = useState<Phase>('player_turn');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [turn, setTurn] = useState(1);
  const [xpGained, setXpGained] = useState(0);
  const [drops, setDrops] = useState<LootItem[]>([]);
  const [scrollDrop, setScrollDrop] = useState<Skill | null>(null);
  const [status, setStatus] = useState<StatusEffects>({ ...EMPTY_STATUS });
  const [busy, setBusy] = useState(false);

  // Init — ressource pleine à chaque nouveau combat
  useEffect(() => {
    if (!activeEnemy || !player) return;
    setPlayerHp(player.hp);
    setResource(player.maxResource);
    setEnemyHp(activeEnemy.hp);
    setEnemyMaxHp(activeEnemy.maxHp);
    setPhase('player_turn');
    setLogs([{ text: `${activeEnemy.name} apparait !`, type: 'system' }]);
    setTurn(1);
    setXpGained(0);
    setDrops([]);
    setScrollDrop(null);
    setStatus({ ...EMPTY_STATUS });
    setBusy(false);
  }, [activeEnemy?.id]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  if (!activeEnemy || !player) return null;

  const addLog = (text: string, type: LogEntry['type'] = 'system') => {
    setLogs(prev => [...prev, { text, type }]);
  };

  const effectiveAtk = player.attack + status.atkBuff;
  const effectiveDef = player.defense + status.defBuff;
  const effectiveEnemyAtk = Math.max(activeEnemy.attack - status.enemyAtkDebuff, 1);
  const resLabel = player.resourceType === 'mana' ? 'Mana' : 'Stamina';

  // ===== UTILISER UNE COMPÉTENCE =====

  const useSkill = (skill: Skill) => {
    if (busy || phase !== 'player_turn') return;
    if (resource < skill.cost) return;
    setBusy(true);

    const newResource = resource - skill.cost;
    setResource(newResource);

    const eff = skill.effect;
    const newStatus = { ...status };

    // Dégâts
    let dmg = 0;
    if (eff.damageMultiplier && eff.damageMultiplier > 0) {
      dmg = Math.max(Math.round(effectiveAtk * eff.damageMultiplier) - activeEnemy.defense, 1);
    }
    // Chaos : dégâts aléatoires
    if (eff.chaosMin !== undefined && eff.chaosMax !== undefined) {
      const mult = eff.chaosMin + Math.random() * (eff.chaosMax - eff.chaosMin);
      dmg = Math.max(Math.round(effectiveAtk * mult) - activeEnemy.defense, 1);
    }

    let newEnemyHp = enemyHp;
    if (dmg > 0) {
      newEnemyHp = Math.max(enemyHp - dmg, 0);
      setEnemyHp(newEnemyHp);

      const isBig = dmg > effectiveAtk;
      addLog(`${skill.icon} ${skill.name} inflige ${dmg} degats !`, 'player');
      pixelRef.current?.showDamage(dmg, isBig ? 'crit' : 'enemy', 420, 180);
      pixelRef.current?.addEffect(isBig ? 'explosion' : 'slash', 420, 180);
      sfx.playHit();
    } else if (!eff.damageMultiplier || eff.damageMultiplier === 0) {
      addLog(`${skill.icon} ${skill.name} !`, 'player');
    }

    // Drain de vie
    if (eff.healPercent && dmg > 0) {
      const heal = Math.round(dmg * eff.healPercent / 100);
      const newHp = Math.min(playerHp + heal, player.maxHp);
      setPlayerHp(newHp);
      addLog(`Drain : +${heal} PV`, 'heal');
      pixelRef.current?.showDamage(heal, 'heal', 150, 180);
      sfx.playHeal();
    }

    // Buffs
    if (eff.atkBuff) {
      newStatus.atkBuff += eff.atkBuff;
      addLog(`ATK +${eff.atkBuff} pour le combat !`, 'system');
      sfx.playSparkle();
    }
    if (eff.defBuff) {
      newStatus.defBuff += eff.defBuff;
      addLog(`DEF +${eff.defBuff} pour le combat !`, 'system');
    }

    // Debuffs ennemi
    if (eff.enemyAtkDebuff) {
      newStatus.enemyAtkDebuff += eff.enemyAtkDebuff;
      addLog(`ATK ennemi -${eff.enemyAtkDebuff} !`, 'system');
    }

    // Poison
    if (eff.poisonDmg && eff.poisonDuration) {
      newStatus.poisonDmg = Math.max(newStatus.poisonDmg, eff.poisonDmg);
      newStatus.poisonTurns = Math.max(newStatus.poisonTurns, eff.poisonDuration);
      addLog(`Poison applique : ${eff.poisonDmg} dmg/tour pendant ${eff.poisonDuration} tours`, 'player');
      pixelRef.current?.addEffect('petal', 420, 200);
    }

    // Invocation
    if (eff.summonDmg && eff.summonDuration) {
      newStatus.summonDmg = eff.summonDmg;
      newStatus.summonTurns = eff.summonDuration;
      addLog(`Spectre invoque : ${eff.summonDmg} dmg/tour pendant ${eff.summonDuration} tours`, 'player');
      sfx.playSparkle();
    }

    // Bouclier
    if (eff.shieldPercent) {
      newStatus.shieldPercent = eff.shieldPercent;
      addLog(`Bouclier : -${eff.shieldPercent}% prochain coup`, 'system');
    }

    // Esquive garantie
    if (eff.guaranteedDodge) {
      newStatus.guaranteedDodge = true;
      addLog('Esquive garantie au prochain tour !', 'system');
    }

    // Skip ennemi
    if (eff.skipEnemyChance && chance(eff.skipEnemyChance)) {
      newStatus.skipEnemyTurn = true;
      addLog('L\'ennemi est immobilise !', 'system');
    }

    setStatus(newStatus);

    if (newEnemyHp <= 0) {
      setTimeout(() => handleVictory(), 600);
    } else {
      setTimeout(() => doEnemyTurn(newEnemyHp, newStatus), 800);
    }
  };

  // ===== UTILISER UNE POTION =====

  const usePotion = () => {
    if (busy || phase !== 'player_turn') return;
    const idx = player.inventory.findIndex(i => i.type === 'potion');
    if (idx === -1) return;
    setBusy(true);

    const potion = player.inventory[idx];
    let heal = 20;
    if (potion.name.includes('vie') || potion.name.includes('lixir')) heal = player.maxHp - playerHp;
    if (potion.name.includes('force')) { heal = 0; status.atkBuff += 5; setStatus({ ...status }); addLog('ATK +5 !', 'system'); }

    if (heal > 0) {
      setPlayerHp(Math.min(playerHp + heal, player.maxHp));
      addLog(`${potion.name} : +${heal} PV`, 'heal');
      pixelRef.current?.showDamage(heal, 'heal', 150, 180);
      sfx.playHeal();
    }

    const inv = [...player.inventory]; inv.splice(idx, 1);
    dispatch({ type: 'SET_PLAYER', player: { ...player, inventory: inv } });

    setTimeout(() => doEnemyTurn(enemyHp, status), 800);
  };

  // ===== FUIR =====

  const doFlee = () => {
    if (busy || phase !== 'player_turn') return;
    setBusy(true);
    if (chance(50)) {
      addLog('Fuite reussie !', 'system');
      sfx.playMenu();
      setTimeout(() => dispatch({ type: 'END_COMBAT_WIN', player: { ...player, hp: playerHp, resource } }), 500);
    } else {
      addLog('Fuite echouee !', 'system');
      setTimeout(() => doEnemyTurn(enemyHp, status), 800);
    }
  };

  // ===== TOUR ENNEMI =====

  const doEnemyTurn = (curEnemyHp: number, curStatus: StatusEffects) => {
    if (curEnemyHp <= 0) { handleVictory(); return; }
    setPhase('enemy_turn');
    let hpAfterDot = curEnemyHp;

    // Poison tick
    if (curStatus.poisonTurns > 0) {
      hpAfterDot = Math.max(curEnemyHp - curStatus.poisonDmg, 0);
      setEnemyHp(hpAfterDot);
      addLog(`Poison : ${curStatus.poisonDmg} degats`, 'player');
      pixelRef.current?.showDamage(curStatus.poisonDmg, 'enemy', 450, 200);
      curStatus.poisonTurns--;
      setStatus({ ...curStatus });
      if (hpAfterDot <= 0) { setTimeout(() => handleVictory(), 600); return; }
    }

    // Invocation tick
    if (curStatus.summonTurns > 0) {
      hpAfterDot = Math.max(hpAfterDot - curStatus.summonDmg, 0);
      setEnemyHp(hpAfterDot);
      addLog(`Spectre : ${curStatus.summonDmg} degats`, 'player');
      pixelRef.current?.showDamage(curStatus.summonDmg, 'enemy', 430, 220);
      curStatus.summonTurns--;
      setStatus({ ...curStatus });
      if (hpAfterDot <= 0) { setTimeout(() => handleVictory(), 600); return; }
    }

    // Skip tour ennemi
    if (curStatus.skipEnemyTurn) {
      curStatus.skipEnemyTurn = false;
      setStatus({ ...curStatus });
      addLog(`${activeEnemy.name} est immobilise et passe son tour !`, 'system');
      setTimeout(() => endEnemyTurn(curStatus), 600);
      return;
    }

    // Esquive
    if (curStatus.guaranteedDodge) {
      curStatus.guaranteedDodge = false;
      setStatus({ ...curStatus });
      addLog(`Vous esquivez l'attaque !`, 'system');
      pixelRef.current?.showDamage(0, 'miss', 150, 160);
      sfx.playMenu();
      setTimeout(() => endEnemyTurn(curStatus), 600);
      return;
    }

    if (chance(8)) {
      addLog(`${activeEnemy.name} rate son attaque !`, 'system');
      pixelRef.current?.showDamage(0, 'miss', 150, 160);
      setTimeout(() => endEnemyTurn(curStatus), 600);
      return;
    }

    // Attaque
    const rawAtk = Math.max(activeEnemy.attack - curStatus.enemyAtkDebuff, 1);
    let dmg = Math.max(rawAtk - effectiveDef, 1);
    const crit = chance(5);
    if (crit) dmg = Math.round(dmg * 1.8);

    // Bouclier
    if (curStatus.shieldPercent > 0) {
      dmg = Math.round(dmg * (1 - curStatus.shieldPercent / 100));
      curStatus.shieldPercent = 0;
      setStatus({ ...curStatus });
      addLog('Le bouclier absorbe une partie des degats !', 'system');
    }

    dmg = Math.max(dmg, 1);
    const newHp = Math.max(playerHp - dmg, 0);
    setPlayerHp(newHp);

    addLog(`${activeEnemy.name} ${crit ? 'CRIT !' : 'attaque :'} ${dmg} degats`, 'enemy');
    pixelRef.current?.showDamage(dmg, crit ? 'crit' : 'player', 150, 180);
    pixelRef.current?.addEffect('slash', 150, 180);
    sfx.playHit();

    if (newHp <= 0) {
      setTimeout(() => { setPhase('defeat'); sfx.playDeath(); addLog('Vous etes vaincu...', 'system'); }, 600);
    } else {
      setTimeout(() => endEnemyTurn(curStatus), 600);
    }
  };

  const endEnemyTurn = (curStatus: StatusEffects) => {
    // Regen de ressource
    const newRes = Math.min(resource + player.resourceRegen, player.maxResource);
    setResource(newRes);
    setTurn(t => t + 1);
    setPhase('player_turn');
    setBusy(false);
  };

  // ===== VICTOIRE =====

  const handleVictory = () => {
    const xp = activeEnemy.xpReward;
    const goldDrop = rand(5, 15 + activeEnemy.xpReward);
    const combatDrops = generateCombatDrops(activeEnemy.tier);
    setXpGained(xp);
    setDrops(combatDrops);

    // Drop de parchemin de compétence (30% chance, 60% sur boss)
    const scrollChance = activeEnemy.tier === 'boss' ? 60 : 30;
    const scroll = chance(scrollChance) ? getRandomScrollDrop(player.className) : null;
    setScrollDrop(scroll);

    sfx.playLevelUp();
    addLog(`${activeEnemy.name} est vaincu !`, 'system');
    addLog(`+${xp} XP, +${goldDrop} or`, 'loot');
    combatDrops.forEach(d => addLog(`${d.icon} ${d.name}`, 'loot'));
    if (scroll) addLog(`Parchemin de competence : ${scroll.icon} ${scroll.name} !`, 'loot');

    pixelRef.current?.addEffect('explosion', 420, 180);

    // Level up
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
      resource,
      inventory: [...player.inventory, ...combatDrops],
    };
    dispatch({ type: 'SET_PLAYER', player: updatedPlayer });

    setPhase(scroll ? 'learn_skill' : 'loot');
  };

  // ===== APPRENDRE UNE COMPÉTENCE (parchemin) =====

  const learnSkill = (slotIndex: number) => {
    if (!scrollDrop) return;
    const newSkills = [...player.skills];
    newSkills[slotIndex] = scrollDrop;
    dispatch({ type: 'SET_PLAYER', player: { ...player, skills: newSkills } });
    sfx.playSparkle();
    addLog(`${scrollDrop.name} appris en slot ${slotIndex + 1} !`, 'system');
    setScrollDrop(null);
    setPhase('loot');
  };

  const skipScroll = () => {
    setScrollDrop(null);
    setPhase('loot');
  };

  // ===== FIN DE COMBAT =====

  const handleEndCombat = () => {
    if (phase === 'loot') {
      if (activeEnemy.tier === 'boss') {
        dispatch({ type: 'BOSS_DEFEATED', bossName: activeEnemy.name });
      } else {
        dispatch({ type: 'END_COMBAT_WIN', player: { ...player, hp: playerHp, resource } });
      }
    } else {
      dispatch({ type: 'END_COMBAT_LOSE', message: `${activeEnemy.name} vous a vaincu...` });
    }
  };

  // ===== RENDU =====

  const potionCount = player.inventory.filter(i => i.type === 'potion').length;

  return (
    <div className="min-h-screen bg-background flex flex-col p-4 gap-3 max-w-2xl mx-auto relative">
      <PixelCanvas ref={pixelRef} active={phase === 'player_turn' || phase === 'enemy_turn'} />

      {/* Overlay apprentissage compétence */}
      {phase === 'learn_skill' && scrollDrop && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg space-y-4">
            <h3 className="font-pixel text-sm text-primary text-center">
              Parchemin trouve : {scrollDrop.icon} {scrollDrop.name}
            </h3>
            <p className="text-xs text-muted-foreground text-center">{scrollDrop.description}</p>
            <p className="text-xs text-center text-muted-foreground">Cout : {scrollDrop.cost} {resLabel}</p>
            <p className="font-pixel text-xs text-center text-yellow-400 mt-2">Remplacer quelle competence ?</p>
            <div className="grid grid-cols-2 gap-3">
              {player.skills.map((sk, i) => (
                <button key={i} onClick={() => learnSkill(i)}
                  className="p-3 rounded-lg border border-border bg-secondary hover:border-primary text-left transition-all">
                  <p className="font-pixel text-xs">{sk.icon} {sk.name}</p>
                  <p className="text-xs text-muted-foreground">{sk.cost} {resLabel} — {sk.description}</p>
                </button>
              ))}
            </div>
            <button onClick={skipScroll}
              className="w-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-all">
              Ignorer le parchemin
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-lg text-destructive">Combat</h2>
        <span className="text-xs text-muted-foreground font-pixel">Tour {turn}</span>
      </div>

      {/* Combattants */}
      <div className="grid grid-cols-2 gap-4">
        {/* Joueur */}
        <div className={`bg-card border rounded-lg p-3 space-y-1 transition-all ${
          phase === 'player_turn' ? 'border-primary' : 'border-border'}`}>
          <div className="flex justify-between items-center">
            <p className="font-pixel text-xs text-primary truncate">{player.name}</p>
            <span className="text-xs text-muted-foreground">Nv.{player.level}</span>
          </div>
          <HpBar hp={playerHp} maxHp={player.maxHp} />
          <p className="text-xs text-muted-foreground">{Math.max(playerHp, 0)} / {player.maxHp} PV</p>
          <Bar value={resource} max={player.maxResource}
            color={player.resourceType === 'mana' ? 'bg-blue-500' : 'bg-yellow-500'} />
          <p className="text-xs text-muted-foreground">{resource} / {player.maxResource} {resLabel}</p>
          <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
            <span>ATK {effectiveAtk}{status.atkBuff > 0 ? ` (+${status.atkBuff})` : ''}</span>
            <span>DEF {effectiveDef}{status.defBuff > 0 ? ` (+${status.defBuff})` : ''}</span>
          </div>
          {/* Indicateurs de statut */}
          <div className="flex flex-wrap gap-1">
            {status.poisonTurns > 0 && <span className="text-xs px-1 rounded bg-green-500/20 text-green-400">Poison {status.poisonTurns}t</span>}
            {status.summonTurns > 0 && <span className="text-xs px-1 rounded bg-purple-500/20 text-purple-400">Spectre {status.summonTurns}t</span>}
            {status.guaranteedDodge && <span className="text-xs px-1 rounded bg-blue-500/20 text-blue-400">Esquive</span>}
            {status.shieldPercent > 0 && <span className="text-xs px-1 rounded bg-cyan-500/20 text-cyan-400">Bouclier</span>}
          </div>
        </div>

        {/* Ennemi */}
        <div className={`bg-card border rounded-lg p-3 space-y-1 transition-all ${
          phase === 'enemy_turn' ? 'border-destructive' : 'border-border'}`}>
          <div className="flex justify-between items-center">
            <p className="font-pixel text-xs text-destructive truncate">{activeEnemy.name}</p>
            {activeEnemy.tier === 'boss' && <span className="text-xs text-destructive font-pixel">BOSS</span>}
          </div>
          <p className="text-3xl text-center">{activeEnemy.icon}</p>
          <Bar value={enemyHp} max={enemyMaxHp} color="bg-red-500" />
          <p className="text-xs text-muted-foreground">{Math.max(enemyHp, 0)} / {enemyMaxHp} PV</p>
          <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
            <span>ATK {effectiveEnemyAtk}{status.enemyAtkDebuff > 0 ? ` (-${status.enemyAtkDebuff})` : ''}</span>
            <span>DEF {activeEnemy.defense}</span>
          </div>
        </div>
      </div>

      {/* Log */}
      <div ref={logRef}
        className="flex-1 bg-card border border-border rounded-lg p-3 overflow-y-auto font-mono text-xs space-y-0.5 min-h-28 max-h-40">
        {logs.map((e, i) => (
          <div key={i} className={
            e.type === 'player' ? 'text-blue-400' : e.type === 'enemy' ? 'text-red-400' :
            e.type === 'heal' ? 'text-green-400' : e.type === 'loot' ? 'text-yellow-400' : 'text-muted-foreground'
          }>{e.text}</div>
        ))}
      </div>

      {/* Drops */}
      {phase === 'loot' && drops.length > 0 && (
        <div className="bg-card border border-yellow-500/30 rounded-lg p-3 space-y-1">
          <p className="font-pixel text-xs text-yellow-400">Butin :</p>
          <div className="flex flex-wrap gap-2">
            {drops.map((item, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded bg-secondary">{item.icon} {item.name}</span>
            ))}
          </div>
        </div>
      )}

      {/* Résultat */}
      {phase === 'loot' && (
        <div className="p-3 rounded-lg border border-green-500 bg-green-500/10 text-center font-pixel text-sm text-green-400">
          VICTOIRE ! +{xpGained} XP
        </div>
      )}
      {phase === 'defeat' && (
        <div className="p-3 rounded-lg border border-destructive bg-destructive/10 text-center font-pixel text-sm text-destructive">
          DEFAITE
        </div>
      )}

      {/* Compétences / Actions */}
      <div className="space-y-2">
        {phase === 'player_turn' && (
          <>
            {/* Skills */}
            <div className="grid grid-cols-2 gap-2">
              {player.skills.map((skill) => (
                <button key={skill.id}
                  onClick={() => useSkill(skill)}
                  disabled={busy || resource < skill.cost}
                  className="px-3 py-2 bg-card border border-border rounded-md text-left hover:border-primary transition-all disabled:opacity-30"
                  title={skill.description}>
                  <div className="flex justify-between items-center">
                    <span className="font-pixel text-xs">{skill.icon} {skill.name}</span>
                    <span className={`text-xs ${resource >= skill.cost ? 'text-yellow-400' : 'text-red-400'}`}>
                      {skill.cost} {resLabel.slice(0, 3)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{skill.description}</p>
                </button>
              ))}
            </div>
            {/* Actions secondaires */}
            <div className="flex gap-2">
              <button onClick={usePotion} disabled={busy || potionCount === 0}
                className="flex-1 px-3 py-2 bg-green-600/80 text-white rounded-md font-pixel text-xs hover:opacity-90 disabled:opacity-30">
                Potion ({potionCount})
              </button>
              <button onClick={doFlee} disabled={busy || activeEnemy.tier === 'boss'}
                className="flex-1 px-3 py-2 bg-secondary text-secondary-foreground rounded-md font-pixel text-xs hover:opacity-80 disabled:opacity-40">
                {activeEnemy.tier === 'boss' ? 'Pas de fuite' : 'Fuir'}
              </button>
            </div>
          </>
        )}
        {phase === 'enemy_turn' && (
          <div className="text-center py-3 font-pixel text-xs text-muted-foreground animate-pulse">
            Tour de l'ennemi...
          </div>
        )}
        {(phase === 'loot' || phase === 'defeat') && (
          <button onClick={handleEndCombat}
            className={`w-full px-6 py-3 rounded-md font-pixel text-xs transition-all ${
              phase === 'loot' ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-destructive text-destructive-foreground hover:opacity-90'}`}>
            {phase === 'loot' ? "Continuer" : 'Retour au menu'}
          </button>
        )}
      </div>
    </div>
  );
}
