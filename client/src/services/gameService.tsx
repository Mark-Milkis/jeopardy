import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode, PropsWithChildren } from 'react';
import { GameState, GamePhase, Player, BuzzerStatus, INITIAL_CATEGORIES, Category, GameRound } from '../types';
import { io, Socket } from 'socket.io-client';
import { convertLegacyGame } from '../utils/legacyGameConverter';

interface GameContextType {
  gameState: GameState;
  isConnected: boolean;
  currentPlayerId: string | null;
  // Player Actions
  joinGame: (name: string, gameId?: string) => void;
  buzz: (playerId: string) => void;
  submitWager: (playerId: string, amount: number) => void;
  submitFinalAnswer: (playerId: string, answer: string) => void;
  // Host Actions
  openClue: (clueId: string) => void;
  closeClue: () => void;
  armBuzzers: () => void;
  handleJudgment: (correct: boolean) => void; // For the active buzzer
  cancelBuzz: () => void; // Reset active buzzer without penalty
  updateScore: (playerId: string, delta: number) => void;
  skipClue: () => void;
  resetGame: () => void;
  startDoubleJeopardy: () => void;
  startFinalJeopardy: () => void;
  startJeopardy: () => void;
  updateSettings: (settings: Partial<GameState>) => void;
  revealPlayerFinal: (playerId: string) => void; // Set active player during Final Reveal
  setFinalRevealPhase: () => void;
  setDailyDoubleConfig: (playerId: string | null, wager: number | null) => void;
  resolveDailyDouble: (correct: boolean) => void;
  loadCategories: (categories: Category[]) => void;
  loadGameFromApi: (gameId: string) => Promise<void>;
  endRound: () => void;
  continueFromRoundEnd: () => void;
  endGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Helper to generate categories
const generateCategories = (round: GameRound): Category[] => {
  if (round === 'FINAL_JEOPARDY') {
    return [{
      id: 'final-cat',
      title: 'FINAL JEOPARDY',
      comment: 'Ask players to make their wagers now.',
      clues: [{
        id: 'final-clue',
        categoryId: 'final-cat',
        value: 0,
        question: 'This famous algorithm is used to sort lists efficiently.',
        answer: 'What is Quicksort?',
        isDailyDouble: false,
        isCompleted: false
      }]
    }];
  }

  const isDouble = round === 'DOUBLE_JEOPARDY';
  const multiplier = isDouble ? 2 : 1;
  const prefix = isDouble ? 'DJ' : 'J';

  return Array.from({ length: 6 }).map((_, i) => ({
    id: `${prefix}-cat-${i}`,
    title: `${isDouble ? 'DOUBLE ' : ''}CATEGORY ${i + 1}`,
    comment: i === 0 ? "A note about this specific category." : undefined,
    clues: Array.from({ length: 5 }).map((__, j) => ({
      id: `${prefix}-clue-${i}-${j}`,
      categoryId: `${prefix}-cat-${i}`,
      value: (j + 1) * 200 * multiplier,
      question: `${round} Question for $${(j + 1) * 200 * multiplier}`,
      answer: `Answer ${i}-${j}`,
      // Ensure roughly 2 DDs in Double Jeopardy, 1 in Single
      isDailyDouble: Math.random() > (isDouble ? 0.9 : 0.95), 
      isCompleted: false
    }))
  }));
};

// LocalStorage keys for session persistence
const STORAGE_KEYS = {
  PLAYER_ID: 'jeopardy_player_id',
  PLAYER_NAME: 'jeopardy_player_name',
  GAME_ID: 'jeopardy_game_id'
};

export const GameProvider = ({ children }: PropsWithChildren<{}>) => {
  const socketRef = useRef<Socket | null>(null);
  // Store loaded game categories for all rounds (J, DJ, FJ)
  const loadedGameCategoriesRef = useRef<{
    jeopardy: Category[];
    doubleJeopardy: Category[];
    finalJeopardy: Category[];
  } | null>(null);
  
  const [gameState, setGameState] = useState<GameState>({
    phase: GamePhase.BOARD,
    round: 'JEOPARDY',
    categories: INITIAL_CATEGORIES,
    activeClueId: null,
    buzzersOpen: false,
    activePlayerId: null,
    players: [],
    lastBuzzTime: 0,
    earlyBuzzPenaltyDuration: 3000,
    dailyDoublePlayerId: null,
    dailyDoubleWager: null,
  });

  const [isConnected, setIsConnected] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(() => {
    // Try to restore player ID from localStorage on mount
    return localStorage.getItem(STORAGE_KEYS.PLAYER_ID) || null;
  });
  const [currentGameId, setCurrentGameId] = useState(() => {
    // Try to restore game ID from localStorage on mount
    return localStorage.getItem(STORAGE_KEYS.GAME_ID) || 'default';
  });

  // Initialize Socket.IO connection
  useEffect(() => {
    console.log('[GameProvider] Initializing socket connection...');
    // Connect to backend (adjust URL for production)
    // Use environment variable if set, otherwise use current origin (works for production)
    // For dev, falls back to localhost:3000
    const envSocketUrl = import.meta.env.VITE_SOCKET_URL;
    const socketUrl = envSocketUrl || 
      (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);
    console.log('[GameProvider] Socket URL:', socketUrl);
    console.log('[GameProvider] Environment:', import.meta.env);
    console.log('[GameProvider] Window origin:', window.location.origin);
    
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });
    
    socketRef.current = socket;
    console.log('[GameProvider] Socket instance created:', !!socket);

    socket.on('connect', () => {
      console.log('[Socket] ✓ Connected to Socket.IO server, socket.id:', socket.id);
      setIsConnected(true);
      
      // Try to reconnect to existing session if available
      const storedPlayerId = localStorage.getItem(STORAGE_KEYS.PLAYER_ID);
      const storedPlayerName = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
      const storedGameId = localStorage.getItem(STORAGE_KEYS.GAME_ID) || 'default';
      
      if (storedPlayerId && storedPlayerName) {
        console.log('[Socket] Attempting to reconnect as player:', storedPlayerName, storedPlayerId);
        socket.emit('player:reconnect', { 
          gameId: storedGameId, 
          playerId: storedPlayerId,
          playerName: storedPlayerName 
        });
      } else {
        // Join default game room as observer
        console.log('[Socket] Auto-joining default game room as observer...');
        socket.emit('game:join', { gameId: storedGameId });
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket] ✗ Disconnected from Socket.IO server');
      setIsConnected(false);
    });
    
    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
    });

    // Listen for game state updates from server
    socket.on('gameState:update', (newGameState: GameState) => {
      console.log('Received game state update:', newGameState);
      setGameState(newGameState);
    });

    // Player joined confirmation
    socket.on('player:joined', ({ playerId, player }) => {
      console.log('Player joined:', player);
      setCurrentPlayerId(playerId);
      // Store player session in localStorage
      localStorage.setItem(STORAGE_KEYS.PLAYER_ID, playerId);
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, player.name);
    });
    
    // Player reconnected confirmation
    socket.on('player:reconnected', ({ playerId, player }) => {
      console.log('Player reconnected:', player);
      setCurrentPlayerId(playerId);
      // Refresh localStorage (in case name changed)
      localStorage.setItem(STORAGE_KEYS.PLAYER_ID, playerId);
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, player.name);
    });
    
    // Handle reconnection failure
    socket.on('player:reconnectFailed', ({ reason }) => {
      console.warn('Reconnection failed:', reason);
      // Clear invalid session data
      localStorage.removeItem(STORAGE_KEYS.PLAYER_ID);
      localStorage.removeItem(STORAGE_KEYS.PLAYER_NAME);
      setCurrentPlayerId(null);
    });

    // Early buzz penalty notification
    socket.on('player:earlyBuzz', ({ playerId, penaltyDuration }) => {
      console.log(`Player ${playerId} buzzed early! Locked out for ${penaltyDuration}ms`);
    });

    // Lockout notification
    socket.on('player:lockedOut', ({ playerId, remainingTime }) => {
      console.log(`Player ${playerId} is locked out for ${remainingTime}ms`);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // --- Player Actions ---

  const joinGame = useCallback((name: string, gameId: string = 'default') => {
    console.log('joinGame called:', name, gameId, 'socket?', !!socketRef.current);
    if (!socketRef.current) {
      console.error('Socket not connected!');
      return;
    }
    
    setCurrentGameId(gameId);
    localStorage.setItem(STORAGE_KEYS.GAME_ID, gameId);
    socketRef.current.emit('game:join', { gameId, playerName: name });
  }, []);

  const buzz = useCallback((playerId: string) => {
    console.log('buzz called:', playerId, 'socket?', !!socketRef.current);
    if (!socketRef.current) return;
    socketRef.current.emit('player:buzz', { gameId: currentGameId, playerId });
  }, [currentGameId]);

  const submitWager = useCallback((playerId: string, amount: number) => {
    if (!socketRef.current) return;
    socketRef.current.emit('player:submitWager', { gameId: currentGameId, playerId, amount });
  }, [currentGameId]);

  const submitFinalAnswer = useCallback((playerId: string, answer: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('player:submitFinalAnswer', { gameId: currentGameId, playerId, answer });
  }, [currentGameId]);

  // --- Host Actions ---

  const openClue = useCallback((clueId: string) => {
    console.log('openClue called:', clueId, 'socket?', !!socketRef.current);
    if (!socketRef.current) return;
    socketRef.current.emit('host:openClue', { gameId: currentGameId, clueId });
  }, [currentGameId]);

  const closeClue = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('host:closeClue', { gameId: currentGameId });
  }, [currentGameId]);

  const armBuzzers = useCallback(() => {
    console.log('armBuzzers called, socket?', !!socketRef.current);
    if (!socketRef.current) return;
    socketRef.current.emit('host:armBuzzers', { gameId: currentGameId });
  }, [currentGameId]);

  const handleJudgment = useCallback((correct: boolean) => {
    if (!socketRef.current) return;
    socketRef.current.emit('host:handleJudgment', { gameId: currentGameId, correct });
  }, [currentGameId]);

  const setDailyDoubleConfig = useCallback((playerId: string | null, wager: number | null) => {
    if (!socketRef.current) return;
    socketRef.current.emit('host:setDailyDoubleConfig', { gameId: currentGameId, playerId, wager });
  }, [currentGameId]);

  const resolveDailyDouble = useCallback((correct: boolean) => {
    if (!socketRef.current) return;
    socketRef.current.emit('host:resolveDailyDouble', { gameId: currentGameId, correct });
  }, [currentGameId]);

  const cancelBuzz = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('host:cancelBuzz', { gameId: currentGameId });
  }, [currentGameId]);

  const updateScore = useCallback((playerId: string, delta: number) => {
    if (!socketRef.current) return;
    socketRef.current.emit('host:updateScore', { gameId: currentGameId, playerId, delta });
  }, [currentGameId]);

  const skipClue = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('host:skipClue', { gameId: currentGameId });
  }, [currentGameId]);

  const resetGame = useCallback(() => {
    if (!socketRef.current) return;
    // Clear any loaded game categories
    loadedGameCategoriesRef.current = null;
    socketRef.current.emit('host:resetGame', { gameId: currentGameId });
  }, [currentGameId]);

  const startDoubleJeopardy = useCallback(() => {
    console.log('startDoubleJeopardy called, socket?', !!socketRef.current);
    if (!socketRef.current) return;
    // Use loaded categories if available, otherwise generate defaults
    const categories = loadedGameCategoriesRef.current?.doubleJeopardy || generateCategories('DOUBLE_JEOPARDY');
    console.log('[GameService] Starting Double Jeopardy with', categories.length, 'categories (from loaded game:', !!loadedGameCategoriesRef.current, ')');
    socketRef.current.emit('host:startRound', { 
      gameId: currentGameId, 
      round: 'DOUBLE_JEOPARDY',
      categories 
    });
  }, [currentGameId]);

  const startFinalJeopardy = useCallback(() => {
    if (!socketRef.current) return;
    // Use loaded categories if available, otherwise generate defaults
    const categories = loadedGameCategoriesRef.current?.finalJeopardy || generateCategories('FINAL_JEOPARDY');
    console.log('[GameService] Starting Final Jeopardy with', categories.length, 'categories (from loaded game:', !!loadedGameCategoriesRef.current, ')');
    socketRef.current.emit('host:startRound', { 
      gameId: currentGameId, 
      round: 'FINAL_JEOPARDY',
      categories 
    });
  }, [currentGameId]);

  const startJeopardy = useCallback(() => {
    console.log('startJeopardy called, socket?', !!socketRef.current);
    if (!socketRef.current) return;
    const categories = generateCategories('JEOPARDY');
    socketRef.current.emit('host:startRound', {
      gameId: currentGameId,
      round: 'JEOPARDY',
      categories
    });
  }, [currentGameId]);

  const setFinalRevealPhase = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('host:setFinalRevealPhase', { gameId: currentGameId });
  }, [currentGameId]);

  const revealPlayerFinal = useCallback((playerId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('host:revealPlayerFinal', { gameId: currentGameId, playerId });
  }, [currentGameId]);

  const updateSettings = useCallback((settings: Partial<GameState>) => {
    if (!socketRef.current) return;
    socketRef.current.emit('host:updateSettings', { gameId: currentGameId, settings });
  }, [currentGameId]);

  const loadCategories = useCallback((categories: Category[]) => {
    if (!socketRef.current) return;
    // Load categories for current round
    socketRef.current.emit('host:startRound', { 
      gameId: currentGameId, 
      round: gameState.round,
      categories 
    });
  }, [currentGameId, gameState.round]);

  const loadGameFromApi = useCallback(async (gameId: string) => {
    try {
      console.log(`[GameService] Loading game from API: ${gameId}`);
      
      // Fetch game data from backend
      const response = await fetch(`/api/games/${gameId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch game: ${response.statusText}`);
      }
      
      const legacyGameData = await response.json();
      console.log('[GameService] Received legacy game data:', legacyGameData);
      
      // Convert legacy format to new Category[] structure
      const categories = convertLegacyGame(legacyGameData);
      console.log('[GameService] Converted to categories:', categories);
      
      if (!socketRef.current) {
        throw new Error('Socket not connected');
      }
      
      // Reset game first
      socketRef.current.emit('host:resetGame', { gameId: currentGameId });
      
      // Wait a moment for reset to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Extract categories for each round
      const jeopardyCategories = categories.filter(c => c.id.startsWith('j-'));
      const djCategories = categories.filter(c => c.id.startsWith('dj-'));
      const fjCategories = categories.filter(c => c.id.startsWith('fj-'));
      
      // Store all categories in ref for later use
      loadedGameCategoriesRef.current = {
        jeopardy: jeopardyCategories,
        doubleJeopardy: djCategories,
        finalJeopardy: fjCategories
      };
      
      console.log('[GameService] Stored categories - J:', jeopardyCategories.length, 'DJ:', djCategories.length, 'FJ:', fjCategories.length);
      
      // Load Jeopardy round categories
      if (jeopardyCategories.length > 0) {
        console.log('[GameService] Loading Jeopardy categories:', jeopardyCategories);
        socketRef.current.emit('host:startRound', {
          gameId: currentGameId,
          round: 'JEOPARDY',
          categories: jeopardyCategories
        });
      }
      
      console.log('[GameService] Game loaded successfully');
    } catch (error) {
      console.error('[GameService] Error loading game:', error);
      throw error;
    }
  }, [currentGameId]);

  const endRound = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('host:endRound', { gameId: currentGameId });
  }, [currentGameId]);

  const continueFromRoundEnd = useCallback(() => {
    if (!socketRef.current) return;
    
    // Automatically start the next round based on current round
    if (gameState.round === 'JEOPARDY') {
      startDoubleJeopardy();
    } else if (gameState.round === 'DOUBLE_JEOPARDY') {
      startFinalJeopardy();
    } else {
      // Fallback: just return to board
      socketRef.current.emit('host:continueFromRoundEnd', { gameId: currentGameId });
    }
  }, [currentGameId, gameState.round, startDoubleJeopardy, startFinalJeopardy]);

  const endGame = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('host:endGame', { gameId: currentGameId });
  }, [currentGameId]);

  return (
    <GameContext.Provider value={{
      gameState,
      isConnected,
      currentPlayerId,
      joinGame,
      buzz,
      submitWager,
      submitFinalAnswer,
      openClue,
      closeClue,
      armBuzzers,
      handleJudgment,
      cancelBuzz,
      updateScore,
      skipClue,
      resetGame,
      startDoubleJeopardy,
      startFinalJeopardy,
      startJeopardy,
      updateSettings,
      setFinalRevealPhase,
      revealPlayerFinal,
      setDailyDoubleConfig,
      resolveDailyDouble,
      loadCategories,
      loadGameFromApi,
      endRound,
      continueFromRoundEnd,
      endGame
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within a GameProvider");
  return context;
};