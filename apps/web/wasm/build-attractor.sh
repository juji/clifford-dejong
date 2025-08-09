#!/bin/bash

# Build script for attractor-calc.cpp WebAssembly module
echo "Building attractor-calc.wasm..."

# Create output directory if it doesn't exist
mkdir -p ../public/wasm

# Compile the C++ code to WebAssembly
emcc \
  attractor-calc.cpp \
  -std=c++17 \
  -O3 \
  -s WASM=1 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s EXPORTED_RUNTIME_METHODS=['ccall','cwrap'] \
  -s EXPORT_ES6=1 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="AttractorModule" \
  -s ENVIRONMENT='web' \
  -s MALLOC=emmalloc \
  --bind \
  -o ../public/wasm/attractor-calc.mjs

echo "Build complete. Files generated:"
echo " - ../public/wasm/attractor-calc.mjs"
echo " - ../public/wasm/attractor-calc.wasm"
