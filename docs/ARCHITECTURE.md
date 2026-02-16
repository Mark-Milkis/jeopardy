# Jeopardy Pro v2 - Socket.IO Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         REACT FRONTEND                              │
│                    (http://localhost:5173)                          │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Socket.IO Client
                                  │ (socket.io-client)
                                  │
                    ┌─────────────▼──────────────┐
                    │   GameProvider Context     │
                    │  (gameService.tsx)         │
                    │                            │
                    │  - gameState               │
                    │  - isConnected             │
                    │  - currentPlayerId         │
                    │  - Action methods          │
                    └─────────────┬──────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌──────────────┐          ┌──────────────┐        ┌──────────────┐
│  HostView    │          │  PlayerView  │        │  BoardView   │
│  /#/host     │          │  /#/play     │        │  /#/board    │
└──────────────┘          └──────────────┘        └──────────────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                                  │ WebSocket Connection
                                  │
┌─────────────────────────────────▼─────────────────────────────────┐
│                      NODE.JS BACKEND                              │
│                    (http://localhost:3000)                        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                Express Server (app.js)                  │    │
│  │                                                         │    │
│  │  - Static file serving                                 │    │
│  │  - REST API routes (/api/*)                           │    │
│  │  - Socket.IO server                                   │    │
│  └─────────────────┬───────────────────────────────────────┘    │
│                    │                                             │
│  ┌─────────────────▼───────────────────────────────────────┐    │
│  │         Socket.IO Handler                               │    │
│  │      (server/sockets/gameSocket.js)                    │    │
│  │                                                         │    │
│  │  Game State Management:                                │    │
│  │  ┌──────────────────────────────────────────┐         │    │
│  │  │  games = Map<gameId, GameState>          │         │    │
│  │  │                                           │         │    │
│  │  │  gameState: {                             │         │    │
│  │  │    gameId: 'default'                      │         │    │
│  │  │    phase: GamePhase                       │         │    │
│  │  │    round: GameRound                       │         │    │
│  │  │    categories: Category[]                 │         │    │
│  │  │    players: Player[]                      │         │    │
│  │  │    activeClueId: string                   │         │    │
│  │  │    activePlayerId: string                 │         │    │
│  │  │    buzzersOpen: boolean                   │         │    │
│  │  │    ...                                    │         │    │
│  │  │  }                                        │         │    │
│  │  └──────────────────────────────────────────┘         │    │
│  │                                                         │    │
│  │  Event Handlers:                                       │    │
│  │  ┌──────────────────────────────────────────┐         │    │
│  │  │  Player Events:                          │         │    │
│  │  │  - game:join                             │         │    │
│  │  │  - player:buzz                           │         │    │
│  │  │  - player:submitWager                    │         │    │
│  │  │  - player:submitFinalAnswer              │         │    │
│  │  │                                           │         │    │
│  │  │  Host Events:                            │         │    │
│  │  │  - host:openClue                         │         │    │
│  │  │  - host:closeClue                        │         │    │
│  │  │  - host:armBuzzers                       │         │    │
│  │  │  - host:handleJudgment                   │         │    │
│  │  │  - host:startRound                       │         │    │
│  │  │  - host:resetGame                        │         │    │
│  │  │  ... (15 total host events)              │         │    │
│  │  └──────────────────────────────────────────┘         │    │
│  │                                                         │    │
│  │  Broadcasting:                                         │    │
│  │  ┌──────────────────────────────────────────┐         │    │
│  │  │  io.to(gameId).emit('gameState:update')  │         │    │
│  │  │                                           │         │    │
│  │  │  Sends to all clients in room:           │         │    │
│  │  │  - Host                                   │         │    │
│  │  │  - All Players                            │         │    │
│  │  │  - Board Display                          │         │    │
│  │  └──────────────────────────────────────────┘         │    │
│  └─────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════
                          EVENT FLOW EXAMPLE
═══════════════════════════════════════════════════════════════════

Standard Clue Flow:
───────────────────

1. Host clicks clue
   HostView → emit('host:openClue', { clueId })
                    ↓
   Server: Update gameState.phase = 'CLUE'
          gameState.activeClueId = clueId
          gameState.buzzersOpen = false
                    ↓
   Server → broadcast('gameState:update', gameState)
                    ↓
   All Views: Update UI with new state

2. Host arms buzzers
   HostView → emit('host:armBuzzers')
                    ↓
   Server: gameState.buzzersOpen = true
          Update player buzzerStatus = 'ARMED'
                    ↓
   Server → broadcast('gameState:update')
                    ↓
   PlayerViews: Enable buzz button

3. Player buzzes
   PlayerView → emit('player:buzz', { playerId })
                    ↓
   Server: Check timing, penalties
          gameState.activePlayerId = playerId
          gameState.buzzersOpen = false
          Winner: buzzerStatus = 'WINNER'
          Others: buzzerStatus = 'LOSER'
                    ↓
   Server → broadcast('gameState:update')
                    ↓
   All Views: Show active player

4. Host judges
   HostView → emit('host:handleJudgment', { correct: true })
                    ↓
   Server: Update player score
          Mark clue as completed
          gameState.phase = 'BOARD'
                    ↓
   Server → broadcast('gameState:update')
                    ↓
   All Views: Return to board


═══════════════════════════════════════════════════════════════════
                       ROOM ARCHITECTURE
═══════════════════════════════════════════════════════════════════

Multiple Simultaneous Games:

┌────────────────────────┐    ┌────────────────────────┐
│   Room: 'game-001'     │    │   Room: 'game-002'     │
│                        │    │                        │
│  Host-1   Player-1A    │    │  Host-2   Player-2A    │
│  Board-1  Player-1B    │    │  Board-2  Player-2B    │
│           Player-1C    │    │           Player-2C    │
│                        │    │                        │
│  gameState-1           │    │  gameState-2           │
└────────────────────────┘    └────────────────────────┘

Events only broadcast within each room:
- io.to('game-001').emit() → Only game-001 clients receive
- io.to('game-002').emit() → Only game-002 clients receive


═══════════════════════════════════════════════════════════════════
                       DATA STRUCTURES
═══════════════════════════════════════════════════════════════════

Player Object:
──────────────
{
  id: "uuid-generated",
  name: "John Doe",
  score: 5400,
  buzzerStatus: "ARMED" | "LOCKED" | "WINNER" | "LOSER" | "IDLE",
  avatar: "https://api.dicebear.com/...",
  lockedOutUntil: 1674123456789,  // timestamp
  wager: 1000,                      // Final Jeopardy
  finalAnswer: "What is...?",       // Final Jeopardy
  isFinalAnswerJudged: false
}

Clue Object:
────────────
{
  id: "clue-1-2",
  categoryId: "cat-1",
  value: 400,
  question: "This algorithm sorts efficiently",
  answer: "What is Quicksort?",
  isDailyDouble: false,
  isCompleted: false
}

Category Object:
────────────────
{
  id: "cat-1",
  title: "COMPUTER SCIENCE",
  comment: "All about algorithms",  // optional
  clues: [Clue, Clue, Clue, Clue, Clue]
}


═══════════════════════════════════════════════════════════════════
                    TIMING & PENALTIES
═══════════════════════════════════════════════════════════════════

Buzzer States:
──────────────

IDLE    → Default state (no active clue)
LOCKED  → Host reading clue (buzzers disabled)
ARMED   → Buzzers enabled (can buzz now)
WINNER  → This player buzzed first
LOSER   → Someone else buzzed first

Early Buzz Penalty:
───────────────────

If player buzzes while buzzersOpen = false:
  → player.lockedOutUntil = now + 3000ms
  → Cannot buzz again until timer expires
  → Timer auto-releases when expired

Lockout Management:
───────────────────

Wrong Answer → buzzerStatus = 'LOSER' (this round only)
Next Clue   → Reset all to 'IDLE'


═══════════════════════════════════════════════════════════════════
                      DEVELOPMENT SETUP
═══════════════════════════════════════════════════════════════════

Terminal 1 - Backend:
────────────────────
$ cd /workspaces/jeopardy
$ node app.js
Express server listening on port 3000

Terminal 2 - Frontend:
─────────────────────
$ cd /workspaces/jeopardy/client/src
$ npm install
$ npm run dev
VITE ready on http://localhost:5173

Browser:
────────
Test:     http://localhost:3000/socket-test.html
React:    http://localhost:5173/#/host
          http://localhost:5173/#/play
          http://localhost:5173/#/board
          http://localhost:5173/#/dev


═══════════════════════════════════════════════════════════════════
                     PRODUCTION CHECKLIST
═══════════════════════════════════════════════════════════════════

Backend:
────────
[ ] Update CORS settings in app.js
[ ] Set environment variables (PORT, NODE_ENV)
[ ] Add Redis for distributed state
[ ] Implement authentication
[ ] Add rate limiting
[ ] Set up logging (Winston, Bunyan)
[ ] Health check endpoint
[ ] HTTPS/WSS configuration

Frontend:
─────────
[ ] Update VITE_SOCKET_URL in .env
[ ] Build production bundle (npm run build)
[ ] Serve from CDN or static host
[ ] Enable service worker for offline
[ ] Add error boundaries
[ ] Implement reconnection UI
[ ] Add loading states

Both:
─────
[ ] Add monitoring (Datadog, New Relic)
[ ] Set up error tracking (Sentry)
[ ] Load testing
[ ] Security audit
[ ] Documentation review
