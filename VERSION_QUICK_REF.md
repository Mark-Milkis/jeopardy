# Version System Quick Reference

## Common Commands

```bash
# Sync versions (production)
npm run version:sync

# Set development version with git SHA
npm run version:dev

# Set specific version
npm run version:set 2.1.0

# Build with current version
npm run build

# Build with development version
npm run build:dev
```

## Release a New Version

### Quick Release (GitHub UI)
1. Go to GitHub Actions tab
2. Run "Version Bump" workflow
3. Select patch/minor/major
4. Done! ✅

### Manual Release
```bash
git tag -a v2.1.0 -m "Release v2.1.0"
git push origin v2.1.0
```

## Check Version

### In Code (Backend)
```javascript
const version = require('./server/version');
console.log(version.fullVersion);
```

### In Code (Frontend)
```typescript
import { version } from './utils/version';
console.log(version.fullVersion);
```

### API
```bash
curl http://localhost:3000/api/version
```

## Docker Tags

### Development
- `jeopardy:master-abc1234` (specific commit)
- `jeopardy:master-latest` (latest on master)
- `jeopardy:feature-xyz-abc1234` (feature branch)

### Release
- `jeopardy:latest` (latest release)
- `jeopardy:2.1.0` (specific version)

## Files Changed by Version Scripts

- `package.json` (root)
- `client/src/package.json`
- `server/version.json` (generated)
- `client/src/version.json` (generated)

## Semantic Versioning Guide

- **Patch** (2.0.0 → 2.0.1): Bug fixes, no breaking changes
- **Minor** (2.0.0 → 2.1.0): New features, backwards compatible
- **Major** (2.0.0 → 3.0.0): Breaking changes

## Troubleshooting

**Versions out of sync?**
```bash
npm run version:sync
```

**Missing version.json?**
```bash
npm run version:dev
```

**Need to reset?**
```bash
npm run version:set 2.0.0
```
