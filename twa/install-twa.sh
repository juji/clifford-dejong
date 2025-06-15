#!/bin/bash

# Script to install the TWA on a connected Android device
set -e

# Change to project root
cd "$(dirname "$0")/.."

echo "📱 Installing Clifford-Dejong TWA on device..."

# Check if ADB is available
if ! command -v adb &> /dev/null; then
    echo "❌ ADB is required but not installed."
    echo "Please install Android SDK Platform Tools"
    exit 1
fi

# Check if device is connected
if ! adb devices | grep -q "device$"; then
    echo "❌ No Android device found."
    echo "Please:"
    echo "1. Connect your Android device via USB"
    echo "2. Enable USB debugging in Developer Options"
    echo "3. Accept the USB debugging prompt on your device"
    exit 1
fi

# Check if APK exists
APK_PATH="twa/android/app/build/outputs/apk/debug/app-debug.apk"
if [ ! -f "$APK_PATH" ]; then
    echo "❌ APK not found. Please build the TWA first:"
    echo "./twa/build-twa.sh"
    exit 1
fi

echo "🔧 Installing APK..."
adb install -r "$APK_PATH"

echo "✅ Installation completed!"
echo ""
echo "The app should now be available on your device as 'Clifford-Dejong'"
