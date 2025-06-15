#!/bin/bash

# Update assetlinks.json with existing keystore fingerprint
set -e

# Read package name from twa-manifest.json
if [ ! -f "twa-manifest.json" ]; then
    echo "❌ twa-manifest.json not found"
    exit 1
fi

PACKAGE_NAME=$(grep -o '"packageId"[[:space:]]*:[[:space:]]*"[^"]*"' twa-manifest.json | cut -d'"' -f4)

if [ -z "$PACKAGE_NAME" ]; then
    echo "❌ Could not read packageId from twa-manifest.json"
    exit 1
fi

echo "🔧 Updating assetlinks.json for TWA package: $PACKAGE_NAME"
echo "🔗 Updating assetlinks.json with keystore fingerprint..."

# Check if keystore exists
if [ ! -f "android.keystore" ]; then
    echo "❌ Keystore not found. Please run ./build-twa.sh first to generate it."
    exit 1
fi

# Extract SHA256 fingerprint from existing keystore
echo "📝 Extracting SHA256 fingerprint from keystore..."
echo "Please enter keystore passwords:"
read -s -p "Store password: " STORE_PASS
echo
read -s -p "Key password: " KEY_PASS
echo

FINGERPRINT=$(keytool -list -v -keystore android.keystore -alias android -storepass "$STORE_PASS" -keypass "$KEY_PASS" | grep "SHA256:" | cut -d' ' -f3)

if [ -z "$FINGERPRINT" ]; then
    echo "❌ Failed to extract fingerprint from keystore"
    exit 1
fi

echo "✅ SHA256 Fingerprint: $FINGERPRINT"

# Update assetlinks.json in public/.well-known/
ASSETLINKS_PATH="../public/.well-known/assetlinks.json"
echo "📄 Updating assetlinks.json at $ASSETLINKS_PATH..."

# Ensure the .well-known directory exists
mkdir -p "../public/.well-known"

cat > "$ASSETLINKS_PATH" << EOF
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "$PACKAGE_NAME",
    "sha256_cert_fingerprints": ["$FINGERPRINT"]
  }
}]
EOF

echo "✅ assetlinks.json updated successfully"
echo ""
echo "📋 Ready for deployment:"
echo "1. File is now at: $ASSETLINKS_PATH"
echo "2. Will be accessible at: https://cdw.jujiplay.com/.well-known/assetlinks.json"
echo "3. Deploy your web app to activate TWA domain verification"
