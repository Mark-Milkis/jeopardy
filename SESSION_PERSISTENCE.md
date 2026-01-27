# Player Session Persistence

## Overview
Players can now reconnect to their existing session if the page reloads or their connection drops. This prevents duplicate player entries and preserves game state.

## Implementation Details

### Frontend (gameService.tsx)

**LocalStorage Keys:**
- `jeopardy_player_id` - Stores the player's unique ID
- `jeopardy_player_name` - Stores the player's name
- `jeopardy_game_id` - Stores the game ID they're in

**Connection Flow:**
1. On socket connect, check localStorage for existing session data
2. If found, emit `player:reconnect` event instead of `game:join`
3. Backend validates player exists and reassociates socket
4. Frontend receives `player:reconnected` confirmation
5. If reconnection fails, localStorage is cleared and player must rejoin

**New Socket Events (Frontend):**
- `player:reconnect` - Attempt to reconnect with existing player ID
- `player:reconnected` - Success confirmation from server
- `player:reconnectFailed` - Server couldn't find player session

### Backend (gameSocket.js)

**Player Tracking:**
- Players now have `isConnected` and `socketId` properties
- On disconnect, players are marked as disconnected (not removed)
- On reconnect, player's `socketId` is updated and `isConnected` set to true

**Reconnection Handler:**
```javascript
socket.on('player:reconnect', ({ gameId, playerId, playerName }) => {
  // Find existing player in game
  const existingPlayer = game.players.find(p => p.id === playerId);
  
  if (existingPlayer) {
    // Update connection status and socket ID
    existingPlayer.isConnected = true;
    existingPlayer.socketId = socket.id;
    
    // Send confirmation and current state
    socket.emit('player:reconnected', { playerId, player: existingPlayer });
    socket.emit('gameState:update', game);
    broadcastGameState(io, gameId);
  } else {
    // Session expired - player must rejoin
    socket.emit('player:reconnectFailed', { reason: 'Player session not found' });
  }
});
```

**Disconnect Handler:**
```javascript
socket.on('disconnect', () => {
  // Mark player as disconnected (don't remove)
  if (currentPlayerId && currentGameId) {
    const game = getGame(currentGameId);
    const player = game.players.find(p => p.id === currentPlayerId);
    
    if (player) {
      player.isConnected = false;
      broadcastGameState(io, currentGameId);
    }
  }
});
```

### UI Updates

**HostView:**
- Players show "(offline)" label when disconnected
- Player cards have reduced opacity when offline
- Status dot shows red indicator when player is disconnected
- Pulsing animation on disconnected status dot

**PlayerView:**
- Shows "Reconnected!" banner for 3 seconds after successful reconnection
- Shows "Connection Lost" warning banner when disconnected
- Connection status tracked in sessionStorage to detect reconnections

## Type Changes

**Player Interface (types.ts):**
```typescript
export interface Player {
  // ... existing fields
  isConnected?: boolean; // Socket connection status
  socketId?: string; // Current socket ID (backend use)
}
```

## Testing

### Manual Test Procedure:

1. **Test Normal Reconnection:**
   - Join as a player
   - Note your player ID in localStorage
   - Refresh the page
   - Verify you reconnect with same score and name
   - Verify "Reconnected!" banner appears

2. **Test Connection Loss:**
   - Join as a player
   - Stop the backend server
   - Verify "Connection Lost" warning appears
   - Restart backend server
   - Verify automatic reconnection occurs

3. **Test Session Expiry:**
   - Join as a player
   - Reset the game (clears all players)
   - Refresh the page
   - Verify reconnection fails gracefully
   - Verify localStorage is cleared
   - Verify player sees join screen

4. **Test Multiple Players:**
   - Open 3 player windows
   - Refresh one player's window
   - Verify only that player reconnects
   - Verify no duplicate entries created

## Edge Cases Handled

1. **Server Restart:** Players are removed from memory. On reconnect, backend sends `player:reconnectFailed` and frontend clears localStorage.

2. **Simultaneous Reconnection:** Multiple players can reconnect simultaneously without conflicts due to unique player IDs.

3. **Network Interruption:** Socket.IO automatically attempts to reconnect. Once reconnected, our `player:reconnect` logic restores the session.

4. **Invalid Session Data:** If localStorage contains invalid/old player ID, backend validates and rejects, prompting fresh join.

5. **Game Reset:** When host resets game, all players are removed. Reconnection attempts fail gracefully.

## Future Improvements

1. **Persistent Storage:** Consider Redis/DB for game state to survive server restarts
2. **Session Timeout:** Auto-remove disconnected players after X minutes
3. **Reconnection Limit:** Limit reconnection attempts to prevent stale sessions
4. **Host Notification:** Alert host when players reconnect/disconnect
5. **Player Removal:** Add host control to manually remove disconnected players

## Known Limitations

- Game state is still in-memory (not persistent across server restarts)
- No automatic cleanup of disconnected players
- No visual distinction between "never connected" and "disconnected" players in game list
- Session data persists forever in localStorage (no expiration)
