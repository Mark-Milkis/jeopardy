# Jeopardy Pro - AI Copilot Instructions

## Project Overview
**Jeopardy Pro** is a full-stack application for hosting and playing Jeopardy! games. It consists of:
- **Backend**: Node.js/Express server (`app.js`) serving REST API and WebSocket events
- **Frontend**: React 18 + TypeScript + Vite (`client/src/`) with four distinct interfaces
- **Data Sources**: Scrapes games from J! Archive via Cheerio; stores custom games in `/games` directory as JSON
- **Current Branch**: `feature/v2-overhaul` - modernizing legacy AngularJS frontend to React/TypeScript
- **Legacy Code**: Original AngularJS app archived in `/legacy-angular/` (reference only)

## Architecture

### Backend Structure
- **Entry**: `server/index.js` - Express server on port 3000, WebSocket support, API routes
- **Socket.IO Server**: `server/sockets/gameSocket.js` - Real-time game state management (v2)
  - Room-based architecture for multiple simultaneous games
  - 20+ event handlers for player and host actions
  - Automatic state broadcasting to all connected clients
  - Intelligent buzzer logic with lockouts and penalties
- **Server Structure** (`server/`):
  - `routes/api.js` - Scrapes J! Archive, exports seasons/games as JSON (Cheerio HTML parsing)
  - `routes/proxy.js` - Media proxy for J! Archive
  - `routes/index.js` - Root route handlers
  - `sockets/gameSocket.js` - Socket.IO v2 event handlers
  - `controllers/` - Business logic (expandable)
  - `utils/` - Shared utilities (expandable)
- **Games Data** (`games/`) - JSON files with game definitions (e.g., `00test.json`)

### Frontend Architecture (React v2)
Located in `client/src/`:
- **Entry Point**: `App.tsx` - React Router with hash-based routing (`/#/board`, `/#/play`, etc.)
- **Routing Context**: 
  - `/board` → `BoardView` - Game board display (cast-able screen for players)
  - `/play` → `PlayerView` - Individual player buzzer/scoring interface
  - `/host` → `HostView` - Host control panel for game management
  - `/dev` → `DeveloperView` - Testing harness (host + players in one window)
- **State Management**: `GameContext` in `gameService.tsx` - React Context API (no Redux)
  - `GameState` interface defines all game state
  - Methods: `joinGame()`, `buzz()`, `openClue()`, `handleJudgment()`, etc.
  - **Socket.IO Integration**: Real-time backend connection via `socket.io-client`
  - Connection status: `isConnected`, `currentPlayerId`
  - Automatic state synchronization via `gameState:update` events
- **Type Definitions**: `types.ts` - Core enums/interfaces:
  - `GamePhase` - States like BOARD, CLUE, DAILY_DOUBLE, FINAL_JEOPARDY, GAME_OVER
  - `BuzzerStatus` - IDLE, LOCKED, ARMED, WINNER, LOSER
  - `Player`, `Clue`, `Category`, `GameState` structures

### Key Data Flows
1. **Game Fetch**: Host selects season → API calls `GET /api/seasons` → Cheerio scrapes J! Archive → JSON returned
2. **Game State**: All components consume `GameContext` for real-time state via Socket.IO
   - Frontend emits actions: `host:openClue`, `player:buzz`, etc.
   - Backend updates state and broadcasts: `gameState:update`
   - All connected clients (host, players, board) receive updates instantly
3. **Buzzer Logic**: 
   - Host arms buzzers → `host:armBuzzers` → backend sets `buzzersOpen = true`
   - Player buzzes → `player:buzz` → backend validates timing, updates `activePlayerId`
   - Early buzz → backend applies penalty lockout (~3s default)
   - Backend broadcasts updated state to all clients

## Critical Patterns & Conventions

### React/TypeScript
- **Functional components only** - no class components
- **Hooks-based**: useState, useContext, useCallback for event handlers
- **Type safety required**: All props/state fully typed via `types.ts`
- **CSS**: Vite project uses inline Tailwind (no separate stylesheets for new components)
- **Router**: Hash-based routing (`HashRouter`), routes as top-level components

### Game Logic
- **Three Rounds**: Jeopardy (J100-J600), Double Jeopardy (DJ200-DJ2000), Final Jeopardy
- **Clue Value Handling**: J and DJ have fixed clue values; Daily Doubles/Final are custom wager amounts
- **Player Control**: Tracks who can pick next clue (control pin), passes to correct answerer
- **Score Management**: Context methods `handleJudgment(correct)`, `updateScore(playerId, delta)`

### Legacy Code Coexistence
- Old AngularJS code archived in `/legacy-angular/` - **DO NOT MODIFY**
- Legacy code kept for reference only (see `/legacy-angular/README.md`)
- New React code is the active codebase in `client/src/`
- Backend `app.js` maintains legacy routes for backwards compatibility
- Legacy socket handler at `legacy-angular/socket.js.deprecated` (replaced by `server/sockets/gameSocket.js`)

### Data Models (from `types.ts`)
```typescript
interface GameState {
  gameId?: string;
  phase: GamePhase;
  round: GameRound; // 'JEOPARDY' | 'DOUBLE_JEOPARDY' | 'FINAL_JEOPARDY'
  categories: Category[];
  players: Player[];
  activeClue?: Clue;
  buzzStatus: BuzzerStatus;
  activePlayer?: string; // Player ID of current buzzer holder
  // ... wager fields, timing, etc.
}
```

## Development Workflow

### Local Setup
```bash
cd /workspaces/jeopardy
npm install              # Root dependencies (Express, Socket.IO, Cheerio, etc.)
cd client/src
npm install              # Client dependencies (React, Vite)
cd ../..
npm start                # Starts backend on port 3000
# In separate terminal, from client/src:
npm run dev              # Vite dev server (proxies to backend)
```

### Build
```bash
cd client/src
npm run build            # Outputs to dist/
```

### Docker
```bash
docker build -t jeopardy .
docker run -p 3000:3000 jeopardy
```

### Key Files to Understand
- [server/index.js](server/index.js) - Express setup, static serving, route mounting, Socket.IO integration
- [server/sockets/gameSocket.js](server/sockets/gameSocket.js) - Socket.IO event handlers (v2)
- [server/routes/api.js](server/routes/api.js) - J! Archive scraping logic (Cheerio)
- [server/routes/proxy.js](server/routes/proxy.js) - Media proxy
- [client/src/App.tsx](client/src/App.tsx) - React Router entry, navigation
- [client/src/services/gameService.tsx](client/src/services/gameService.tsx) - State management with Socket.IO
- [client/src/types.ts](client/src/types.ts) - Central type definitions
- [client/src/components/\*.tsx](client/src/components) - UI views

## Common Tasks

### Adding a New UI Component
1. Create `.tsx` file in `client/src/components/` with functional component + TypeScript types
2. Import `useContext` to access `GameContext` for state
3. Use Tailwind classes inline for styling
4. Export and import in `App.tsx` or parent component

### Connecting to Backend Service
Socket.IO integration is complete and functional:
- Frontend automatically connects to backend on mount via `socket.io-client`
- Configuration in `client/src/.env`: `VITE_SOCKET_URL=http://localhost:3000`
- Backend handlers in `server/sockets/gameSocket.js` manage all game logic
- State updates broadcast to all clients via `io.to(gameId).emit('gameState:update')`
- Connection status tracked via `isConnected` and `currentPlayerId` in GameContext
- See [README_SOCKETS.md](README_SOCKETS.md) for complete event documentation

### Adding Game Data Endpoint
1. Add handler in [routes/api.js](routes/api.js) or new file in `server/`
2. Register route in [routes/index.js](routes/index.js)
3. Frontend fetches via `fetch('/api/endpoint')` in `gameService.tsx`

## Known Issues & TODOs
- Media from J! Archive frequently broken (images/audio not always available)
- No persistent game history beyond JSON files in `/games`
- State storage is in-memory (resets on server restart - consider Redis for production)
- No authentication/authorization for host role
- CORS may need configuration for production deployment

## Architecture Decisions to Preserve
- **Hash-based routing**: Simplifies SPA deployment (no server routing needed)
- **React Context over Redux**: Reduced complexity for moderate state; avoid adding Redux without discussion
- **Vite over Create React App**: Faster build times, modern ES modules
- **File-based custom games**: Simple approach; consider DB if feature expands
- **Separate frontend/backend builds**: Frontend builds to `dist/`, served as static from Express

---
**Last Updated**: January 2026 | **Branch**: feature/v2-overhaul
