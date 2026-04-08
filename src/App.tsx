import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// ── BAART : Game Engine ──────────────────────────────────────
import { GameProvider, useGame } from "./engine/GameContext";
import TitleScreen     from "./screens/TitleScreen";
import GameScreen      from "./screens/GameScreen";
import CombatScreen    from "./screens/CombatScreen";
import InventoryScreen from "./screens/InventoryScreen";
import LevelUpScreen   from "./screens/LevelUpScreen";
import DungeonSelectScreen from "./screens/DungeonSelectScreen";
import LeaderboardScreen from "./screens/LeaderboardScreen";
import GameOverScreen  from "./screens/GameOverScreen";
import WinScreen       from "./screens/WinScreen";

const queryClient = new QueryClient();

// Router d'écrans — lit l'état du GameContext et affiche le bon écran
function ScreenRouter() {
  const { state } = useGame();

  switch (state.screen) {
    case 'title':     return <TitleScreen />;
    case 'game':      return <GameScreen />;
    case 'combat':    return <CombatScreen />;
    case 'inventory': return <InventoryScreen />;
    case 'levelup':       return <LevelUpScreen />;
    case 'dungeonselect': return <DungeonSelectScreen />;
    case 'leaderboard':   return <LeaderboardScreen />;
    case 'gameover':      return <GameOverScreen />;
    case 'win':       return <WinScreen />;
    default:          return <TitleScreen />;
  }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <GameProvider>
        <ScreenRouter />
      </GameProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
