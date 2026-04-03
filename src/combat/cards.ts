// =============================================================================
// cards.ts — Pool complet de cartes pour les 4 classes
// =============================================================================

import type { Card, ClassName, CardRarity } from "./types";

// ---------------------------------------------------------------------------
// BARBARE
// ---------------------------------------------------------------------------

const BARBARE_CARDS: Card[] = [
  // COMMON
  {
    id: "barb_c1", name: "Frappe Brutale", rarity: "common", className: "barbare",
    description: "+15% dégâts de base",
    effect: { atk: 0, chaosDamageBonus: 0.15 }, // on utilise atk multiplier côté engine
  },
  {
    id: "barb_c2", name: "Peau Épaisse", rarity: "common", className: "barbare",
    description: "+12 PV max",
    effect: { hpMax: 12 },
  },
  {
    id: "barb_c3", name: "Endurance", rarity: "common", className: "barbare",
    description: "Réduit le cooldown de 0.15s",
    effect: { cooldown: -0.15 },
  },
  {
    id: "barb_c4", name: "Sauvagerie", rarity: "common", className: "barbare",
    description: "+3% chance de coup critique (×1.8)",
    effect: { critChance: 3 },
  },
  {
    id: "barb_c5", name: "Soin de Guerre", rarity: "common", className: "barbare",
    description: "Soin post-combat +10%",
    effect: { postCombatHealBonus: 0.10 },
  },

  // UNCOMMON
  {
    id: "barb_u1", name: "Rage", rarity: "uncommon", className: "barbare",
    description: "En dessous de 30% PV, +25% dégâts",
    effect: { rageThreshold: 30, rageDamageBonus: 0.25 },
  },
  {
    id: "barb_u2", name: "Parade Renforcée", rarity: "uncommon", className: "barbare",
    description: "+8% chance de parade",
    effect: { parryChance: 8 },
  },
  {
    id: "barb_u3", name: "Frappe Dévastatrice", rarity: "uncommon", className: "barbare",
    description: "1 attaque sur 5 stun l'ennemi 1s",
    effect: {}, // géré via flag dans le moteur de combat
  },
  {
    id: "barb_u4", name: "Colosse", rarity: "uncommon", className: "barbare",
    description: "+30 PV max, -5% vitesse d'attaque",
    effect: { hpMax: 30, cooldown: 0.18 },
  },

  // RARE
  {
    id: "barb_r1", name: "Berserk", rarity: "rare", className: "barbare",
    description: "Sous 50% PV, cooldown réduit de 0.5s",
    effect: { rageThreshold: 50, cooldown: -0.5 }, // appliqué conditionnellement
  },
  {
    id: "barb_r2", name: "Mur de Chair", rarity: "rare", className: "barbare",
    description: "Absorbe les 3 premiers dégâts de chaque combat",
    effect: {}, // flag géré dans initCombat()
  },
  {
    id: "barb_r3", name: "Exécution", rarity: "rare", className: "barbare",
    description: "Si l'ennemi est sous 15% PV, +80% dégâts",
    effect: { executionThreshold: 15, executionBonus: 0.80 },
  },

  // EPIC
  {
    id: "barb_e1", name: "Guerrier Immortel", rarity: "epic", className: "barbare",
    description: "Survie 1× à un coup fatal par combat (reste à 1 PV)",
    effect: { immortalOnce: true },
  },
  {
    id: "barb_e2", name: "Tsunami de Sang", rarity: "epic", className: "barbare",
    description: "Le soin post-combat peut dépasser le max (vie temporaire)",
    effect: { postCombatHealBonus: 0.30 }, // + flag overheal
  },
];

// ---------------------------------------------------------------------------
// MAGE DU CHAOS
// ---------------------------------------------------------------------------

const MAGE_CHAOS_CARDS: Card[] = [
  // COMMON
  {
    id: "chaos_c1", name: "Entropie Croissante", rarity: "common", className: "mage_chaos",
    description: "+2% sur chaque entrée de la table chaos",
    effect: { chaosTableBonus: 2 },
  },
  {
    id: "chaos_c2", name: "Canal Instable", rarity: "common", className: "mage_chaos",
    description: "+10% dégâts sur tous les sorts",
    effect: { chaosDamageBonus: 0.10 },
  },
  {
    id: "chaos_c3", name: "Réserve Magique", rarity: "common", className: "mage_chaos",
    description: "Réduit le retour de flamme de 15%",
    effect: { chaosBackfireReduction: 0.15 },
  },
  {
    id: "chaos_c4", name: "Flux Aléatoire", rarity: "common", className: "mage_chaos",
    description: "Relancer 1× par combat si résultat = Rien",
    effect: { rerollOnNothing: true },
  },
  {
    id: "chaos_c5", name: "Cooldown réduit", rarity: "common", className: "mage_chaos",
    description: "Réduit le cooldown de 0.15s",
    effect: { cooldown: -0.15 },
  },

  // UNCOMMON
  {
    id: "chaos_u1", name: "Chaos Amplifié", rarity: "uncommon", className: "mage_chaos",
    description: "GROS dégâts +30%, retour de flamme +30% aussi",
    effect: { chaosDamageBonus: 0.30 },
  },
  {
    id: "chaos_u2", name: "Bouclier du Destin", rarity: "uncommon", className: "mage_chaos",
    description: "15% de chance que le retour de flamme soit absorbé",
    effect: { chaosBackfireReduction: 0.15 }, // combiné avec résistance aléatoire
  },
  {
    id: "chaos_u3", name: "Table Élargie", rarity: "uncommon", className: "mage_chaos",
    description: "Débloque l'entrée 'Double Sort' dans la table chaos",
    effect: { unlockDoubleSpell: true },
  },
  {
    id: "chaos_u4", name: "Plus de Vie", rarity: "uncommon", className: "mage_chaos",
    description: "+20 PV max",
    effect: { hpMax: 20 },
  },

  // RARE
  {
    id: "chaos_r1", name: "Maître du Hasard", rarity: "rare", className: "mage_chaos",
    description: "1× par combat, choisir entre 2 résultats de la table",
    effect: { chooseBetween2: true },
  },
  {
    id: "chaos_r2", name: "Résonance", rarity: "rare", className: "mage_chaos",
    description: "Si 2 résultats identiques se suivent, effet ×1.5",
    effect: { resonanceBonus: 1.5 },
  },
  {
    id: "chaos_r3", name: "Pet Permanent", rarity: "rare", className: "mage_chaos",
    description: "Le pet invoqué reste entre les combats (50% PV)",
    effect: { petPermanent: true },
  },

  // EPIC
  {
    id: "chaos_e1", name: "Singularité", rarity: "epic", className: "mage_chaos",
    description: "2% de chance par cast de déclencher TOUS les effets simultanément",
    effect: {}, // flag spécial : singularity
  },
  {
    id: "chaos_e2", name: "Chaos Pur", rarity: "epic", className: "mage_chaos",
    description: "Table équiprobable mais tous les effets sont ×2",
    effect: { chaosDamageBonus: 1.0 }, // flag pour rendre table équiprobable
  },
];

// ---------------------------------------------------------------------------
// VOLEUR
// ---------------------------------------------------------------------------

const VOLEUR_CARDS: Card[] = [
  // COMMON
  {
    id: "thief_c1", name: "Lame Empoisonnée", rarity: "common", className: "voleur",
    description: "+1 stack de poison maximum",
    effect: { poisonStackMax: 1 },
  },
  {
    id: "thief_c2", name: "Réflexes", rarity: "common", className: "voleur",
    description: "+3% esquive",
    effect: { dodge: 3 },
  },
  {
    id: "thief_c3", name: "Dague Acérée", rarity: "common", className: "voleur",
    description: "+8% dégâts",
    effect: { atk: 1 }, // +1 atk raw, interprété comme bonus %
  },
  {
    id: "thief_c4", name: "Pickpocket Rapide", rarity: "common", className: "voleur",
    description: "Vol d'objet ne consomme pas de cooldown",
    effect: {},
  },
  {
    id: "thief_c5", name: "Furtivité", rarity: "common", className: "voleur",
    description: "Réduit le cooldown de 0.1s",
    effect: { cooldown: -0.10 },
  },

  // UNCOMMON
  {
    id: "thief_u1", name: "Poison Virulent", rarity: "uncommon", className: "voleur",
    description: "Chaque stack de poison fait +15% dégâts",
    effect: { poisonDamageBonus: 0.15 },
  },
  {
    id: "thief_u2", name: "Contre-Attaque", rarity: "uncommon", className: "voleur",
    description: "Après une esquive, attaque instantanée à 60% dégâts",
    effect: { counterAttackChance: 100, counterAttackMultiplier: 0.60 },
  },
  {
    id: "thief_u3", name: "Ombre", rarity: "uncommon", className: "voleur",
    description: "10% de chance d'être immunisé 1s après une esquive",
    effect: { shadowChance: 10 },
  },
  {
    id: "thief_u4", name: "Vol Ciblé", rarity: "uncommon", className: "voleur",
    description: "Peut voler un objet équipé à l'ennemi",
    effect: {},
  },

  // RARE
  {
    id: "thief_r1", name: "Toxicologue", rarity: "rare", className: "voleur",
    description: "Le poison peut se stacker jusqu'à 8",
    effect: { poisonStackMax: 4 }, // +4 sur la base de 4
  },
  {
    id: "thief_r2", name: "Exécution Furtive", rarity: "rare", className: "voleur",
    description: "Premier coup du combat fait ×2.5 dégâts",
    effect: { firstHitMultiplier: 2.5 },
  },
  {
    id: "thief_r3", name: "Fantôme", rarity: "rare", className: "voleur",
    description: "Esquive parfaite garantie contre le 1er coup de chaque combat",
    effect: { guaranteedDodgeFirst: true },
  },

  // EPIC
  {
    id: "thief_e1", name: "Lame du Néant", rarity: "epic", className: "voleur",
    description: "Chaque attaque applique automatiquement 2 stacks de poison",
    effect: {}, // flag : autoPoison2
  },
  {
    id: "thief_e2", name: "Danse de Mort", rarity: "epic", className: "voleur",
    description: "Après une esquive réussie, prochain coup critique garanti",
    effect: { counterAttackChance: 100, critChance: 100 }, // flag : guaranteedCritAfterDodge
  },
];

// ---------------------------------------------------------------------------
// NÉCROMANCIEN
// ---------------------------------------------------------------------------

const NECRO_CARDS: Card[] = [
  // COMMON
  {
    id: "necro_c1", name: "Invocation Renforcée", rarity: "common", className: "necromancien",
    description: "+10% PV sur les minions invoqués",
    effect: { minionHpBonus: 0.10 },
  },
  {
    id: "necro_c2", name: "Lien Nécrotique", rarity: "common", className: "necromancien",
    description: "Soin à mort d'un minion : minimum passe de 0.1× à 0.2×",
    effect: { necroHealMin: 0.20 },
  },
  {
    id: "necro_c3", name: "Ossements Solides", rarity: "common", className: "necromancien",
    description: "+8 PV max",
    effect: { hpMax: 8 },
  },
  {
    id: "necro_c4", name: "Aura Morbide", rarity: "common", className: "necromancien",
    description: "Les minions agissent 10% plus vite",
    effect: { cooldown: -0.05 }, // appliqué aux minions
  },
  {
    id: "necro_c5", name: "Résistance Morbide", rarity: "common", className: "necromancien",
    description: "+4 défense",
    effect: { def: 4 },
  },

  // UNCOMMON
  {
    id: "necro_u1", name: "Légion des Morts", rarity: "uncommon", className: "necromancien",
    description: "+1 minion simultané maximum",
    effect: { minionCountMax: 1 },
  },
  {
    id: "necro_u2", name: "Festin", rarity: "uncommon", className: "necromancien",
    description: "Soin à mort d'ennemi ou minion : minimum garanti à 0.4×",
    effect: { necroHealMin: 0.40 },
  },
  {
    id: "necro_u3", name: "Armure d'Os", rarity: "uncommon", className: "necromancien",
    description: "-10% dégâts reçus si au moins 1 minion en vie",
    effect: { def: 3 }, // flag: boneArmor
  },
  {
    id: "necro_u4", name: "Résurrection", rarity: "uncommon", className: "necromancien",
    description: "25% de chance qu'un minion mort revive avec 25% PV",
    effect: {}, // flag: resurrection
  },

  // RARE
  {
    id: "necro_r1", name: "Pacte Sombre", rarity: "rare", className: "necromancien",
    description: "La barre de mort gagne 0–3 au lieu de 0–5",
    effect: { deathBarReduction: 2 }, // max réduit à 3
  },
  {
    id: "necro_r2", name: "Armée Fantôme", rarity: "rare", className: "necromancien",
    description: "Les minions de base ont +50% ATK",
    effect: { armyGhost: true },
  },
  {
    id: "necro_r3", name: "Drain de Vie", rarity: "rare", className: "necromancien",
    description: "Chaque attaque de tes minions te soigne de 2 PV",
    effect: { drainLife: 2 },
  },

  // EPIC
  {
    id: "necro_e1", name: "Lich", rarity: "epic", className: "necromancien",
    description: "Si la barre de mort dépasse 80, elle est immédiatement divisée par 2",
    effect: { lichPassive: true },
  },
  {
    id: "necro_e2", name: "Seigneur des Morts", rarity: "epic", className: "necromancien",
    description: "Quand tu survis à 0 PV, tous les minions morts se relèvent à 50% PV",
    effect: {}, // flag: lordOfDead
  },
];

// ---------------------------------------------------------------------------
// EXPORT & UTILITAIRES
// ---------------------------------------------------------------------------

export const ALL_CARDS: Record<ClassName, Card[]> = {
  barbare: BARBARE_CARDS,
  mage_chaos: MAGE_CHAOS_CARDS,
  voleur: VOLEUR_CARDS,
  necromancien: NECRO_CARDS,
};

/**
 * Retourne les poids de rareté selon le niveau du joueur.
 * Les raretés Rare et Épique débloquées progressivement.
 */
export function getRarityWeights(level: number): Record<CardRarity, number> {
  const rareUnlock    = Math.max(0, (level - 5) * 0.5);   // +0.5% par niveau depuis nv5
  const epicUnlock    = Math.max(0, (level - 10) * 0.25); // +0.25% par niveau depuis nv10
  const rareWeight    = Math.min(13 + rareUnlock, 25);
  const epicWeight    = Math.min(4  + epicUnlock, 12);
  const uncommonWeight = 28;
  const commonWeight  = Math.max(100 - rareWeight - epicWeight - uncommonWeight, 20);

  return {
    common:   commonWeight,
    uncommon: uncommonWeight,
    rare:     rareWeight,
    epic:     epicWeight,
  };
}
