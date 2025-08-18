#!/bin/bash

# Build script for attractor-calc.cpp WebAssembly module
echo "Building attractor-calc.wasm..."

# Exit on error
set -e

# Create output directory if it doesn't exist
mkdir -p ../public/wasm

# --closure 1 \
# Compile the C++ code to WebAssembly
emcc \
  attractor-calc.cpp \
  -std=c++17 \
  -O3 \
  -gsource-map \
  -s WASM=1 \
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

# Check if build was successful
if [ $? -ne 0 ]; then
  echo "Error: Build failed!"
  exit 1
fi

echo "Build complete. Files generated:"
echo " - ../public/wasm/attractor-calc.mjs"
echo " - ../public/wasm/attractor-calc.wasm"
echo " - ../public/wasm/attractor-calc.wasm.map (source map)"
exit 0
