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

## Setup Process

1. generate icons

```bash
pnpm run twa:screenshots
```

2. run initial setup

```bash
pnpm run twa:setup
```

## Quick Commands

From the project root directory:

```bash
# Initial setup (run once)
pnpm run twa:setup

# Generate Android icons from favicon.svg
pnpm run twa:icons

# Generate app screenshots for different viewports
pnpm run twa:screenshots

# Build debug version
pnpm run twa:build

# Install on connected Android device
pnpm run twa:install

# Build release version for Play Store
pnpm run twa:release

# Generate certificate fingerprint
pnpm run twa:fingerprint

# Validate TWA setup and configuration
pnpm run twa:validate

# Clean generated files and start fresh
pnpm run twa:clean
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
