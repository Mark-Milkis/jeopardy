# Legacy AngularJS Application (Archived)

This directory contains the original AngularJS (v1.x) frontend implementation of Jeopardy Pro, archived on January 21, 2026.

## ⚠️ Status: DEPRECATED

This code is **no longer actively maintained** and should not be used for new development. It is preserved here for reference purposes only.

## What's Archived

### Frontend (AngularJS)
- **js/** - Angular controllers, directives, services, filters
  - `app.js` - Angular module definition and routing
  - `controllers.js` - Main controller logic
  - `services.js` - Angular services
  - `directives.js` - Custom directives
  - `filters.js` - Custom filters
  - `controllers/` - Individual route controllers
    - `board.js` - Game board view controller
    - `boardclue.js` - Board clue controller
    - `game.js` - Player game view controller
    - `gameclue.js` - Game clue controller
    - `editor.js` - Game editor controller

### Views (Jade Templates)
- **views/** - Jade/Pug template files
  - `layout.jade` - Base layout template
  - `index.jade` - Main index page
  - `partials/` - Angular route partials
    - `board.jade` - Game board template
    - `boardclue.jade` - Board clue template
    - `game.jade` - Player game template
    - `gameclue.jade` - Game clue template
    - `editor.jade` - Game editor template
    - `seasons.jade` - Season selection template
    - `season.jade` - Individual season template

### Backend (Deprecated)
- **socket.js.deprecated** - Original Socket.IO handler (pre-v2)
  - Fixed 6-player architecture
  - Legacy event structure
  - Replaced by `server/sockets/gameSocket.js` in v2
- **routes-index.js.deprecated** - Legacy route handlers
  - Jade template rendering for AngularJS views
  - Served partials for Angular routing
  - Replaced by React SPA routing in v2

### Styling
- **css/** - Original stylesheets
  - `app.css` - Main application styles

### Dependencies (Deprecated Package Managers)
- **bower_components/** - Legacy Bower frontend dependencies
- **bower.json** - Bower package configuration
- **.bowerrc** - Bower directory settings
- **.yarnrc** - Yarn v1 configuration
- **yarn.lock** - Yarn dependency lock file
- **.yarn/** - Yarn release cache

### Dependencies
- **bower_components/** - Bower-managed dependencies (if present)
- **bower.json** - Bower configuration

## Why Archived?

The application was modernized with:
- **React 18 + TypeScript** instead of AngularJS 1.x
- **Vite** instead of Bower/manual bundling
- **Socket.IO v2 architecture** with room-based games
- **Type safety** via TypeScript
- **Modern React patterns** (hooks, context, functional components)

## Accessing the New Version

The current active codebase is located in:
- **Frontend**: `/client/src/` - React + TypeScript app
- **Backend**: `/server/sockets/gameSocket.js` - Modern Socket.IO handler
- **Documentation**: See root-level markdown files

To run the new version:
```bash
# Backend
node app.js

# Frontend
cd client/src
npm run dev
```

## Reference Usage

This archived code may be useful for:
- Understanding original game logic
- Referencing UI/UX design decisions
- Porting missing features to v2
- Historical documentation

## Key Differences: Legacy vs v2

| Feature | Legacy (AngularJS) | v2 (React) |
|---------|-------------------|------------|
| Framework | AngularJS 1.4 | React 18 + TypeScript |
| Routing | Angular UI Router | React Router (hash-based) |
| State | $scope, services | React Context + Socket.IO |
| Socket.IO | Fixed 6 players | Dynamic room-based |
| Build | Bower + manual | Vite |
| Templates | Jade/Pug | JSX/TSX |
| Styling | CSS | Inline (Tailwind-ready) |
| Types | None | Full TypeScript |

## Migration Notes

If you need to reference logic from the legacy app:

1. **Controllers → React Components**
   - `js/controllers/board.js` → `client/src/components/BoardView.tsx`
   - `js/controllers/game.js` → `client/src/components/PlayerView.tsx`
   - `js/controllers/boardclue.js` → Integrated into BoardView

2. **Services → Context**
   - `js/services.js` → `client/src/services/gameService.tsx`

3. **Socket Events → v2 Events**
   - `socket.js.deprecated` → `server/sockets/gameSocket.js`
   - See `/README_SOCKETS.md` for new event structure

## Technical Debt Removed

- ✅ Fixed 6-player limit
- ✅ Hard-coded player names (`player_1`, `player_2`, etc.)
- ✅ No multi-game support
- ✅ Complex $scope watchers
- ✅ Bower dependency management
- ✅ Mixed server/client routing
- ✅ No type safety

## Original Dependencies

```json
{
  "angular": "1.4.14",
  "angular-bootstrap": "~0.13.3",
  "angular-sanitize": "~1.4.4",
  "angular-socket-io": "~0.7.0",
  "angular-ui-router": "~0.2.15",
  "bootstrap": "~3.3.5",
  "jquery": "1.9.1 - 3"
}
```

## License & Attribution

Original code written for Jeopardy! practice sessions. Not affiliated with Jeopardy! or Sony Pictures Entertainment.

## Last Known Working State

- **Date Archived**: January 21, 2026
- **Last Active**: Pre-v2 overhaul
- **Node Version**: Compatible with Node 12-14
- **Dependencies**: See bower.json

---

**Do not modify files in this directory.** For new development, work in the main codebase (`/client/src/` and `/server/`).

See the main [README.md](../README.md) for the current project status.
