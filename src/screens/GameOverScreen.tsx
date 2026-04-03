// GameOverScreen.tsx — BAART
// Noura : tu peux remplacer le visuel ici

import { useGame } from '../engine/GameContext';

export default function GameOverScreen() {
  const { state, resetGame } = useGame();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
      <div className="text-center space-y-3">
        <div className="text-6xl">💀</div>
        <h2 className="font-pixel text-3xl text-destructive">Game Over</h2>
        <p className="text-muted-foreground text-sm max-w-xs">{state.gameOverMessage}</p>
        <p className="text-xs text-muted-foreground">Tours survécus : {state.turn}</p>
      </div>

      <button
        onClick={resetGame}
        className="px-8 py-4 bg-primary text-primary-foreground rounded-md font-pixel text-sm hover:opacity-90 transition-all hover:scale-105"
      >
        ↩ Recommencer
      </button>
    </div>
  );
}
