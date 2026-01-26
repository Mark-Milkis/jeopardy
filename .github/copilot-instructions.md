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
  - `routes/index.js` - Root route handlers (legacy compatibility messages)
  - `routes/api.js` - Scrapes J! Archive, exports seasons/games as JSON (Cheerio HTML parsing)
  - `routes/proxy.js` - Media proxy for J! Archive
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
**Critical**: Frontend types in `client/src/types.ts` MUST match backend enums in `server/sockets/gameSocket.js`
```typescript
// Shared across frontend/backend (keep in sync!)
enum GamePhase { BOARD, CLUE, DAILY_DOUBLE, FINAL_JEOPARDY, FINAL_REVEAL, GAME_OVER }
enum BuzzerStatus { IDLE, LOCKED, ARMED, WINNER, LOSER }
type GameRound = 'JEOPARDY' | 'DOUBLE_JEOPARDY' | 'FINAL_JEOPARDY'

interface GameState {
  gameId: string;
  phase: GamePhase;
  round: GameRound;
  categories: Category[];
  players: Player[];
  activeClueId: string | null;    // Currently displayed clue
  buzzersOpen: boolean;            // Host armed buzzers
  activePlayerId: string | null;   // Player who buzzed/has control
  lastBuzzTime: number;            // For early buzz detection
  earlyBuzzPenaltyDuration: number; // Default 3000ms
  dailyDoublePlayerId: string | null;
  dailyDoubleWager: number | null;
}

interface Player {
  id: string;                      // UUID generated on join
  name: string;
  score: number;
  buzzerStatus: BuzzerStatus;
  avatar: string;                  // DiceBear API URL
  lockedOutUntil: number;          // Timestamp for penalty end
  wager?: number;                  // Final Jeopardy wager
  finalAnswer?: string;
  isFinalAnswerJudged?: boolean;
}
```

**When modifying types**: Update BOTH `types.ts` and `gameSocket.js` enums simultaneously to avoid runtime errors.

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
npm run dev              # Vite dev server on port 5173 (proxies API to port 3000)
```

**Important**: Frontend runs on port 5173, backend on port 3000. Vite proxies `/api/*` and `/media/*` requests to the Express backend. Socket.IO connects directly to port 3000.

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
- [server/routes/index.js](server/routes/index.js) - Root route handlers (legacy compatibility)
- [client/src/App.tsx](client/src/App.tsx) - React Router entry, navigation
- [client/src/services/gameService.tsx](client/src/services/gameService.tsx) - State management with Socket.IO
- [client/src/types.ts](client/src/types.ts) - Central type definitions
- [client/src/components/\*.tsx](client/src/components) - UI views
- [client/src/utils/legacyGameConverter.ts](client/src/utils/legacyGameConverter.ts) - Convert J! Archive format to Category[]

## Common Tasks

### Adding a New UI Component
1. Create `.tsx` file in `client/src/components/` with functional component + TypeScript types
2. Import `useContext` to access `GameContext` for state
3. Use Tailwind classes inline for styling
4. Export and import in `App.tsx` or parent component

### Working with Socket.IO Events
Socket.IO integration is complete and functional:
- Frontend automatically connects via `socket.io-client` in `GameProvider` useEffect
- Socket URL: `VITE_SOCKET_URL` env var (defaults to `http://localhost:3000`)
- Backend handlers in `server/sockets/gameSocket.js` - all events follow `namespace:action` pattern
- **Event Naming Convention**: `player:buzz`, `host:openClue`, `gameState:update`
- State is stored in-memory in `games` Map (key = gameId) - **no persistence across restarts**
- Room-based isolation: Each game has separate Socket.IO room via `socket.join(gameId)`
- Broadcast pattern: `io.to(gameId).emit('gameState:update', game)` sends to all clients in room
- See [README_SOCKETS.md](README_SOCKETS.md) for complete event documentation

**Adding New Socket Events**:
1. Define handler in `server/sockets/gameSocket.js` with `socket.on('namespace:action', handler)`
2. Add emitter method in `client/src/services/gameService.tsx` using `socketRef.current.emit()`
3. Update `GameContextType` interface with new method signature
4. Broadcast updated state with `broadcastGameState(io, gameId)` at end of handler

### Adding Game Data Endpoint
1. Add handler in [server/routes/api.js](server/routes/api.js) or new file in `server/routes/`
2. Register route in [server/index.js](server/index.js) (routes are imported from `server/routes/`)
3. Frontend fetches via `fetch('/api/endpoint')` in `gameService.tsx`

## Missing Features from Legacy Version

The React v2 rewrite is functional for gameplay but lacks several features from the AngularJS version:

### ✅ COMPLETED
1. **Game Browser/Season Selector** - ✓ Fully implemented
   - SeasonsView component for browsing all J! Archive seasons
   - SeasonDetailView component for listing games in a season
   - GamePreviewModal for previewing categories before loading
   - legacyGameConverter utility for format conversion
   - Routes: `/seasons` and `/seasons/:seasonId`
   - Integration with gameService.loadGameFromApi()
   - "Browse Games" button in HostView

2. **Game Editor** - ✓ Fully implemented
   - EditorView component with 3-panel layout (rounds/categories, clue grid, clue editor)
   - Create new games with auto-generated template (J/DJ/FJ rounds)
   - Edit existing custom games
   - Save/Load functionality with completion validation
   - Import/Export JSON files
   - Delete custom games with confirmation
   - Daily Double checkbox for J/DJ rounds
   - Routes: `/editor` (new) and `/editor/:id` (edit)
   - Integrated with SeasonDetailView "Create New Game" and "Edit" buttons

### 🟡 HIGH Priority
3. **Media Support in Clues** - Images/audio from J! Archive not rendered
   - Backend proxy exists at `/media/*`
   - Clue data includes `media` field but frontend doesn't display it
4. **Between-Rounds Score Display** - No full-screen score ceremony
   - Legacy showed prominent score display after "End Round"
   - Currently just switches to next board immediately

### 🟢 LOW Priority  
5. **Triple Stumper Indicators** - No "TS" badge on clues
6. **"Open Board" Button** - Host must manually navigate to `/board`
7. **Final Jeopardy Wagering Calculator** - No link to J! Archive's wagering tool

See [Implementation Plans](#implementation-plans) section below for detailed development guidance.

## Known Issues & TODOs
- **Media Proxy**: Images/audio from J! Archive often broken (proxied through `/media/*` route)
- **State Persistence**: Games Map is in-memory only - **server restart wipes all game state**
  - Consider Redis or DB for production
  - Custom games persist as JSON in `/games/` directory (e.g., `00test.json`)
- **Authentication**: No auth/authorization for host role - anyone can control game
- **CORS**: Currently allows localhost:5173 and 3001-3003 in `server/index.js` - update for production domains
- **Avatar Generation**: Uses DiceBear API v7 - may break if API changes
- **Buzzer Timing**: Early buzz detection relies on client-side timestamps (`Date.now()`) - can be exploited with clock manipulation

## Architecture Decisions to Preserve
- **Hash-based routing** (`HashRouter`): Simplifies SPA deployment, no server-side routing config needed
- **React Context over Redux**: Single `GameProvider` wraps app, sufficient for moderate state complexity
  - Avoid adding Redux/Zustand without discussion - current pattern works well
- **Vite over Create React App**: Faster HMR, native ES modules, minimal config
- **File-based custom games**: JSON files in `/games/` directory, simple CRUD via `/api/games` endpoints
  - Format: See `games/00test.json` for structure
  - File naming: `{id}.json` where id is used in `/api/games/:id`
- **Separate builds**: Frontend builds to `client/src/dist/`, backend serves from `public/`
- **No TypeScript in backend**: Backend is plain Node.js/Express - keep it that way for consistency
  - Types only enforced in frontend React code
- **Cheerio for scraping**: J! Archive HTML parsing via `routes/api.js` - avoid switching to Puppeteer (overhead)

## Debugging Tips
- **Socket not connecting**: Check browser console for `[Socket] ✓ Connected` message
  - Verify `VITE_SOCKET_URL` in `.env` matches backend URL
  - Check CSocket.IO connects to `http://localhost:3000` (backend port)
  - Check CORS origins in `server/index.js` include `http://localhost:5173` (Vite dev server)
- **API requests failing**: Check browser Network tab
  - Vite should proxy `/api/*` and `/media/*` to `http://localhost:3000`
  - Verify both backend (port 3000) and Vite (port 5173) are running
- **State not updating**: Look for `gameState:update` events in console
  - Use React DevTools to inspect GameContext values
  - Verify `broadcastGameState()` called after backend state changes
- **Buzzer not working**: Check player's `lockedOutUntil` timestamp in state
  - Early buzz penalty may still be active
  - Verify `buzzersOpen: true` in game state when host arms
- **Daily Double detection**: Backend checks `clue.isDailyDouble` when host opens clue
  - Auto-transitions to `DAILY_DOUBLE` phase
  - Check clue data structure has boolean `isDailyDouble` field
## Implementation Plans

Detailed plans for implementing missing features from the legacy version.

### Plan 1: Game Browser / Season Selector (CRITICAL)

**Objective**: Allow host to browse and load real J! Archive games

**New Files to Create**:
- `client/src/components/SeasonsView.tsx` - List all seasons
- `client/src/components/SeasonDetailView.tsx` - List games in a season
- `client/src/components/GamePreviewModal.tsx` - Show game info before loading

**Files to Modify**:
- `client/src/App.tsx` - Add routes for `/seasons` and `/seasons/:id`
- `client/src/services/gameService.tsx` - Add `loadGameFromApi(gameId)` method
- `client/src/components/HostView.tsx` - Add "Browse Games" button

**Backend Integration**:
- Endpoints already exist and functional:
  - `GET /api/seasons` - Returns array of seasons with custom games at top (id='00')
  - `GET /api/seasons/:id` - Returns games in season (or custom games if id='00')
  - `GET /api/games/:id` - Returns full game data
  - `DELETE /api/games/:id` - Delete custom game (id must start with 'custom_' or '00')

**Data Transformation Required**:
J! Archive format uses legacy structure (e.g., `clue_J_1_1`, `category_J_1`). Need converter:
```typescript
// Convert legacy format to new Category[] structure
function convertLegacyGame(legacyData: any): Category[] {
  // Parse clue_J_1_1 → round='J', category=1, clue=1
  // Parse category_J_1 → round='J', category=1
  // Build Category[] with nested Clue[]
  // Handle FJ separately (single category with 1 clue)
}
```

**Implementation Steps**:
1. Create `SeasonsView.tsx`:
   - Fetch `/api/seasons` on mount
   - Render table with columns: Name, Description, Note
   - Highlight "Custom Games" row (id='00') with different styling
   - Link to `/seasons/:id` on row click
2. Create `SeasonDetailView.tsx`:
   - Fetch `/api/seasons/:seasonId` on mount
   - Show game list with: Game Title, Comments, Completeness indicator
   - If seasonId='00', show delete buttons for custom games
   - Click game → show preview modal
3. Create `GamePreviewModal.tsx`:
   - Display game metadata (title, comments, completeness)
   - Show category names for J, DJ, FJ rounds
   - "Load Game" button → calls `loadGameFromApi(gameId)` → navigates to `/host`
4. Add converter utility `utils/legacyGameConverter.ts`:
   - Parse legacy key patterns (`clue_J_2_3` = Jeopardy, Cat 2, Clue 3)
   - Map to new format with proper typing
   - Handle Daily Doubles (check `daily_double` boolean)
   - Handle media URLs (convert J! Archive URLs to proxy URLs)
5. Update `gameService.tsx`:
   - Add `loadGameFromApi(gameId: string)` method
   - Fetch game data, convert format, emit socket event to load categories
   - Backend socket handler: Add `host:loadGame` event that accepts Category[]

**Edge Cases**:
- Games with missing clues (check `game_complete` flag)
- Media URLs may be broken (show placeholder or hide)
- Custom game format differs from J! Archive format (check ID prefix)

---

### Plan 2: Game Editor (CRITICAL)

**Objective**: Create/edit custom games through UI

**New Files to Create**:
- `client/src/components/EditorView.tsx` - Main editor interface
- `client/src/components/EditorRoundSelector.tsx` - Switch between J/DJ/FJ
- `client/src/components/EditorCategoryPanel.tsx` - Edit category metadata
- `client/src/components/EditorCluePanel.tsx` - Edit individual clues

**Files to Modify**:
- `client/src/App.tsx` - Add route `/editor/:id?` (optional ID for editing existing)
- Backend uses existing endpoints: `POST /api/games`, `DELETE /api/games/:id`

**Data Model**:
Custom game JSON format (see `games/00test.json`):
```typescript
interface CustomGame {
  id: string; // 'custom_TIMESTAMP' or '00XXX'
  game_title: string;
  game_comments: string;
  game_complete: boolean;
  // Legacy key format: category_J_1, clue_J_1_1, etc.
  [key: string]: any; // Dynamic keys for categories/clues
}
```

**Implementation Steps**:
1. Create `EditorView.tsx` structure:
   - Left sidebar: Round selector (J, DJ, FJ) + Category list
   - Center panel: Selected category title + clue grid (5 clues for J/DJ, 1 for FJ)
   - Right panel: Clue editor (question, answer, value, Daily Double checkbox)
   - Top bar: Game title input, Save/Save As/Import/Export/Delete buttons
2. State management:
   - Use `useState` for editor-local state (not GameContext)
   - Store as legacy format for backend compatibility
   - Convert to/from new format only when loading into game
3. Initialize empty template:
   - 6 categories × 5 clues for J round (values: 200-1000)
   - 6 categories × 5 clues for DJ round (values: 400-2000)
   - 1 category × 1 clue for FJ (value: 0)
4. Load existing game:
   - If `:id` in route, fetch `/api/games/:id`
   - Populate editor state
5. Save functionality:
   - Validate: All clues have question + answer
   - POST to `/api/games` with full game object
   - Set `game_complete: true` if all 61 clues filled
6. Import/Export:
   - Export: Download JSON file (`jeopardy_game_${id}.json`)
   - Import: File input → `FileReader` → parse JSON → populate state
7. Delete:
   - Only for custom games (ID starts with 'custom_' or '00')
   - Confirm dialog → DELETE `/api/games/:id` → navigate to `/seasons/00`

**UI/UX Considerations**:
- Auto-save draft to localStorage every 30s (prevent data loss)
- Keyboard shortcuts: Ctrl+S to save, Tab to move between fields
- Visual indicator for Daily Doubles (red badge)
- Character counter for long questions/answers
- Preview mode to see how clue looks in game

---

### Plan 3: Media Support in Clues (HIGH)

**Objective**: Display images/audio from J! Archive in clue display

**Files to Modify**:
- `client/src/components/HostView.tsx` - Render media in clue modal
- `client/src/components/BoardView.tsx` - Render media in board clue display
- `client/src/types.ts` - Add `media?: string[]` to Clue interface (already exists in backend)

**Backend (Already Complete)**:
- `/media/*` proxy in `server/routes/proxy.js` handles J! Archive media
- Clue data from `/api/games/:id` includes `media` array with proxied URLs

**Implementation Steps**:
1. Update Clue interface:
   ```typescript
   interface Clue {
     // ... existing fields
     media?: string[]; // URLs to images/audio (proxied)
   }
   ```
2. In HostView modal, after question text:
   ```tsx
   {activeClue.media && (
     <div className="flex gap-2 flex-wrap">
       {activeClue.media.map((url, i) => (
         url.endsWith('.mp3') || url.endsWith('.wav') ? (
           <audio key={i} controls src={url} className="w-full" />
         ) : (
           <img key={i} src={url} alt="Clue media" 
                className="max-w-xs rounded border" 
                onError={(e) => e.currentTarget.style.display = 'none'} />
         )
       ))}
     </div>
   )}
   ```
3. In BoardView (legacy-angular/js/controllers/boardclue.js reference):
   - Same rendering logic in board clue modal
4. Handle errors:
   - Many J! Archive media URLs are broken (404s)
   - Use `onError` to hide broken images gracefully
   - Show placeholder text: "Media unavailable"

**Testing**:
- Find game with known media (search J! Archive for image/audio categories)
- Test proxy functionality: `http://localhost:3000/media/j-archive.com/media/2023_04_10_J_01.jpg`

---

### Plan 4: Between-Rounds Score Display (HIGH)

**Objective**: Full-screen score ceremony after round ends

**Files to Modify**:
- `client/src/components/BoardView.tsx` - Add score display mode
- `server/sockets/gameSocket.js` - Add `host:endRound` event

**Implementation Steps**:
1. Add new GamePhase: `ROUND_END = 'ROUND_END'`
2. Update `types.ts`:
   ```typescript
   enum GamePhase {
     // ... existing
     ROUND_END = 'ROUND_END', // Between rounds, showing scores
   }
   ```
3. Add socket event `host:endRound`:
   - Backend transitions to `ROUND_END` phase
   - Broadcasts state update
4. In BoardView, detect phase:
   ```tsx
   {phase === GamePhase.ROUND_END && (
     <div className="h-full flex flex-col items-center justify-center bg-blue-900">
       <h1 className="text-6xl font-bold text-yellow-400 mb-12">
         {round === 'JEOPARDY' ? 'END OF JEOPARDY ROUND' : 'END OF DOUBLE JEOPARDY'}
       </h1>
       <div className="grid grid-cols-3 gap-8 max-w-5xl">
         {players.map(p => (
           <div key={p.id} className="text-center">
             <div className="text-3xl font-bold text-white mb-2">{p.name}</div>
             <div className={`text-6xl font-mono font-bold ${p.score < 0 ? 'text-red-400' : 'text-green-400'}`}>
               ${p.score}
             </div>
           </div>
         ))}
       </div>
     </div>
   )}
   ```
5. Add "Continue" button in HostView when `phase === ROUND_END`:
   - Triggers next round start (DJ or FJ)
6. Auto-transition after 5 seconds (optional)

---

### Plan 5: Minor Enhancements (LOW Priority)

**Triple Stumper Indicators**:
- Clue interface already supports `tripleStumper?: boolean`
- In HostView clue button, add badge:
  ```tsx
  {clue.tripleStumper && (
    <span className="absolute top-1 left-1 text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded">TS</span>
  )}
  ```

**"Open Board" Button**:
- Add to HostView top bar:
  ```tsx
  <button onClick={() => window.open('/#/board', '_blank')}>
    Open Board in New Window
  </button>
  ```

**FJ Wagering Calculator Link**:
- In HostView Final Jeopardy phase, add link:
  ```tsx
  <a href={`http://www.j-archive.com/wageringcalculator.php?${buildQueryString(players)}`} 
     target="_blank" className="text-blue-500 underline">
    Optimal Wagering Calculator
  </a>
  ```
  Where `buildQueryString` formats player names and scores for J! Archive's calculator

---

## Development Priority Order

**Phase 1** (Critical for Real Gameplay): ✅ COMPLETED
1. ✅ Game Browser/Season Selector - Implemented
2. ✅ Legacy game format converter utility - Implemented
3. ✅ Load game into active session - Implemented

**Phase 2** (Enable Custom Content): ✅ COMPLETED
4. ✅ Game Editor UI - Implemented (EditorView with full CRUD)
5. ✅ Import/Export functionality - Implemented (JSON file handling)

**Phase 3** (Polish): 🔄 NEXT
6. Media rendering in clues (0.5 days) - NOT STARTED
7. Between-rounds score display (0.5 days) - NOT STARTED
8. Minor enhancements (0.5 days) - NOT STARTED

**Remaining Estimated Effort**: 1-2 days for complete feature parity

---
**Last Updated**: January 26, 2026 | **Branch**: feature/v2-overhaul
