#!/bin/bash

# Update assetlinks.json with existing keystore fingerprint
set -e

echo "🔗 Updating assetlinks.json with keystore fingerprint..."

# Check if keystore exists
if [ ! -f "android.keystore" ]; then
    echo "❌ Keystore not found. Please run ./build-twa.sh first to generate it."
    exit 1
fi

# Extract SHA256 fingerprint from existing keystore
echo "📝 Extracting SHA256 fingerprint from keystore..."
FINGERPRINT=$(keytool -list -v -keystore android.keystore -alias android -storepass qwerasdf -keypass qwerasdf | grep "SHA256:" | cut -d' ' -f3)

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
    "package_name": "com.jujiplay.cdw.twa",
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
