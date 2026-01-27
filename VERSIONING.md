# Versioning System Documentation

## Overview

Jeopardy Pro uses an automated versioning system with:
- **Semantic Versioning** (MAJOR.MINOR.PATCH) for releases
- **Git SHA + Branch** for development/test builds
- **Synchronized versions** across root and client package.json files
- **GitHub Actions integration** for automated builds and releases

## Version Format

### Release Builds (Tagged Releases)
- Format: `v2.1.0` (clean semantic version)
- Docker tags: `jeopardy:latest`, `jeopardy:2.1.0`
- Triggered by: Git tags matching `v*.*.*`

### Development Builds (Branches)
- Format: `2.0.0+abc1234.feature-v2-overhaul` (version + build metadata)
- Docker tags: `jeopardy:feature-v2-overhaul-abc1234`, `jeopardy:feature-v2-overhaul-latest`
- Triggered by: Pushes to master, feature/*, develop branches

## Manual Version Management

### Sync Versions
Keep root and client package.json in sync:
```bash
npm run version:sync
```

### Set Development Version (with Git SHA)
```bash
npm run version:dev
```
This creates version like: `2.0.0+abc1234.feature-v2-overhaul`

### Set Specific Version
```bash
npm run version:set 2.1.0
```

### Build with Version
```bash
# Production build (uses current version)
npm run build

# Development build (includes git SHA)
npm run build:dev
```

## GitHub Actions Workflows

### 1. Build Development (`build-dev.yml`)
**Triggers:**
- Push to master, feature/*, develop branches
- Pull requests to master

**Actions:**
- Sets version with git SHA
- Builds frontend
- Runs tests (when implemented)
- Pushes Docker image with branch + SHA tags

**Example Docker tags produced:**
- `jeopardy:feature-v2-overhaul-abc1234`
- `jeopardy:feature-v2-overhaul-latest`

### 2. Release Version (`version-release.yml`)
**Triggers:**
- Git tags matching `v*.*.*` (e.g., `v2.1.0`)

**Actions:**
- Extracts version from tag
- Updates package.json files
- Builds production artifacts
- Creates tarball release
- Pushes Docker images with version tags
- Creates GitHub Release with notes

**Example Docker tags produced:**
- `jeopardy:latest`
- `jeopardy:2.1.0`

### 3. Version Bump (`version-bump.yml`)
**Triggers:**
- Manual workflow dispatch

**Actions:**
- Allows selecting patch/minor/major bump
- Updates version in both package.json files
- Commits changes
- Creates and pushes git tag
- Triggers release workflow automatically

**Usage:**
1. Go to GitHub Actions tab
2. Select "Version Bump" workflow
3. Click "Run workflow"
4. Choose bump type (patch/minor/major)
5. Workflow will commit, tag, and trigger release

## Creating a Release

### Method 1: Manual Tag (Recommended for CI/CD)
```bash
# Ensure you're on the branch you want to release
git checkout master
git pull

# Create and push tag (triggers version-release.yml)
git tag -a v2.1.0 -m "Release v2.1.0"
git push origin v2.1.0
```

### Method 2: GitHub Actions UI (Easiest)
1. Go to repository on GitHub
2. Navigate to Actions tab
3. Select "Version Bump" workflow
4. Click "Run workflow" button
5. Select bump type:
   - **patch**: 2.0.0 → 2.0.1 (bug fixes)
   - **minor**: 2.0.0 → 2.1.0 (new features, backwards compatible)
   - **major**: 2.0.0 → 3.0.0 (breaking changes)
6. Click "Run workflow"
7. Release workflow automatically triggers

## Version Information at Runtime

### Backend (Node.js)
```javascript
const version = require('./server/version');

console.log(version.fullVersion);  // "2.0.0+abc1234.feature-v2-overhaul"
console.log(version.version);      // "2.0.0"
console.log(version.gitSha);       // "abc1234"
console.log(version.gitBranch);    // "feature-v2-overhaul"
console.log(version.buildDate);    // "2026-01-26T10:30:00.000Z"
```

### Frontend (React/TypeScript)
```typescript
import { version } from './utils/version';

console.log(version.fullVersion);  // "2.0.0+abc1234.feature-v2-overhaul"
console.log(version.version);      // "2.0.0"
console.log(version.gitSha);       // "abc1234"
console.log(version.gitBranch);    // "feature-v2-overhaul"
```

### API Endpoint
```bash
curl http://localhost:3000/api/version
```

Response:
```json
{
  "version": "2.0.0",
  "buildMetadata": "+abc1234.feature-v2-overhaul",
  "fullVersion": "2.0.0+abc1234.feature-v2-overhaul",
  "buildDate": "2026-01-26T10:30:00.000Z",
  "gitSha": "abc1234",
  "gitBranch": "feature-v2-overhaul"
}
```

## File Structure

```
/workspaces/jeopardy/
├── scripts/
│   └── sync-version.js          # Version synchronization script
├── server/
│   ├── version.js               # Runtime version accessor
│   └── version.json             # Generated version data
├── client/src/
│   ├── utils/
│   │   └── version.ts           # Frontend version utility
│   ├── version.json             # Generated version data
│   └── package.json             # Client package (synced)
├── package.json                 # Root package (source of truth)
└── .github/workflows/
    ├── build-dev.yml            # Development builds
    ├── version-release.yml      # Release builds
    ├── version-bump.yml         # Automated version bumping
    └── docker-image.yml         # Legacy (deprecated)
```

## Version Synchronization

The `scripts/sync-version.js` ensures:
1. Root package.json version is source of truth
2. Client package.json version stays in sync
3. Version files generated for runtime access
4. Build metadata added for development builds

## Docker Image Tags Strategy

### Development Builds
- `{branch}-{sha}` - Specific commit (e.g., `master-abc1234`)
- `{branch}-latest` - Latest on branch (e.g., `master-latest`)

### Release Builds
- `latest` - Latest stable release
- `{version}` - Specific version (e.g., `2.1.0`)

## Best Practices

1. **Never manually edit version numbers** - Use npm scripts or GitHub Actions
2. **Always sync before building** - Scripts handle this automatically
3. **Use semantic versioning** - Follow MAJOR.MINOR.PATCH convention
4. **Tag releases properly** - Use `v` prefix (e.g., `v2.1.0`)
5. **Keep package.json files in sync** - Use `npm run version:sync` if manual changes needed

## Troubleshooting

### Versions out of sync
```bash
npm run version:sync
```

### Version file missing
```bash
npm run version:sync  # Regenerates version.json files
```

### GitHub Actions failing
- Verify Docker Hub credentials in repository secrets:
  - `DOCKERHUB_USERNAME`
  - `DOCKERHUB_TOKEN`
- Ensure `GITHUB_TOKEN` has write permissions (usually automatic)

### Manual recovery
If version.json files are missing or corrupted:
```bash
node scripts/sync-version.js --git-sha
```

## Environment Variables

None required! Version information is embedded during build.

Optional for Docker builds:
- `VERSION` - Build arg for version override

## Migration Notes

- Old workflow (`docker-image.yml`) deprecated
- All new builds use `build-dev.yml` or `version-release.yml`
- Version files (`version.json`) are git-ignored (generated at build time)
- Client and root package.json must stay synchronized
