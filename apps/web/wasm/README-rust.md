# Rust WebAssembly Attractor Calculator

This is a Rust implementation of the attractor calculator, compiled to WebAssembly for high-performance calculations in web browsers.

## Features

- **High Performance**: Rust's zero-cost abstractions and memory safety
- **WebAssembly Target**: Compiles to efficient WASM for browser execution
- **Same API**: Compatible interface with the existing C++ implementation
- **Memory Safe**: Rust's ownership system prevents common memory errors
- **Modern Tooling**: Uses `wasm-bindgen` for seamless JS interop

## Prerequisites

1. **Install Rust**: https://rustup.rs/
2. **Install wasm-pack**: 
   ```bash
   curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
   ```

## Building

Run the build script:
```bash
./build-rust.sh
```

This will generate:
- `attractor-calc-rust.mjs` - WebAssembly module interface
- `attractor-calc-rust.wasm` - Compiled WebAssembly binary

## Usage

Import and use the Rust module similar to the C++ version:

```javascript
import init, { 
    calculate_attractor_loop, 
    get_build_number 
} from "./attractor-calc-rust.mjs";

// Initialize the WASM module
await init();

// Use the calculator
const result = calculate_attractor_loop({
    attractorParams: {
        attractor: "clifford",
        a: -1.4, b: 1.6, c: 1.0, d: 0.7,
        hue: 200, saturation: 100, brightness: 100,
        background: [0, 0, 0, 255],
        scale: 100, left: 0, top: 0
    },
    densityBuffer: densityBuffer,
    infoBuffer: infoBuffer,
    imageBuffer: imageBuffer,
    highQuality: true,
    pointsToCalculate: 1000000,
    width: 800,
    height: 800,
    x: 0, y: 0,
    loopNum: 100,
    drawAt: 50000
});
```

## Performance Benefits

- **Faster execution**: Rust compiles to highly optimized WASM
- **Memory efficiency**: Zero-copy operations where possible
- **Parallel potential**: Ready for future WebAssembly threading
- **Predictable performance**: No garbage collection pauses

## API Compatibility

The Rust implementation maintains the same interface as the C++ version:

- `calculate_attractor_loop(context)` - Main calculation function
- `get_build_number()` - Returns version string
- Same parameter structure and return values

## Advantages over C++

1. **Memory Safety**: No segfaults or buffer overflows
2. **Modern Language**: Better abstractions and error handling
3. **Ecosystem**: Rich crate ecosystem for additional features
4. **Tooling**: Excellent debugging and profiling tools
5. **Maintainability**: More readable and maintainable code

## File Structure

- `attractor-calc.rs` - Main Rust implementation
- `Cargo.toml` - Rust package configuration
- `build-rust.sh` - Build script
- `pkg/` - Generated WebAssembly output (created after build)

## Development

For development builds with debug info:
```bash
wasm-pack build --target web --out-dir pkg --dev
```

For optimization analysis:
```bash
wasm-pack build --target web --out-dir pkg --release -- --features console_error_panic_hook
```
