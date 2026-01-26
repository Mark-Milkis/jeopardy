/**
 * Game Socket.IO Handler for Jeopardy Pro v2
 * Manages real-time game state synchronization between host, players, and board views
 */

const { v4: uuidv4 } = require('uuid');

// Game state storage (in-memory, can be moved to Redis/DB later)
const games = new Map();

// Enums matching frontend types
const GamePhase = {
  BOARD: 'BOARD',
  CLUE: 'CLUE',
  DAILY_DOUBLE: 'DAILY_DOUBLE',
  ROUND_END: 'ROUND_END',
  FINAL_JEOPARDY: 'FINAL_JEOPARDY',
  FINAL_REVEAL: 'FINAL_REVEAL',
  GAME_OVER: 'GAME_OVER'
};

const BuzzerStatus = {
  IDLE: 'IDLE',
  LOCKED: 'LOCKED',
  ARMED: 'ARMED',
  WINNER: 'WINNER',
  LOSER: 'LOSER'
};

// Default game state factory
function createDefaultGameState(gameId = 'default') {
  return {
    gameId,
    phase: GamePhase.BOARD,
    round: 'JEOPARDY',
    categories: [],
    activeClueId: null,
    buzzersOpen: false,
    activePlayerId: null,
    players: [],
    lastBuzzTime: 0,
    earlyBuzzPenaltyDuration: 3000,
    dailyDoublePlayerId: null,
    dailyDoubleWager: null,
  };
}

// Get or create game
function getGame(gameId) {
  if (!games.has(gameId)) {
    games.set(gameId, createDefaultGameState(gameId));
  }
  return games.get(gameId);
}

// Broadcast game state to all clients in the game room
function broadcastGameState(io, gameId) {
  const game = getGame(gameId);
  io.to(gameId).emit('gameState:update', game);
}

module.exports = function(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    let currentGameId = 'default';
    let currentPlayerId = null;
    
    // Join a game room
    socket.on('game:join', ({ gameId = 'default', playerName = null }) => {
      currentGameId = gameId;
      socket.join(gameId);
      
      const game = getGame(gameId);
      
      // If playerName provided, add player to game
      if (playerName) {
        const newPlayer = {
          id: uuidv4(),
          name: playerName,
          score: 0,
          buzzerStatus: BuzzerStatus.IDLE,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${playerName}`,
          lockedOutUntil: 0
        };
        
        game.players.push(newPlayer);
        currentPlayerId = newPlayer.id;
        
        console.log(`Player ${playerName} (${newPlayer.id}) joined game ${gameId}`);
        
        // Send player their ID
        socket.emit('player:joined', { playerId: newPlayer.id, player: newPlayer });
      }
      
      // Send current game state to the joining client
      socket.emit('gameState:update', game);
      
      // Notify all clients that a player joined
      if (playerName) {
        broadcastGameState(io, gameId);
      }
    });
    
    // Player actions
    socket.on('player:buzz', ({ gameId, playerId }) => {
      const game = getGame(gameId);
      
      // 1. If someone already won (is answering), ignore
      if (game.activePlayerId) {
        return;
      }
      
      const player = game.players.find(p => p.id === playerId);
      if (!player) return;
      
      // 2. Check for lockout/penalty
      if (player.lockedOutUntil && player.lockedOutUntil > Date.now()) {
        socket.emit('player:lockedOut', { playerId, remainingTime: player.lockedOutUntil - Date.now() });
        return;
      }
      
      // 3. Early buzz logic (buzzing when closed but active clue exists)
      if (!game.buzzersOpen && game.activeClueId && game.phase === GamePhase.CLUE && game.round !== 'FINAL_JEOPARDY') {
        player.lockedOutUntil = Date.now() + game.earlyBuzzPenaltyDuration;
        socket.emit('player:earlyBuzz', { playerId, penaltyDuration: game.earlyBuzzPenaltyDuration });
        broadcastGameState(io, gameId);
        return;
      }
      
      // 4. Standard valid buzz
      if (game.buzzersOpen) {
        game.buzzersOpen = false;
        game.activePlayerId = playerId;
        game.lastBuzzTime = Date.now();
        
        game.players.forEach(p => {
          p.buzzerStatus = p.id === playerId ? BuzzerStatus.WINNER : BuzzerStatus.LOSER;
        });
        
        console.log(`Player ${player.name} buzzed in!`);
        broadcastGameState(io, gameId);
      }
    });
    
    socket.on('player:submitWager', ({ gameId, playerId, amount }) => {
      const game = getGame(gameId);
      const player = game.players.find(p => p.id === playerId);
      if (player) {
        player.wager = amount;
        broadcastGameState(io, gameId);
      }
    });
    
    socket.on('player:submitFinalAnswer', ({ gameId, playerId, answer }) => {
      const game = getGame(gameId);
      const player = game.players.find(p => p.id === playerId);
      if (player) {
        player.finalAnswer = answer;
        broadcastGameState(io, gameId);
      }
    });
    
    // Host actions
    socket.on('host:openClue', ({ gameId, clueId }) => {
      const game = getGame(gameId);
      
      // Find clue to check if Daily Double
      let isDailyDouble = false;
      game.categories.forEach(cat => {
        const clue = cat.clues.find(c => c.id === clueId);
        if (clue?.isDailyDouble) isDailyDouble = true;
      });
      
      game.phase = isDailyDouble ? GamePhase.DAILY_DOUBLE : GamePhase.CLUE;
      game.activeClueId = clueId;
      game.buzzersOpen = false;
      game.activePlayerId = null;
      game.dailyDoublePlayerId = null;
      game.dailyDoubleWager = null;
      
      game.players.forEach(p => {
        p.buzzerStatus = BuzzerStatus.LOCKED;
        p.lockedOutUntil = 0;
      });
      
      console.log(`Clue ${clueId} opened (Daily Double: ${isDailyDouble})`);
      broadcastGameState(io, gameId);
    });
    
    socket.on('host:closeClue', ({ gameId }) => {
      const game = getGame(gameId);
      
      // Mark clue as completed
      game.categories.forEach(cat => {
        cat.clues.forEach(c => {
          if (c.id === game.activeClueId) {
            c.isCompleted = true;
          }
        });
      });
      
      game.phase = GamePhase.BOARD;
      game.activeClueId = null;
      game.buzzersOpen = false;
      game.activePlayerId = null;
      game.dailyDoublePlayerId = null;
      game.dailyDoubleWager = null;
      
      game.players.forEach(p => {
        p.buzzerStatus = BuzzerStatus.IDLE;
      });
      
      broadcastGameState(io, gameId);
    });
    
    socket.on('host:armBuzzers', ({ gameId }) => {
      const game = getGame(gameId);
      const now = Date.now();
      
      game.buzzersOpen = true;
      
      game.players.forEach(p => {
        const isPenalized = p.lockedOutUntil && p.lockedOutUntil > now;
        p.buzzerStatus = isPenalized ? BuzzerStatus.LOCKED : BuzzerStatus.ARMED;
        
        // Schedule penalty release
        if (isPenalized) {
          const delay = p.lockedOutUntil - now;
          setTimeout(() => {
            const currentGame = getGame(gameId);
            if (currentGame.buzzersOpen && !currentGame.activePlayerId) {
              const player = currentGame.players.find(pl => pl.id === p.id);
              if (player) {
                player.buzzerStatus = BuzzerStatus.ARMED;
                broadcastGameState(io, gameId);
              }
            }
          }, delay);
        }
      });
      
      console.log(`Buzzers armed for game ${gameId}`);
      broadcastGameState(io, gameId);
    });
    
    socket.on('host:handleJudgment', ({ gameId, correct }) => {
      const game = getGame(gameId);
      
      if (!game.activePlayerId) return;
      
      const player = game.players.find(p => p.id === game.activePlayerId);
      if (!player) return;
      
      // If in Final Reveal and already judged, ignore
      if (game.round === 'FINAL_JEOPARDY' && player.isFinalAnswerJudged) {
        return;
      }
      
      let value = 0;
      
      if (game.round === 'FINAL_JEOPARDY') {
        // In FJ, use player's wager
        value = player.wager || 0;
      } else {
        // Standard round
        game.categories.forEach(cat => {
          const clue = cat.clues.find(c => c.id === game.activeClueId);
          if (clue) value = clue.value;
        });
      }
      
      // Update score
      player.score = correct ? player.score + value : player.score - value;
      
      // Phase transition based on judgment
      if (game.round === 'FINAL_JEOPARDY') {
        player.isFinalAnswerJudged = true;
        // Stay in FINAL_REVEAL
      } else {
        // Normal gameplay
        if (correct) {
          // Mark clue completed and return to board
          game.categories.forEach(cat => {
            cat.clues.forEach(c => {
              if (c.id === game.activeClueId) {
                c.isCompleted = true;
              }
            });
          });
          
          game.phase = GamePhase.BOARD;
          game.activeClueId = null;
          game.buzzersOpen = false;
          game.activePlayerId = null;
          
          game.players.forEach(p => {
            p.buzzerStatus = BuzzerStatus.IDLE;
          });
        } else {
          // Wrong answer - reopen buzzers
          player.buzzerStatus = BuzzerStatus.LOSER;
          game.buzzersOpen = true;
          game.activePlayerId = null;
          
          game.players.forEach(p => {
            if (p.id !== player.id) {
              p.buzzerStatus = BuzzerStatus.ARMED;
            }
          });
        }
      }
      
      console.log(`Judgment for ${player.name}: ${correct ? 'Correct' : 'Wrong'} (${value})`);
      broadcastGameState(io, gameId);
    });
    
    socket.on('host:cancelBuzz', ({ gameId }) => {
      const game = getGame(gameId);
      game.buzzersOpen = true;
      game.activePlayerId = null;
      
      game.players.forEach(p => {
        p.buzzerStatus = BuzzerStatus.ARMED;
      });
      
      broadcastGameState(io, gameId);
    });
    
    socket.on('host:updateScore', ({ gameId, playerId, delta }) => {
      const game = getGame(gameId);
      const player = game.players.find(p => p.id === playerId);
      if (player) {
        player.score += delta;
        broadcastGameState(io, gameId);
      }
    });
    
    socket.on('host:skipClue', ({ gameId }) => {
      const game = getGame(gameId);
      
      // Mark clue as completed
      game.categories.forEach(cat => {
        cat.clues.forEach(c => {
          if (c.id === game.activeClueId) {
            c.isCompleted = true;
          }
        });
      });
      
      game.phase = GamePhase.BOARD;
      game.activeClueId = null;
      game.buzzersOpen = false;
      game.activePlayerId = null;
      
      game.players.forEach(p => {
        p.buzzerStatus = BuzzerStatus.IDLE;
      });
      
      broadcastGameState(io, gameId);
    });
    
    socket.on('host:setDailyDoubleConfig', ({ gameId, playerId, wager }) => {
      const game = getGame(gameId);
      game.dailyDoublePlayerId = playerId;
      game.dailyDoubleWager = wager;
      broadcastGameState(io, gameId);
    });
    
    socket.on('host:resolveDailyDouble', ({ gameId, correct }) => {
      const game = getGame(gameId);
      
      if (!game.dailyDoublePlayerId || game.dailyDoubleWager === null || game.dailyDoubleWager === undefined) {
        return;
      }
      
      const player = game.players.find(p => p.id === game.dailyDoublePlayerId);
      if (player) {
        player.score = correct ? player.score + game.dailyDoubleWager : player.score - game.dailyDoubleWager;
      }
      
      // Mark completed
      game.categories.forEach(cat => {
        cat.clues.forEach(c => {
          if (c.id === game.activeClueId) {
            c.isCompleted = true;
          }
        });
      });
      
      game.phase = GamePhase.BOARD;
      game.activeClueId = null;
      game.dailyDoublePlayerId = null;
      game.dailyDoubleWager = null;
      
      broadcastGameState(io, gameId);
    });
    
    socket.on('host:startRound', ({ gameId, round, categories }) => {
      const game = getGame(gameId);
      
      game.round = round;
      game.categories = categories || [];
      game.phase = GamePhase.BOARD;
      game.activeClueId = null;
      game.buzzersOpen = false;
      game.activePlayerId = null;
      game.dailyDoublePlayerId = null;
      game.dailyDoubleWager = null;
      
      game.players.forEach(p => {
        p.buzzerStatus = BuzzerStatus.IDLE;
        p.lockedOutUntil = 0;
        if (round === 'FINAL_JEOPARDY') {
          p.wager = undefined;
          p.finalAnswer = undefined;
          p.isFinalAnswerJudged = false;
        }
      });
      
      console.log(`Started ${round} round for game ${gameId}`);
      broadcastGameState(io, gameId);
    });
    
    socket.on('host:setFinalRevealPhase', ({ gameId }) => {
      const game = getGame(gameId);
      game.phase = GamePhase.FINAL_REVEAL;
      game.activePlayerId = null;
      broadcastGameState(io, gameId);
    });
    
    socket.on('host:revealPlayerFinal', ({ gameId, playerId }) => {
      const game = getGame(gameId);
      game.activePlayerId = playerId;
      broadcastGameState(io, gameId);
    });
    
    socket.on('host:updateSettings', ({ gameId, settings }) => {
      const game = getGame(gameId);
      Object.assign(game, settings);
      broadcastGameState(io, gameId);
    });
    
    socket.on('host:resetGame', ({ gameId }) => {
      const newGame = createDefaultGameState(gameId);
      games.set(gameId, newGame);
      console.log(`Game ${gameId} reset`);
      broadcastGameState(io, gameId);
    });
    
    socket.on('host:endRound', ({ gameId }) => {
      const game = getGame(gameId);
      game.phase = GamePhase.ROUND_END;
      game.activeClueId = null;
      game.buzzersOpen = false;
      game.activePlayerId = null;
      console.log(`Round ended for game ${gameId}, showing scores`);
      broadcastGameState(io, gameId);
    });
    
    socket.on('host:continueFromRoundEnd', ({ gameId }) => {
      const game = getGame(gameId);
      // Return to board view to start next round or continue current round
      game.phase = GamePhase.BOARD;
      console.log(`Continuing from round end for game ${gameId}`);
      broadcastGameState(io, gameId);
    });
    
    // Disconnect handling
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      // Optionally: Remove player from game on disconnect
      // For now, we keep them in the game (they can reconnect)
    });
    
    // Debug: Get current game state
    socket.on('debug:getGameState', ({ gameId }) => {
      const game = getGame(gameId);
      socket.emit('debug:gameState', game);
    });
  });
  
  return io;
};
