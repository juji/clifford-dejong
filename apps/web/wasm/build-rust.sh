#!/bin/bash

# Build script for Rust WebAssembly attractor calculator
set -e

echo "Building Rust WebAssembly module..."

# Build with wasm-pack
wasm-pack build --target web --out-dir pkg --release

# Copy generated files to the public/wasm directory
cp pkg/attractor_calc.js ../public/wasm/attractor-calc-rust.mjs
cp pkg/attractor_calc_bg.wasm ../public/wasm/attractor-calc-rust.wasm

echo "Rust WebAssembly build complete!"
echo "Generated files:"
echo "  - ../public/wasm/attractor-calc-rust.mjs"
echo "  - ../public/wasm/attractor-calc-rust.wasm"
