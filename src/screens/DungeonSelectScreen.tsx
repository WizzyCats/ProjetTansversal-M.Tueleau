// =============================================================================
// DungeonSelectScreen.tsx — Sélection de donjon (1 à 10)
// =============================================================================

import { useGame } from '../engine/GameContext';
import { useSoundFX } from '../hooks/useSoundFX';
import PixelSprite from '../components/PixelSprite';

const DUNGEON_NAMES = [
  'Caverne des Rats',
  'Crypte Oubliee',
  'Mine Maudite',
  'Temple Sombre',
  'Forteresse d\'Os',
  'Abime Pourpre',
  'Tour du Necromant',
  'Gouffre Infernal',
  'Citadelle du Chaos',
  'Throne du Demon',
];

const DUNGEON_ICONS = ['🐀', '💀', '⛏️', '🏛️', '🦴', '🌑', '🗼', '🔥', '🌀', '😈'];

export default function DungeonSelectScreen() {
  const { state, selectDungeon } = useGame();
  const sfx = useSoundFX();
  const { player, maxDungeonUnlocked } = state;

  if (!player) return null;

  return (
    <div className="min-h-screen bg-background p-4 space-y-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="font-pixel text-xl text-primary">Selection du Donjon</h1>
        <p className="text-xs text-muted-foreground">
          {player.name} — Nv.{player.level} — {player.hp}/{player.maxHp} PV
        </p>
      </div>

      {/* Grille de donjons */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 10 }).map((_, i) => {
          const level = i + 1;
          const unlocked = level <= maxDungeonUnlocked;
          const difficulty = 1 + (level - 1) * 1.5;
          const isLast = level === 10;

          return (
            <button
              key={level}
              onClick={() => {
                if (!unlocked) return;
                sfx.playMenu();
                selectDungeon(level);
              }}
              disabled={!unlocked}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                unlocked
                  ? isLast
                    ? 'border-red-500 bg-red-500/10 hover:bg-red-500/20'
                    : 'border-border bg-card hover:border-primary hover:scale-[1.02]'
                  : 'border-border/30 bg-card/30 opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{unlocked ? DUNGEON_ICONS[i] : '🔒'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-pixel text-xs ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Donjon {level}
                  </p>
                  <p className={`text-xs ${unlocked ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                    {unlocked ? DUNGEON_NAMES[i] : '???'}
                  </p>
                </div>
              </div>

              {unlocked && (
                <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                  <span>Diff. {difficulty.toFixed(1)}</span>
                  <span>·</span>
                  <span>{6 + level}-{10 + level * 2} salles</span>
                </div>
              )}

              {/* Barre de difficulté visuelle */}
              {unlocked && (
                <div className="mt-2 w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full ${level <= 3 ? 'bg-green-500' : level <= 6 ? 'bg-yellow-500' : level <= 8 ? 'bg-orange-500' : 'bg-red-500'}`}
                    style={{ width: `${level * 10}%` }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Info */}
      <p className="text-xs text-muted-foreground text-center">
        {maxDungeonUnlocked < 10
          ? `Battez le boss du donjon ${maxDungeonUnlocked} pour debloquer le suivant.`
          : 'Tous les donjons sont debloques !'}
      </p>
    </div>
  );
}
