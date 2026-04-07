// =============================================================================
// InventoryScreen.tsx — Inventaire + Fiche personnage + Équipement
// =============================================================================

import { useState } from 'react';
import { useGame } from '../engine/GameContext';
import { useSoundFX } from '../hooks/useSoundFX';
import type { LootItem, EquipSlot } from '../levels/types';

const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
};

const RARITY_BORDER: Record<string, string> = {
  common: 'border-gray-600',
  uncommon: 'border-green-600',
  rare: 'border-blue-600',
  epic: 'border-purple-600',
  legendary: 'border-yellow-500',
};

const SLOT_LABELS: Record<EquipSlot, string> = {
  weapon: 'Arme',
  helmet: 'Casque',
  chest: 'Armure',
  accessory: 'Accessoire',
};

const SLOT_ICONS: Record<EquipSlot, string> = {
  weapon: '🗡️',
  helmet: '⛑️',
  chest: '🛡️',
  accessory: '💍',
};

const CLASS_LABELS: Record<string, string> = {
  barbare: 'Barbare',
  mage_chaos: 'Mage du Chaos',
  voleur: 'Voleur',
  necromancien: 'Nécromancien',
};

export default function InventoryScreen() {
  const { state, dispatch } = useGame();
  const { player } = state;
  const sfx = useSoundFX();
  const [tab, setTab] = useState<'character' | 'inventory'>('character');

  if (!player) return null;

  // Calcul des bonus d'équipement
  const equipBonus = { atk: 0, def: 0, hp: 0, resource: 0 };
  for (const item of Object.values(player.equipment)) {
    if (item?.equipStats) {
      equipBonus.atk += item.equipStats.atk ?? 0;
      equipBonus.def += item.equipStats.def ?? 0;
      equipBonus.hp += item.equipStats.hp ?? 0;
      equipBonus.resource += item.equipStats.resource ?? 0;
    }
  }

  const totalAtk = player.attack + equipBonus.atk;
  const totalDef = player.defense + equipBonus.def;
  const totalHp = player.maxHp + equipBonus.hp;
  const totalRes = player.maxResource + equipBonus.resource;
  const resLabel = player.resourceType === 'mana' ? 'Mana' : 'Stamina';

  // Équiper un item
  const equipItem = (item: LootItem) => {
    if (!item.equipSlot || !item.equipStats) return;
    sfx.playSparkle();

    const slot = item.equipSlot;
    const currentEquipped = player.equipment[slot];
    const newInventory = player.inventory.filter(i => i.id !== item.id);

    // Remettre l'ancien équipement dans l'inventaire
    if (currentEquipped) {
      newInventory.push(currentEquipped);
    }

    const newEquipment = { ...player.equipment, [slot]: item };

    // Recalculer les stats avec le nouvel équipement
    const newEquipBonus = { atk: 0, def: 0, hp: 0, resource: 0 };
    for (const eq of Object.values(newEquipment)) {
      if (eq?.equipStats) {
        newEquipBonus.atk += eq.equipStats.atk ?? 0;
        newEquipBonus.def += eq.equipStats.def ?? 0;
        newEquipBonus.hp += eq.equipStats.hp ?? 0;
        newEquipBonus.resource += eq.equipStats.resource ?? 0;
      }
    }

    dispatch({
      type: 'SET_PLAYER',
      player: {
        ...player,
        inventory: newInventory,
        equipment: newEquipment,
        hp: Math.min(player.hp, player.maxHp + newEquipBonus.hp),
      },
    });
  };

  // Déséquiper un item
  const unequipItem = (slot: EquipSlot) => {
    const item = player.equipment[slot];
    if (!item) return;
    sfx.playMenu();

    dispatch({
      type: 'SET_PLAYER',
      player: {
        ...player,
        inventory: [...player.inventory, item],
        equipment: { ...player.equipment, [slot]: null },
      },
    });
  };

  // Items équipables dans l'inventaire
  const equipableItems = player.inventory.filter(i => i.equipSlot && i.equipStats);
  const consumables = player.inventory.filter(i => i.type === 'potion' || i.type === 'scroll');
  const otherItems = player.inventory.filter(i => !i.equipSlot && i.type !== 'potion' && i.type !== 'scroll' && i.type !== 'gold');

  return (
    <div className="min-h-screen bg-background p-4 space-y-4 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-xl text-primary">Inventaire</h2>
        <button
          onClick={() => dispatch({ type: 'CLOSE_INVENTORY' })}
          className="text-sm text-muted-foreground hover:text-foreground font-pixel px-3 py-1 border border-border rounded"
        >
          Fermer
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('character')}
          className={`px-4 py-2 rounded-md font-pixel text-xs transition-all ${
            tab === 'character' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
          Personnage
        </button>
        <button
          onClick={() => setTab('inventory')}
          className={`px-4 py-2 rounded-md font-pixel text-xs transition-all ${
            tab === 'inventory' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
          Sac ({player.inventory.length})
        </button>
      </div>

      {/* ═══ TAB PERSONNAGE ═══ */}
      {tab === 'character' && (
        <div className="space-y-4">

          {/* Stats */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-pixel text-sm text-primary">{player.name}</p>
                <p className="text-xs text-muted-foreground">{CLASS_LABELS[player.className] ?? player.className} — Niveau {player.level}</p>
              </div>
              <div className="text-xs text-muted-foreground text-right">
                <p>{player.gold} or</p>
                <p>{player.xp} / {player.xpToNextLevel} XP</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary rounded-md px-3 py-2">
                <p className="text-xs text-muted-foreground">PV</p>
                <p className="font-pixel text-sm">{player.hp} / {totalHp}
                  {equipBonus.hp > 0 && <span className="text-green-400 text-xs"> (+{equipBonus.hp})</span>}
                </p>
              </div>
              <div className="bg-secondary rounded-md px-3 py-2">
                <p className="text-xs text-muted-foreground">{resLabel}</p>
                <p className="font-pixel text-sm">{totalRes}
                  {equipBonus.resource > 0 && <span className="text-blue-400 text-xs"> (+{equipBonus.resource})</span>}
                </p>
              </div>
              <div className="bg-secondary rounded-md px-3 py-2">
                <p className="text-xs text-muted-foreground">ATK</p>
                <p className="font-pixel text-sm">{totalAtk}
                  {equipBonus.atk > 0 && <span className="text-red-400 text-xs"> (+{equipBonus.atk})</span>}
                </p>
              </div>
              <div className="bg-secondary rounded-md px-3 py-2">
                <p className="text-xs text-muted-foreground">DEF</p>
                <p className="font-pixel text-sm">{totalDef}
                  {equipBonus.def > 0 && <span className="text-yellow-400 text-xs"> (+{equipBonus.def})</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Équipement */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <p className="font-pixel text-xs text-primary">Equipement</p>
            <div className="grid grid-cols-2 gap-3">
              {(['weapon', 'helmet', 'chest', 'accessory'] as EquipSlot[]).map(slot => {
                const equipped = player.equipment[slot];
                return (
                  <div key={slot}
                    className={`p-3 rounded-lg border-2 space-y-1 ${
                      equipped ? RARITY_BORDER[equipped.rarity] : 'border-border border-dashed'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{SLOT_ICONS[slot]} {SLOT_LABELS[slot]}</span>
                      {equipped && (
                        <button onClick={() => unequipItem(slot)}
                          className="text-xs text-red-400 hover:text-red-300">Retirer</button>
                      )}
                    </div>
                    {equipped ? (
                      <>
                        <p className={`font-pixel text-xs ${RARITY_COLORS[equipped.rarity]}`}>
                          {equipped.icon} {equipped.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{equipped.description}</p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Vide</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compétences */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <p className="font-pixel text-xs text-primary">Competences</p>
            <div className="grid grid-cols-2 gap-2">
              {player.skills.map((sk, i) => (
                <div key={i} className="bg-secondary rounded-md px-3 py-2">
                  <p className="font-pixel text-xs">{sk.icon} {sk.name}</p>
                  <p className="text-xs text-muted-foreground">{sk.cost} {resLabel} — {sk.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB INVENTAIRE ═══ */}
      {tab === 'inventory' && (
        <div className="space-y-4">

          {/* Items équipables */}
          {equipableItems.length > 0 && (
            <div className="space-y-2">
              <p className="font-pixel text-xs text-primary">Equipable</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {equipableItems.map(item => (
                  <button key={item.id} onClick={() => equipItem(item)}
                    className={`p-3 rounded-lg border text-left transition-all hover:scale-[1.02] ${RARITY_BORDER[item.rarity]} bg-card`}>
                    <p className={`font-pixel text-xs ${RARITY_COLORS[item.rarity]}`}>{item.icon} {item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                    <p className="text-xs text-yellow-400 mt-1">Cliquer pour equiper</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Consommables */}
          {consumables.length > 0 && (
            <div className="space-y-2">
              <p className="font-pixel text-xs text-primary">Consommables</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {consumables.map(item => (
                  <div key={item.id} className="bg-card border border-border rounded-lg p-3 space-y-2">
                    <p className={`font-pixel text-xs ${RARITY_COLORS[item.rarity]}`}>{item.icon} {item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                    {item.type === 'potion' && (
                      <button
                        onClick={() => {
                          let heal = 20;
                          if (item.name.includes('vie') || item.name.includes('lixir')) heal = player.maxHp + equipBonus.hp - player.hp;
                          if (item.name.includes('force')) heal = 0;
                          if (player.hp >= player.maxHp + equipBonus.hp && heal > 0) return;
                          const newHp = Math.min(player.hp + heal, player.maxHp + equipBonus.hp);
                          const inv = player.inventory.filter(i => i.id !== item.id);
                          dispatch({ type: 'SET_PLAYER', player: { ...player, hp: newHp, inventory: inv } });
                          sfx.playHeal();
                        }}
                        disabled={player.hp >= player.maxHp + equipBonus.hp && !item.name.includes('force')}
                        className="w-full px-2 py-1 bg-green-600/80 text-white rounded text-xs font-pixel hover:opacity-90 disabled:opacity-30">
                        Utiliser
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Autres */}
          {otherItems.length > 0 && (
            <div className="space-y-2">
              <p className="font-pixel text-xs text-primary">Divers</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {otherItems.map(item => (
                  <div key={item.id} className="bg-card border border-border rounded-lg p-3">
                    <p className={`font-pixel text-xs ${RARITY_COLORS[item.rarity]}`}>{item.icon} {item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {player.inventory.length === 0 && (
            <p className="text-sm text-muted-foreground italic text-center py-8">
              Votre sac est vide. Explorez le donjon !
            </p>
          )}
        </div>
      )}
    </div>
  );
}
