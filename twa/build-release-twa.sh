#!/bin/bash

# Script to build a release version of the TWA for Play Store submission
set -e

echo "📦 Building release version of Clifford-Dejong TWA..."

# Check if keystore exists
if [ ! -f "android.keystore" ]; then
    echo "❌ Keystore not found. Please run ./build-twa.sh first to generate it."
    exit 1
fi

# Build web app
echo "🏗️  Building web application..."
cd ..
if command -v pnpm &> /dev/null; then
    pnpm run build
else
    npm run build
fi
cd twa

# Build release APK
echo "🔨 Building release APK..."
cd android

# Clean previous builds
./gradlew clean

# Build release
./gradlew assembleRelease

cd ..

echo "✅ Release build completed!"
echo ""
echo "📍 Release APK location: android/app/build/outputs/apk/release/app-release.apk"
echo ""
echo "Next steps for Play Store:"
echo "1. Test the release APK thoroughly"
echo "2. Upload to Google Play Console"
echo "3. Complete store listing"
echo "4. Submit for review"
echo ""
echo "⚠️  Remember to:"
echo "- Upload assetlinks.json to https://cdw.jujiplay.com/.well-known/"
echo "- Verify domain ownership in Play Console"
echo "- Test on multiple devices and Android versions"
