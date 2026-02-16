# Versioning Workflows Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Jeopardy Pro Versioning                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        Package Files                             │
├─────────────────────────────────────────────────────────────────┤
│  package.json (root)          ←→  client/src/package.json       │
│  version: "2.0.0"                  version: "2.0.0"              │
│                                                                   │
│  Synchronized by: scripts/sync-version.js                        │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Generated Files                              │
├─────────────────────────────────────────────────────────────────┤
│  server/version.json          client/src/version.json            │
│  {                            {                                  │
│    "version": "2.0.0",          "version": "2.0.0",              │
│    "fullVersion": "...",        "fullVersion": "...",            │
│    "gitSha": "abc1234",         "gitSha": "abc1234",             │
│    "gitBranch": "...",          "gitBranch": "...",              │
│    "buildDate": "..."           "buildDate": "..."               │
│  }                            }                                  │
│                                                                   │
│  ⚠️  Git-ignored (generated at build time)                       │
└─────────────────────────────────────────────────────────────────┘
```

## Workflow 1: Development Push

```
Developer pushes to feature branch
         ↓
┌─────────────────────────────────────┐
│  GitHub Actions: build-dev.yml      │
├─────────────────────────────────────┤
│  1. Checkout code                   │
│  2. Run: npm run version:dev        │
│     → Sets: 2.0.0+abc1234.feature   │
│  3. Install dependencies            │
│  4. Build frontend                  │
│  5. Run tests                       │
│  6. Build Docker image              │
│  7. Push to Docker Hub              │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  Docker Hub                          │
├─────────────────────────────────────┤
│  jeopardy:feature-xyz-abc1234       │
│  jeopardy:feature-xyz-latest        │
└─────────────────────────────────────┘
```

## Workflow 2: Release (Automated)

```
Developer runs "Version Bump" workflow (or manual tag)
         ↓
┌─────────────────────────────────────┐
│  GitHub Actions: version-bump.yml   │
├─────────────────────────────────────┤
│  1. Bump version (patch/minor/major)│
│     2.0.0 → 2.1.0                   │
│  2. Run: npm run version:set 2.1.0  │
│  3. Commit changes                  │
│  4. Create tag: v2.1.0              │
│  5. Push tag                        │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  GitHub Actions: version-release.yml│
├─────────────────────────────────────┤
│  1. Triggered by tag: v2.1.0        │
│  2. Extract version from tag        │
│  3. Update package.json files       │
│  4. Build frontend                  │
│  5. Create release tarball          │
│  6. Build Docker image              │
│  7. Push to Docker Hub              │
│  8. Create GitHub Release           │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  Outputs                             │
├─────────────────────────────────────┤
│  Docker Hub:                         │
│    jeopardy:latest                  │
│    jeopardy:2.1.0                   │
│                                      │
│  GitHub Releases:                    │
│    Release v2.1.0                   │
│    jeopardy-v2.1.0.tar.gz       │
└─────────────────────────────────────┘
```

## Workflow 3: Manual Version Management

```
┌─────────────────────────────────────┐
│  Developer Local Machine             │
├─────────────────────────────────────┤
│                                      │
│  npm run version:sync               │
│    → Syncs current versions         │
│                                      │
│  npm run version:dev                │
│    → Sets: 2.0.0+abc1234.branch     │
│                                      │
│  npm run version:set 2.1.0          │
│    → Sets: 2.1.0 (both files)       │
│                                      │
│  npm run build                      │
│    → Builds with current version    │
│                                      │
│  npm run build:dev                  │
│    → Builds with dev version        │
└─────────────────────────────────────┘
```

## Version Access Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Runtime Access                                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Backend (Node.js)                Frontend (React)           │
│  ─────────────────                ─────────────────          │
│  const v = require('./version')  import { version }          │
│  v.fullVersion                   version.fullVersion         │
│                                                               │
│                      HTTP API                                │
│                  ────────────────                            │
│                  GET /api/version                            │
│                  Returns JSON                                │
│                                                               │
│                   UI Component                               │
│                  ────────────────                            │
│                  <VersionBadge />                            │
│                  Displays version                            │
└─────────────────────────────────────────────────────────────┘
```

## Docker Tag Strategy

```
Development Builds:
┌────────────────────────────────────────┐
│ Branch: master                          │
│ SHA: abc1234                           │
│                                         │
│ Tags:                                   │
│   jeopardy:master-abc1234              │
│   jeopardy:master-latest               │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Branch: feature/new-ui                  │
│ SHA: def5678                           │
│                                         │
│ Tags:                                   │
│   jeopardy:feature-new-ui-def5678      │
│   jeopardy:feature-new-ui-latest       │
└────────────────────────────────────────┘

Release Builds:
┌────────────────────────────────────────┐
│ Tag: v2.1.0                            │
│                                         │
│ Tags:                                   │
│   jeopardy:2.1.0                       │
│   jeopardy:latest (updated)            │
└────────────────────────────────────────┘
```

## File Synchronization

```
┌────────────────────┐
│  scripts/          │
│  sync-version.js   │
└────────────────────┘
         ↓
    Ensures sync
         ↓
┌────────────────────┬────────────────────┐
│  Root              │  Client            │
│  package.json      │  package.json      │
│  version: "2.0.0"  │  version: "2.0.0"  │
└────────────────────┴────────────────────┘
         ↓                     ↓
    Generates             Generates
         ↓                     ↓
┌────────────────────┬────────────────────┐
│  server/           │  client/src/       │
│  version.json      │  version.json      │
│  (full info)       │  (full info)       │
└────────────────────┴────────────────────┘
         ↓                     ↓
    Consumed by          Consumed by
         ↓                     ↓
┌────────────────────┬────────────────────┐
│  server/           │  client/src/       │
│  version.js        │  utils/version.ts  │
│  (accessor)        │  (accessor)        │
└────────────────────┴────────────────────┘
```

## Version Format Examples

```
Production Release:
  package.json version:     "2.1.0"
  buildMetadata:            ""
  fullVersion:              "2.1.0"
  gitSha:                   "abc1234"
  gitBranch:                "master"

Development Build:
  package.json version:     "2.0.0"
  buildMetadata:            "+abc1234.feature-v2-overhaul"
  fullVersion:              "2.0.0+abc1234.feature-v2-overhaul"
  gitSha:                   "abc1234"
  gitBranch:                "feature/v2-overhaul"
```

## Quick Decision Tree

```
Need to...

┌─────────────────────────────────────────────────┐
│ Create a release?                                │
├─────────────────────────────────────────────────┤
│ → GitHub Actions → Version Bump workflow        │
│   OR                                             │
│ → git tag -a v2.1.0 -m "..." && git push        │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Build for development/testing?                   │
├─────────────────────────────────────────────────┤
│ → git push (auto-builds with git SHA)          │
│   OR                                             │
│ → npm run build:dev (local build)              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Check current version?                           │
├─────────────────────────────────────────────────┤
│ → cat package.json | grep version              │
│   OR                                             │
│ → curl http://localhost:3000/api/version       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Versions out of sync?                            │
├─────────────────────────────────────────────────┤
│ → npm run version:sync                          │
└─────────────────────────────────────────────────┘
```
