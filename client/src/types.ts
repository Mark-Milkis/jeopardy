export enum GamePhase {
  BOARD = 'BOARD',
  CLUE = 'CLUE',
  DAILY_DOUBLE = 'DAILY_DOUBLE',
  ROUND_END = 'ROUND_END',
  FINAL_JEOPARDY = 'FINAL_JEOPARDY',
  FINAL_REVEAL = 'FINAL_REVEAL',
  GAME_OVER = 'GAME_OVER'
}

export enum BuzzerStatus {
  IDLE = 'IDLE',      // Default state
  LOCKED = 'LOCKED',  // Host is reading, cannot buzz
  ARMED = 'ARMED',    // Host opened buzzers, can buzz
  WINNER = 'WINNER',  // This player buzzed first
  LOSER = 'LOSER'     // Someone else buzzed first
}

export interface Player {
  id: string;
  name: string;
  score: number;
  buzzerStatus: BuzzerStatus;
  avatar?: string;
  lockedOutUntil?: number; // Timestamp for early buzz penalty
  wager?: number;
  finalAnswer?: string;
  isFinalAnswerJudged?: boolean;
  isConnected?: boolean; // Whether player's socket is currently connected
  socketId?: string; // Current socket ID (for backend tracking)
}

export interface Clue {
  id: string;
  categoryId: string;
  value: number;
  question: string;
  answer: string;
  isDailyDouble: boolean;
  isCompleted: boolean;
  tripleStumper?: boolean; // Was a triple stumper in the actual show
  media?: string[]; // URLs to images/audio (proxied through /media/*)
}

export interface Category {
  id: string;
  title: string;
  comment?: string; // Host explainer/note
  clues: Clue[];
}

export type GameRound = 'JEOPARDY' | 'DOUBLE_JEOPARDY' | 'FINAL_JEOPARDY';

export interface GameState {
  phase: GamePhase;
  round: GameRound;
  categories: Category[];
  activeClueId: string | null;
  buzzersOpen: boolean;
  activePlayerId: string | null; // The player currently answering
  players: Player[];
  lastBuzzTime: number;
  earlyBuzzPenaltyDuration: number; // Duration in ms to lock out early buzzers
  dailyDoublePlayerId?: string | null;
  dailyDoubleWager?: number | null;
}

// Initial Data Mock
export const INITIAL_CATEGORIES: Category[] = Array.from({ length: 6 }).map((_, i) => ({
  id: `cat-${i}`,
  title: [
    "HISTORY", "SCIENCE", "GEOGRAPHY", "LITERATURE", "POP CULTURE", "POTPOURRI"
  ][i],
  comment: i % 2 === 0 ? "Read the preamble for this category." : undefined,
  clues: Array.from({ length: 5 }).map((__, j) => ({
    id: `clue-${i}-${j}`,
    categoryId: `cat-${i}`,
    value: (j + 1) * 200,
    question: `This is a sample question for $${(j + 1) * 200} in category ${i + 1}.`,
    answer: `What is Answer ${i}-${j}?`,
    isDailyDouble: Math.random() > 0.95, // Rare chance
    isCompleted: false
  }))
}));