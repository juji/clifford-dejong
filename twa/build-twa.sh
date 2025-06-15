#!/bin/bash

# Comprehensive TWA build script for Clifford-Dejong
set -e

echo "🚀 Building Clifford-Dejong TWA..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is required but not installed."
    exit 1
fi

if ! command -v java &> /dev/null; then
    print_error "Java is required but not installed."
    exit 1
fi

if ! command -v keytool &> /dev/null; then
    print_error "keytool (Java) is required but not installed."
    exit 1
fi

print_success "Prerequisites check passed"

# Install dependencies
print_status "Installing dependencies..."
if command -v pnpm &> /dev/null; then
    pnpm install
elif command -v npm &> /dev/null; then
    npm install
else
    print_error "Neither npm nor pnpm found"
    exit 1
fi

# Install Bubblewrap CLI if not present
if ! command -v bubblewrap &> /dev/null; then
    print_status "Installing Bubblewrap CLI..."
    npm install -g @bubblewrap/cli
    print_success "Bubblewrap CLI installed"
fi

# Build the web application
print_status "Building web application..."
cd ..
if command -v pnpm &> /dev/null; then
    pnpm run build
else
    npm run build
fi
cd twa
print_success "Web application built"

# Generate Android icons
print_status "Generating Android icons..."
if command -v pnpm &> /dev/null; then
    pnpm run generate-icons
else
    npm run generate-icons
fi
print_success "Android icons generated"

# Generate signing key if it doesn't exist
if [ ! -f "android.keystore" ]; then
    print_status "Generating Android signing keystore..."
    print_warning "You will be prompted to enter keystore information."
    keytool -genkey -v -keystore android.keystore -alias android -keyalg RSA -keysize 2048 -validity 10000
    print_success "Keystore generated"
fi

# Generate fingerprint and update assetlinks.json
print_status "Generating SHA256 fingerprint..."
./update-assetlinks.sh

# Initialize TWA project if it doesn't exist
if [ ! -d "android" ]; then
    print_status "Initializing TWA project..."
    mkdir -p android
    cd android
    bubblewrap init --manifest ../twa-manifest.json
    cd ..
    print_success "TWA project initialized"
else
    print_warning "TWA project already exists, updating..."
    cd android
    bubblewrap update --manifest ../twa-manifest.json
    cd ..
fi

# Build the Android APK
print_status "Building Android APK..."
cd android
./gradlew assembleDebug
cd ..
print_success "Android APK built successfully"

echo ""
print_success "TWA build completed! 🎉"
echo ""
echo "Next steps:"
echo "1. Install on device: ./install-twa.sh"
echo "2. For release build: ./build-release-twa.sh"
echo "3. Upload assetlinks.json to your web server's /.well-known/ directory"
echo ""
echo "APK location: android/app/build/outputs/apk/debug/app-debug.apk"
