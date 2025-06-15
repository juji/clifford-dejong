#!/bin/bash

# Script to set up TWA (Trusted Web Activity) for Clifford-Dejong

echo "Setting up TWA for Clifford-Dejong..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is required but not installed. Please install Node.js first."
    exit 1
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "Java is required but not installed. Please install Java first."
    exit 1
fi

# Install Bubblewrap CLI globally if not already installed
if ! command -v bubblewrap &> /dev/null; then
    echo "Installing Bubblewrap CLI..."
    npm install -g @bubblewrap/cli
fi

echo "Building the web app..."
cd .. && npm run build && cd twa

echo "Initializing TWA project..."
# This will create the Android project structure
bubblewrap init --manifest https://cdw.jujiplay.com/manifest.json

echo "To build the TWA:"
echo "1. cd into the generated android project directory"
echo "2. Run: bubblewrap build"
echo ""
echo "To run on device:"
echo "1. Enable USB debugging on your Android device"
echo "2. Run: bubblewrap install"
echo ""
echo "For Play Store release:"
echo "1. Generate a signing key: keytool -genkey -v -keystore twa/android.keystore -alias android -keyalg RSA -keysize 2048 -validity 10000"
echo "2. Update twa/twa-manifest.json with your signing key path"
echo "3. Run: bubblewrap build --release"
