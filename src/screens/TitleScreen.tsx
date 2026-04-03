// ============================================================
// TitleScreen.tsx — BAART
// Noura : tu peux remplacer tout le JSX/style ici
// ============================================================

import { useGame } from '../engine/GameContext';

export default function TitleScreen() {
  const { startGame } = useGame();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8">
      <div className="text-center space-y-3">
        <h1 className="font-pixel text-4xl text-primary">⚔️ CrawlVenture</h1>
        <p className="text-muted-foreground text-sm">Un donjon vous attend. Osez-vous entrer ?</p>
      </div>

      <button
        onClick={startGame}
        className="px-8 py-4 rounded-md bg-primary text-primary-foreground font-pixel text-sm
                   hover:opacity-90 transition-all hover:scale-105 active:scale-95"
      >
        ▶ Commencer l'aventure
      </button>

      <div className="text-xs text-muted-foreground text-center space-y-1 mt-4">
        <p>Utilisez la carte pour explorer les salles</p>
        <p>Chaque salle cache des ennemis, du loot et des secrets</p>
      </div>
    </div>
  );
}
