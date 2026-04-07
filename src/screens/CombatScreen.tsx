// =============================================================================
// CombatScreen.tsx — Combat tour par tour style Pokemon Game Boy
// =============================================================================

import { useEffect, useState, useRef } from 'react';
import { useGame } from '../engine/GameContext';
import type { Player } from '../engine/gameTypes';
import type { LootItem } from '../levels/types';
import { generateLoot } from '../levels/lootTables';
import { getRandomScrollDrop, type Skill } from '../combat/skills';
import PixelSprite, { getEnemySpriteName, getHeroSpriteName } from '../components/PixelSprite';
import { useSoundFX } from '../hooks/useSoundFX';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

interface LogEntry { text: string; type: 'player' | 'enemy' | 'system' | 'heal' | 'loot'; }
type Phase = 'player_turn' | 'enemy_turn' | 'victory' | 'defeat' | 'loot' | 'learn_skill';

interface StatusEffects {
  poisonDmg: number; poisonTurns: number;
  summonDmg: number; summonTurns: number;
  atkBuff: number; defBuff: number;
  enemyAtkDebuff: number; shieldPercent: number;
  guaranteedDodge: boolean; skipEnemyTurn: boolean;
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
function xpForLevel(level: number) { return Math.round(100 * Math.pow(level, 1.5)); }

function generateCombatDrops(tier: string): LootItem[] {
  // Boss : 100% drop 2-3 items
  if (tier === 'boss') return generateLoot(rand(2, 3), 3, () => Math.random());
  // Elite : 25% chance de drop 1 item
  if (tier === 'elite') return chance(25) ? generateLoot(1, 3, () => Math.random()) : [];
  // Minion : 10% chance de drop 1 item
  return chance(10) ? generateLoot(1, 3, () => Math.random()) : [];
}

// ---------------------------------------------------------------------------
// DAMAGE NUMBER FLOTTANT (React, pas canvas)
// ---------------------------------------------------------------------------

interface FloatingDmg { id: number; value: string; color: string; x: 'left' | 'right'; }
let dmgId = 0;

function DamageNumber({ dmg, onDone }: { dmg: FloatingDmg; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 1200); return () => clearTimeout(t); }, []);
  return (
    <div className={`absolute ${dmg.x === 'left' ? 'left-1/4' : 'right-1/4'} top-1/3 font-pixel text-lg animate-bounce pointer-events-none z-20`}
      style={{ color: dmg.color, textShadow: '2px 2px 0 #000' }}>
      {dmg.value}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BARRE
// ---------------------------------------------------------------------------

function Bar({ value, max, color, height = 'h-3' }: { value: number; max: number; color: string; height?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`w-full bg-black/40 rounded-sm ${height} overflow-hidden border border-white/10`}>
      <div className={`${color} ${height} transition-all duration-500`} style={{ width: `${pct}%` }} />
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
  const [floatingDmgs, setFloatingDmgs] = useState<FloatingDmg[]>([]);
  const [shakeEnemy, setShakeEnemy] = useState(false);
  const [shakePlayer, setShakePlayer] = useState(false);
  const [autoRunCount, setAutoRunCount] = useState(0);
  const [combatKey, setCombatKey] = useState(0); // force re-init

  const isAutoRun = sessionStorage.getItem('autorun') === 'true';

  useEffect(() => {
    if (!activeEnemy || !player) return;
    let resBonus = 0;
    for (const item of Object.values(player.equipment)) {
      if (item?.equipStats?.resource) resBonus += item.equipStats.resource;
    }
    setPlayerHp(player.hp);
    setResource(player.maxResource + resBonus);
    setEnemyHp(activeEnemy.hp);
    setEnemyMaxHp(activeEnemy.maxHp);
    setPhase('player_turn');
    setLogs([]);
    setTurn(1);
    setXpGained(0);
    setDrops([]);
    setScrollDrop(null);
    setStatus({ ...EMPTY_STATUS });
    setBusy(false);
    setFloatingDmgs([]);
    setLevelsGained(0);
  }, [activeEnemy?.id, combatKey]);

  // Auto-run : attaque auto et continue auto
  useEffect(() => {
    if (!isAutoRun || busy) return;
    if (phase === 'player_turn' && player && enemyHp > 0) {
      // Attaque avec le meilleur skill payable
      const affordable = player.skills.filter(s => s.cost <= resource).sort((a, b) => b.cost - a.cost);
      if (affordable.length > 0) {
        const timer = setTimeout(() => useSkill(affordable[0]), 400);
        return () => clearTimeout(timer);
      }
    }
    if (phase === 'loot' || phase === 'defeat') {
      const timer = setTimeout(() => handleEndCombat(), 800);
      return () => clearTimeout(timer);
    }
    if (phase === 'learn_skill') {
      // Auto-skip le scroll en auto-run
      const timer = setTimeout(() => skipScroll(), 500);
      return () => clearTimeout(timer);
    }
  }, [phase, isAutoRun, busy, resource]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  if (!activeEnemy || !player) return null;

  // Bonus équipement
  const equipBonus = { atk: 0, def: 0, hp: 0, resource: 0 };
  for (const item of Object.values(player.equipment)) {
    if (item?.equipStats) {
      equipBonus.atk += item.equipStats.atk ?? 0;
      equipBonus.def += item.equipStats.def ?? 0;
      equipBonus.hp += item.equipStats.hp ?? 0;
      equipBonus.resource += item.equipStats.resource ?? 0;
    }
  }
  const effectiveAtk = player.attack + equipBonus.atk + status.atkBuff;
  const effectiveDef = player.defense + equipBonus.def + status.defBuff;
  const effectiveMaxHp = player.maxHp + equipBonus.hp;
  const effectiveMaxRes = player.maxResource + equipBonus.resource;
  const effectiveEnemyAtk = Math.max(activeEnemy.attack - status.enemyAtkDebuff, 1);
  const resLabel = player.resourceType === 'mana' ? 'Mana' : 'Stamina';

  const addLog = (text: string, type: LogEntry['type'] = 'system') => {
    setLogs(prev => [...prev, { text, type }]);
  };

  const showDmg = (value: string, color: string, side: 'left' | 'right') => {
    const id = ++dmgId;
    setFloatingDmgs(prev => [...prev, { id, value, color, x: side }]);
  };
  const removeDmg = (id: number) => setFloatingDmgs(prev => prev.filter(d => d.id !== id));

  // ===== COMPÉTENCE =====
  const useSkill = (skill: Skill) => {
    if (busy || phase !== 'player_turn') return;
    if (resource < skill.cost) return;
    setBusy(true);
    setResource(r => r - skill.cost);

    const eff = skill.effect;
    const newStatus = { ...status };
    let dmg = 0;

    if (eff.damageMultiplier && eff.damageMultiplier > 0)
      dmg = Math.max(Math.round(effectiveAtk * eff.damageMultiplier) - activeEnemy.defense, 1);
    if (eff.chaosMin !== undefined && eff.chaosMax !== undefined) {
      const mult = eff.chaosMin + Math.random() * (eff.chaosMax - eff.chaosMin);
      dmg = Math.max(Math.round(effectiveAtk * mult) - activeEnemy.defense, 1);
    }

    let newEnemyHp = enemyHp;
    if (dmg > 0) {
      newEnemyHp = Math.max(enemyHp - dmg, 0);
      setEnemyHp(newEnemyHp);
      setShakeEnemy(true); setTimeout(() => setShakeEnemy(false), 400);
      showDmg(`-${dmg}`, dmg > effectiveAtk ? '#ff5500' : '#ffd166', 'right');
      addLog(`${skill.icon} ${skill.name} : ${dmg} degats !`, 'player');
      sfx.playHit();
    } else {
      addLog(`${skill.icon} ${skill.name} !`, 'player');
      sfx.playSparkle();
    }

    if (eff.healPercent && dmg > 0) {
      const heal = Math.round(dmg * eff.healPercent / 100);
      setPlayerHp(hp => Math.min(hp + heal, effectiveMaxHp));
      showDmg(`+${heal}`, '#80ffdb', 'left');
      addLog(`Drain : +${heal} PV`, 'heal');
    }
    if (eff.atkBuff) { newStatus.atkBuff += eff.atkBuff; addLog(`ATK +${eff.atkBuff} !`, 'system'); }
    if (eff.defBuff) { newStatus.defBuff += eff.defBuff; addLog(`DEF +${eff.defBuff} !`, 'system'); }
    if (eff.enemyAtkDebuff) { newStatus.enemyAtkDebuff += eff.enemyAtkDebuff; addLog(`ATK ennemi -${eff.enemyAtkDebuff}`, 'system'); }
    if (eff.poisonDmg && eff.poisonDuration) {
      newStatus.poisonDmg = Math.max(newStatus.poisonDmg, eff.poisonDmg);
      newStatus.poisonTurns = Math.max(newStatus.poisonTurns, eff.poisonDuration);
      addLog(`Poison : ${eff.poisonDmg}/tour, ${eff.poisonDuration} tours`, 'player');
    }
    if (eff.summonDmg && eff.summonDuration) {
      newStatus.summonDmg = eff.summonDmg; newStatus.summonTurns = eff.summonDuration;
      addLog(`Invocation : ${eff.summonDmg}/tour, ${eff.summonDuration} tours`, 'player');
    }
    if (eff.shieldPercent) { newStatus.shieldPercent = eff.shieldPercent; addLog(`Bouclier -${eff.shieldPercent}%`, 'system'); }
    if (eff.guaranteedDodge) { newStatus.guaranteedDodge = true; addLog('Esquive preparee !', 'system'); }
    if (eff.skipEnemyChance && chance(eff.skipEnemyChance)) { newStatus.skipEnemyTurn = true; addLog('Ennemi immobilise !', 'system'); }

    setStatus(newStatus);
    if (newEnemyHp <= 0) setTimeout(() => handleVictory(), 600);
    else setTimeout(() => doEnemyTurn(newEnemyHp, newStatus), 900);
  };

  // ===== POTION =====
  const usePotion = () => {
    if (busy || phase !== 'player_turn') return;
    const idx = player.inventory.findIndex(i => i.type === 'potion');
    if (idx === -1) return;
    setBusy(true);
    const potion = player.inventory[idx];
    let heal = 20;
    if (potion.name.includes('vie') || potion.name.includes('lixir')) heal = effectiveMaxHp - playerHp;
    const newHp = Math.min(playerHp + heal, effectiveMaxHp);
    setPlayerHp(newHp);
    showDmg(`+${heal}`, '#80ffdb', 'left');
    addLog(`${potion.name} : +${heal} PV`, 'heal');
    sfx.playHeal();
    const inv = [...player.inventory]; inv.splice(idx, 1);
    dispatch({ type: 'SET_PLAYER', player: { ...player, inventory: inv } });
    setTimeout(() => doEnemyTurn(enemyHp, status), 900);
  };

  // ===== FUIR =====
  const doFlee = () => {
    if (busy || phase !== 'player_turn') return;
    setBusy(true);
    if (chance(50)) {
      addLog('Fuite reussie !', 'system'); sfx.playMenu();
      setTimeout(() => dispatch({ type: 'END_COMBAT_WIN', player: { ...player, hp: playerHp, resource } }), 500);
    } else {
      addLog('Fuite echouee !', 'system');
      setTimeout(() => doEnemyTurn(enemyHp, status), 900);
    }
  };

  // ===== TOUR ENNEMI =====
  const doEnemyTurn = (curEnemyHp: number, curStatus: StatusEffects) => {
    if (curEnemyHp <= 0) { handleVictory(); return; }
    setPhase('enemy_turn');
    let hpLeft = curEnemyHp;

    if (curStatus.poisonTurns > 0) {
      hpLeft = Math.max(hpLeft - curStatus.poisonDmg, 0); setEnemyHp(hpLeft);
      showDmg(`-${curStatus.poisonDmg}`, '#4caf50', 'right');
      addLog(`Poison : ${curStatus.poisonDmg} degats`, 'player');
      curStatus.poisonTurns--;
      if (hpLeft <= 0) { setStatus({...curStatus}); setTimeout(() => handleVictory(), 600); return; }
    }
    if (curStatus.summonTurns > 0) {
      hpLeft = Math.max(hpLeft - curStatus.summonDmg, 0); setEnemyHp(hpLeft);
      showDmg(`-${curStatus.summonDmg}`, '#c77dff', 'right');
      addLog(`Spectre : ${curStatus.summonDmg} degats`, 'player');
      curStatus.summonTurns--;
      if (hpLeft <= 0) { setStatus({...curStatus}); setTimeout(() => handleVictory(), 600); return; }
    }

    if (curStatus.skipEnemyTurn) {
      curStatus.skipEnemyTurn = false; setStatus({...curStatus});
      addLog(`${activeEnemy.name} est paralyse !`, 'system');
      setTimeout(() => endTurn(curStatus), 600); return;
    }
    if (curStatus.guaranteedDodge) {
      curStatus.guaranteedDodge = false; setStatus({...curStatus});
      showDmg('MISS', '#888', 'left');
      addLog('Esquive !', 'system'); sfx.playMenu();
      setTimeout(() => endTurn(curStatus), 600); return;
    }
    if (chance(8)) {
      showDmg('MISS', '#888', 'left');
      addLog(`${activeEnemy.name} rate !`, 'system');
      setTimeout(() => endTurn(curStatus), 600); return;
    }

    const rawAtk = Math.max(activeEnemy.attack - curStatus.enemyAtkDebuff, 1);
    let dmg = Math.max(rawAtk - effectiveDef, 1);
    const crit = chance(5);
    if (crit) dmg = Math.round(dmg * 1.8);
    if (curStatus.shieldPercent > 0) {
      dmg = Math.max(Math.round(dmg * (1 - curStatus.shieldPercent / 100)), 1);
      curStatus.shieldPercent = 0;
    }
    setStatus({...curStatus});

    const newHp = Math.max(playerHp - dmg, 0);
    setPlayerHp(newHp);
    setShakePlayer(true); setTimeout(() => setShakePlayer(false), 400);
    showDmg(crit ? `CRIT -${dmg}` : `-${dmg}`, crit ? '#ff5500' : '#ff8fab', 'left');
    addLog(`${activeEnemy.name} ${crit ? 'CRIT' : 'attaque'} : ${dmg}`, 'enemy');
    sfx.playHit();

    if (newHp <= 0) {
      setTimeout(() => { setPhase('defeat'); sfx.playDeath(); addLog('Defaite...', 'system'); }, 600);
    } else {
      setTimeout(() => endTurn(curStatus), 700);
    }
  };

  const endTurn = (s: StatusEffects) => {
    setResource(r => Math.min(r + player.resourceRegen, effectiveMaxRes));
    setTurn(t => t + 1); setPhase('player_turn'); setBusy(false);
  };

  // ===== VICTOIRE =====
  const [levelsGained, setLevelsGained] = useState(0);

  const handleVictory = () => {
    // XP avec bonus %
    const rawXp = activeEnemy.xpReward;
    const xp = Math.round(rawXp * (1 + player.xpBonus / 100));
    const goldDrop = rand(5, 15 + rawXp);
    const combatDrops = (isAutoRun && !chance(1)) ? [] : generateCombatDrops(activeEnemy.tier);
    setXpGained(xp); setDrops(combatDrops);
    // Parchemin : jamais en auto-run, 5% minion, 15% elite, 50% boss
    const scrollRate = isAutoRun ? 0 : activeEnemy.tier === 'boss' ? 50 : activeEnemy.tier === 'elite' ? 15 : 5;
    const scroll = chance(scrollRate) ? getRandomScrollDrop(player.className) : null;
    setScrollDrop(scroll);
    sfx.playLevelUp();
    addLog(`${activeEnemy.name} vaincu ! +${xp} XP${player.xpBonus > 0 ? ` (+${player.xpBonus}%)` : ''} +${goldDrop} or`, 'loot');
    combatDrops.forEach(d => addLog(`${d.icon} ${d.name}`, 'loot'));
    if (scroll) addLog(`Parchemin : ${scroll.icon} ${scroll.name}`, 'loot');

    let newXp = player.xp + xp, newLv = player.level, xpN = player.xpToNextLevel;
    let lvGained = 0;
    while (newXp >= xpN && newLv < 20) {
      newXp -= xpN; newLv++; lvGained++; xpN = xpForLevel(newLv + 1);
      addLog(`LEVEL UP ! Niveau ${newLv} — 5 points a repartir !`, 'system'); sfx.playLevelUp();
    }
    setLevelsGained(lvGained);

    dispatch({ type: 'SET_PLAYER', player: {
      ...player, hp: playerHp, level: newLv, xp: newXp, xpToNextLevel: xpN,
      gold: player.gold + goldDrop, resource,
      inventory: [...player.inventory, ...combatDrops],
      statPoints: player.statPoints + lvGained * 5,
    }});

    if (isAutoRun && lvGained === 0 && !scroll) {
      // Auto-run : relance direct sans passer par l'écran loot
      setTimeout(() => continueAutoRun(), 300);
      return;
    }
    if (isAutoRun && lvGained > 0) {
      stopAutoRun();
    }
    setPhase(scroll ? 'learn_skill' : 'loot');
  };

  // ===== APPRENDRE COMPÉTENCE =====
  const learnSkill = (i: number) => {
    if (!scrollDrop) return;
    const sk = [...player.skills]; sk[i] = scrollDrop;
    dispatch({ type: 'SET_PLAYER', player: { ...player, skills: sk } });
    sfx.playSparkle(); addLog(`${scrollDrop.name} appris !`, 'system');
    setScrollDrop(null); setPhase('loot');
  };
  const skipScroll = () => {
    if (scrollDrop) {
      const item: LootItem = { id: `scroll_${scrollDrop.id}_${Date.now()}`, name: scrollDrop.name,
        rarity: 'rare', type: 'scroll', value: 30, description: scrollDrop.description, icon: scrollDrop.icon };
      dispatch({ type: 'SET_PLAYER', player: { ...player, inventory: [...player.inventory, item] } });
      addLog(`${scrollDrop.name} stocke.`, 'loot');
    }
    setScrollDrop(null); setPhase('loot');
  };

  // ===== STOP AUTO-RUN =====
  const stopAutoRun = () => {
    sessionStorage.removeItem('autorun');
    sessionStorage.removeItem('autorunRoomId');
  };

  // ===== RELANCE AUTO-RUN =====
  const continueAutoRun = () => {
    if (!state.floor || !player) return;
    const roomId = sessionStorage.getItem('autorunRoomId');
    const room = state.floor.rooms.find(r => r.id === roomId);
    if (!room || !room.enemies.length) { stopAutoRun(); return; }

    // Respawn ennemis à 60%
    room.enemies.forEach(e => { e.hp = Math.round(e.maxHp * 0.6); });
    room.cleared = false;
    setAutoRunCount(c => c + 1);

    // Re-dispatch l'ennemi ET incrémenter combatKey pour forcer le re-init
    dispatch({ type: 'ENTER_COMBAT', enemy: { ...room.enemies[0] } });
    setCombatKey(k => k + 1);
  };

  // ===== FIN =====
  // Note : handleVictory a déjà fait SET_PLAYER avec toutes les stats/xp/statPoints à jour.
  // Ici on fait juste la transition d'écran, sans re-écraser le player.
  const handleEndCombat = () => {
    if (phase === 'loot') {
      if (isAutoRun && levelsGained === 0) {
        setTimeout(() => continueAutoRun(), 400);
        return;
      }

      // Marquer la salle comme cleared via END_COMBAT_WIN
      // On re-read le player ACTUEL du state pour ne pas écraser les statPoints
      const currentPlayer = state.player!;
      if (activeEnemy.tier === 'boss') {
        stopAutoRun();
        dispatch({ type: 'BOSS_DEFEATED', bossName: activeEnemy.name });
      } else {
        dispatch({ type: 'END_COMBAT_WIN', player: { ...currentPlayer, hp: playerHp } });
      }
      if (levelsGained > 0) {
        stopAutoRun();
        setTimeout(() => dispatch({ type: 'OPEN_LEVELUP' }), 100);
      }
    } else if (phase === 'defeat') {
      if (isAutoRun) {
        stopAutoRun();
        const currentPlayer = state.player!;
        dispatch({ type: 'END_COMBAT_WIN', player: { ...currentPlayer, hp: currentPlayer.maxHp, resource: currentPlayer.maxResource } });
      } else {
        dispatch({ type: 'END_COMBAT_LOSE', message: `${activeEnemy.name} vous a vaincu...` });
      }
    }
  };

  const potions = player.inventory.filter(i => i.type === 'potion').length;
  const hpPct = (hp: number, max: number) => Math.max(0, Math.min(100, (hp / max) * 100));
  const hpColor = (pct: number) => pct > 50 ? 'bg-green-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500';

  // ===== RENDU POKEMON STYLE =====
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-2xl mx-auto">

      {/* Overlay apprendre compétence */}
      {phase === 'learn_skill' && scrollDrop && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg space-y-4">
            <h3 className="font-pixel text-sm text-primary text-center">{scrollDrop.icon} {scrollDrop.name}</h3>
            <p className="text-xs text-muted-foreground text-center">{scrollDrop.description} — {scrollDrop.cost} {resLabel}</p>
            <p className="font-pixel text-xs text-center text-yellow-400">Remplacer quelle competence ?</p>
            <div className="grid grid-cols-2 gap-3">
              {player.skills.map((sk, i) => (
                <button key={i} onClick={() => learnSkill(i)}
                  className="p-3 rounded-lg border border-border bg-secondary hover:border-primary text-left">
                  <p className="font-pixel text-xs">{sk.icon} {sk.name}</p>
                  <p className="text-xs text-muted-foreground">{sk.cost} {resLabel}</p>
                </button>
              ))}
            </div>
            <button onClick={skipScroll} className="w-full text-xs text-muted-foreground hover:text-foreground py-2">
              Garder dans l'inventaire
            </button>
          </div>
        </div>
      )}

      {/* Header auto-run */}
      {isAutoRun && (
        <div className="flex items-center justify-between bg-amber-600/20 border border-amber-500/30 px-4 py-2">
          <span className="font-pixel text-xs text-amber-400 animate-pulse">AUTO-RUN #{autoRunCount + 1}</span>
          <button onClick={() => { stopAutoRun(); setAutoRunCount(0); }}
            className="px-3 py-1 bg-red-600/80 text-white rounded font-pixel text-xs hover:opacity-90">
            Stop
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════
          ARÈNE DE COMBAT (style Pokemon)
      ══════════════════════════════════════════ */}
      <div className="relative min-h-[360px]" style={{
        background: `
          linear-gradient(180deg, #2e1240 0%, #2e1240 18%, #160820 18%, #1e0d2e 19%, #160820 20%, #1e0d2e 21%, #160820 100%),
          repeating-linear-gradient(90deg, #160820 0px, #160820 32px, #1e0d2e 32px, #1e0d2e 64px)
        `,
        imageRendering: 'pixelated',
      }}>
        {/* Déco murale : rangée de tiles mur en haut */}
        <div className="absolute top-0 left-0 right-0 flex overflow-hidden" style={{ height: 48 }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={`w${i}`} className="flex-shrink-0"><PixelSprite name="tileWall" scale={3} /></div>
          ))}
        </div>

        {/* Ligne de séparation mur/sol */}
        <div className="absolute top-[48px] left-0 right-0 h-[2px] bg-[#e05c82]/30" />

        {/* Déco : porte au centre du mur */}
        <div className="absolute top-[2px] left-1/2 -translate-x-1/2 z-[1]">
          <PixelSprite name="tileDoor" scale={3} />
        </div>

        {/* Déco : cristaux sur le sol */}
        <div className="absolute top-[56px] left-6 z-[1] opacity-60">
          <PixelSprite name="tileCrystal" scale={3} />
        </div>
        <div className="absolute bottom-[100px] right-8 z-[1] opacity-40">
          <PixelSprite name="tileCrystal" scale={2} />
        </div>

        {/* Damage numbers */}
        {floatingDmgs.map(d => (
          <DamageNumber key={d.id} dmg={d} onDone={() => removeDmg(d.id)} />
        ))}

        {/* ── Ennemi : haut droite ── */}
        <div className="absolute top-2 right-2 w-[52%] z-10">
          <div className="bg-[#0d0510]/80 border border-[#ff8fab33] rounded-lg px-3 py-2">
            <div className="flex justify-between items-center mb-1">
              <span className="font-pixel text-xs text-destructive">{activeEnemy.name}</span>
              <span className="text-xs text-muted-foreground">Tour {turn}</span>
            </div>
            <Bar value={enemyHp} max={enemyMaxHp} color="bg-red-500" height="h-2" />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">{enemyHp}/{enemyMaxHp}</span>
              {activeEnemy.tier === 'boss' && <span className="text-xs text-red-400 font-pixel">BOSS</span>}
            </div>
          </div>
        </div>

        {/* Sprite ennemi */}
        <div className="absolute top-[70px] right-[15%] z-[5]"
          style={shakeEnemy ? { animation: 'shake 0.3s ease-in-out' } : {}}>
          <PixelSprite name={getEnemySpriteName(activeEnemy.name)} scale={8} />
        </div>

        {/* ── Joueur : bas gauche ── */}
        <div className="absolute bottom-[90px] left-[8%] z-[5]"
          style={shakePlayer ? { animation: 'shake 0.3s ease-in-out' } : {}}>
          <PixelSprite name={getHeroSpriteName(player.className)} scale={8} />
        </div>

        {/* Info joueur : bas droite */}
        <div className="absolute bottom-2 right-2 w-[52%] z-10">
          <div className="bg-[#0d0510]/80 border border-[#c77dff33] rounded-lg px-3 py-2">
            <div className="flex justify-between items-center mb-1">
              <span className="font-pixel text-xs text-primary">{player.name}</span>
              <span className="text-xs text-muted-foreground">Nv.{player.level}</span>
            </div>
            <Bar value={playerHp} max={effectiveMaxHp} color={hpColor(hpPct(playerHp, effectiveMaxHp))} height="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{playerHp}/{effectiveMaxHp} PV</span>
              <span>ATK {effectiveAtk} DEF {effectiveDef}</span>
            </div>
            <Bar value={resource} max={effectiveMaxRes}
              color={player.resourceType === 'mana' ? 'bg-blue-500' : 'bg-amber-500'} height="h-1.5" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{resource}/{effectiveMaxRes} {resLabel}</span>
              <div className="flex gap-1">
                {status.poisonTurns > 0 && <span className="text-green-400">PSN</span>}
                {status.summonTurns > 0 && <span className="text-purple-400">INV</span>}
                {status.guaranteedDodge && <span className="text-blue-400">EVA</span>}
                {status.shieldPercent > 0 && <span className="text-cyan-400">SLD</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          ZONE TEXTE + ACTIONS (bas de l'écran)
      ══════════════════════════════════════════ */}
      <div className="bg-[#0d0510] border-t-2 border-[#ff8fab22]">

        {/* Log de combat */}
        <div ref={logRef} className="h-20 overflow-y-auto px-4 py-2 font-mono text-xs space-y-0.5">
          {logs.length === 0 && <p className="text-muted-foreground italic">Un {activeEnemy.name} sauvage apparait !</p>}
          {logs.map((e, i) => (
            <div key={i} className={
              e.type === 'player' ? 'text-blue-400' : e.type === 'enemy' ? 'text-red-400' :
              e.type === 'heal' ? 'text-green-400' : e.type === 'loot' ? 'text-yellow-400' : 'text-muted-foreground'
            }>{e.text}</div>
          ))}
        </div>

        {/* Drops */}
        {phase === 'loot' && drops.length > 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1">
            {drops.map((d, i) => <span key={i} className="text-xs px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400">{d.icon} {d.name}</span>)}
          </div>
        )}

        {/* Résultat */}
        {phase === 'loot' && (
          <div className="mx-4 mb-2 p-2 rounded border border-green-500/50 bg-green-500/10 text-center font-pixel text-xs text-green-400">
            VICTOIRE ! +{xpGained} XP
          </div>
        )}
        {phase === 'defeat' && (
          <div className="mx-4 mb-2 p-2 rounded border border-red-500/50 bg-red-500/10 text-center font-pixel text-xs text-red-400">
            DEFAITE...
          </div>
        )}

        {/* Actions */}
        <div className="p-3 space-y-2">
          {phase === 'player_turn' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {player.skills.map(sk => (
                  <button key={sk.id} onClick={() => useSkill(sk)} disabled={busy || resource < sk.cost}
                    className="px-3 py-2 bg-[#1e0d2e] border border-[#c77dff33] rounded text-left hover:border-[#c77dff] transition-all disabled:opacity-25">
                    <div className="flex justify-between">
                      <span className="font-pixel text-xs">{sk.icon} {sk.name}</span>
                      <span className={`text-xs ${resource >= sk.cost ? 'text-amber-400' : 'text-red-400'}`}>{sk.cost}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={usePotion} disabled={busy || potions === 0}
                  className="flex-1 py-2 bg-green-800/60 border border-green-500/30 rounded font-pixel text-xs text-green-300 disabled:opacity-25">
                  Potion ({potions})
                </button>
                <button onClick={doFlee} disabled={busy || activeEnemy.tier === 'boss'}
                  className="flex-1 py-2 bg-[#1e0d2e] border border-[#ff8fab22] rounded font-pixel text-xs text-muted-foreground disabled:opacity-25">
                  {activeEnemy.tier === 'boss' ? 'Bloque' : 'Fuir'}
                </button>
              </div>
            </>
          )}
          {phase === 'enemy_turn' && (
            <div className="text-center py-3 font-pixel text-xs text-red-400 animate-pulse">
              {activeEnemy.name} attaque...
            </div>
          )}
          {(phase === 'loot' || phase === 'defeat') && (
            <button onClick={handleEndCombat}
              className={`w-full py-3 rounded font-pixel text-xs ${
                phase === 'loot' ? 'bg-green-700 text-white hover:bg-green-600' : 'bg-red-900 text-red-300 hover:bg-red-800'}`}>
              {phase === 'loot' ? 'Continuer' : 'Menu'}
            </button>
          )}
        </div>
      </div>

      {/* CSS shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
