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
# Create android directory and initialize there
mkdir -p android
cd android
bubblewrap init --manifest https://cdw.jujiplay.com/manifest.json
cd ..

echo "Setup completed! TWA project created in twa/android/"
echo ""
echo "Next steps:"
echo "1. Build TWA: npm run twa:build"
echo "2. Install on device: npm run twa:install"
