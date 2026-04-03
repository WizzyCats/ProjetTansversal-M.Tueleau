// =============================================================================
// combat/combat.ts — Moteur AFK complet avec toutes les mécaniques de classes
// Lon — Module Combat & Classes
// =============================================================================

import type {
  PlayerState, CombatEnemy, CombatLog, CombatResult,
  StatusEffect, StatusEffectType, Minion, ChaosResult, ChaosEntry,
} from './types';
import { sumCardValue, hasCardFlag, getCardValue } from './player';
import { grantXp } from './levelup';

// ---------------------------------------------------------------------------
// UTILITAIRES
// ---------------------------------------------------------------------------

const rand  = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randF = (min: number, max: number) => Math.random() * (max - min) + min;
const chance = (pct: number) => Math.random() * 100 < pct;

function weightedPick<T extends { weight: number }>(arr: T[]): T {
  const total = arr.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const item of arr) { r -= item.weight; if (r <= 0) return item; }
  return arr[arr.length - 1];
}

// ---------------------------------------------------------------------------
// ÉTAT INTERNE DU COMBAT
// ---------------------------------------------------------------------------

interface CombatState {
  player:               PlayerState;
  enemies:              CombatEnemy[];
  logs:                 CombatLog[];
  tick:                 number;
  playerTimer:          number;
  enemyTimers:          Map<string, number>;
  minionTimers:         Map<string, number>;
  isFirstHit:           boolean;
  guaranteedDodgeUsed:  boolean;
  immortalUsed:         boolean;
  rerollUsed:           boolean;
  choose2Used:          boolean;
  chaosResonanceCount:  number;
  lastChaosResult:      ChaosResult | null;
  wallOfFleshHits:      number;
}

// ---------------------------------------------------------------------------
// INIT
// ---------------------------------------------------------------------------

function initCombatState(player: PlayerState, enemies: CombatEnemy[]): CombatState {
  const p = structuredClone(player);
  p.immortalUsedThisCombat = false;
  if (!hasCardFlag(p, 'petPermanent')) { p.petActive = false; p.petHp = 0; }

  const enemyTimers  = new Map<string, number>();
  const minionTimers = new Map<string, number>();
  const freshEnemies = enemies.map(e => ({ ...structuredClone(e), currentHp: e.hp, statusEffects: [] }));
  for (const e of freshEnemies) enemyTimers.set(e.id, 2000);

  return {
    player: p, enemies: freshEnemies, logs: [], tick: 0,
    playerTimer: Math.round(p.stats.cooldown * 1000),
    enemyTimers, minionTimers,
    isFirstHit: true, guaranteedDodgeUsed: false, immortalUsed: false,
    rerollUsed: false, choose2Used: false,
    chaosResonanceCount: 1, lastChaosResult: null,
    wallOfFleshHits: player.activeCards.some(c => c.id === 'barb_r2') ? 3 : 0,
  };
}

// ---------------------------------------------------------------------------
// LOG
// ---------------------------------------------------------------------------

function log(state: CombatState, actor: string, action: string, value?: number, detail?: string) {
  state.logs.push({ tick: state.tick, actor, action, value, detail });
}

// ---------------------------------------------------------------------------
// CALCUL DÉGÂTS JOUEUR
// ---------------------------------------------------------------------------

function getDebuffVal(entity: CombatEnemy | PlayerState, type: StatusEffectType): number {
  return (entity.statusEffects ?? [])
    .filter(e => e.type === type)
    .reduce((sum, e) => sum + e.value * e.stacks, 0);
}

function computePlayerDamage(state: CombatState, enemy: CombatEnemy): number {
  const p = state.player;
  let dmg = p.stats.atk;

  if (chance(p.stats.critChance)) dmg *= p.stats.critMultiplier;

  const rageThreshold = getCardValue(p, 'rageThreshold');
  const rageDmgBonus  = sumCardValue(p, 'rageDamageBonus');
  if (rageThreshold > 0 && (p.stats.hp / p.stats.hpMax) * 100 <= rageThreshold) {
    dmg *= (1 + rageDmgBonus);
  }

  const execThreshold = getCardValue(p, 'executionThreshold');
  const execBonus     = sumCardValue(p, 'executionBonus');
  if (execThreshold > 0 && (enemy.currentHp / enemy.hpMax) * 100 <= execThreshold) {
    dmg *= (1 + execBonus);
  }

  const firstHitMult = getCardValue(p, 'firstHitMultiplier');
  if (firstHitMult > 1 && state.isFirstHit) { dmg *= firstHitMult; state.isFirstHit = false; }

  const effectiveDef = Math.max(enemy.def - getDebuffVal(enemy, 'debuff_def'), 0);
  dmg = Math.max(dmg - effectiveDef, 1);
  return Math.round(dmg);
}

// ---------------------------------------------------------------------------
// ACTIONS PAR CLASSE
// ---------------------------------------------------------------------------

function aliveEnemy(state: CombatState): CombatEnemy | undefined {
  return state.enemies.find(e => e.currentHp > 0);
}

function checkEnemyDeath(state: CombatState, enemy: CombatEnemy) {
  if (enemy.currentHp > 0) return;
  enemy.currentHp = 0;
  log(state, enemy.name, '☠️ Mort !');
  if (state.player.className === 'necromancien') {
    const minHeal = getCardValue(state.player, 'necroHealMin') || 0.1;
    const factor  = randF(minHeal, 1.0);
    const heal    = Math.round(enemy.hpMax * factor);
    state.player.stats.hp = Math.min(state.player.stats.hp + heal, state.player.stats.hpMax);
    log(state, state.player.name, `Festin sur ${enemy.name}`, heal);
  }
}

// BARBARE
function barbarianAction(state: CombatState) {
  const enemy = aliveEnemy(state); if (!enemy) return;
  const dmg = computePlayerDamage(state, enemy);
  enemy.currentHp -= dmg;
  log(state, state.player.name, 'Frappe Brutale', dmg, `→ ${enemy.name} [${Math.max(enemy.currentHp,0)}/${enemy.hpMax}]`);
  checkEnemyDeath(state, enemy);
}

// CHAOS TABLE
function buildChaosTable(player: PlayerState): ChaosEntry[] {
  const table  = structuredClone(player.chaosTable);
  const bonus  = sumCardValue(player, 'chaosTableBonus');
  if (player.activeCards.some(c => c.id === 'chaos_e2')) return table.map(e => ({ ...e, weight: 100 }));
  if (bonus > 0) return table.map(e => ({ ...e, weight: e.weight + bonus }));
  return table;
}

function rollChaos(state: CombatState): ChaosResult {
  const table = buildChaosTable(state.player);
  const extended = hasCardFlag(state.player, 'unlockDoubleSpell')
    ? [...table, { result: 'double_spell' as ChaosResult, weight: 6, label: 'Double Sort' }]
    : table;

  let result = weightedPick(extended).result as ChaosResult;

  if (result === 'nothing' && !state.rerollUsed && hasCardFlag(state.player, 'rerollOnNothing')) {
    state.rerollUsed = true;
    result = weightedPick(extended.filter(e => e.result !== 'nothing')).result as ChaosResult;
    log(state, state.player.name, 'Flux Aléatoire', undefined, 'Relance !');
  }

  if (result === state.lastChaosResult) state.chaosResonanceCount++;
  else state.chaosResonanceCount = 1;
  state.lastChaosResult = result;
  return result;
}

function chaosResultPriority(r: ChaosResult): number {
  const p: Record<ChaosResult, number> = {
    double_spell: 6, damage_huge_backfire: 5, damage_high: 4,
    aoe_weak: 3, debuff: 3, summon_pet: 3, temp_hp: 2,
    small_heal: 2, damage_medium: 2, nothing: 0,
  };
  return p[r] ?? 1;
}

function applyChaosEffect(
  state: CombatState, result: ChaosResult,
  dmgBonus: number, backfireRed: number, resonance: number, enemy?: CombatEnemy,
) {
  const p = state.player;
  switch (result) {
    case 'small_heal': {
      const heal = Math.round(rand(10, 20) * resonance);
      p.stats.hp = Math.min(p.stats.hp + heal, p.stats.hpMax);
      log(state, p.name, 'Soin Chaos', heal); break;
    }
    case 'temp_hp': {
      const v = Math.round(rand(15, 30) * resonance);
      p.statusEffects.push({ type: 'temp_hp', stacks: 1, duration: 3, value: v });
      log(state, p.name, 'Vie Temporaire', v); break;
    }
    case 'damage_medium': {
      if (!enemy) break;
      const dmg = Math.round((rand(15, 25) * (1 + dmgBonus)) * resonance);
      const reduced = Math.max(dmg - enemy.def, 1);
      enemy.currentHp -= reduced;
      log(state, p.name, 'Sort Moyen', reduced);
      checkEnemyDeath(state, enemy); break;
    }
    case 'damage_high': {
      if (!enemy) break;
      const dmg = Math.round((rand(30, 50) * (1 + dmgBonus)) * resonance);
      const reduced = Math.max(dmg - enemy.def, 1);
      enemy.currentHp -= reduced;
      log(state, p.name, 'Sort Puissant', reduced);
      checkEnemyDeath(state, enemy); break;
    }
    case 'damage_huge_backfire': {
      if (!enemy) break;
      const dmg = Math.round((rand(60, 100) * (1 + dmgBonus)) * resonance);
      const reduced = Math.max(dmg - enemy.def, 1);
      enemy.currentHp -= reduced;
      let backfire = Math.round(rand(15, 30) * (1 - Math.min(backfireRed, 0.9)));
      if (chance(15) && p.activeCards.some(c => c.id === 'chaos_u2')) {
        backfire = 0;
        log(state, p.name, 'Bouclier du Destin', undefined, 'Retour absorbé !');
      }
      if (backfire > 0) { p.stats.hp -= backfire; log(state, p.name, '🔥 Retour de Flamme', backfire); }
      log(state, p.name, 'GROS Sort', reduced);
      checkEnemyDeath(state, enemy); break;
    }
    case 'aoe_weak': {
      const alive = state.enemies.filter(e => e.currentHp > 0);
      const base  = Math.round((rand(10, 20) * (1 + dmgBonus)) * resonance);
      for (const e of alive) {
        const r = Math.max(base - e.def, 1); e.currentHp -= r;
        log(state, p.name, 'AOE', r, `→ ${e.name}`);
        checkEnemyDeath(state, e);
      } break;
    }
    case 'debuff': {
      if (!enemy) break;
      const t: StatusEffectType = chance(50) ? 'debuff_atk' : 'debuff_def';
      enemy.statusEffects.push({ type: t, stacks: 1, duration: 3, value: 3 });
      log(state, p.name, 'Débuff Chaos', 3, `${t} → ${enemy.name}`); break;
    }
    case 'summon_pet': {
      if (!p.petActive) { p.petActive = true; p.petHp = rand(20, 40); log(state, p.name, 'Pet Invoqué', p.petHp); }
      else { p.petHp += rand(5, 15); log(state, p.name, 'Pet Renforcé', p.petHp); }
      break;
    }
    case 'nothing':
      log(state, p.name, 'Fizzle...', undefined, 'La magie disparaît...'); break;
  }
}

function chaosAction(state: CombatState) {
  const { player } = state;
  const enemy = aliveEnemy(state);
  const dmgBonus    = sumCardValue(player, 'chaosDamageBonus');
  const backfireRed = sumCardValue(player, 'chaosBackfireReduction');
  const resonance   = (state.chaosResonanceCount > 1 && sumCardValue(player, 'resonanceBonus') > 1)
    ? sumCardValue(player, 'resonanceBonus') : 1;

  let result: ChaosResult;
  if (!state.choose2Used && hasCardFlag(player, 'chooseBetween2')) {
    state.choose2Used = true;
    const r1 = rollChaos(state), r2 = rollChaos(state);
    result = chaosResultPriority(r1) >= chaosResultPriority(r2) ? r1 : r2;
    log(state, player.name, 'Maître du Hasard', undefined, `${r1} vs ${r2} → ${result}`);
  } else {
    result = rollChaos(state);
  }

  if (chance(2) && player.activeCards.some(c => c.id === 'chaos_e1')) {
    log(state, player.name, '✨ SINGULARITÉ !');
    for (const r of ['small_heal','temp_hp','damage_high','aoe_weak','debuff','summon_pet'] as ChaosResult[]) {
      applyChaosEffect(state, r, dmgBonus * 2, backfireRed, resonance, enemy);
    }
    return;
  }

  if (result === 'double_spell') {
    const r1 = rollChaos(state), r2 = rollChaos(state);
    log(state, player.name, 'Double Sort !', undefined, `${r1} + ${r2}`);
    applyChaosEffect(state, r1, dmgBonus, backfireRed, resonance, enemy);
    applyChaosEffect(state, r2, dmgBonus, backfireRed, resonance, enemy);
    return;
  }

  log(state, player.name, `Chaos: ${result}`, undefined,
    state.chaosResonanceCount > 1 ? `Résonance ×${resonance}` : undefined);
  applyChaosEffect(state, result, dmgBonus, backfireRed, resonance, enemy);
}

// VOLEUR
function addPoison(state: CombatState, enemy: CombatEnemy, stacks: number) {
  const maxStacks = state.player.poisonStackMax;
  const existing  = enemy.statusEffects.find(e => e.type === 'poison');
  if (existing) {
    const toAdd = Math.min(stacks, maxStacks - existing.stacks);
    existing.stacks += toAdd;
    if (toAdd > 0) log(state, state.player.name, 'Poison +Stack', toAdd, `Total: ${existing.stacks}/${maxStacks}`);
  } else {
    enemy.statusEffects.push({ type: 'poison', stacks: Math.min(stacks, maxStacks), duration: 99, value: 3 });
    log(state, state.player.name, 'Poison Appliqué', Math.min(stacks, maxStacks));
  }
}

function rogueAction(state: CombatState) {
  const enemy = aliveEnemy(state); if (!enemy) return;
  const dmg = computePlayerDamage(state, enemy);
  enemy.currentHp -= dmg;
  log(state, state.player.name, 'Frappe Rapide', dmg);
  const autoPoison = state.player.activeCards.some(c => c.id === 'thief_e1') ? 2 : 1;
  addPoison(state, enemy, autoPoison);
  checkEnemyDeath(state, enemy);
}

// NÉCROMANCIEN
function summonMinion(state: CombatState) {
  const { player } = state;
  const hpBonus  = sumCardValue(player, 'minionHpBonus');
  const atkBonus = hasCardFlag(player, 'armyGhost') ? 1.5 : 1;
  const templates = [
    { name: 'Squelette',  hpBase: 20, atkBase: 5, cooldown: 2000 },
    { name: 'Zombie',     hpBase: 35, atkBase: 4, cooldown: 2500 },
    { name: 'Spectre',    hpBase: 15, atkBase: 8, cooldown: 1800 },
    { name: "Golem d'Os", hpBase: 50, atkBase: 3, cooldown: 3000 },
  ];
  const t   = templates[rand(0, templates.length - 1)];
  const hp  = Math.round(t.hpBase * (1 + hpBonus));
  const atk = Math.round(t.atkBase * atkBonus);
  const debuffStats = ['atk', 'def', 'spd'] as const;
  const minion: Minion = {
    id: `minion_${Date.now()}_${rand(0,9999)}`,
    name: t.name, hp, hpMax: hp, atk,
    cooldown: t.cooldown,
    debuffStat: debuffStats[rand(0, 2)],
    debuffValue: rand(2, 6),
  };
  player.minions.push(minion);
  state.minionTimers.set(minion.id, minion.cooldown);
  log(state, player.name, `Invoque ${minion.name}`, undefined, `${hp}PV / ${atk}ATK`);
}

function onMinionDeath(state: CombatState, minion: Minion) {
  const { player } = state;
  const minHeal   = getCardValue(player, 'necroHealMin') || 0.1;
  const factor    = randF(minHeal, 1.0);
  const heal      = Math.round(minion.hpMax * factor);
  player.stats.hp = Math.min(player.stats.hp + heal, player.stats.hpMax);
  log(state, player.name, `Mange ${minion.name}`, heal, `(×${factor.toFixed(2)})`);
  if (chance(25) && player.activeCards.some(c => c.id === 'necro_u4')) {
    minion.hp = Math.round(minion.hpMax * 0.25);
    log(state, player.name, 'Résurrection !', undefined, `${minion.name} revit`);
    return;
  }
  player.minions = player.minions.filter(m => m.id !== minion.id);
  state.minionTimers.delete(minion.id);
}

function minionsAction(state: CombatState, deltaMs: number) {
  const enemy = aliveEnemy(state);
  for (const minion of [...state.player.minions]) {
    let timer = (state.minionTimers.get(minion.id) ?? minion.cooldown) - deltaMs;
    if (timer <= 0) {
      timer = minion.cooldown;
      if (enemy && minion.hp > 0) {
        const dmg = Math.max(minion.atk - enemy.def, 1);
        enemy.currentHp -= dmg;
        log(state, minion.name, 'Attaque Minion', dmg, `→ ${enemy.name}`);
        const drain = sumCardValue(state.player, 'drainLife');
        if (drain > 0) {
          state.player.stats.hp = Math.min(state.player.stats.hp + drain, state.player.stats.hpMax);
        }
        // Débuff
        const typeMap: Record<'atk'|'def'|'spd', StatusEffectType> = { atk:'debuff_atk', def:'debuff_def', spd:'debuff_spd' };
        const existing = enemy.statusEffects.find(e => e.type === typeMap[minion.debuffStat]);
        if (existing) existing.stacks = Math.min(existing.stacks + 1, 10);
        else enemy.statusEffects.push({ type: typeMap[minion.debuffStat], stacks: 1, duration: 99, value: minion.debuffValue });
        checkEnemyDeath(state, enemy);
      }
    }
    state.minionTimers.set(minion.id, timer);
  }
}

function necromancerAction(state: CombatState) {
  const enemy = aliveEnemy(state);
  if (state.player.minions.length < state.player.minionCountMax && enemy) {
    summonMinion(state);
  } else if (enemy) {
    const dmg = computePlayerDamage(state, enemy);
    enemy.currentHp -= dmg;
    log(state, state.player.name, 'Toucher Nécrotique', dmg);
    checkEnemyDeath(state, enemy);
  }
}

// ---------------------------------------------------------------------------
// RÉCEPTION DÉGÂTS JOUEUR
// ---------------------------------------------------------------------------

function triggerCounterAttack(state: CombatState) {
  const { player } = state;
  const cc   = sumCardValue(player, 'counterAttackChance');
  const mult = getCardValue(player, 'counterAttackMultiplier') || 0.6;
  if (cc > 0 && chance(cc)) {
    const enemy = aliveEnemy(state);
    if (enemy) {
      const dmg = Math.round(player.stats.atk * mult);
      enemy.currentHp -= dmg;
      log(state, player.name, 'Contre-Attaque !', dmg, `→ ${enemy.name}`);
      checkEnemyDeath(state, enemy);
    }
  }
}

function necromancerDeathCheck(state: CombatState): boolean {
  const { player } = state;
  if (player.stats.hp > 0) {
    if (player.isDeathBarActive) {
      player.isDeathBarActive = false;
      player.deathBar = Math.floor(player.deathBar / 2);
      log(state, player.name, 'Barre de Mort ÷2', player.deathBar);
    }
    return false;
  }
  player.isDeathBarActive = true;
  const roll    = rand(1, 100);
  const maxGain = Math.max(5 - Math.round(sumCardValue(player, 'deathBarReduction')), 0);
  log(state, player.name, '⚠️ Test de Mort', undefined, `Roll: ${roll} vs barre: ${player.deathBar}`);
  if (roll <= player.deathBar) { log(state, player.name, '☠️ Nécromancien tombe...'); return true; }
  const gain = rand(0, maxGain);
  player.deathBar = Math.min(player.deathBar + gain, 100);
  if (hasCardFlag(player, 'lichPassive') && player.deathBar > 80) {
    player.deathBar = Math.floor(player.deathBar / 2);
    log(state, player.name, 'Lich: Barre ÷2 !', player.deathBar);
  }
  player.stats.hp = 1;
  log(state, player.name, 'Survie Nécrotique !', 1, `Barre: ${player.deathBar}/100`);
  return false;
}

function playerReceiveHit(state: CombatState, rawDmg: number, attacker: string) {
  const { player } = state;

  if (!state.guaranteedDodgeUsed && hasCardFlag(player, 'guaranteedDodgeFirst')) {
    state.guaranteedDodgeUsed = true;
    log(state, player.name, 'Fantôme: Esquive Parfaite !', 0, `← ${attacker}`);
    triggerCounterAttack(state); return;
  }
  if (chance(player.stats.dodge)) {
    log(state, player.name, 'Esquive !', 0, `← ${attacker}`);
    triggerCounterAttack(state); return;
  }
  if (player.className === 'barbare' && chance(player.stats.parryChance)) {
    log(state, player.name, 'Parade !', 0, `← ${attacker}`); return;
  }
  if (state.wallOfFleshHits > 0) {
    state.wallOfFleshHits--;
    log(state, player.name, 'Mur de Chair absorbe', rawDmg, `(${state.wallOfFleshHits} restants)`); return;
  }

  let finalDmg = rawDmg;
  if (player.className === 'necromancien' && player.minions.some(m => m.hp > 0)
    && player.activeCards.some(c => c.id === 'necro_u3')) finalDmg = Math.round(finalDmg * 0.9);

  const tempHp = player.statusEffects.find(e => e.type === 'temp_hp');
  if (tempHp) {
    if (tempHp.value >= finalDmg) { tempHp.value -= finalDmg; log(state, player.name, 'Vie Temporaire absorbe', finalDmg); return; }
    finalDmg -= tempHp.value;
    log(state, player.name, 'Vie Temporaire absorbe partiellement', tempHp.value);
    player.statusEffects = player.statusEffects.filter(e => e.type !== 'temp_hp');
  }

  finalDmg = Math.max(finalDmg - player.stats.def, 1);
  player.stats.hp -= finalDmg;
  log(state, attacker, 'Attaque', finalDmg, `→ ${player.name} [${Math.max(player.stats.hp,0)}/${player.stats.hpMax}]`);

  if (player.stats.hp <= 0 && !state.immortalUsed && hasCardFlag(player, 'immortalOnce')) {
    state.immortalUsed = true; player.stats.hp = 1;
    log(state, player.name, '⚔️ Guerrier Immortel !', 1);
  }
  if (player.className === 'necromancien' && player.stats.hp <= 0) necromancerDeathCheck(state);
}

// ---------------------------------------------------------------------------
// ENNEMIS
// ---------------------------------------------------------------------------

function enemiesAction(state: CombatState, deltaMs: number) {
  for (const enemy of state.enemies) {
    if (enemy.currentHp <= 0) continue;
    let timer = (state.enemyTimers.get(enemy.id) ?? 2000) - deltaMs;
    if (timer <= 0) {
      timer = 2000 + rand(-300, 300);
      const spdDebuff = getDebuffVal(enemy, 'debuff_spd');
      if (spdDebuff > 0) timer += spdDebuff * 100;
      const atkDebuff = getDebuffVal(enemy, 'debuff_atk');
      const dmg       = Math.max(enemy.atk - atkDebuff, 1);
      playerReceiveHit(state, dmg, enemy.name);
    }
    state.enemyTimers.set(enemy.id, timer);
  }
}

// ---------------------------------------------------------------------------
// POISON TICK
// ---------------------------------------------------------------------------

function tickPoison(state: CombatState) {
  const bonus = sumCardValue(state.player, 'poisonDamageBonus');
  for (const enemy of state.enemies) {
    if (enemy.currentHp <= 0) continue;
    const poison = enemy.statusEffects.find(e => e.type === 'poison');
    if (!poison) continue;
    const dmg = Math.round(poison.value * poison.stacks * (1 + bonus));
    enemy.currentHp -= dmg;
    log(state, 'Poison', `×${poison.stacks} stacks`, dmg, `→ ${enemy.name}`);
    checkEnemyDeath(state, enemy);
  }
}

// ---------------------------------------------------------------------------
// SOIN POST-COMBAT BARBARE
// ---------------------------------------------------------------------------

function barbarianPostCombatHeal(state: CombatState) {
  if (state.player.className !== 'barbare') return;
  const bonus  = sumCardValue(state.player, 'postCombatHealBonus');
  const amount = Math.round(state.player.stats.hpMax * (0.25 + bonus));
  if (state.player.activeCards.some(c => c.id === 'barb_e2')) {
    const overheal = Math.max(0, (state.player.stats.hp + amount) - state.player.stats.hpMax);
    state.player.stats.hp = Math.min(state.player.stats.hp + amount, state.player.stats.hpMax);
    if (overheal > 0) {
      state.player.statusEffects.push({ type: 'temp_hp', stacks: 1, duration: 5, value: overheal });
      log(state, state.player.name, 'Tsunami de Sang: Vie Temporaire', overheal);
    }
  } else {
    state.player.stats.hp = Math.min(state.player.stats.hp + amount, state.player.stats.hpMax);
  }
  log(state, state.player.name, 'Soin Post-Combat', amount);
}

// ---------------------------------------------------------------------------
// BOUCLE PRINCIPALE
// ---------------------------------------------------------------------------

export function simulateCombat(
  player: PlayerState,
  enemies: CombatEnemy[],
  maxDurationMs = 120_000,
): CombatResult {
  const state   = initCombatState(player, enemies);
  const TICK_MS = 100;
  let poisonTimer = 1000;
  let elapsed     = 0;

  log(state, 'Système', '== COMBAT DÉMARRÉ ==', undefined, `vs ${enemies.map(e => e.name).join(', ')}`);

  while (elapsed < maxDurationMs) {
    elapsed           += TICK_MS;
    state.tick         = elapsed;
    poisonTimer       -= TICK_MS;
    state.playerTimer -= TICK_MS;

    if (poisonTimer <= 0) { poisonTimer = 1000; tickPoison(state); }

    if (state.playerTimer <= 0) {
      let cd = Math.round(state.player.stats.cooldown * 1000);
      if (state.player.activeCards.some(c => c.id === 'barb_r1')
        && (state.player.stats.hp / state.player.stats.hpMax) < 0.5) {
        cd = Math.max(cd - 500, 800);
      }
      state.playerTimer = cd;
      switch (state.player.className) {
        case 'barbare':      barbarianAction(state);  break;
        case 'mage_chaos':   chaosAction(state);      break;
        case 'voleur':       rogueAction(state);       break;
        case 'necromancien': necromancerAction(state); break;
      }
    }

    if (state.player.className === 'necromancien') {
      minionsAction(state, TICK_MS);
      for (const m of [...state.player.minions]) { if (m.hp <= 0) onMinionDeath(state, m); }
    }

    enemiesAction(state, TICK_MS);

    const allDead   = state.enemies.every(e => e.currentHp <= 0);
    const playerDead = state.player.stats.hp <= 0 && state.player.className !== 'necromancien';

    if (allDead) {
      log(state, 'Système', '✅ VICTOIRE !', undefined, `Temps: ${elapsed}ms`);
      barbarianPostCombatHeal(state);
      const xpTotal  = enemies.reduce((s, e) => s + e.xp, 0);
      const xpResult = grantXp(state.player, xpTotal);
      return {
        victory: true, xpGained: xpTotal, logs: state.logs,
        leveledUp: xpResult.leveledUp, newLevel: xpResult.leveledUp ? xpResult.player.level : undefined,
        finalPlayerState: xpResult.player,
      };
    }
    if (playerDead) {
      log(state, 'Système', '💀 DÉFAITE', undefined, `Temps: ${elapsed}ms`);
      return { victory: false, xpGained: 0, logs: state.logs, leveledUp: false, finalPlayerState: state.player };
    }
  }

  log(state, 'Système', '⏱️ TIMEOUT');
  return { victory: false, xpGained: 0, logs: state.logs, leveledUp: false, finalPlayerState: state.player };
}
