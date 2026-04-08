# CrawlVenture

Dungeon Crawler tour par tour — RPG de donjon avec salles aleatoires, ennemis, loot, equipement et boss final.

## Stack technique

| Tech | Usage |
|------|-------|
| **React 18** + **TypeScript** | Framework UI |
| **Vite** | Build & dev server |
| **Tailwind CSS** | Styling (theme dark donjon) |
| **shadcn/ui** (Radix) | Composants UI de base |
| **Vitest** + **Playwright** | Tests unitaires & E2E |
| **Canvas API** | Sprites pixel art |
| **Web Audio API** | Effets sonores synthetiques |
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
| **Noura** | UI / Art & Son | `src/ui/`, `src/components/PixelSprite.tsx`, `src/hooks/useSoundFX.ts` |

## Architecture du code

```
src/
├── engine/                  # BAART — Moteur du jeu
│   ├── GameContext.tsx       #   Machine a etats (useReducer) + Context React + sauvegarde auto
│   ├── gameTypes.ts          #   Types : Player, Equipment, GameState, GameAction
│   └── leaderboard.ts       #   Leaderboard hardcode + champions + localStorage
│
├── screens/                 # Ecrans du jeu
│   ├── TitleScreen.tsx       #   Ecran titre + continuer + selection classe (Lon)
│   ├── GameScreen.tsx        #   Carte du donjon + HUD + navigation adjacente (Baart)
│   ├── CombatScreen.tsx      #   Combat tour par tour style Pokemon (Lon + Baart)
│   ├── InventoryScreen.tsx   #   Fiche personnage + equipement + inventaire (Baart)
│   ├── LevelUpScreen.tsx     #   Repartition de points de competence (Baart)
│   ├── DungeonSelectScreen.tsx #  Selection de donjon 1-10 (Baart)
│   ├── LeaderboardScreen.tsx #   Classement top 10 + combat des champions (Baart)
│   ├── GameOverScreen.tsx    #   Ecran defaite + envoi score (Baart)
│   └── WinScreen.tsx         #   Ecran victoire + envoi score + sauvegarde champion (Baart)
│
├── combat/                  # LON — Systeme de combat
│   ├── types.ts              #   Types : PlayerState, CombatEnemy, Card, StatusEffect
│   ├── player.ts             #   Factory joueur par classe + stats de base
│   ├── cards.ts              #   56 cartes pour 4 classes (common → epic)
│   ├── combat.ts             #   Ancien moteur AFK (conserve pour reference)
│   ├── skills.ts             #   Competences actives par classe + parchemins apprenables
│   ├── levelup.ts            #   Courbe XP, tirage de cartes
│   └── CombatSystem.ts       #   Facade publique + adapteur Enemy → CombatEnemy
│
├── levels/                  # JENN — Generation procedurale
│   ├── types.ts              #   Types : Room, Enemy, LootItem, EquipSlot, EquipStats
│   ├── dungeonGenerator.ts   #   Generateur de donjon (random walk + seed)
│   ├── enemyFactory.ts       #   13 templates d'ennemis (minion/elite/boss)
│   ├── lootTables.ts         #   Armes, casques, armures, accessoires, potions, scrolls
│   └── index.ts              #   Re-exports
│
├── ui/                      # NOURA — UI Pixel Art & Son
│   ├── UIManager.js          #   Moteur canvas pixel art, sprites, sons synthetiques
│   └── crystal_dungeon_demo.html  #   Demo standalone du rendu visuel
│
├── components/              # Composants visuels partages
│   ├── PixelSprite.tsx       #   Rendu sprites pixel art Noura en React (Noura + Baart)
│   ├── PixelCanvas.tsx       #   Canvas overlay pour effets visuels
│   ├── DungeonMap.tsx        #   Carte interactive du donjon SVG (Jenn)
│   ├── RoomDetail.tsx        #   Detail salle avec sprites ennemis (Jenn + Noura)
│   └── ui/                   #   48+ composants shadcn/ui
│
├── hooks/                   # Hooks partages
│   ├── useSoundFX.ts         #   Hook sons avec mute (Noura)
│   ├── use-mobile.tsx        #   Detection mobile
│   └── use-toast.ts          #   Notifications toast
│
├── App.tsx                  # BAART — ScreenRouter + providers
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
title → (continuer / nouvelle partie)
          ↓
       (choix classe) → (choix nom) → dungeonselect → game → combat → game
                                           ↑            ↓       ↓        ↓
                                      leaderboard   inventory levelup  gameover
                                           ↑                              ↓
                                          win ← (boss vaincu) ← combat  envoi score
                                           ↓
                                    donjon suivant / sauvegarde champion
```

**Actions disponibles :**

| Action | Effet |
|--------|-------|
| `START_GAME` | Cree un joueur avec classe + genere un donjon |
| `SET_PLAYER` | Met a jour le joueur (stats, inventaire, equipement) |
| `ENTER_ROOM` | Change la salle courante (adjacence verifiee) |
| `ENTER_COMBAT` | Lance le combat tour par tour |
| `END_COMBAT_WIN` | Marque la salle cleared, retour a la carte |
| `END_COMBAT_LOSE` | Ecran game over |
| `BOSS_DEFEATED` | Ecran victoire |
| `OPEN_INVENTORY` / `CLOSE_INVENTORY` | Fiche personnage + sac |
| `OPEN_LEVELUP` / `CLOSE_LEVELUP` | Repartition de points |
| `SELECT_DUNGEON` | Genere un nouveau donjon et entre dedans |
| `OPEN_DUNGEON_SELECT` | Ecran selection de donjon |
| `OPEN_LEADERBOARD` / `CLOSE_LEADERBOARD` | Classement |
| `START_CHAMPION_FIGHT` | Lance un combat contre un champion sauvegarde |
| `LOAD_SAVE` | Charge une sauvegarde localStorage |
| `NEXT_TURN` | Incremente le compteur de tours |
| `RESET` | Efface la sauvegarde, retour au titre |

### Systeme de combat (Lon)

**Combat tour par tour** style Pokemon — le joueur choisit une competence, puis l'ennemi attaque.

**4 classes jouables :**

| Classe | Ressource | PV | ATK | DEF | Specialite |
|--------|-----------|-----|-----|-----|------------|
| Barbare | Stamina (5, +1/tour) | 160 | 22 | 8 | Tank, gros degats |
| Mage du Chaos | Mana (8, +2/tour) | 90 | 14 | 4 | Sorts, degats aleatoires |
| Voleur | Stamina (6, +1/tour) | 75 | 12 | 3 | Poison, esquive |
| Necromancien | Mana (8, +2/tour) | 80 | 10 | 5 | Drain de vie, invocations |

**Competences par classe (4 de base + parchemins apprenables) :**

*Barbare :*
| Competence | Cout | Effet |
|------------|------|-------|
| Coup de boule | 1 Sta | 0.8x ATK |
| Coup de hache | 2 Sta | 1.4x ATK |
| Etreinte | 3 Sta | 30% skip tour ennemi |
| Hurlement | 2 Sta | +5 ATK pour le combat |

*Voleur :*
| Competence | Cout | Effet |
|------------|------|-------|
| Coup rapide | 1 Sta | 0.7x ATK |
| Lame empoisonnee | 2 Sta | 0.9x ATK + poison 4/tour 3 tours |
| Embuscade | 3 Sta | 2.2x ATK |
| Evasion | 2 Sta | Esquive garantie prochain tour |

*Mage du Chaos :*
| Competence | Cout | Effet |
|------------|------|-------|
| Trait de feu | 2 Mana | 1.2x ATK |
| Eclair | 3 Mana | 1.6x ATK |
| Bouclier arcane | 2 Mana | -50% prochain coup recu |
| Explosion chaotique | 5 Mana | 0.5x a 3x ATK (aleatoire) |

*Necromancien :*
| Competence | Cout | Effet |
|------------|------|-------|
| Drain de vie | 2 Mana | 0.8x ATK + heal 50% degats |
| Malediction | 3 Mana | ATK ennemi -4 |
| Invocation spectrale | 4 Mana | 6 dmg/tour pendant 3 tours |
| Toucher mortel | 5 Mana | 2x ATK |

**Parchemins de competence :** drop en combat (5% minion, 15% elite, 50% boss, 0% auto-run). Permettent de remplacer une competence existante ou de stocker dans l'inventaire.

**Potions :** utilisables en combat (consomme le tour) ou hors combat depuis l'inventaire.

### Systeme de progression

**Courbe XP :** `100 * niveau^1.5` — max niveau 20.

**Level Up :** chaque passage de niveau donne **5 points de competence** a repartir dans :

| Stat | Effet par point |
|------|----------------|
| Attaque | +2 ATK |
| Defense | +1 DEF |
| Vie | +8 PV max |
| Mana / Stamina | +1 ressource max |
| Bonus XP | +5% XP gagne |

Le bonus %XP est applique a chaque gain d'XP en combat.

### Systeme d'equipement

**4 slots :** Arme, Casque, Armure, Accessoire

Les bonus d'equipement s'ajoutent aux stats de base et sont actifs en combat.

| Slot | Exemples | Bonus possibles |
|------|----------|----------------|
| Arme | Dague (+2 ATK) → Excalibur (+22 ATK, +10 PV) | ATK, PV |
| Casque | Capuche (+1 DEF) → Couronne maudite (+4 DEF, +3 Mana) | DEF, PV, Ressource |
| Armure | Plastron (+2 DEF) → Egide divine (+12 DEF, +20 PV) | DEF, PV, ATK |
| Accessoire | Anneau (+1/+1) → Oeil du Neant (+8 ATK, +3 DEF) | ATK, DEF, PV, Ressource |

**Drop rates :**

| Tier | Loot (normal) | Loot (auto-run) | Parchemin |
|------|--------------|-----------------|-----------|
| Minion | 10% (1 item) | 1% | 5% |
| Elite | 25% (1 item) | 1% | 15% |
| Boss | 100% (2-3 items) | — | 50% |

### Mode Auto-Run

Permet de **farmer de l'XP** sur une salle deja cleared :
- Le heros attaque automatiquement avec son meilleur skill payable
- Les ennemis respawn a 60% PV a chaque run
- Enchaine les combats en boucle sans intervention
- **Arret automatique** si : mort (full HP restore) ou level up (repartition de points)
- **Bouton Stop** pour arreter manuellement et revenir a la carte
- **Bouton Mute** pour couper les sons pendant le farm
- Loot reduit a 1%, aucun parchemin

### 10 Donjons

| Donjon | Nom | Difficulte | Salles |
|--------|-----|-----------|--------|
| 1 | Caverne des Rats | 1.0 | 7-12 |
| 2 | Crypte Oubliee | 2.5 | 8-14 |
| 3 | Mine Maudite | 4.0 | 9-16 |
| 4 | Temple Sombre | 5.5 | 10-18 |
| 5 | Forteresse d'Os | 7.0 | 11-20 |
| 6 | Abime Pourpre | 8.5 | 12-22 |
| 7 | Tour du Necromant | 10.0 | 13-24 |
| 8 | Gouffre Infernal | 11.5 | 14-26 |
| 9 | Citadelle du Chaos | 13.0 | 15-28 |
| 10 | Throne du Demon | 14.5 | 16-30 |

Chaque donjon se debloque en battant le boss du precedent. Les donjons precedents restent accessibles pour farm.

### Leaderboard & Combat des Champions

**Score :** 10 pts/mob, 50 pts/boss, 100 pts/donjon complete.

**Leaderboard :**
- Top 10 hardcode dans le code (partage via le repo, visible sur toutes les machines)
- Scores locaux (localStorage) se mergent avec les scores hardcodes
- Accessible depuis : titre, HUD, victoire, game over
- Affiche la position du joueur meme hors du top 10

**Champions :**
- 4 champions hardcodes (Baart, Lon, Noura, Jenn) defiables par tous les joueurs
- Quand un joueur finit les 10 donjons → peut sauvegarder son heros comme champion
- N'importe quel joueur peut defier un champion → combat PvP contre les stats du champion
- Pour ajouter un champion permanent : ajouter une entree dans `HARDCODED_CHAMPIONS` et commit

### Navigation du donjon (Baart + Jenn)

- **Adjacence obligatoire** — on ne peut se deplacer que vers les salles connectees par une porte
- **Collecte auto** du loot dans les salles tresor
- **Salles recommencables** — bouton "Recommencer la salle" + "Auto-Run" sur les salles deja cleared
- Compteur de tours dans le HUD

### Generation de donjon (Jenn)

- **Algorithme :** Random walk depuis le centre d'une grille
- **Seed :** Reproductible via RNG mulberry32
- **Types de salles :** start, normal (70%), treasure (12%), trap (10%), boss (derniere)
- **Ennemis :** Scaling par difficulte (1-10) et par etage (+0.5/etage)
- **Loot :** Poids par rarete : common(50) > uncommon(30) > rare(13) > epic(5) > legendary(2)
- **Connexions :** Portes bidirectionnelles + 20% chance de chemins croises

### UI Pixel Art & Sons (Noura)

**Sprites pixel art** integres dans tout le jeu via `PixelSprite.tsx` :
- **Heros :** fee (mage), rose (barbare), ombre (voleur), skull (necro) — affiches en combat, HUD, inventaire, selection de classe
- **Ennemis :** slime, skull, boss, fairy — affiches en combat et dans le detail des salles
- **Decor combat :** tiles mur, sol, porte, cristaux — fond de l'arene de combat style Pokemon
- **Items :** potion, sword — references visuelles

**Sons synthetiques (Web Audio API) :** integres via le hook `useSoundFX`

| Son | Declencheur |
|-----|------------|
| `hit` | Attaque en combat |
| `heal` | Soin (potion, drain de vie) |
| `lightning` | Coup critique, sorts puissants |
| `death` | Mort ennemi, game over |
| `loot` | Entree salle tresor |
| `levelup` | Victoire, level up |
| `sparkle` | Selection classe, invocation, equipement |
| `menu` | Navigation, esquive |

**Mute** disponible en auto-run via le bouton dans le bandeau.

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

## Ce qui a ete fait

- [x] Game engine avec machine a etats (useReducer)
- [x] Selection de classe avec sprites pixel art
- [x] Generation procedurale de donjon (random walk + seed)
- [x] Navigation adjacente (portes uniquement)
- [x] Combat tour par tour avec competences (stamina/mana)
- [x] 4 classes jouables avec 4 competences chacune
- [x] Systeme d'equipement (4 slots : arme, casque, armure, accessoire)
- [x] Fiche personnage complete avec stats et equipement
- [x] Level up avec 5 points de competence a repartir
- [x] Bonus %XP cumulable
- [x] Parchemins de competence (drop + apprentissage)
- [x] Potions utilisables en combat et hors combat
- [x] Mode auto-run pour farm XP
- [x] Sprites pixel art Noura integres partout
- [x] Sons synthetiques sur tous les ecrans
- [x] Fond d'arene de combat avec tiles pixel art
- [x] Collecte auto du loot dans les salles tresor
- [x] Salles recommencables pour farm
- [x] 10 donjons avec difficulte progressive
- [x] Selection de donjon + retour aux donjons precedents pour farm
- [x] Equilibrage difficulte / economie (XP, ennemis, scaling)
- [x] Multi-mobs par salle (enchainement automatique)
- [x] Regen mana/stamina qui scale avec les points investis
- [x] Sauvegarde auto locale (localStorage) + bouton Continuer
- [x] Leaderboard hardcode (top 10 partage via le repo)
- [x] 4 champions hardcodes defiables par tous les joueurs
- [x] Combat des Champions (PvP contre stats sauvegardees)
- [x] Envoi de score apres victoire ou defaite

## Ce qui reste a faire

- [ ] Animations CSS sur les transitions d'ecran

## Branches

| Branche | Contenu |
|---------|---------|
| `main` | Branche de Jenn (Generation des niveaux) |
| `brt` | Branche de Baart (Game Engine) |
| `DevL0n` | Branche de Lon (Combat) |
| `NOURA` | Branche de Noura (UI pixel art) |
| `MergeTotal` | Fusion + toutes les features |

## Scripts

```bash
npm run dev       # Serveur de dev (port 8080)
npm run build     # Build production
npm run test      # Tests unitaires (vitest)
npm run lint      # ESLint
```