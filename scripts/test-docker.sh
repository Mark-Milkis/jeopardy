#!/bin/bash
# Docker Build Test Script
# Tests the Docker build and verifies the image

set -e

echo "🐳 Testing Docker Build for Jeopardy Pro"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function
test_step() {
    local description=$1
    echo -n "$description... "
}

pass() {
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
}

fail() {
    local msg=${1:-""}
    echo -e "${RED}✗ FAIL${NC} $msg"
    ((TESTS_FAILED++))
}

info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Test 1: Build the image
test_step "Building Docker image"
if docker build -t jeopardy:test . > /tmp/docker-build.log 2>&1; then
    pass
else
    fail "(see /tmp/docker-build.log)"
    echo "Build failed. Last 20 lines:"
    tail -20 /tmp/docker-build.log
    exit 1
fi

# Test 2: Check image size
test_step "Checking image size"
SIZE=$(docker images jeopardy:test --format "{{.Size}}")
echo -e "${GREEN}✓${NC} Size: $SIZE"
((TESTS_PASSED++))

# Test 3: Check version file exists
test_step "Checking version file in image"
if docker run --rm jeopardy:test test -f server/version.json; then
    pass
else
    fail
fi

# Test 4: Check frontend was built
test_step "Checking frontend build output"
if docker run --rm jeopardy:test test -f public/index.html; then
    pass
else
    fail
fi

# Test 5: Check assets directory
test_step "Checking frontend assets"
if docker run --rm jeopardy:test test -d public/assets; then
    pass
else
    fail
fi

# Test 6: Check server files
test_step "Checking server files"
if docker run --rm jeopardy:test test -f server/index.js; then
    pass
else
    fail
fi

# Test 7: Check non-root user
test_step "Checking container runs as non-root"
USER=$(docker run --rm jeopardy:test whoami)
if [ "$USER" = "nodejs" ]; then
    pass
else
    fail "(running as $USER)"
fi

# Test 8: Start container and check health
test_step "Starting container"
CONTAINER_ID=$(docker run -d -p 3001:3000 jeopardy:test)
if [ -n "$CONTAINER_ID" ]; then
    pass
    info "Container ID: ${CONTAINER_ID:0:12}"
else
    fail
fi

# Wait for startup
sleep 3

# Test 9: Check if server is responding
test_step "Checking server health endpoint"
if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
    pass
else
    fail
fi

# Test 10: Check version endpoint
test_step "Checking version API endpoint"
VERSION_RESPONSE=$(curl -sf http://localhost:3001/api/version 2>/dev/null)
if [ -n "$VERSION_RESPONSE" ]; then
    pass
    info "Version: $(echo $VERSION_RESPONSE | jq -r '.fullVersion' 2>/dev/null || echo 'unknown')"
else
    fail
fi

# Test 11: Check frontend is served
test_step "Checking frontend is served"
if curl -sf http://localhost:3001/ | grep -q "<!DOCTYPE html>"; then
    pass
else
    fail
fi

# Cleanup
echo ""
echo "Cleaning up..."
docker stop $CONTAINER_ID > /dev/null 2>&1
docker rm $CONTAINER_ID > /dev/null 2>&1
echo "Container removed"

# Summary
echo ""
echo "=========================================="
echo "Test Results:"
echo "  Passed: ${GREEN}$TESTS_PASSED${NC}"
echo "  Failed: ${RED}$TESTS_FAILED${NC}"
echo "=========================================="
echo ""

# Display version info
echo "Version Information:"
echo "-------------------"
docker run --rm jeopardy:test cat server/version.json | jq '.' 2>/dev/null || \
docker run --rm jeopardy:test cat server/version.json

echo ""

# Display image details
echo "Image Details:"
echo "-------------"
docker images jeopardy:test --format "Size: {{.Size}}\nCreated: {{.CreatedSince}}"

echo ""

# Exit with appropriate code
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo ""
    echo "To run the container:"
    echo "  docker run -p 3000:3000 jeopardy:test"
    echo ""
    echo "Or use docker-compose:"
    echo "  docker compose up -d"
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    exit 1
fi
