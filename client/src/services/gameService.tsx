import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, PropsWithChildren } from 'react';
import { GameState, GamePhase, Player, BuzzerStatus, INITIAL_CATEGORIES, Category, GameRound } from '../types';
import { io, Socket } from 'socket.io-client';

// Socket.IO connection to backend
let socket: Socket | null = null;

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
  updateSettings: (settings: Partial<GameState>) => void;
  revealPlayerFinal: (playerId: string) => void; // Set active player during Final Reveal
  setFinalRevealPhase: () => void;
  setDailyDoubleConfig: (playerId: string | null, wager: number | null) => void;
  resolveDailyDouble: (correct: boolean) => void;
  loadCategories: (categories: Category[]) => void;
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

export const GameProvider = ({ children }: PropsWithChildren<{}>) => {
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
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [currentGameId, setCurrentGameId] = useState('default');

  // Initialize Socket.IO connection
  useEffect(() => {
    // Connect to backend (adjust URL for production)
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      setIsConnected(true);
      
      // Join default game room
      socket?.emit('game:join', { gameId: 'default' });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
      setIsConnected(false);
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
      socket?.disconnect();
      socket = null;
    };
  }, []);

  // --- Player Actions ---

  const joinGame = useCallback((name: string, gameId: string = 'default') => {
    if (!socket) return;
    
    setCurrentGameId(gameId);
    socket.emit('game:join', { gameId, playerName: name });
  }, []);

  const buzz = useCallback((playerId: string) => {
    if (!socket) return;
    socket.emit('player:buzz', { gameId: currentGameId, playerId });
  }, [currentGameId]);

  const submitWager = useCallback((playerId: string, amount: number) => {
    if (!socket) return;
    socket.emit('player:submitWager', { gameId: currentGameId, playerId, amount });
  }, [currentGameId]);

  const submitFinalAnswer = useCallback((playerId: string, answer: string) => {
    if (!socket) return;
    socket.emit('player:submitFinalAnswer', { gameId: currentGameId, playerId, answer });
  }, [currentGameId]);

  // --- Host Actions ---

  const openClue = useCallback((clueId: string) => {
    if (!socket) return;
    socket.emit('host:openClue', { gameId: currentGameId, clueId });
  }, [currentGameId]);

  const closeClue = useCallback(() => {
    if (!socket) return;
    socket.emit('host:closeClue', { gameId: currentGameId });
  }, [currentGameId]);

  const armBuzzers = useCallback(() => {
    if (!socket) return;
    socket.emit('host:armBuzzers', { gameId: currentGameId });
  }, [currentGameId]);

  const handleJudgment = useCallback((correct: boolean) => {
    if (!socket) return;
    socket.emit('host:handleJudgment', { gameId: currentGameId, correct });
  }, [currentGameId]);

  const setDailyDoubleConfig = useCallback((playerId: string | null, wager: number | null) => {
    if (!socket) return;
    socket.emit('host:setDailyDoubleConfig', { gameId: currentGameId, playerId, wager });
  }, [currentGameId]);

  const resolveDailyDouble = useCallback((correct: boolean) => {
    if (!socket) return;
    socket.emit('host:resolveDailyDouble', { gameId: currentGameId, correct });
  }, [currentGameId]);

  const cancelBuzz = useCallback(() => {
    if (!socket) return;
    socket.emit('host:cancelBuzz', { gameId: currentGameId });
  }, [currentGameId]);

  const updateScore = useCallback((playerId: string, delta: number) => {
    if (!socket) return;
    socket.emit('host:updateScore', { gameId: currentGameId, playerId, delta });
  }, [currentGameId]);

  const skipClue = useCallback(() => {
    if (!socket) return;
    socket.emit('host:skipClue', { gameId: currentGameId });
  }, [currentGameId]);

  const resetGame = useCallback(() => {
    if (!socket) return;
    socket.emit('host:resetGame', { gameId: currentGameId });
  }, [currentGameId]);

  const startDoubleJeopardy = useCallback(() => {
    if (!socket) return;
    const categories = generateCategories('DOUBLE_JEOPARDY');
    socket.emit('host:startRound', { 
      gameId: currentGameId, 
      round: 'DOUBLE_JEOPARDY',
      categories 
    });
  }, [currentGameId]);

  const startFinalJeopardy = useCallback(() => {
    if (!socket) return;
    const categories = generateCategories('FINAL_JEOPARDY');
    socket.emit('host:startRound', { 
      gameId: currentGameId, 
      round: 'FINAL_JEOPARDY',
      categories 
    });
  }, [currentGameId]);

  const setFinalRevealPhase = useCallback(() => {
    if (!socket) return;
    socket.emit('host:setFinalRevealPhase', { gameId: currentGameId });
  }, [currentGameId]);

  const revealPlayerFinal = useCallback((playerId: string) => {
    if (!socket) return;
    socket.emit('host:revealPlayerFinal', { gameId: currentGameId, playerId });
  }, [currentGameId]);

  const updateSettings = useCallback((settings: Partial<GameState>) => {
    if (!socket) return;
    socket.emit('host:updateSettings', { gameId: currentGameId, settings });
  }, [currentGameId]);

  const loadCategories = useCallback((categories: Category[]) => {
    if (!socket) return;
    // Load categories for current round
    socket.emit('host:startRound', { 
      gameId: currentGameId, 
      round: gameState.round,
      categories 
    });
  }, [currentGameId, gameState.round]);

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
      updateSettings,
      setFinalRevealPhase,
      revealPlayerFinal,
      setDailyDoubleConfig,
      resolveDailyDouble,
      loadCategories
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