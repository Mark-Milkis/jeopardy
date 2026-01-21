# 📁 Legacy Code Archive Notice

## What Was Archived

The following legacy AngularJS code has been moved to `/legacy-angular/` directory:

### Moved Files/Directories:
- ✅ `public/js/` → `legacy-angular/js/` (Angular controllers, services, directives)
- ✅ `public/css/` → `legacy-angular/css/` (Legacy stylesheets)
- ✅ `views/` → `legacy-angular/views/` (Jade templates)
- ✅ `routes/socket.js` → `legacy-angular/socket.js.deprecated` (Old socket handler)
- ✅ `routes/index.js` → `legacy-angular/routes-index.js.deprecated` (Jade template routes)
- ✅ `public/bower_components/` → `legacy-angular/bower_components/` (Angular dependencies)
- ✅ `bower.json` → `legacy-angular/bower.json` (Bower config)

### Why Archived?

To avoid confusion between the old AngularJS app and the new React v2 app. The legacy code is preserved for reference but is no longer actively used.

### What Remains Active:

**Backend:**
- `app.js` - Express server entry point (updated for v2, Jade views disabled)
- `server/routes/api.js` - J! Archive scraping API (ACTIVE)
- `server/routes/proxy.js` - Media proxy (ACTIVE)
- `server/routes/index.js` - Root route handlers
- `server/sockets/gameSocket.js` - Socket.IO v2 handler (ACTIVE)

**Frontend (React v2):**
- `client/src/` - Complete React + TypeScript application
- `public/socket-test.html` - Socket.IO test page

**Documentation:**
- All root-level markdown files (README_SOCKETS.md, etc.)
- `legacy-angular/README.md` - Archive documentation

### Using the New App

**Start Backend:**
```bash
node app.js
# Runs on http://localhost:3000
```

**Start Frontend:**
```bash
cd client/src
npm run dev
# Runs on http://localhost:5173
```

**Access:**
- React App: http://localhost:5173/#/host (or /play, /board, /dev)
- Test Page: http://localhost:3000/socket-test.html
- Legacy (reference only): See `/legacy-angular/`

### Migration Complete

✅ Old Angular code safely archived
✅ New React app is the primary codebase
✅ No breaking changes to active functionality
✅ Backend routes preserved for compatibility
✅ Documentation updated

### Need Legacy Code?

See [legacy-angular/README.md](legacy-angular/README.md) for:
- What's archived
- Original architecture
- Reference usage
- Migration notes

---

**Date Archived**: January 21, 2026
**Archived By**: Automated during v2 Socket.IO implementation
