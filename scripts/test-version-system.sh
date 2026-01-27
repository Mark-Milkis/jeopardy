#!/bin/bash
# Version System Test Script
# Tests all version management functionality

echo "🧪 Testing Jeopardy Pro Versioning System"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function
test_command() {
    local description=$1
    local command=$2
    local expected=$3
    
    echo -n "Testing: $description... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((TESTS_FAILED++))
    fi
}

# Test 1: Check if sync-version.js exists
test_command "sync-version.js exists" "test -f scripts/sync-version.js"

# Test 2: Check if sync-version.js is executable
test_command "sync-version.js is executable" "test -x scripts/sync-version.js"

# Test 3: Run version sync
echo -n "Testing: version:sync command... "
if npm run version:sync > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

# Test 4: Check if version.json files were created
test_command "server/version.json created" "test -f server/version.json"
test_command "client/src/version.json created" "test -f client/src/version.json"

# Test 5: Check if versions are synced
ROOT_VERSION=$(node -p "require('./package.json').version")
CLIENT_VERSION=$(node -p "require('./client/src/package.json').version")

echo -n "Testing: versions are synced... "
if [ "$ROOT_VERSION" = "$CLIENT_VERSION" ]; then
    echo -e "${GREEN}✓ PASS${NC} (both $ROOT_VERSION)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (root: $ROOT_VERSION, client: $CLIENT_VERSION)"
    ((TESTS_FAILED++))
fi

# Test 6: Check version.js accessor
test_command "server/version.js exists" "test -f server/version.js"

# Test 7: Check version utility for frontend
test_command "client/src/utils/version.ts exists" "test -f client/src/utils/version.ts"

# Test 8: Check VersionBadge component
test_command "VersionBadge component exists" "test -f client/src/components/VersionBadge.tsx"

# Test 9: Check GitHub Actions workflows
test_command "build-dev.yml exists" "test -f .github/workflows/build-dev.yml"
test_command "version-release.yml exists" "test -f .github/workflows/version-release.yml"
test_command "version-bump.yml exists" "test -f .github/workflows/version-bump.yml"

# Test 10: Test dev version generation
echo -n "Testing: dev version generation... "
if npm run version:dev > /dev/null 2>&1; then
    BUILD_METADATA=$(node -p "require('./package.json').buildMetadata || ''")
    if [ -n "$BUILD_METADATA" ]; then
        echo -e "${GREEN}✓ PASS${NC} (metadata: $BUILD_METADATA)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (no build metadata)"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${RED}✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

# Test 11: Validate version.json structure
echo -n "Testing: version.json structure... "
REQUIRED_FIELDS=$(node -p "
    const v = require('./server/version.json');
    ['version', 'fullVersion', 'gitSha', 'gitBranch', 'buildDate'].every(f => f in v)
")
if [ "$REQUIRED_FIELDS" = "true" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

# Test 12: Check documentation files
test_command "VERSIONING.md exists" "test -f VERSIONING.md"
test_command "VERSION_QUICK_REF.md exists" "test -f VERSION_QUICK_REF.md"
test_command "IMPLEMENTATION_SUMMARY.md exists" "test -f IMPLEMENTATION_SUMMARY.md"

# Reset to clean state
echo ""
echo -n "Resetting to production version... "
if npm run version:sync > /dev/null 2>&1; then
    echo -e "${GREEN}✓ DONE${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
fi

# Summary
echo ""
echo "=========================================="
echo "Test Results:"
echo "  Passed: ${GREEN}$TESTS_PASSED${NC}"
echo "  Failed: ${RED}$TESTS_FAILED${NC}"
echo "=========================================="
echo ""

# Display current version info
echo "Current Version Information:"
echo "----------------------------"
cat server/version.json | node -p "
    const v = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
    \`Version:      \${v.version}
Full Version: \${v.fullVersion}
Git SHA:      \${v.gitSha}
Git Branch:   \${v.gitBranch}
Build Date:   \${new Date(v.buildDate).toLocaleString()}\`
"

echo ""

# Exit with appropriate code
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    exit 1
fi
