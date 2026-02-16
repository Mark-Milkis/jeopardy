# 📂 Project Structure

Following industry-standard organization for a full-stack Node.js + React application.

## Root Directory

```
jeopardy/
├── package.json                    # Project dependencies & scripts
├── README.md                       # Main documentation
├── Dockerfile                      # Container configuration
│
├── server/                         # Backend code (Node.js/Express)
│   ├── index.js                    # Express server entry point
│   ├── routes/                     # API routes & handlers
│   │   ├── api.js                  # J! Archive scraping API
│   │   ├── proxy.js                # Media proxy
│   │   └── index.js                # Root route handlers
│   ├── sockets/                    # Socket.IO handlers
│   │   └── gameSocket.js           # Real-time game state management
│   ├── controllers/                # Business logic controllers
│   └── utils/                      # Shared utilities
│
├── client/                         # Frontend code (React/TypeScript)
│   └── src/
│       ├── App.tsx                 # React Router entry point
│       ├── index.tsx               # React mount point
│       ├── types.ts                # TypeScript type definitions
│       ├── package.json            # Frontend dependencies
│       ├── vite.config.ts          # Build configuration
│       ├── .env                    # Environment variables
│       ├── components/             # React components
│       │   ├── BoardView.tsx       # Game board display
│       │   ├── PlayerView.tsx      # Player interface
│       │   ├── HostView.tsx        # Host controls
│       │   └── DeveloperView.tsx   # Dev/test interface
│       └── services/
│           └── gameService.tsx     # Socket.IO + state management
│
├── games/                          # Game data (JSON files)
│   └── 00test.json
│
├── public/                         # Static assets
│   └── socket-test.html            # Socket.IO test page
│
├── legacy-angular/                 # ARCHIVED - Reference only
│   ├── README.md                   # Archive documentation
│   ├── js/                         # Old Angular code
│   ├── views/                      # Old Jade templates
│   ├── css/                        # Old styles
│   ├── socket.js.deprecated        # Old socket handler
│   └── routes-index.js.deprecated  # Old route handlers
│
└── docs/                           # Documentation
    ├── README.md                   # Main project README
    ├── README_SOCKETS.md           # Socket.IO documentation
    ├── ARCHITECTURE.md             # System architecture
    ├── QUICK_REFERENCE.md          # Command reference
    └── ...
```

## Backend Structure (`/server/`)

### `/server/routes/` - Route Handlers
- **api.js** - J! Archive scraping endpoints
  - `GET /api/seasons` - List available seasons
  - `GET /api/seasons/:id` - Get season details
  - `GET /api/games/:id` - Get game data
  - `POST /api/games` - Save custom game
  - `DELETE /api/games/:id` - Delete game
- **proxy.js** - Media proxy for J! Archive assets
  - `GET /media/*` - Proxy external media
- **index.js** - Root handlers
  - `GET /` - Info page pointing to React app
  - `GET /partials/:name` - Legacy stub (404)

### `/server/sockets/` - Socket.IO Handlers
- **gameSocket.js** - Real-time game management
  - Room-based game isolation
  - Player/host event handlers
  - State broadcasting
  - Buzzer timing logic

### `/server/controllers/` - Business Logic
- (Expandable) - Separate business logic from routes
- Example: Game validation, scoring calculations, etc.

### `/server/utils/` - Shared Utilities
- (Expandable) - Helper functions
- Example: Data formatters, validators, etc.

## Frontend Structure (`/client/src/`)

### Root Files
- **App.tsx** - Main React component with routing
- **index.tsx** - React DOM entry point
- **types.ts** - Shared TypeScript interfaces/enums
- **vite.config.ts** - Build configuration
- **.env** - Environment variables (Socket.IO URL)

### `/components/` - React Components
- **BoardView.tsx** - Game board display (TV/projector)
- **PlayerView.tsx** - Player buzzer interface
- **HostView.tsx** - Host control panel
- **DeveloperView.tsx** - All-in-one test view

### `/services/` - Business Logic
- **gameService.tsx** - React Context for game state
  - Socket.IO client integration
  - Real-time state synchronization
  - Action methods (joinGame, buzz, etc.)

## Industry Standards Applied

### ✅ Backend Organization
- **Separation of concerns**: Routes, controllers, sockets, utils in separate directories
- **Modular structure**: Each module in its own file
- **Clear naming**: Descriptive file and folder names
- **Scalability**: Easy to add new routes, controllers, or utilities

### ✅ Frontend Organization
- **Component-based**: React components in `/components/`
- **Type safety**: TypeScript with centralized types
- **State management**: Context API in `/services/`
- **Build tooling**: Modern Vite build system
- **Environment config**: `.env` for configuration

### ✅ Full-Stack Standards
- **Monorepo structure**: Frontend and backend in one repository
- **Clear separation**: `server/` vs `client/` directories
- **Documentation**: Comprehensive docs at root level
- **Legacy isolation**: Old code in `/legacy-angular/`
- **Static assets**: Public files in `/public/`

## Navigation Guide

### Starting Development

**Backend (from root):**
```bash
node app.js
# Server runs on http://localhost:3000
```

**Frontend (from root):**
```bash
cd client/src
npm run dev
# Dev server runs on http://localhost:5173
```

### Adding New Features

**New API Endpoint:**
1. Add route handler in `server/routes/api.js`
2. (Optional) Extract logic to `server/controllers/`
3. Update API documentation

**New Socket Event:**
1. Add event handler in `server/sockets/gameSocket.js`
2. Add client emit in `client/src/services/gameService.tsx`
3. Update [README_SOCKETS.md](README_SOCKETS.md)

**New React Component:**
1. Create `.tsx` file in `client/src/components/`
2. Import in `App.tsx` for routing
3. Use `useGame()` hook for state access

**New Business Logic:**
1. Create controller in `server/controllers/`
2. Import in route handlers
3. Keep routes thin, logic in controllers

### File Locations Quick Reference

| What | Where |
|------|-------|
| Express setup | `/server/index.js` |
| API routes | `/server/routes/api.js` |
| Socket.IO logic | `/server/sockets/gameSocket.js` |
| React components | `/client/src/components/` |
| Game state | `/client/src/services/gameService.tsx` |
| Type definitions | `/client/src/types.ts` |
| Static files | `/public/` |
| Game data | `/games/` |
| Tests | `/client/src/__tests__/` (future) |
| Docs | Root level `.md` files |

## Comparison: Before vs After

### Before (Mixed Structure)
```
jeopardy/
├── routes/           # Routes mixed with server logic
├── public/js/        # Old Angular code
├── public/css/       # Old styles
├── views/            # Old templates
└── server/           # Incomplete server structure
```

### After (Industry Standard)
```
jeopardy/
├── server/           # All backend code organized
│   ├── routes/       # API routes
│   ├── sockets/      # WebSocket handlers
│   ├── controllers/  # Business logic
│   └── utils/        # Utilities
├── client/src/       # All frontend code organized
│   ├── components/   # React components
│   └── services/     # State management
└── legacy-angular/   # Old code archived
```

## Benefits of Current Structure

1. **Clear separation**: Backend vs Frontend vs Legacy vs Docs
2. **Scalable**: Easy to add new routes, controllers, components
3. **Maintainable**: Logical organization, easy to find files
4. **Standard**: Follows Node.js + React best practices
5. **Team-friendly**: New developers can navigate easily
6. **CI/CD ready**: Clear build targets (server vs client)

## Future Expansion

As the project grows, consider:

### Backend
- **`/server/middleware/`** - Custom Express middleware
- **`/server/models/`** - Database models (if adding DB)
- **`/server/services/`** - External service integrations
- **`/server/config/`** - Configuration files
- **`/server/__tests__/`** - Backend tests

### Frontend
- **`/client/src/hooks/`** - Custom React hooks
- **`/client/src/context/`** - Additional context providers
- **`/client/src/utils/`** - Frontend utilities
- **`/client/src/__tests__/`** - Frontend tests
- **`/client/src/assets/`** - Images, fonts, etc.

### Root Level
- **`/scripts/`** - Build/deployment scripts
- **`/config/`** - Environment configs
- **`/.github/workflows/`** - CI/CD pipelines
- **`/docs/api/`** - API documentation

---

**Last Updated**: January 21, 2026  
**Structure Version**: v2.0 (Industry Standard)
