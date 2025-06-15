#!/bin/bash

# Script to generate SHA256 fingerprint for Android app signing certificate
# This fingerprint is needed for the assetlinks.json file

# Change to project root
cd "$(dirname "$0")/.."

echo "Generating SHA256 fingerprint for TWA..."

KEYSTORE_FILE="twa/android.keystore"
ALIAS="android"

if [ ! -f "$KEYSTORE_FILE" ]; then
    echo "Keystore file not found. Creating a new keystore..."
    echo "You will be prompted to enter keystore information."
    keytool -genkey -v -keystore "$KEYSTORE_FILE" -alias "$ALIAS" -keyalg RSA -keysize 2048 -validity 10000
fi

echo ""
echo "Extracting SHA256 fingerprint..."
SHA256=$(keytool -list -v -keystore "$KEYSTORE_FILE" -alias "$ALIAS" | grep "SHA256:" | cut -d' ' -f3 | tr -d ':')

if [ ! -z "$SHA256" ]; then
    echo ""
    echo "Your SHA256 fingerprint is:"
    echo "$SHA256"
    echo ""
    echo "Update the assetlinks.json file with this fingerprint:"
    echo "Replace 'YOUR_APP_FINGERPRINT_HERE' with: $SHA256"
    
    # Auto-update the assetlinks.json file
    if [ -f "public/.well-known/assetlinks.json" ]; then
        sed -i.bak "s/YOUR_APP_FINGERPRINT_HERE/$SHA256/g" public/.well-known/assetlinks.json
        echo "✅ Updated public/.well-known/assetlinks.json automatically"
        rm public/.well-known/assetlinks.json.bak
    fi
else
    echo "❌ Failed to extract fingerprint. Please check your keystore."
fi
