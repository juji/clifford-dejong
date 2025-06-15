#!/bin/bash

# Script to validate TWA setup and dependencies
# Run this before attempting to build the TWA

# Change to project root
cd "$(dirname "$0")/.."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_check() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[✓ PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[✗ FAIL]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[⚠ WARN]${NC} $1"
}

echo "🔍 Validating TWA setup for Clifford-Dejong..."
echo ""

ISSUES=0

# Check Node.js
print_check "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_pass "Node.js found: $NODE_VERSION"
else
    print_fail "Node.js not found. Please install Node.js 14+ from https://nodejs.org"
    ISSUES=$((ISSUES + 1))
fi

# Check package manager
print_check "Checking package manager..."
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    print_pass "pnpm found: $PNPM_VERSION"
elif command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_pass "npm found: $NPM_VERSION"
else
    print_fail "Neither npm nor pnpm found"
    ISSUES=$((ISSUES + 1))
fi

# Check Java
print_check "Checking Java..."
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    print_pass "Java found: $JAVA_VERSION"
    
    # Check keytool
    if command -v keytool &> /dev/null; then
        print_pass "keytool found"
    else
        print_fail "keytool not found (should be included with Java)"
        ISSUES=$((ISSUES + 1))
    fi
else
    print_fail "Java not found. Please install JDK 8+ from https://adoptopenjdk.net"
    ISSUES=$((ISSUES + 1))
fi

# Check Bubblewrap CLI
print_check "Checking Bubblewrap CLI..."
if command -v bubblewrap &> /dev/null; then
    BUBBLEWRAP_VERSION=$(bubblewrap --version 2>/dev/null || echo "unknown")
    print_pass "Bubblewrap CLI found: $BUBBLEWRAP_VERSION"
else
    print_warn "Bubblewrap CLI not found. It will be installed automatically during build."
fi

# Check ADB (optional)
print_check "Checking ADB (optional for device testing)..."
if command -v adb &> /dev/null; then
    ADB_VERSION=$(adb version 2>/dev/null | head -n 1 || echo "unknown")
    print_pass "ADB found: $ADB_VERSION"
else
    print_warn "ADB not found. Install Android SDK Platform Tools for device testing."
fi

# Check project files
print_check "Checking project files..."

REQUIRED_FILES=(
    "package.json"
    "public/manifest.json"
    "public/sw.js"
    "twa/twa-manifest.json"
    "twa/build-twa.sh"
    "twa/install-twa.sh"
    "twa/build-release-twa.sh"
    "twa/generate-fingerprint.sh"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_pass "$file exists"
    else
        print_fail "$file missing"
        ISSUES=$((ISSUES + 1))
    fi
done

# Check if web app builds
print_check "Testing web app build..."
if command -v pnpm &> /dev/null; then
    if pnpm run build &> /dev/null; then
        print_pass "Web app builds successfully"
    else
        print_fail "Web app build failed"
        ISSUES=$((ISSUES + 1))
    fi
elif command -v npm &> /dev/null; then
    if npm run build &> /dev/null; then
        print_pass "Web app builds successfully"
    else
        print_fail "Web app build failed"
        ISSUES=$((ISSUES + 1))
    fi
fi

# Check script permissions
print_check "Checking script permissions..."
TWA_SCRIPTS=(
    "twa/build-twa.sh"
    "twa/install-twa.sh"
    "twa/build-release-twa.sh"
    "twa/generate-fingerprint.sh"
    "twa/setup-twa.sh"
)

for script in "${TWA_SCRIPTS[@]}"; do
    if [ -x "$script" ]; then
        print_pass "$script is executable"
    else
        print_warn "$script is not executable (will be fixed automatically)"
        chmod +x "$script"
        print_pass "Fixed permissions for $script"
    fi
done

echo ""
echo "📊 Validation Summary"
echo "===================="

if [ $ISSUES -eq 0 ]; then
    print_pass "All checks passed! ✨"
    echo ""
    echo "🚀 Ready to build TWA:"
    echo "   npm run twa:build"
    echo ""
    echo "📱 To install on device:"
    echo "   npm run twa:install"
    echo ""
    echo "🏪 For Play Store release:"
    echo "   npm run twa:release"
else
    print_fail "$ISSUES issue(s) found. Please fix them before building the TWA."
    exit 1
fi
