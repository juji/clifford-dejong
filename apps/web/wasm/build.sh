#!/bin/bash

# This script compiles the C++ code to WebAssembly

# Make sure emscripten is installed and activated
# If not, the user will need to install emscripten: 
# https://emscripten.org/docs/getting_started/downloads.html

# Check if em++ (emscripten compiler) is available
if ! command -v em++ &> /dev/null; then
    echo "Error: Emscripten compiler (em++) not found!"
    echo "Please install Emscripten from https://emscripten.org/docs/getting_started/downloads.html"
    echo "And ensure it's properly activated in your environment"
    exit 1
fi

# Compile the C++ file to WebAssembly
em++ -O3 \
    -s WASM=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME=HelloModule \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s NO_EXIT_RUNTIME=1 \
    -s EXPORTED_RUNTIME_METHODS=['ccall','cwrap'] \
    --bind \
    -o ../public/hello.js \
    hello.cpp

echo "Compilation complete. Output files are in the public directory."
