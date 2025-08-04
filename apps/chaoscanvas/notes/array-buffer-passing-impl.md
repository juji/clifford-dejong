# Implementing ArrayBuffer Passing for Attractor Calculation

This guide outlines the necessary changes to switch from passing pixel data as a string to using a shared `ArrayBuffer` for zero-copy data transfer between JavaScript and C++.

This approach is significantly more performant as it avoids the overhead of string conversion and data copying.

### Step 1: Update the TypeScript Layer

In `calculate-attractor-native.ts`, we will create the `ArrayBuffer` and pass it to the native module. The `onUpdate` callback will now receive the number of bytes written in the latest batch.

**File: `apps/chaoscanvas/src/lib/calculate-attractor-native.ts`**

```typescript
import NativeAttractorCalc from '@specs/NativeAttractorCalc';

// Define a constant for the buffer size for clarity
const POINT_COUNT = 1000000;
// Assuming each point is represented by 4 int (r, g, b, a)
const BYTES_PER_POINT = 4 * 4;
const BUFFER_SIZE = POINT_COUNT * BYTES_PER_POINT;


export type AttractorCalcModuleParams = {
  timestamp: string;
  onProgress?: (progress: number) => void;
  // The onUpdate callback now receives the number of new bytes written
  onUpdate?: (bytesWritten: number, done: boolean) => void;
};

export function calculateAttractorNative(
  params: AttractorCalcModuleParams,
): Promise<string> {
  // Create the ArrayBuffer that will be written to by the C++ code.
  const sharedBuffer = new ArrayBuffer(BUFFER_SIZE);

  const onProgress =
    params.onProgress ||
    ((progress: number) => {
      console.log('Progress:', Math.round(progress * 100) + '%');
    });

  const onUpdate =
    params.onUpdate ||
    ((bytesWritten: number, done: boolean) => {
      // The JS side can now access the updated `sharedBuffer` directly.
      // For example, create a view on the buffer to read the data.
      const dataView = new Uint8Array(sharedBuffer, 0, bytesWritten / 4);
      console.log(
        'Update received, bytes written:',
        bytesWritten,
        'done:',
        done,
        'First point x:',
        dataView.length > 0 ? dataView[0] : 'N/A'
      );
    });

  // Pass the sharedBuffer to the native function.
  return NativeAttractorCalc.calculateAttractor(
    params.timestamp,
    sharedBuffer, // Pass the buffer here
    onProgress,
    onUpdate,
  );
}
```

### Step 2: Update the C++ TurboModule

In `NativeAttractorCalc.cpp`, we'll modify the `calculateAttractor` function to accept the `ArrayBuffer`, write to it directly, and update the `onUpdate` callback.

**File: `apps/chaoscanvas/shared/NativeAttractorCalc.h` (Interface Guess)**

```cpp
#pragma once

#include <memory>
#include "NativeAttractorCalc.h" // Assuming this is the generated spec header

namespace facebook::react {

class NativeAttractorCalc : public NativeAttractorCalcCxxSpec<NativeAttractorCalc> {
 public:
  NativeAttractorCalc(std::shared_ptr<CallInvoker> jsInvoker);

  jsi::Value calculateAttractor(
      jsi::Runtime& rt,
      std::string timestamp,
      jsi::Value buffer, // Changed from string to jsi::Value
      jsi::Function onProgress,
      jsi::Function onUpdate);
};

} // namespace facebook::react
```

**File: `apps/chaoscanvas/shared/NativeAttractorCalc.cpp` (Implementation)**

```cpp
#include "NativeAttractorCalc.h"
#include <jsi/jsi.h>
#include <vector> // For dummy data generation

namespace facebook::react {

NativeAttractorCalc::NativeAttractorCalc(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeAttractorCalcCxxSpec(std::move(jsInvoker)) {}

jsi::Value NativeAttractorCalc::calculateAttractor(
    jsi::Runtime& rt,
    std::string timestamp,
    jsi::Value buffer, // Accept a jsi::Value
    jsi::Function onProgress,
    jsi::Function onUpdate) {
  // 1. Validate and get the ArrayBuffer
  if (!buffer.isObject() || !buffer.asObject(rt).isArrayBuffer(rt)) {
    throw jsi::JSError(rt, "Third argument must be an ArrayBuffer.");
  }
  auto arrayBuffer = buffer.asObject(rt).getArrayBuffer(rt);
  uint8_t* bufferPtr = arrayBuffer.data(rt);
  size_t bufferSize = arrayBuffer.size(rt);

  auto promiseCtor = rt.global().getPropertyAsFunction(rt, "Promise");
  auto onProgressCopy = std::make_shared<jsi::Function>(std::move(onProgress));
  auto onUpdateCopy = std::make_shared<jsi::Function>(std::move(onUpdate));

  auto promise = promiseCtor.callAsConstructor(rt,
    jsi::Function::createFromHostFunction(rt,
      jsi::PropNameID::forAscii(rt, "executor"),
      2, // resolve and reject
      [ this, // Capture 'this' to access callInvoker
        timestamp,
        onProgressCopy,
        onUpdateCopy,
        bufferPtr,
        bufferSize
      ](jsi::Runtime& runtime, const jsi::Value&, const jsi::Value* args, size_t count) -> jsi::Value {
        auto resolveFunc = std::make_shared<jsi::Function>(args[0].asObject(runtime).asFunction(runtime));
        auto rejectFunc = std::make_shared<jsi::Function>(args[1].asObject(runtime).asFunction(runtime));

        // Example of async work using the callInvoker
        this->jsInvoker_->invokeAsync([&runtime, timestamp, onProgressCopy, onUpdateCopy, bufferPtr, bufferSize, resolveFunc, rejectFunc]() {
          try {
            size_t bytesWritten = 0;
            // Simulating attractor calculation
            for (int i = 0; i < 10; i++) {
              double progress = (i + 1) / 10.0;
              onProgressCopy->call(runtime, jsi::Value(progress));

              // 2. Write directly into the ArrayBuffer
              // This is a dummy implementation. A real implementation would write float data.
              size_t batch_size = 100;
              if (bytesWritten + batch_size > bufferSize) {
                  // Handle buffer overflow error
                  break;
              }
              for (size_t j = 0; j < batch_size; j++) {
                  bufferPtr[bytesWritten + j] = static_cast<uint8_t>((i * j) % 256);
              }
              bytesWritten += batch_size;

              // 3. Call onUpdate with bytes written
              bool done = (i == 9);
              onUpdateCopy->call(runtime, jsi::Value((int)bytesWritten), jsi::Value(done));
            }

            std::string result = "Attractor calculation completed for timestamp: " + timestamp;
            resolveFunc->call(runtime, jsi::String::createFromUtf8(runtime, result));
          } catch (const std::exception& e) {
            rejectFunc->call(runtime, jsi::String::createFromUtf8(runtime, e.what()));
          }
        });

        return jsi::Value::undefined();
      }));

  return promise;
}

} // namespace facebook::react
```

### Summary of Changes

1.  **JS owns the memory:** The `ArrayBuffer` is created and owned by JavaScript, which is a cleaner pattern.
2.  **Zero-Copy:** The C++ code gets a direct pointer to the JS memory (`bufferPtr`). There is no serialization or copying.
3.  **Efficient Updates:** Instead of sending large strings, C++ writes directly to the buffer, and JS just needs a small notification (`onUpdate`) to know that new data is available to be rendered.
4.  **Asynchronous Execution:** The example above includes a basic `invokeAsync` to show how this can be moved off the main JS thread. The actual calculation loop would run within that lambda.
