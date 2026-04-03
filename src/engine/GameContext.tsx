// ============================================================
// GameContext.tsx — BAART (Game Engine & Core)
// Machine à états centrale du jeu.
// Tous les composants lisent et modifient l'état via ce contexte.
//
// USAGE pour Lon / Jenn / Noura :
//   const { state, dispatch } = useGame();
// ============================================================

import { createContext, useContext, useReducer, ReactNode } from 'react';
import { GameState, GameAction, GameScreen, DEFAULT_PLAYER } from './gameTypes';
import { generateDungeonFloor } from '../levels/dungeonGenerator';

// ── État initial ─────────────────────────────────────────────
const initialState: GameState = {
  screen: 'title',
  previousScreen: null,
  player: null,
  floor: null,
  currentRoomId: null,
  activeEnemy: null,
  turn: 0,
  gameOverMessage: '',
  winMessage: '',
};

// ── Reducer — machine à états ────────────────────────────────
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {

    case 'START_GAME': {
      return {
        ...initialState,
        screen: 'game',
        player: action.player,
        floor: action.floor,
        currentRoomId: action.floor.startRoomId,
      };
    }

    case 'SET_FLOOR':
      return { ...state, floor: action.floor, currentRoomId: action.floor.startRoomId };

    case 'SET_PLAYER':
      return { ...state, player: action.player };

    case 'ENTER_ROOM':
      return { ...state, currentRoomId: action.room.id };

    case 'ENTER_COMBAT':
      return {
        ...state,
        screen: 'combat',
        previousScreen: state.screen,
        activeEnemy: action.enemy,
      };

    case 'END_COMBAT_WIN': {
      // Marquer la salle comme vidée
      const updatedRooms = state.floor?.rooms.map(r =>
        r.id === state.currentRoomId ? { ...r, cleared: true } : r
      );
      return {
        ...state,
        screen: 'game',
        previousScreen: 'combat',
        player: action.player,
        activeEnemy: null,
        floor: state.floor ? { ...state.floor, rooms: updatedRooms ?? [] } : null,
      };
    }

    case 'END_COMBAT_LOSE':
      return {
        ...state,
        screen: 'gameover',
        previousScreen: 'combat',
        activeEnemy: null,
        gameOverMessage: action.message ?? 'Vous avez été vaincu dans les ténèbres...',
      };

    case 'BOSS_DEFEATED':
      return {
        ...state,
        screen: 'win',
        previousScreen: 'combat',
        activeEnemy: null,
        winMessage: `Vous avez vaincu ${action.bossName} et libéré le donjon !`,
      };

    case 'OPEN_INVENTORY':
      return state.screen === 'game'
        ? { ...state, screen: 'inventory', previousScreen: 'game' }
        : state;

    case 'CLOSE_INVENTORY':
      return { ...state, screen: state.previousScreen ?? 'game', previousScreen: null };

    case 'NEXT_TURN':
      return { ...state, turn: state.turn + 1 };

    case 'GAME_OVER':
      return { ...state, screen: 'gameover', gameOverMessage: action.message };

    case 'WIN':
      return { ...state, screen: 'win', winMessage: action.message };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

// ── Context ──────────────────────────────────────────────────
interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;

  // Helpers prêts à l'emploi (évite de répéter le dispatch partout)
  startGame: () => void;
  resetGame: () => void;
  goToScreen: (screen: GameScreen) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const startGame = () => {
    const floor = generateDungeonFloor({ floorCount: 1, minRooms: 8, maxRooms: 14, difficulty: 3 }, 1);
    dispatch({ type: 'START_GAME', player: DEFAULT_PLAYER, floor });
  };

  const resetGame = () => dispatch({ type: 'RESET' });

  // Helper pour naviguer sans passer par un dispatch explicite
  // Noura : tu peux l'utiliser pour les transitions d'écran
  const goToScreen = (screen: GameScreen) => {
    const validActions: Record<string, GameAction> = {
      inventory: { type: 'OPEN_INVENTORY' },
    };
    if (validActions[screen]) {
      dispatch(validActions[screen]);
    }
  };

  return (
    <GameContext.Provider value={{ state, dispatch, startGame, resetGame, goToScreen }}>
      {children}
    </GameContext.Provider>
  );
}

// ── Hook d'accès ─────────────────────────────────────────────
export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame doit être utilisé dans <GameProvider>');
  return ctx;
}
