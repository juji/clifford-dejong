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

### Prerequisites (Optional) - Create Keystore

You can optionally create a keystore file for app signing before running the setup. If you don't create one, it will be generated automatically during the setup process.

#### Generate Keystore (Optional)

To create your own keystore before setup, run this command from the project root:

```bash
keytool -genkey -v -keystore twa/android.keystore -alias android -keyalg RSA -keysize 2048 -validity 10000
```

You'll be prompted for:
- **Keystore password**: Choose a strong password (remember this!)
- **Key password**: Can be the same as keystore password
- **Personal details**: Name, organization, city, etc. (required for certificate)

**Critical**: Write down your passwords! You cannot update your app on Google Play without them.

### Initial Setup

The setup process will prompt you for configuration details:

1. **App Details**: Application name, short name, package ID
2. **Display Settings**: Theme colors, display mode, orientation
3. **Keystore Configuration**: Either use existing keystore or create a new one

### What to Expect During Setup

When you run `pnpm run twa:setup`, you'll be prompted for:

1. **Domain**: Your web app's domain (e.g., `cdw.jujiplay.com`)
2. **URL path**: Starting path for your app (usually `/`)
3. **Application name**: Full app name for the Play Store
4. **Short name**: Abbreviated name (12 chars max) for the launcher
5. **Application ID**: Unique package identifier (e.g., `com.jujiplay.clifforddejong`)
6. **Display mode**: How the app appears (`standalone` recommended)
7. **Status bar color**: Color for Android status bar (hex format)
8. **Navigation color**: Color for navigation elements
9. **Background color**: App background color
10. **Features**: Optional features like location services, billing
11. **Keystore settings**: Signing certificate configuration

### Keystore Configuration Details

During setup, you'll be asked about signing key configuration:

- **Generate signing key**: Say `no` if you already created one, or `yes` to create a new one
- **Keystore path**: Enter `android.keystore` (when running from twa directory)
- **Key alias**: Enter `android` (or your chosen alias)
- **Keystore password**: Enter the password you set when creating the keystore
- **Key password**: Enter the key password (usually same as keystore password)

**Critical**: Use the same keystore and passwords you created in the prerequisite step!

## Quick Commands

From the project root directory:

```bash
# Initial setup (run once)
pnpm run twa:setup

# Generate Android icons from favicon.svg
pnpm run twa:icons

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
