# Docker Guide for Jeopardy Pro

## Quick Start

### Production Build
```bash
# Build and run
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

### Development Build (with hot reload)
```bash
# Build and run dev version
docker compose --profile dev up jeopardy-dev

# Or using Dockerfile.dev directly
docker build -f Dockerfile.dev -t jeopardy:dev .
docker run -p 3000:3000 -p 5173:5173 jeopardy:dev
```

## Dockerfile Architecture

### Multi-Stage Production Build

The production `Dockerfile` uses a multi-stage build for optimal image size:

```
Stage 1: frontend-builder (node:18-alpine)
  ├─ Install client dependencies
  ├─ Build React app with Vite
  └─ Output: dist/ directory

Stage 2: final image (node:18-alpine)
  ├─ Install backend dependencies
  ├─ Copy backend source
  ├─ Generate version information
  ├─ Copy built frontend from Stage 1
  └─ Configure non-root user & healthcheck
```

### Key Features

1. **Optimized Caching**: Package files copied first for better layer caching
2. **Production Dependencies Only**: Uses `npm ci --only=production`
3. **Non-Root User**: Runs as `nodejs` user (UID 1001) for security
4. **Health Check**: Built-in health check on `/health` endpoint
5. **Signal Handling**: Uses `dumb-init` for proper signal forwarding
6. **Small Image Size**: Alpine Linux base (~150MB final image)

## Build Commands

### Production Build
```bash
# Standard build
docker build -t jeopardy:latest .

# With version tag
docker build -t jeopardy:2.0.0 .

# With build args (used by CI/CD)
docker build --build-arg VERSION=2.1.0 -t jeopardy:2.1.0 .
```

### Development Build
```bash
docker build -f Dockerfile.dev -t jeopardy:dev .
```

### Multi-Platform Build (for CI/CD)
```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t youruser/jeopardy:latest \
  --push \
  .
```

## Run Commands

### Simple Run
```bash
docker run -p 3000:3000 jeopardy:latest
```

### With Custom Games Persistence
```bash
docker run -p 3000:3000 \
  -v $(pwd)/games:/usr/src/app/games \
  jeopardy:latest
```

### With Environment Variables
```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  jeopardy:latest
```

### Development with Hot Reload
```bash
docker run -p 3000:3000 -p 5173:5173 \
  -v $(pwd)/server:/usr/src/app/server \
  -v $(pwd)/client/src:/usr/src/app/client/src \
  jeopardy:dev
```

## Docker Compose

### Production
```bash
# Start
docker compose up -d

# View logs
docker compose logs -f jeopardy

# Restart
docker compose restart jeopardy

# Stop
docker compose down

# Rebuild and start
docker compose up -d --build
```

### Development
```bash
# Start dev version with hot reload
docker compose --profile dev up jeopardy-dev

# View logs
docker compose --profile dev logs -f jeopardy-dev

# Stop
docker compose --profile dev down
```

## Accessing the Application

Once running, access:
- **Frontend/Board**: http://localhost:3000
- **API**: http://localhost:3000/api/version
- **Health Check**: http://localhost:3000/health

Routes (hash-based):
- Board View: http://localhost:3000/#/board
- Player View: http://localhost:3000/#/play
- Host View: http://localhost:3000/#/host
- Developer View: http://localhost:3000/#/dev
- Game Browser: http://localhost:3000/#/seasons

## Image Tags Strategy

### Production Images (from GitHub Actions)
- `jeopardy:latest` - Latest stable release
- `jeopardy:2.1.0` - Specific version
- `jeopardy:2.0.0` - Previous versions

### Development Images (from GitHub Actions)
- `jeopardy:master-abc1234` - Master branch at commit abc1234
- `jeopardy:master-latest` - Latest master commit
- `jeopardy:feature-xyz-abc1234` - Feature branch
- `jeopardy:feature-xyz-latest` - Latest on feature branch

## Volume Mounts

### Custom Games Persistence
```yaml
volumes:
  - ./games:/usr/src/app/games
```
Persists custom game files outside container.

### Development Source Code
```yaml
volumes:
  - ./server:/usr/src/app/server
  - ./client/src:/usr/src/app/client/src
```
Enables hot reload during development.

### Node Modules (Dev Only)
```yaml
volumes:
  - /usr/src/app/node_modules
  - /usr/src/app/client/src/node_modules
```
Prevents host node_modules from overwriting container's.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node environment |
| `PORT` | `3000` | Server port |

## Health Checks

The container includes a health check that:
- Runs every 30 seconds
- Hits `GET /health` endpoint
- Times out after 3 seconds
- Retries 3 times before marking unhealthy
- Starts checking 5-10 seconds after container start

View health status:
```bash
docker ps
# Look for "healthy" in STATUS column

docker inspect jeopardy | jq '.[0].State.Health'
```

## Troubleshooting

### Container Won't Start
```bash
# View logs
docker logs jeopardy

# Check container status
docker ps -a
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Use different port
docker run -p 8080:3000 jeopardy:latest
```

### Permission Issues
```bash
# Container runs as UID 1001
# Ensure games/ directory has proper permissions
chmod -R 755 games/
```

### Build Failures
```bash
# Clear build cache
docker builder prune

# Build with no cache
docker build --no-cache -t jeopardy:latest .
```

### Version Info Not Showing
```bash
# Version is generated at build time
# Rebuild image to update version
docker build -t jeopardy:latest .

# Check version inside container
docker run --rm jeopardy:latest cat server/version.json
```

## CI/CD Integration

The Dockerfile is designed to work with GitHub Actions:

### Build Dev Workflow
```yaml
- name: Build Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    file: ./Dockerfile
    push: true
    tags: jeopardy:${{ steps.meta.outputs.branch }}-${{ steps.meta.outputs.sha }}
```

### Release Workflow
```yaml
- name: Build Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    file: ./Dockerfile
    push: true
    tags: |
      jeopardy:latest
      jeopardy:${{ steps.extract_version.outputs.version }}
```

See [.github/workflows/build-dev.yml](.github/workflows/build-dev.yml) and [.github/workflows/version-release.yml](.github/workflows/version-release.yml) for full CI/CD configuration.

## Image Size

Optimized build sizes:
- **Production**: ~150MB (Alpine + Node 18 + dependencies + built app)
- **Development**: ~350MB (includes dev dependencies)

Compare with previous version: ~450MB

## Security

- ✅ Runs as non-root user (`nodejs:1001`)
- ✅ Only production dependencies included
- ✅ No unnecessary tools in final image
- ✅ Regular base image updates (Node 18 Alpine)
- ✅ Health checks for monitoring
- ✅ Proper signal handling with dumb-init

## Best Practices

1. **Use specific tags**: `jeopardy:2.1.0` instead of `:latest` for production
2. **Pin base image versions**: Already done (node:18-alpine)
3. **Scan images**: Use `docker scan jeopardy:latest`
4. **Update regularly**: Rebuild images when base image updates
5. **Use docker-compose**: Easier management than raw docker commands
6. **Persist data**: Mount `./games` volume for custom games

## Additional Commands

### Shell Access
```bash
# Production container
docker exec -it jeopardy sh

# Check files
docker exec jeopardy ls -la /usr/src/app

# View version
docker exec jeopardy cat server/version.json
```

### Cleanup
```bash
# Remove stopped containers
docker compose down

# Remove images
docker rmi jeopardy:latest

# Clean all unused resources
docker system prune -a
```

### Export/Import
```bash
# Save image to tar
docker save jeopardy:latest | gzip > jeopardy.tar.gz

# Load image from tar
gunzip -c jeopardy.tar.gz | docker load
```

## Production Deployment

For production deployment, consider:

1. **Reverse Proxy**: Use nginx/Caddy in front of the container
2. **HTTPS**: Terminate SSL at reverse proxy
3. **Logging**: Configure log drivers
4. **Monitoring**: Use health checks with orchestration platform
5. **Updates**: Use CI/CD to deploy new versions automatically
6. **Backup**: Regularly backup `./games` directory

Example nginx config:
```nginx
server {
    listen 80;
    server_name jeopardy.example.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

For more information, see:
- [VERSIONING.md](VERSIONING.md) - Version management
- [README.md](README.md) - Application overview
- [README_SOCKETS.md](README_SOCKETS.md) - Socket.IO API
