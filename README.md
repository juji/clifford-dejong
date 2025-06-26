# Clifford-de Jong Attractor Wallpaper Creator

A sophisticated web application that generates beautiful mathematical art wallpapers using **Clifford** and **de Jong** attractors. Create stunning, mathematically-generated patterns perfect for wallpapers and digital art.

🌐 **Web App**: [https://cdw.jujiplay.com/](https://cdw.jujiplay.com/)

Deployed on [Cloudflare](https://cloudflare.com/)

## Features

### Mathematical Visualization
- **Clifford Attractor**: Generates chaotic attractors using the Clifford equations
- **de Jong Attractor**: Creates beautiful patterns using Peter de Jong's attractor formulas
- **Real-time Parameter Control**: Adjust mathematical coefficients (a, b, c, d) in real-time
- **Color Customization**: Full HSV color control (hue, saturation, brightness)
- **Positioning & Scaling**: Fine-tune scale, top, and left positioning

### User Interface
- **Interactive Parameter Panel**: Powered by lil-gui for intuitive control
- **Download Functionality**: High-quality wallpaper export with animated download button
- **Full-Screen Mode**: Optimized viewing experience
- **Reset Controls**: Quick parameter reset to defaults
- **Responsive Design**: Works seamlessly on desktop and mobile

### Progressive Web App (PWA)
- **Service Worker**: Offline functionality and caching
- **Web Manifest**: Full PWA capabilities

## Technical Stack

- **Frontend**: TypeScript + Vite
- **UI Library**: lil-gui for parameter controls
- **Styling**: CSS with custom animations and elastic effects
- **State Management**: Custom store with reactive subscription pattern
- **Rendering**: HTML5 Canvas with WebGL detection
- **Build Tool**: Vite with TypeScript configuration
- **Package Manager**: pnpm

### Architecture
- **Modular Design**: Organized into renderer, state, and UI modules
- **Reactive State**: `optionStore` with subscription-based updates
- **Color Management**: HSV to RGB conversion utilities
- **Cross-platform**: Works in browsers and as PWA

## Development

### Prerequisites
- Node.js (16+ recommended)
- pnpm package manager

### Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Project Structure

```
src/
├── renderer/           # Core rendering engine
│   ├── attractors.ts   # Mathematical attractor implementations
│   ├── context2d.ts   # Canvas 2D rendering
│   └── detect-webgl.ts # WebGL capability detection
├── state/              # State management
│   └── index.ts        # optionStore and configuration
├── ui/                 # User interface components
│   ├── lil-gui.ts      # Parameter control panel
│   ├── full-screen.ts  # Full-screen functionality
│   ├── download-button.ts # Download functionality
│   └── body.ts         # Dynamic styling
└── main.ts             # Application entry point
```

### Configuration

The application uses a sophisticated state management system:

```typescript
type Options = {
  attractor: string;           // 'clifford' or 'dejong'
  a, b, c, d: number;         // Mathematical coefficients
  hue, saturation, brightness: number; // Color controls
  scale, top, left: number;   // Positioning
  background: [r, g, b];      // Background color
}
```

## Mathematical Background

### Clifford Attractors
Clifford attractors are generated using the equations:
```
x(n+1) = sin(a*y(n)) + c*cos(a*x(n))
y(n+1) = sin(b*x(n)) + d*cos(b*y(n))
```

### de Jong Attractors  
de Jong attractors use:
```
x(n+1) = sin(a*y(n)) - cos(b*x(n))
y(n+1) = sin(c*x(n)) - cos(d*y(n))
```

These mathematical systems create beautiful, chaotic patterns that are perfect for wallpapers and digital art.

## Features in Detail

### Real-time Parameter Control
- **Mathematical Coefficients**: Adjust a, b, c, d parameters with immediate visual feedback
- **Color System**: HSV color space for intuitive color manipulation
- **Positioning Controls**: Fine-tune scale and positioning for perfect composition
- **Background Customization**: Dynamic background color adjustment

### Advanced UI
- **Elastic Animations**: Sophisticated CSS keyframe animations for smooth interactions
- **Responsive Design**: Optimized for both desktop and mobile experiences
- **Full-screen Support**: Native browser fullscreen with PWA compatibility

### Performance Optimizations
- **WebGL Detection**: Automatic fallback to Canvas 2D when needed
- **Efficient Rendering**: Optimized drawing loops for smooth real-time updates
- **Memory Management**: Careful resource management for long-running sessions

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Browsers**: iOS Safari, Chrome Mobile, Samsung Internet
- **PWA Support**: Full Progressive Web App capabilities

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**Copyright (c) 2025 Tri Rahmat Gunadi**

The MIT License allows you to:
- ✅ **Use** the software for any purpose
- ✅ **Modify** and create derivative works
- ✅ **Distribute** original and modified versions
- ✅ **Private use** and commercial use
- ✅ **Include** in proprietary software

**Requirements**: Include the original copyright notice and license in any copies or substantial portions of the software.

## Acknowledgments

- Mathematical concepts based on the work of Clifford Pickover and Peter de Jong
- UI components powered by [lil-gui](https://lil-gui.georgealways.com/)
- Built with [Vite](https://vitejs.dev/) for optimal development experience

---

## Documentation
- See `doc/migration-plan.md` for the migration plan.
- See `doc/dev-log.md` for the migration & development log.

## Migration Notice

We are planning to migrate this project to a monorepo structure using React, React Native, and [Tamagui](https://tamagui.dev/) for cross-platform UI. See `doc/migration-plan.md` for details and progress.

The current working example is now preserved in the `current/` directory.
