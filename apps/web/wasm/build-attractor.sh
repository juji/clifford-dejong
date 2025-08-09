#!/bin/bash

# Build script for attractor-calc.cpp WebAssembly module
echo "Building attractor-calc.wasm..."

# Create output directory if it doesn't exist
mkdir -p ../public/wasm

# --closure 1 \
# Compile the C++ code to WebAssembly
emcc \
  attractor-calc.cpp \
  -std=c++17 \
  -O2 \
  -gsource-map \
  -s WASM=1 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s EXPORTED_RUNTIME_METHODS=['ccall','cwrap'] \
  -s EXPORT_ES6=1 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="AttractorModule" \
  -s ENVIRONMENT='web,worker' \
  -s MALLOC=emmalloc \
  --source-map-base / \
  --closure 1 \
  --bind \
  -o ../public/wasm/attractor-calc.mjs

echo "Build complete. Files generated:"
echo " - ../public/wasm/attractor-calc.mjs"
echo " - ../public/wasm/attractor-calc.wasm"
echo " - ../public/wasm/attractor-calc.wasm.map (source map)"
