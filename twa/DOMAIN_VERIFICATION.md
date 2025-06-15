# Domain Verification Setup for TWA

This guide explains how to set up domain verification for your TWA, which is required for the app to work properly.

## What is assetlinks.json?

The `assetlinks.json` file proves that you own both the website and the Android app. It must be hosted on your website for the TWA to function correctly.

## Steps to Deploy

### 1. Generate Your App's Fingerprint

First, generate your app's SHA256 fingerprint:

```bash
npm run twa:fingerprint
```

This will:
- Create a keystore if it doesn't exist
- Extract the SHA256 fingerprint
- Automatically update the local assetlinks.json file

### 2. Upload to Your Website

The `assetlinks.json` file must be hosted at:
```
https://cdw.jujiplay.com/.well-known/assetlinks.json
```

#### For Cloudflare Pages (your current setup):

1. Copy the updated `public/.well-known/assetlinks.json` to your website
2. The file should be accessible at the URL above
3. Ensure the MIME type is `application/json`

#### Content Example:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.jujiplay.clifforddejong",
    "sha256_cert_fingerprints": ["YOUR_ACTUAL_SHA256_FINGERPRINT"]
  }
}]
```

### 3. Verify the Setup

Test that your assetlinks.json is properly deployed:

```bash
curl https://cdw.jujiplay.com/.well-known/assetlinks.json
```

You should see your JSON file returned with the correct fingerprint.

### 4. Validate with Google

Use Google's Digital Asset Links tester:
https://developers.google.com/digital-asset-links/tools/generator

Enter:
- **Source**: `cdw.jujiplay.com`
- **Target**: Your app's package name and fingerprint

## Important Notes

### Security
- Keep your keystore file (`twa/android.keystore`) secure and backed up
- If you lose the keystore, you'll need to generate a new one and update the assetlinks.json
- For production apps, use the same keystore for all releases

### Multiple Environments
If you have staging/production environments, you may need different assetlinks.json files or include multiple fingerprints:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.jujiplay.clifforddejong",
    "sha256_cert_fingerprints": [
      "DEBUG_FINGERPRINT_HERE",
      "RELEASE_FINGERPRINT_HERE"
    ]
  }
}]
```

### Troubleshooting

**TWA opens in browser instead of app:**
- Check that assetlinks.json is accessible
- Verify the fingerprint matches your app
- Ensure the package name is correct

**File not found (404):**
- Verify the file is uploaded to the correct path
- Check that your web server serves files from `.well-known/`

**Wrong MIME type:**
- Ensure your server returns `application/json` for .json files
- Some servers might need explicit configuration

### Testing

1. **Local testing**: Use Chrome DevTools to verify the link
2. **Device testing**: Install the APK and test deep linking
3. **Production**: Test with the Play Store version

## Cloudflare Specific Instructions

Since you're using Cloudflare Pages:

1. Ensure the `public/.well-known/` directory is included in your build
2. Cloudflare should automatically serve `.well-known` files
3. You can verify in your Cloudflare dashboard under "Custom rules" if needed

The Vite build process should automatically copy this file to your `dist` folder during `npm run build`.
