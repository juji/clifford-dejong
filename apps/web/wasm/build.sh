#!/bin/bash

# This script compiles the C++ code to WebAssembly

# Default to production mode
DEBUG_MODE=0
VERBOSE=0

# Parse arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --debug) DEBUG_MODE=1; shift ;;
    --verbose) VERBOSE=1; shift ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
done

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

# Print banner
echo "==============================================" 
echo " Clifford-deJong WebAssembly Module Builder"
echo "=============================================="
echo

OPTIMIZATION="-O2"
DEBUG_FLAGS="-gsource-map -s ASSERTIONS=2 -s STACK_OVERFLOW_CHECK=1 -s SAFE_HEAP=1"

# Set compilation flags based on mode
if [ $DEBUG_MODE -eq 1 ]; then
    echo "🔍 Building in DEBUG mode..."
    SOURCE_MAPS="--source-map-base http://localhost:3000/"
    MINIFY=""
else
    echo "🚀 Building in PRODUCTION mode..."
    SOURCE_MAPS="--source-map-base /"
    MINIFY="--closure 1"
fi

# Print build info if verbose
if [ $VERBOSE -eq 1 ]; then
    echo "Build configuration:"
    echo "- Optimization level: $OPTIMIZATION"
    echo "- Debug flags: $DEBUG_FLAGS"
    echo "- Source maps: $SOURCE_MAPS"
    echo "- C++ source: hello.cpp"
    echo "- Output file: ../public/hello.js"
    echo
fi

# Create output directory if it doesn't exist
mkdir -p ../public

# Compile the C++ file to WebAssembly
em++ $OPTIMIZATION \
    -s WASM=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME=HelloModule \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s NO_EXIT_RUNTIME=1 \
    -s EXPORTED_RUNTIME_METHODS=['ccall','cwrap'] \
    -s ENVIRONMENT='web,worker' \
    $DEBUG_FLAGS \
    $SOURCE_MAPS \
    $MINIFY \
    --bind \
    -o ../public/hello.js \
    hello.cpp

# Check if compilation was successful
if [ $? -eq 0 ]; then
    echo "✅ Compilation successful! Output files are in the public directory:"
    echo "   - ../public/hello.js"
    echo "   - ../public/hello.wasm"
    
    # Generate TypeScript definition file
    cat > hello.d.ts << EOL
declare module 'hello' {
  interface HelloModule {
    getGreeting(): string;
    ccall(funcName: string, returnType: string, argTypes: string[], args: any[]): any;
    cwrap(funcName: string, returnType: string, argTypes: string[]): (...args: any[]) => any;
  }

  interface HelloModuleFactory {
    (): Promise<HelloModule>;
  }

  const HelloModule: HelloModuleFactory;
  export default HelloModule;
}
EOL
    echo "   - hello.d.ts (TypeScript definitions)"
else
    echo "❌ Compilation failed!"
    exit 1
fi
