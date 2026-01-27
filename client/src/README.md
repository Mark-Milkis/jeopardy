<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Jeopardy Pro v2 - React Frontend

Modern React + TypeScript frontend for Jeopardy Pro with real-time Socket.IO integration.

## Quick Start

**Prerequisites:** Node.js 18+, Backend server running on port 3000

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open browser to the URL shown (typically http://localhost:5173)

## Application Routes

- **`/#/board`** - Game board display (for projection/TV)
- **`/#/play`** - Player buzzer interface
- **`/#/host`** - Host control panel
- **`/#/dev`** - Developer view (all interfaces in one window)

## Socket.IO Integration

This frontend connects to the backend Socket.IO server for real-time game state synchronization. See [../../README_SOCKETS.md](../../README_SOCKETS.md) for detailed documentation.

**Connection Status:**
Check the browser console for `Connected to Socket.IO server` message.

## Development

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```
