// wasm-worker.js
// This worker loads and runs the WebAssembly module

let wasmModule = null;

// Handle messages from the main thread
self.addEventListener("message", async (event) => {
  const { type, data } = event.data;

  switch (type) {
    case "init":
      // Load the WebAssembly module
      try {
        // We need to fetch and instantiate the module manually in the worker
        if (!wasmModule) {
          importScripts("/hello.js");
          // @ts-ignore - HelloModule is loaded globally by importScripts
          wasmModule = await self.HelloModule();
          self.postMessage({ type: "initialized", success: true });
        }
      } catch (error) {
        self.postMessage({
          type: "error",
          message: "Failed to initialize WebAssembly module",
          error: error.toString(),
        });
      }
      break;

    case "getGreeting":
      if (wasmModule) {
        try {
          const greeting = wasmModule.getGreeting();
          self.postMessage({ type: "greeting", result: greeting });
        } catch (error) {
          self.postMessage({
            type: "error",
            message: "Error calling WebAssembly function",
            error: error.toString(),
          });
        }
      } else {
        self.postMessage({
          type: "error",
          message: "WebAssembly module not initialized",
        });
      }
      break;

    default:
      self.postMessage({
        type: "error",
        message: `Unknown message type: ${type}`,
      });
  }
});
