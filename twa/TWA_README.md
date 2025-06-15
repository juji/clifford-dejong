# TWA (Trusted Web Activity) Setup

This document explains how to convert the Clifford-Dejong web app into an Android app using TWA.

## Prerequisites

1. **Node.js** (v14 or higher)
2. **Java Development Kit (JDK)** (v8 or higher)
3. **Android Studio** (recommended for testing)
4. **Android SDK** with build tools

## Quick Commands

All commands should be run from the project root directory:

```bash
# Validate setup (run first)
npm run twa:validate

# Initial setup (run once)
npm run twa:setup

# Build debug version
npm run twa:build

# Install on connected Android device
npm run twa:install

# Build release version for Play Store
npm run twa:release

# Generate certificate fingerprint
npm run twa:fingerprint

# Clean build artifacts
npm run twa:clean
```

## Manual Setup

### 1. Install Bubblewrap CLI

```bash
npm install -g @bubblewrap/cli
```

### 2. Build the Web App

```bash
npm run build
```

### 3. Initialize TWA Project

```bash
bubblewrap init --manifest twa-manifest.json
```

### 4. Build the Android App

```bash
bubblewrap build
```

### 5. Install on Device

Connect your Android device with USB debugging enabled:
```bash
bubblewrap install
```

## Configuration

The TWA configuration is in `twa-manifest.json`. Key settings:

- **packageId**: `com.jujiplay.clifforddejong`
- **host**: `cdw.jujiplay.com`
- **name**: App name shown in Android
- **themeColor**: Status bar color
- **startUrl**: Starting URL of the app

## Customization

### Icons

Generate different sized icons for Android:
1. Open `icon-generator.html` in a browser
2. Download the generated icons
3. Place them in the `android/app/src/main/res/` directories

### Signing for Release

1. Generate a keystore:
```bash
keytool -genkey -v -keystore android.keystore -alias android -keyalg RSA -keysize 2048 -validity 10000
```

2. Update `twa-manifest.json` with your keystore path

3. Build release version:
```bash
npm run twa:build-release
```

## Publishing to Google Play Store

1. Build a release APK/AAB
2. Test thoroughly on different devices
3. Create a Google Play Console account
4. Upload the APK/AAB
5. Complete the store listing

## Domain Verification

For the TWA to work properly, you need to verify domain ownership:

1. Add a `assetlinks.json` file to your website's `/.well-known/` directory
2. The file should contain verification for your Android app
3. See Google's documentation for exact format

## Troubleshooting

### Common Issues

1. **Build fails**: Check Java and Android SDK installation
2. **App doesn't open website**: Verify domain and start URL
3. **Icons not showing**: Ensure icon files are in correct directories
4. **Signing errors**: Check keystore path and credentials

### Debug Tips

- Use `adb logcat` to see Android logs
- Test on multiple Android versions
- Verify your website works properly in Chrome mobile

## Scripts Available

- `npm run twa:init` - Initial setup
- `npm run twa:build` - Build debug APK
- `npm run twa:install` - Install on connected device
- `npm run twa:build-release` - Build release APK
