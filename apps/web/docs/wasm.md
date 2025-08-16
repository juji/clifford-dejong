# WebAssembly Integration Requirements

## Overview

This document outlines the requirements and implementation details for WebAssembly integration in the Clifford-deJong project.

## Requirements

Create a way to edit a sharedArrayBuffer in c++ 

 - An array buffer of 8 number is created in the main process
 - it will then be transferred to the worker
 - in the worker.. it shared with c++ and c++ will fill the buffer with 8's
 - when it is done, a message to the main process is sent, telling that the data is complete.
 - the main process (in app/new/page.tsx) now can show the contents of the sharedArrayBuffer to the screen

## Implementation Strategy

### Step 1: Update C++ Code
1. Modify `hello.cpp` to add a new function that works with SharedArrayBuffer
2. Create function that accepts a pointer to memory and length
3. Implement the logic to fill the memory with 8's
4. Expose the function via Emscripten bindings

### Step 2: Update Build Script
1. Ensure the build script includes necessary flags for SharedArrayBuffer support
2. Add `-pthread` flag to enable threading support
3. Add `-s ALLOW_MEMORY_GROWTH=1` (already present) for dynamic memory allocation
4. Verify `-s ENVIRONMENT='web,worker'` is set (already present)

### Step 3: Update Worker Implementation
1. Modify `wasm-worker.js` to handle new message types for SharedArrayBuffer
2. Implement receiving the SharedArrayBuffer from main thread
3. Pass the SharedArrayBuffer to the WebAssembly module
4. Send completion message back to main thread

### Step 4: Update Main Thread Component
1. Add SharedArrayBuffer detection and creation in `app/new/page.tsx`
2. Implement cross-origin isolation check (required for SharedArrayBuffer)
3. Create message passing logic for worker communication
4. Add UI to display the SharedArrayBuffer contents

### Step 5: Handle Cross-Origin Isolation
1. Configure Next.js headers for Cross-Origin Embedder Policy (COEP)
2. Configure Cross-Origin Opener Policy (COOP)
3. Add fallback for browsers without SharedArrayBuffer support

### Step 6: Testing and Validation
1. Test in different browsers to ensure compatibility
2. Verify memory is correctly shared and modified
3. Check for any memory leaks or performance issues

## References

- [Emscripten Documentation](https://emscripten.org/docs/index.html)
- [WebAssembly MDN Documentation](https://developer.mozilla.org/en-US/docs/WebAssembly)
- [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
