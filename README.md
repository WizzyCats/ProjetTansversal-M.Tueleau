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
| **Lon** | Combat & Personnage | A integrer dans `src/screens/CombatScreen.tsx`, `InventoryScreen.tsx` |
| **Jenn** | Generation des niveaux | `src/levels/`, `src/components/DungeonMap.tsx`, `RoomDetail.tsx` |
| **Noura** | UI / Art & Son | Styles dans `src/index.css`, visuels des screens |

## Architecture du code

```
src/
├── engine/                  # BAART — Moteur du jeu
│   ├── GameContext.tsx       #   Machine a etats (useReducer) + Context React
│   └── gameTypes.ts          #   Types partages : Player, GameState, GameAction
│
├── screens/                 # BAART — Ecrans du jeu (routing par etat)
│   ├── TitleScreen.tsx       #   Ecran titre → startGame()
│   ├── GameScreen.tsx        #   Ecran principal : carte + HUD
│   ├── CombatScreen.tsx      #   STUB pour Lon (combat placeholder)
│   ├── InventoryScreen.tsx   #   STUB pour Lon (inventaire placeholder)
│   ├── GameOverScreen.tsx    #   Ecran defaite → resetGame()
│   └── WinScreen.tsx         #   Ecran victoire → resetGame()
│
├── levels/                  # JENN — Generation procedurale
│   ├── types.ts              #   Types : Room, Enemy, LootItem, DungeonFloor, etc.
│   ├── dungeonGenerator.ts   #   Generateur de donjon (random walk + seed)
│   ├── enemyFactory.ts       #   13 templates d'ennemis (minion/elite/boss)
│   ├── lootTables.ts         #   Tables de loot (armes, armures, potions, scrolls)
│   └── index.ts              #   Re-exports
│
├── components/              # JENN + NOURA — Composants visuels
│   ├── DungeonMap.tsx        #   Carte interactive du donjon (SVG + boutons)
│   ├── RoomDetail.tsx        #   Detail d'une salle (ennemis, loot, portes)
│   └── ui/                   #   48+ composants shadcn/ui
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
title → game → combat → game (victoire) ou gameover (defaite)
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

### Generation de donjon (Jenn)

- **Algorithme :** Random walk depuis le centre d'une grille
- **Seed :** Reproductible via RNG mulberry32
- **Types de salles :** start, normal (70%), treasure (12%), trap (10%), boss (derniere)
- **Ennemis :** Scaling par difficulte (1-10) et par etage (+0.5/etage)
- **Loot :** Poids par rarete : common(50) > uncommon(30) > rare(13) > epic(5) > legendary(2)
- **Connexions :** Portes bidirectionnelles + 20% chance de chemins croises

### Joueur par defaut

```
HP: 100 | ATK: 15 | DEF: 5 | Niveau: 1 | Or: 0
```

### Ennemis notables

| Nom | Tier | HP | ATK | DEF | XP |
|-----|------|----|-----|-----|----|
| Rat geant | Minion | 15 | 3 | 1 | 5 |
| Chevalier noir | Elite | 60 | 12 | 8 | 30 |
| Dragon ancien | Boss | 200 | 25 | 15 | 150 |
| Liche supreme | Boss | 150 | 30 | 10 | 180 |

## Ce qui reste a faire

### Lon — Combat & Personnage
- [ ] Systeme de combat tour par tour reel (remplacer les boutons placeholder)
- [ ] Calcul de degats (ATK - DEF, min 1)
- [ ] Systeme de level up (XP → niveau)
- [ ] Utilisation des potions/scrolls en combat
- [ ] Equipement d'armes/armures depuis l'inventaire

### Noura — UI / Art & Son
- [ ] Animations CSS sur les transitions d'ecran
- [ ] Effets visuels de combat (shake, flash)
- [ ] Sound design (Web Audio API) : ambiance, coups, loot
- [ ] Ecran titre anime
- [ ] Polish des ecrans Game Over et Victoire

### Ameliorations globales
- [ ] Collecte automatique du loot en entrant dans une salle treasure
- [ ] Navigation salle par salle (verifier adjacence)
- [ ] Multi-etages (la structure existe deja dans `generateDungeon()`)
- [ ] Sauvegarde locale (localStorage)

## Branches

| Branche | Contenu |
|---------|---------|
| `main` | Base commune |
| `brt` | Branche de Baart (Game Engine) |

## Scripts

```bash
npm run dev       # Serveur de dev (port 8080)
npm run build     # Build production
npm run test      # Tests unitaires (vitest)
npm run lint      # ESLint
```