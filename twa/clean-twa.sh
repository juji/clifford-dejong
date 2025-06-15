#!/bin/bash

# Script to clean TWA build artifacts and reset the setup
# Useful when you want to start fresh or fix build issues

# Change to project root
cd "$(dirname "$0")/.."

echo "🧹 Cleaning TWA build artifacts..."

# Remove generated Android project
if [ -d "twa/android" ]; then
    echo "Removing Android project directory..."
    rm -rf twa/android
    echo "✅ Removed twa/android/"
fi

# Remove keystore (with confirmation)
if [ -f "twa/android.keystore" ]; then
    echo ""
    echo "⚠️  Found existing keystore: twa/android.keystore"
    echo "This contains your app signing certificate."
    echo "Removing it will require generating a new one."
    echo ""
    read -p "Do you want to remove the keystore? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm twa/android.keystore
        echo "✅ Removed keystore"
    else
        echo "↩️  Keeping keystore"
    fi
fi

# Remove Bubblewrap cache
if [ -d ".bubblewrap" ]; then
    echo "Removing Bubblewrap cache..."
    rm -rf .bubblewrap
    echo "✅ Removed .bubblewrap/"
fi

# Clean web build
if [ -d "dist" ]; then
    echo "Removing web build..."
    rm -rf dist
    echo "✅ Removed dist/"
fi

# Clean node_modules if requested
echo ""
read -p "Do you want to clean node_modules and reinstall dependencies? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -d "node_modules" ]; then
        echo "Removing node_modules..."
        rm -rf node_modules
        echo "✅ Removed node_modules/"
    fi
    
    if [ -f "pnpm-lock.yaml" ]; then
        echo "Removing pnpm-lock.yaml..."
        rm pnpm-lock.yaml
        echo "✅ Removed pnpm-lock.yaml"
    fi
    
    echo "Reinstalling dependencies..."
    if command -v pnpm &> /dev/null; then
        pnpm install
    else
        npm install
    fi
    echo "✅ Dependencies reinstalled"
fi

echo ""
echo "🎉 Cleanup completed!"
echo ""
echo "Next steps:"
echo "1. Run validation: npm run twa:validate"
echo "2. Build TWA: npm run twa:build"
