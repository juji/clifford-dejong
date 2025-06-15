# TWA (Trusted Web Activity) Directory

This directory contains all the files and scripts needed to package the Clifford-Dejong web app as an Android app using TWA.

## Directory Structure

```
twa/
├── README.md                 # This file
├── TWA_README.md            # Detailed TWA setup guide
├── twa-manifest.json        # TWA configuration
├── build-twa.sh            # Main build script
├── build-release-twa.sh    # Release build script
├── install-twa.sh          # Device installation script
├── generate-fingerprint.sh # Certificate fingerprint generator
├── setup-twa.sh           # Initial setup script
├── icon-generator.html     # Icon generation utility
└── android/                # Generated Android project (gitignored)
    └── ...
```

## Quick Commands

From the project root directory:

```bash
# Initial setup (run once)
npm run twa:setup

# Generate Android icons from favicon.svg
npm run twa:icons

# Build debug version
npm run twa:build

# Install on connected Android device
npm run twa:install

# Build release version for Play Store
npm run twa:release

# Generate certificate fingerprint
npm run twa:fingerprint
```

## Files Overview

### Configuration Files

- **`twa-manifest.json`**: Main TWA configuration including app details, package name, theme colors, and signing key settings
- **`TWA_README.md`**: Comprehensive documentation for TWA setup and deployment

### Build Scripts

- **`build-twa.sh`**: Complete build process including dependency installation, web app build, keystore generation, and Android APK creation
- **`build-release-twa.sh`**: Builds production-ready APK for Play Store submission
- **`install-twa.sh`**: Installs the built APK on a connected Android device via ADB
- **`setup-twa.sh`**: Initial project setup and Bubblewrap CLI installation

### Utility Scripts

- **`generate-fingerprint.sh`**: Generates SHA256 certificate fingerprint needed for domain verification
- **`generate-icons.js`**: Node.js script using Sharp to generate Android icons from favicon.svg

## Prerequisites

1. **Node.js** (v14+)
2. **Java Development Kit** (JDK 8+)
3. **Android SDK** (for device testing)
4. **Bubblewrap CLI** (installed automatically)

## Generated Files (Not in Git)

- `android/` - Generated Android project
- `android.keystore` - App signing certificate
- `.bubblewrap/` - Bubblewrap cache

These files are automatically generated and excluded from version control.
