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
FINGERPRINT=$(keytool -list -v -keystore android.keystore -alias android -storepass android -keypass android | grep "SHA256:" | cut -d' ' -f3)

if [ -z "$FINGERPRINT" ]; then
    echo "❌ Failed to extract fingerprint from keystore"
    exit 1
fi

echo "✅ SHA256 Fingerprint: $FINGERPRINT"

# Create assetlinks.json
echo "📄 Updating assetlinks.json..."
cat > assetlinks.json << EOF
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.jujiplay.cdw",
    "sha256_cert_fingerprints": ["$FINGERPRINT"]
  }
}]
EOF

echo "✅ assetlinks.json created successfully"
echo ""
echo "📋 Next steps:"
echo "1. Upload assetlinks.json to your web server's /.well-known/ directory"
echo "2. Verify it's accessible at: https://cdw.jujiplay.com/.well-known/assetlinks.json"
echo ""
echo "📍 File location: $(pwd)/assetlinks.json"
