# Generated Android Icons

Icons have been generated and saved to `public/icons/` directory.

## Icon Types

### Regular Icons
- `icon-*x*.png` - Standard app icons for different densities
- Use these for basic icon requirements

### Adaptive Icons (Android 8.0+)
- `adaptive-icon-*x*.png` - Foreground layer
- `background-*x*.png` - Background layer  
- `monochrome-*x*.png` - Monochrome version for themed icons

## Android Resource Directories

When setting up your Android project, place icons in these directories:

### Regular Icons
- `public/icons/icon-36x36.png` → `res/mipmap-ldpi/ic_launcher.png`
- `public/icons/icon-48x48.png` → `res/mipmap-mdpi/ic_launcher.png`
- `public/icons/icon-72x72.png` → `res/mipmap-hdpi/ic_launcher.png`
- `public/icons/icon-96x96.png` → `res/mipmap-xhdpi/ic_launcher.png`
- `public/icons/icon-144x144.png` → `res/mipmap-xxhdpi/ic_launcher.png`
- `public/icons/icon-192x192.png` → `res/mipmap-xxxhdpi/ic_launcher.png`

### Adaptive Icons
- `public/icons/adaptive-icon-81x81.png` → `res/mipmap-ldpi/ic_launcher_foreground.png`
- `public/icons/background-81x81.png` → `res/mipmap-ldpi/ic_launcher_background.png`
- `public/icons/monochrome-icon-81x81.png` → `res/mipmap-ldpi/ic_launcher_monochrome.png`
- etc. for other densities...

### Play Store
- `public/icons/icon-512x512.png` - Use this for Google Play Store listing

## Generated: 2025-06-15T20:30:29.115Z
