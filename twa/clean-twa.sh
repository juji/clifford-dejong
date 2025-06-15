#!/bin/bash

# Script to clean TWA build artifacts and reset the setup
# Useful when you want to start fresh or fix build issues

echo "🧹 Cleaning TWA build artifacts..."

# Remove generated Android project
if [ -d "android" ]; then
    echo "Removing Android project directory..."
    rm -rf android
    echo "✅ Removed android/"
fi

# Remove keystore (with confirmation)
if [ -f "android.keystore" ]; then
    echo ""
    echo "⚠️  Found existing keystore: android.keystore"
    echo "This contains your app signing certificate."
    echo "Removing it will require generating a new one."
    echo ""
    read -p "Do you want to remove the keystore? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm android.keystore
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

echo ""
echo "🎉 TWA cleanup completed!"
echo ""
echo "Next steps:"
echo "1. Run validation: pnpm run twa:validate"
echo "2. Build TWA: pnpm run twa:build"
