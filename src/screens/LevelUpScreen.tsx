// =============================================================================
// LevelUpScreen.tsx — Répartition de points de compétence
// 5 points par level up dans : ATK, DEF, VIE, Mana/Stamina, %XP
// =============================================================================

import { useState } from 'react';
import { useGame } from '../engine/GameContext';
import { useSoundFX } from '../hooks/useSoundFX';
import PixelSprite, { getHeroSpriteName } from '../components/PixelSprite';

interface StatAlloc {
  atk: number;
  def: number;
  hp: number;
  resource: number;
  xpBonus: number;
}

const STAT_INFO = {
  atk:      { label: 'Attaque',        icon: '⚔️', color: 'text-red-400',    per: '+2 ATK par point' },
  def:      { label: 'Defense',         icon: '🛡️', color: 'text-yellow-400', per: '+1 DEF par point' },
  hp:       { label: 'Vie',             icon: '❤️', color: 'text-green-400',  per: '+8 PV max par point' },
  resource: { label: 'Mana / Stamina',  icon: '💎', color: 'text-blue-400',   per: '+1 max par point, +1 regen tous les 2 pts' },
  xpBonus:  { label: 'Bonus XP',        icon: '✨', color: 'text-purple-400', per: '+5% XP gagné par point' },
};

export default function LevelUpScreen() {
  const { state, dispatch } = useGame();
  const { player } = state;
  const sfx = useSoundFX();

  const [alloc, setAlloc] = useState<StatAlloc>({ atk: 0, def: 0, hp: 0, resource: 0, xpBonus: 0 });

  if (!player || player.statPoints <= 0) {
    // Pas de points → retour direct
    dispatch({ type: 'CLOSE_LEVELUP' });
    return null;
  }

  const pointsUsed = alloc.atk + alloc.def + alloc.hp + alloc.resource + alloc.xpBonus;
  const pointsLeft = player.statPoints - pointsUsed;
  const resLabel = player.resourceType === 'mana' ? 'Mana' : 'Stamina';

  const add = (stat: keyof StatAlloc) => {
    if (pointsLeft <= 0) return;
    sfx.playSparkle();
    setAlloc(prev => ({ ...prev, [stat]: prev[stat] + 1 }));
  };

  const remove = (stat: keyof StatAlloc) => {
    if (alloc[stat] <= 0) return;
    setAlloc(prev => ({ ...prev, [stat]: prev[stat] - 1 }));
  };

  const confirm = () => {
    if (pointsLeft > 0) return; // doit tout dépenser

    sfx.playLevelUp();
    // Regen +1 tous les 2 points de mana/stamina investis
    const newMaxResource = player.maxResource + alloc.resource;
    const regenGain = Math.floor(alloc.resource / 2);

    dispatch({
      type: 'SET_PLAYER',
      player: {
        ...player,
        attack:        player.attack        + alloc.atk * 2,
        defense:       player.defense       + alloc.def * 1,
        maxHp:         player.maxHp         + alloc.hp * 8,
        hp:            player.hp            + alloc.hp * 8,
        maxResource:   newMaxResource,
        resourceRegen: player.resourceRegen + regenGain,
        xpBonus:       player.xpBonus       + alloc.xpBonus * 5,
        statPoints:    0,
      },
    });
    dispatch({ type: 'CLOSE_LEVELUP' });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border-2 border-primary rounded-xl p-6 w-full max-w-md space-y-5">

        {/* Header */}
        <div className="text-center space-y-2">
          <PixelSprite name={getHeroSpriteName(player.className)} scale={5} className="mx-auto" />
          <h2 className="font-pixel text-xl text-primary">LEVEL UP !</h2>
          <p className="text-sm text-muted-foreground">
            {player.name} atteint le niveau {player.level}
          </p>
          <div className="inline-block bg-primary/20 border border-primary rounded-full px-4 py-1">
            <span className="font-pixel text-sm text-primary">{pointsLeft} points restants</span>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          {(Object.keys(STAT_INFO) as (keyof StatAlloc)[]).map(stat => {
            const info = STAT_INFO[stat];
            const label = stat === 'resource' ? resLabel : info.label;
            return (
              <div key={stat} className="flex items-center gap-3 bg-secondary/50 rounded-lg px-3 py-2">
                <span className="text-lg w-8 text-center">{info.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-pixel text-xs ${info.color}`}>{label}</p>
                  <p className="text-xs text-muted-foreground">{info.per}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => remove(stat)} disabled={alloc[stat] <= 0}
                    className="w-7 h-7 rounded bg-secondary border border-border text-sm font-bold disabled:opacity-20 hover:border-primary">
                    -
                  </button>
                  <span className={`font-pixel text-sm w-6 text-center ${alloc[stat] > 0 ? info.color : 'text-muted-foreground'}`}>
                    {alloc[stat]}
                  </span>
                  <button onClick={() => add(stat)} disabled={pointsLeft <= 0}
                    className="w-7 h-7 rounded bg-secondary border border-border text-sm font-bold disabled:opacity-20 hover:border-primary">
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Preview */}
        <div className="bg-secondary/30 rounded-lg px-3 py-2 text-xs text-muted-foreground space-y-1">
          <p className="font-pixel text-xs text-primary mb-1">Apercu :</p>
          {alloc.atk > 0 && <p>ATK {player.attack} → <span className="text-red-400">{player.attack + alloc.atk * 2}</span></p>}
          {alloc.def > 0 && <p>DEF {player.defense} → <span className="text-yellow-400">{player.defense + alloc.def}</span></p>}
          {alloc.hp > 0 && <p>PV max {player.maxHp} → <span className="text-green-400">{player.maxHp + alloc.hp * 8}</span></p>}
          {alloc.resource > 0 && <p>{resLabel} max {player.maxResource} → <span className="text-blue-400">{player.maxResource + alloc.resource}</span>
            {Math.floor(alloc.resource / 2) > 0 && <>, regen {player.resourceRegen} → {player.resourceRegen + Math.floor(alloc.resource / 2)}</>}
          </p>}
          {alloc.xpBonus > 0 && <p>Bonus XP {player.xpBonus}% → <span className="text-purple-400">{player.xpBonus + alloc.xpBonus * 5}%</span></p>}
          {pointsUsed === 0 && <p className="italic">Aucun point attribue</p>}
        </div>

        {/* Confirmer */}
        <button onClick={confirm} disabled={pointsLeft > 0}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-pixel text-sm hover:opacity-90 transition-all disabled:opacity-30">
          {pointsLeft > 0 ? `Repartir les ${pointsLeft} points restants` : 'Confirmer'}
        </button>
      </div>
    </div>
  );
}
