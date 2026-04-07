# CrawlVenture

Dungeon Crawler en tour par tour — RPG de donjon avec salles aleatoires, ennemis, loot et boss final.

## Stack technique

| Tech | Usage |
|------|-------|
| **React 18** + **TypeScript** | Framework UI |
| **Vite** | Build & dev server |
| **Tailwind CSS** | Styling (theme dark donjon) |
| **shadcn/ui** (Radix) | Composants UI de base |
| **Vitest** + **Playwright** | Tests unitaires & E2E |
| **Canvas API** | Rendu pixel art (UIManager) |
| **Web Audio API** | Effets sonores |
| **Lovable** | Scaffolding initial du projet + composants shadcn/ui |

## Lancer le projet

```bash
npm install
npm run dev
```

Ouvrir **http://localhost:8080**

## Repartition de l'equipe

| Membre | Partie | Dossiers |
|--------|--------|----------|
| **Baart** | Game Engine & Core | `src/engine/`, `src/screens/`, `App.tsx` |
| **Lon** | Combat & Personnage | `src/combat/`, `src/screens/CombatScreen.tsx`, `TitleScreen.tsx` |
| **Jenn** | Generation des niveaux | `src/levels/`, `src/components/DungeonMap.tsx`, `RoomDetail.tsx` |
| **Noura** | UI / Art & Son | `src/ui/UIManager.js`, `src/ui/crystal_dungeon_demo.html` |

## Architecture du code

```
src/
├── engine/                  # BAART — Moteur du jeu
│   ├── GameContext.tsx       #   Machine a etats (useReducer) + Context React
│   └── gameTypes.ts          #   Types partages : Player, GameState, GameAction, ClassedPlayer
│
├── screens/                 # BAART + LON — Ecrans du jeu
│   ├── TitleScreen.tsx       #   Ecran titre + selection de classe + nom (Lon)
│   ├── GameScreen.tsx        #   Ecran principal : carte + HUD (Baart)
│   ├── CombatScreen.tsx      #   Combat AFK complet avec logs et level up (Lon)
│   ├── InventoryScreen.tsx   #   Inventaire avec rarete coloree (Baart)
│   ├── GameOverScreen.tsx    #   Ecran defaite (Baart)
│   └── WinScreen.tsx         #   Ecran victoire (Baart)
│
├── combat/                  # LON — Systeme de combat complet
│   ├── types.ts              #   Types : PlayerState, CombatEnemy, Card, StatusEffect, etc.
│   ├── player.ts             #   Factory joueur par classe + helpers de lecture des cartes
│   ├── cards.ts              #   56 cartes pour 4 classes (common → epic)
│   ├── combat.ts             #   Moteur de combat AFK (simulation tick par tick)
│   ├── levelup.ts            #   Systeme XP, courbe de niveau, tirage de cartes
│   └── CombatSystem.ts       #   Facade publique + adapteur Enemy → CombatEnemy
│
├── levels/                  # JENN — Generation procedurale
│   ├── types.ts              #   Types : Room, Enemy, LootItem, DungeonFloor, etc.
│   ├── dungeonGenerator.ts   #   Generateur de donjon (random walk + seed)
│   ├── enemyFactory.ts       #   13 templates d'ennemis (minion/elite/boss)
│   ├── lootTables.ts         #   Tables de loot (armes, armures, potions, scrolls)
│   └── index.ts              #   Re-exports
│
├── ui/                      # NOURA — UI Pixel Art & Son
│   ├── UIManager.js          #   Rendu canvas pixel art, sprites, damage numbers, sons
│   └── crystal_dungeon_demo.html  #   Demo standalone du rendu visuel
│
├── components/              # JENN + NOURA — Composants visuels
│   ├── DungeonMap.tsx        #   Carte interactive du donjon (SVG + boutons)
│   ├── RoomDetail.tsx        #   Detail d'une salle (ennemis, loot, portes)
│   ├── PixelCanvas.tsx       #   Wrapper React du canvas Noura (overlay effets visuels)
│   └── ui/                   #   48+ composants shadcn/ui
│
├── hooks/                   # Hooks partages
│   ├── useSoundFX.ts         #   Hook sons (Noura) — accessible depuis tous les ecrans
│   ├── use-mobile.tsx        #   Detection mobile
│   └── use-toast.ts          #   Notifications toast
│
├── App.tsx                  # BAART — Point d'entree : ScreenRouter + providers
├── main.tsx                 # Montage React
└── index.css                # Theme Tailwind (couleurs donjon, font pixel)
```

## Comment ca marche

### Machine a etats (Baart)

Le jeu fonctionne avec un **useReducer** central dans `GameContext.tsx`. Tous les ecrans lisent et modifient l'etat via :

```tsx
const { state, dispatch } = useGame();
```

**Etats (screens) :**
```
title → (choix classe) → (choix nom) → game → combat → game (victoire) ou gameover (defaite)
                                                  ↓
                                                 win (si boss vaincu)

game → inventory → game
```

**Actions disponibles :**

| Action | Effet |
|--------|-------|
| `START_GAME` | Cree un joueur + genere un donjon → ecran `game` |
| `ENTER_ROOM` | Change la salle courante |
| `ENTER_COMBAT` | Passe a l'ecran combat avec un ennemi |
| `END_COMBAT_WIN` | Retour a `game`, salle marquee cleared |
| `END_COMBAT_LOSE` | Ecran game over |
| `BOSS_DEFEATED` | Ecran victoire |
| `OPEN_INVENTORY` / `CLOSE_INVENTORY` | Toggle inventaire |
| `NEXT_TURN` | Incremente le compteur de tours |
| `RESET` | Retour au titre |

### Systeme de combat (Lon)

**Combat AFK** — le joueur regarde son heros se battre automatiquement en temps reel simule.

**4 classes jouables :**

| Classe | Style | Mecanique unique |
|--------|-------|-----------------|
| Barbare | Tanky, gros degats | Parade, rage sous 30% PV, soin post-combat |
| Mage du Chaos | Aleatoire, puissant | Table chaos (10 effets aleatoires), backfire, pet |
| Voleur | Rapide, esquive | Poison stackable, contre-attaque apres esquive |
| Necromancien | Invocateur | Minions, barre de mort, festin sur les cadavres |

**56 cartes de progression** (14 par classe) : common, uncommon, rare, epic.
A chaque level up, le joueur choisit 1 carte parmi 3 proposees (tirage pondere par rarete).

**Courbe XP :** `100 * niveau^1.5` — max niveau 20.

### Generation de donjon (Jenn)

- **Algorithme :** Random walk depuis le centre d'une grille
- **Seed :** Reproductible via RNG mulberry32
- **Types de salles :** start, normal (70%), treasure (12%), trap (10%), boss (derniere)
- **Ennemis :** Scaling par difficulte (1-10) et par etage (+0.5/etage)
- **Loot :** Poids par rarete : common(50) > uncommon(30) > rare(13) > epic(5) > legendary(2)
- **Connexions :** Portes bidirectionnelles + 20% chance de chemins croises

### UI Pixel Art & Sons (Noura)

`UIManager.js` fournit un systeme de rendu canvas + audio complet, integre dans React via :
- `PixelCanvas.tsx` — Composant React qui superpose un canvas transparent pour les effets visuels
- `useSoundFX.ts` — Hook qui expose tous les sons depuis n'importe quel composant

**Effets visuels (canvas overlay en combat) :**
- **Damage numbers** flottants avec animation (degats, soins, crit, miss)
- **Effets de sorts** : slash, petal, ice, lightning, heal, explosion
- **Sprites pixel art** : heros (fee, rose, ombre), ennemis (slime, boss, skull)

**Sons synthetiques (Web Audio API) :**

| Son | Declencheur |
|-----|------------|
| `slash` | Debut de combat |
| `hit` | Attaque / frappe |
| `heal` | Soin / survie |
| `lightning` | Coup critique / chaos |
| `death` | Mort ennemi / game over |
| `loot` | Entree salle tresor |
| `levelup` | Victoire / level up |
| `sparkle` | Selection classe / invocation |
| `menu` | Navigation ecrans |

**Palette coherente** : rose/lavande/menthe/or sur fond sombre

### Stats de base par classe

| Classe | PV | ATK | DEF | Esquive | Crit | Cooldown |
|--------|----|-----|-----|---------|------|----------|
| Barbare | 160 | 22 | 8 | 5% | 8% | 3.5s |
| Mage Chaos | 90 | 14 | 4 | 8% | 10% | 2.5s |
| Voleur | 75 | 12 | 3 | 22% | 15% | 1.8s |
| Necromancien | 80 | 10 | 5 | 6% | 6% | 2.5s |

### Ennemis notables

| Nom | Tier | HP | ATK | DEF | XP |
|-----|------|----|-----|-----|----|
| Rat geant | Minion | 15 | 3 | 1 | 5 |
| Gobelin | Minion | 18 | 6 | 2 | 10 |
| Chevalier noir | Elite | 60 | 12 | 8 | 30 |
| Ogre | Elite | 80 | 15 | 5 | 35 |
| Dragon ancien | Boss | 200 | 25 | 15 | 150 |
| Liche supreme | Boss | 150 | 30 | 10 | 180 |
| Demon des abysses | Boss | 250 | 22 | 18 | 200 |

## Ce qui reste a faire

### Integration (fait)
- [x] Connecter UIManager.js (canvas Noura) comme composant React → `PixelCanvas.tsx`
- [x] Ajouter les sons de Noura (Web Audio API) aux evenements de combat → `useSoundFX.ts`
- [x] Sons sur tous les ecrans (titre, game, combat, game over, victoire)
- [x] Effets visuels canvas (damage numbers, slash, explosion) en overlay combat

### Gameplay
- [ ] Collecte automatique du loot en entrant dans une salle treasure
- [ ] Navigation salle par salle (verifier adjacence avant de bouger)
- [ ] Multi-etages (la structure existe deja dans `generateDungeon()`)
- [ ] Sauvegarde locale (localStorage)
- [ ] Utilisation des potions/scrolls en combat
- [ ] Equipement d'armes/armures depuis l'inventaire

### Polish
- [ ] Animations CSS sur les transitions d'ecran
- [ ] Afficher les sprites pixel art (heros/ennemis) dans les panneaux React du combat
- [ ] Ecran titre anime avec particules canvas de Noura

## Branches

| Branche | Contenu |
|---------|---------|
| `main` | Base commune (Baart + Jenn) |
| `brt` | Branche de Baart (Game Engine) |
| `DevL0n` | Branche de Lon (Combat complet) |
| `NOURA` | Branche de Noura (UI pixel art) |
| `MergeTotal` | Fusion de toutes les branches |

## Scripts

```bash
npm run dev       # Serveur de dev (port 8080)
npm run build     # Build production
npm run test      # Tests unitaires (vitest)
npm run lint      # ESLint
```