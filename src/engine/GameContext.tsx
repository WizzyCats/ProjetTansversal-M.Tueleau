// ============================================================
// GameContext.tsx — BAART (Game Engine & Core)
// Machine à états centrale du jeu.
// Tous les composants lisent et modifient l'état via ce contexte.
//
// USAGE pour Lon / Jenn / Noura :
//   const { state, dispatch } = useGame();
// ============================================================

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { GameState, GameAction, GameScreen, DEFAULT_PLAYER, Player } from './gameTypes';
import { generateDungeonFloor } from '../levels/dungeonGenerator';
import { getClassSkills, getClassResource, getClassBaseStats } from '../combat/skills';

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
  currentDungeon: 1,
  maxDungeonUnlocked: 1,
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
      // Marquer la salle comme vidée. Utilise le player déjà dans le state (mis à jour par SET_PLAYER)
      const updatedRooms = state.floor?.rooms.map(r =>
        r.id === state.currentRoomId ? { ...r, cleared: true } : r
      );
      return {
        ...state,
        screen: 'game',
        previousScreen: 'combat',
        player: action.player ?? state.player,
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

    case 'BOSS_DEFEATED': {
      const nextDungeon = state.currentDungeon + 1;
      const newMax = Math.max(state.maxDungeonUnlocked, Math.min(nextDungeon, 10));
      return {
        ...state,
        screen: 'win',
        previousScreen: 'combat',
        activeEnemy: null,
        winMessage: nextDungeon <= 10
          ? `Vous avez vaincu ${action.bossName} ! Donjon ${nextDungeon} debloque !`
          : `Vous avez vaincu ${action.bossName} et conquis tous les donjons !`,
        maxDungeonUnlocked: newMax,
      };
    }

    case 'SELECT_DUNGEON': {
      return {
        ...state,
        screen: 'game',
        floor: action.floor,
        currentRoomId: action.floor.startRoomId,
        currentDungeon: action.dungeonLevel,
        activeEnemy: null,
        turn: 0,
      };
    }

    case 'OPEN_DUNGEON_SELECT':
      return { ...state, screen: 'dungeonselect' };

    case 'OPEN_INVENTORY':
      return state.screen === 'game'
        ? { ...state, screen: 'inventory', previousScreen: 'game' }
        : state;

    case 'CLOSE_INVENTORY':
      return { ...state, screen: state.previousScreen ?? 'game', previousScreen: null };

    case 'OPEN_LEVELUP':
      return { ...state, screen: 'levelup', previousScreen: state.screen };

    case 'CLOSE_LEVELUP':
      return { ...state, screen: state.previousScreen ?? 'game', previousScreen: null };

    case 'NEXT_TURN':
      return { ...state, turn: state.turn + 1 };

    case 'GAME_OVER':
      return { ...state, screen: 'gameover', gameOverMessage: action.message };

    case 'WIN':
      return { ...state, screen: 'win', winMessage: action.message };

    case 'RESET':
      return { ...initialState };

    case 'LOAD_SAVE':
      return { ...action.savedState };

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
  loadSave: () => boolean;
  hasSaveData: boolean;
  selectDungeon: (level: number) => void;
  goToScreen: (screen: GameScreen) => void;
}

const SAVE_KEY = 'crawlventure_save';

function saveGame(state: GameState) {
  try {
    // On ne sauvegarde que si une partie est en cours
    if (!state.player) return;
    // Ne pas sauvegarder pendant un combat (état instable)
    if (state.screen === 'combat') return;
    const data = {
      player: state.player,
      floor: state.floor,
      currentRoomId: state.currentRoomId,
      turn: state.turn,
      currentDungeon: state.currentDungeon,
      maxDungeonUnlocked: state.maxDungeonUnlocked,
      screen: state.screen,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch { /* quota exceeded, ignore */ }
}

function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.player || !data.floor) return null;
    return {
      ...initialState,
      player: data.player,
      floor: data.floor,
      currentRoomId: data.currentRoomId,
      turn: data.turn ?? 0,
      currentDungeon: data.currentDungeon ?? 1,
      maxDungeonUnlocked: data.maxDungeonUnlocked ?? 1,
      screen: data.screen === 'combat' ? 'game' : (data.screen ?? 'game'),
    };
  } catch { return null; }
}

function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
}

function hasSave(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

const GameContext = createContext<GameContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Sauvegarde auto après chaque changement d'état
  useEffect(() => { saveGame(state); }, [state]);

  const startGame = () => {
    const floor = generateDungeonFloor({ floorCount: 1, minRooms: 8, maxRooms: 14, difficulty: 1 }, 1);
    const className = sessionStorage.getItem('playerClassName') ?? 'barbare';
    const playerName = sessionStorage.getItem('playerName') ?? 'Héros';
    const baseStats = getClassBaseStats(className);
    const res = getClassResource(className);
    const skills = getClassSkills(className);
    const player: Player = {
      ...DEFAULT_PLAYER,
      name: playerName,
      className,
      hp: baseStats.hp,
      maxHp: baseStats.hp,
      attack: baseStats.atk,
      defense: baseStats.def,
      skills,
      resource: res.max,
      maxResource: res.max,
      resourceRegen: res.regen,
      resourceType: res.type,
    };
    dispatch({ type: 'START_GAME', player, floor });
  };

  const selectDungeon = (level: number) => {
    const diff = 1 + (level - 1) * 1.5;
    const minRooms = 6 + level;
    const maxRooms = 10 + level * 2;
    const floor = generateDungeonFloor({ floorCount: 1, minRooms, maxRooms, difficulty: diff }, level);
    dispatch({ type: 'SELECT_DUNGEON', dungeonLevel: level, floor });
  };

  const resetGame = () => { deleteSave(); dispatch({ type: 'RESET' }); };

  const loadSave = (): boolean => {
    const saved = loadGame();
    if (!saved) return false;
    dispatch({ type: 'LOAD_SAVE', savedState: saved });
    return true;
  };

  const hasSaveData = hasSave();

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
    <GameContext.Provider value={{ state, dispatch, startGame, resetGame, loadSave, hasSaveData, selectDungeon, goToScreen }}>
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
