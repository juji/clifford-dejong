# clifford-dejong

Wallpaper creator for dejong & clifford attractor ....

🌐 **Web App**: [https://cdw.jujiplay.com/](https://cdw.jujiplay.com/)

📱 **Android App**: Available as a Trusted Web Activity (TWA)

Deployed on [Cloudflare](https://cloudflare.com/)

## TWA (Android App) Setup

This project can be packaged as an Android app using Trusted Web Activity (TWA). See [twa/TWA_README.md](./twa/TWA_README.md) for detailed setup instructions.

### Quick Start for TWA

```bash
# Build the TWA
npm run twa:build

# Install on connected Android device
npm run twa:install

# Build release version for Play Store
npm run twa:release
```

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```
