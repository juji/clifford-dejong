# TWA (Trusted Web Activity) Setup Guide

This directory contains all the files and scripts needed to package the Clifford-Dejong web app as an Android app using TWA (Trusted Web Activity).

## What is TWA?

TWA allows you to package your web app as a native Android app that runs in a trusted Chrome browser instance. The app appears as a native Android app but actually displays your web content.

## Prerequisites

Before starting, ensure you have:

1. **Node.js** (v14+) - For running build scripts
2. **Java Development Kit** (JDK 8+) - For Android development
3. **Android SDK** (optional) - For device testing with ADB
4. **pnpm** - Package manager (installed automatically)

## Step-by-Step Setup

### 1. Generate Icons and Screenshots

First, generate the required Android icons and app screenshots:

```bash
# Generate Android icons from favicon.svg
pnpm run twa:icons

# Generate screenshots for app stores
pnpm run twa:screenshots
```

### 2. Initial TWA Setup

Run the setup script to initialize the TWA project:

```bash
pnpm run twa:setup
```

This will:
- Install Bubblewrap CLI (if not present)
- Build the web application
- Create the Android project structure in `twa/android/`

### 3. Build the TWA

Build the Android APK:

```bash
pnpm run twa:build
```

This will:
- Install dependencies
- Build the web app
- Generate Android keystore (first time only)
- Create SHA256 fingerprint
- Update assetlinks.json
- Build debug APK

### 4. Deploy assetlinks.json

Upload the generated `assetlinks.json` file to your web server:

```bash
# Upload to: https://cdw.jujiplay.com/.well-known/assetlinks.json
```

This file verifies that your Android app is authorized to open your website.

### 5. Test on Device

Install the app on a connected Android device:

```bash
# Enable USB debugging on your Android device first
pnpm run twa:install
```

### 6. Build Release Version (Optional)

For Play Store submission:

```bash
pnpm run twa:release
```

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm run twa:setup` | Initial project setup |
| `pnpm run twa:icons` | Generate Android icons |
| `pnpm run twa:screenshots` | Generate app screenshots |
| `pnpm run twa:build` | Build debug APK |
| `pnpm run twa:install` | Install on device |
| `pnpm run twa:release` | Build release APK |
| `pnpm run twa:validate` | Validate setup |
| `pnpm run twa:clean` | Clean generated files |

## Directory Structure

```
twa/
├── README.md                # This guide
├── twa-manifest.json       # TWA configuration
├── build-twa.sh           # Main build script
├── build-release-twa.sh   # Release build script
├── install-twa.sh         # Device installation script
├── setup-twa.sh          # Initial setup script
├── update-assetlinks.sh  # Generate assetlinks.json
├── clean-twa.sh          # Cleanup script
├── validate-setup.sh     # Validation script
├── generate-icons.js     # Icon generation utility
├── generate-screenshots.js # Screenshot generator
├── android.keystore      # App signing certificate (generated)
└── android/              # Generated Android project (gitignored)
```

## Generated Files

These files are created during the build process:

- **`android/`** - Complete Android project with Gradle files
- **`android.keystore`** - Your app's signing certificate (keep safe!)
- **`assetlinks.json`** - Domain verification file
- **`.bubblewrap/`** - Bubblewrap cache directory

## Important Notes

1. **Keep your keystore safe** - You need it to update your app on Play Store
2. **Upload assetlinks.json** - Required for domain verification
3. **Test thoroughly** - Test the TWA on different devices before release
4. **Update web manifest** - Ensure your web app's manifest.json is properly configured

## Troubleshooting

### Common Issues

1. **Keystore password prompts**: The scripts use default passwords for simplicity
2. **Build failures**: Run `pnpm run twa:validate` to check your setup
3. **Installation issues**: Ensure USB debugging is enabled on your device
4. **Domain verification**: Make sure assetlinks.json is accessible at `/.well-known/assetlinks.json`

### Starting Fresh

If you encounter issues, clean everything and start over:

```bash
pnpm run twa:clean
pnpm run twa:setup
```

## Play Store Submission

1. Build release version: `pnpm run twa:release`
2. Test the release APK thoroughly
3. Create Google Play Console account
4. Upload APK and fill out store listing
5. Submit for review
