# Socket.IO Integration Guide

## Architecture Overview

The Jeopardy Pro v2 application uses Socket.IO for real-time bidirectional communication between:
- **Host View**: Controls game flow, opens clues, judges answers
- **Player Views**: Individual player screens with buzzer controls
- **Board View**: Large display showing game board and active clues

## Backend Structure

### Socket Server: `/server/sockets/gameSocket.js`

The server maintains game state in memory and broadcasts updates to all connected clients.

**Key Features:**
- Room-based game isolation (multiple games can run simultaneously)
- Player management with unique IDs
- Buzzer timing and lockout logic
- Daily Double and Final Jeopardy workflows
- Automatic penalty handling for early buzzes

### Socket Events

#### Client → Server (Emit)

**Player Actions:**
- `game:join` - Join a game room (with optional playerName)
- `player:buzz` - Player attempts to buzz in
- `player:submitWager` - Submit Daily Double or Final Jeopardy wager
- `player:submitFinalAnswer` - Submit Final Jeopardy answer

**Host Actions:**
- `host:openClue` - Open a clue (automatically detects Daily Doubles)
- `host:closeClue` - Close current clue and return to board
- `host:armBuzzers` - Enable buzzers for players
- `host:handleJudgment` - Judge answer as correct/incorrect
- `host:cancelBuzz` - Reset buzzers without penalty
- `host:updateScore` - Manual score adjustment
- `host:skipClue` - Skip clue without awarding points
- `host:setDailyDoubleConfig` - Set Daily Double player and wager
- `host:resolveDailyDouble` - Resolve Daily Double outcome
- `host:startRound` - Start new round with categories
- `host:setFinalRevealPhase` - Enter Final Jeopardy reveal mode
- `host:revealPlayerFinal` - Feature a player during Final reveal
- `host:updateSettings` - Update game configuration
- `host:resetGame` - Reset entire game state

#### Server → Client (Listen)

- `gameState:update` - Complete game state broadcast (sent to all clients in room)
- `player:joined` - Confirmation of player joining with assigned ID
- `player:earlyBuzz` - Notification of early buzz penalty
- `player:lockedOut` - Notification of lockout status

### Game State Structure

```typescript
{
  gameId: string
  phase: 'BOARD' | 'CLUE' | 'DAILY_DOUBLE' | 'FINAL_JEOPARDY' | 'FINAL_REVEAL' | 'GAME_OVER'
  round: 'JEOPARDY' | 'DOUBLE_JEOPARDY' | 'FINAL_JEOPARDY'
  categories: Category[]
  activeClueId: string | null
  buzzersOpen: boolean
  activePlayerId: string | null
  players: Player[]
  lastBuzzTime: number
  earlyBuzzPenaltyDuration: number
  dailyDoublePlayerId: string | null
  dailyDoubleWager: number | null
}
```

## Frontend Integration

### Service: `/client/src/services/gameService.tsx`

The GameProvider wraps the entire React app and provides:
- Automatic Socket.IO connection on mount
- Real-time game state synchronization
- Action methods that emit socket events
- Connection status tracking

**Context Values:**
- `gameState` - Current game state
- `isConnected` - Socket connection status
- `currentPlayerId` - Local player's ID (if joined as player)
- Action methods (joinGame, buzz, openClue, etc.)

### Usage in Components

```tsx
import { useGame } from '../services/gameService';

function PlayerView() {
  const { gameState, buzz, currentPlayerId, isConnected } = useGame();
  
  const handleBuzz = () => {
    if (currentPlayerId) {
      buzz(currentPlayerId);
    }
  };
  
  return (
    <div>
      {!isConnected && <p>Connecting...</p>}
      <button onClick={handleBuzz}>BUZZ</button>
      <p>Score: {gameState.players.find(p => p.id === currentPlayerId)?.score}</p>
    </div>
  );
}
```

## Setup Instructions

### Backend Setup

1. Install dependencies:
```bash
cd /workspaces/jeopardy
yarn install
```

2. Start the server:
```bash
node app.js
```

Server will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to client directory:
```bash
cd /workspaces/jeopardy/client/src
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Start Vite dev server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173` (or next available port)

### Testing the Connection

1. Start backend server
2. Start frontend dev server
3. Open browser to frontend URL
4. Open browser console - you should see: `Connected to Socket.IO server`
5. Navigate to Host view or Player view to test functionality

## Deployment Considerations

### Production Socket URL

Update `.env` in client to point to production server:
```
VITE_SOCKET_URL=https://your-production-server.com
```

### CORS Configuration

The Socket.IO server may need CORS configuration for production. In `app.js`:

```javascript
const io = require('socket.io').listen(server, {
  cors: {
    origin: "https://your-frontend-domain.com",
    methods: ["GET", "POST"]
  }
});
```

### State Persistence

Current implementation uses in-memory state. For production:
- Consider Redis for distributed state management
- Implement session reconnection logic
- Add game state persistence to database

## Game Flow Examples

### Standard Clue Flow

1. Host clicks clue → `host:openClue`
2. Server updates phase to CLUE, locks buzzers
3. Host reads clue, then clicks "Arm Buzzers" → `host:armBuzzers`
4. Player clicks buzz button → `player:buzz`
5. Server updates activePlayerId, sets player as WINNER
6. Host judges answer → `host:handleJudgment(true/false)`
7. If correct: return to BOARD, mark clue complete
8. If incorrect: rearm buzzers for other players

### Daily Double Flow

1. Host clicks DD clue → `host:openClue` (phase becomes DAILY_DOUBLE)
2. Host selects player and enters wager → `host:setDailyDoubleConfig`
3. Player answers, host judges → `host:resolveDailyDouble(true/false)`
4. Score updated, return to BOARD

### Final Jeopardy Flow

1. Host starts Final Jeopardy → `host:startRound({ round: 'FINAL_JEOPARDY', categories })`
2. Players see category, enter wagers → `player:submitWager`
3. Host reveals clue
4. Players enter answers → `player:submitFinalAnswer`
5. Host enters reveal phase → `host:setFinalRevealPhase`
6. Host reveals each player → `host:revealPlayerFinal(playerId)`
7. Host judges each answer → `host:handleJudgment(true/false)`

## Troubleshooting

### Connection Issues

- Check that backend is running on port 3000
- Verify VITE_SOCKET_URL in .env matches backend
- Check browser console for connection errors
- Ensure firewall allows WebSocket connections

### State Not Updating

- Verify all clients are in the same game room
- Check that gameId is consistent across emits
- Look for socket event listener errors in console

### Buzzer Timing Issues

- Early buzz penalty is configurable via `earlyBuzzPenaltyDuration`
- Check system clock synchronization across clients
- Network latency may affect buzzer fairness

## Development Tips

- Use browser dev tools Network tab to inspect Socket.IO frames
- Add `socket.on('*', (event, data) => console.log(event, data))` for debugging
- Test with multiple browser windows to simulate multiple clients
- Use the Developer View (`/#/dev`) to test all interfaces in one window

## Future Enhancements

- [ ] Add authentication for host role
- [ ] Implement spectator mode
- [ ] Add chat functionality
- [ ] Game replay/history
- [ ] Mobile-optimized player view
- [ ] Sound effects and animations
- [ ] Multi-room lobby system
- [ ] Persistent leaderboards
