# Simple JSI Example

## The Task

Create a minimal JSI implementation that:
1. Receives a timestamp string from JavaScript
2. Creates an ArrayBuffer in C++
3. Fills the buffer with some numbers
4. Returns the buffer to JavaScript

## Example Usage in JavaScript

```javascript
// Later we'll be able to do this:
const buffer = global.AttractorJSI.fillBuffer("2025-08-02");
const bytes = new Uint8Array(buffer);
console.log(bytes); // [0, 1, 2, 3, ...]
```

## Implementation

### 1. C++ Header (attractor-jsi.h)
```cpp
#pragma once
#include <jsi/jsi.h>

namespace attractorjsi {
  void install(facebook::jsi::Runtime& runtime);
}
```

### 2. C++ Implementation (attractor-jsi.cpp)
```cpp
#include "attractor-jsi.h"

namespace attractorjsi {
  using namespace facebook::jsi;

  // Creates an ArrayBuffer and fills it with bytes
  Value fillBuffer(Runtime& runtime, const std::string& timestamp) {
    // Create buffer with 10 bytes
    auto buffer = runtime.global()
      .getPropertyAsFunction(runtime, "ArrayBuffer")
      .callAsConstructor(runtime, 10);  // 10 bytes
    
    // Get direct access to buffer memory
    auto arrayBuffer = buffer.getObject(runtime).getArrayBuffer(runtime);
    auto* data = arrayBuffer.data(runtime);
    
    // Fill with bytes (just an example)
    uint8_t* bytes = (uint8_t*)data;
    for (int i = 0; i < 10; i++) {
      bytes[i] = i;  // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    }
    
    return buffer;
  }

  void install(Runtime& runtime) {
    auto fillBufferFunc = Function::createFromHostFunction(
      runtime,
      PropNameID::forAscii(runtime, "fillBuffer"),
      1,  // 1 argument
      [](Runtime& runtime, const Value& thisValue, const Value* arguments, size_t count) -> Value {
        std::string timestamp = arguments[0].getString(runtime).utf8(runtime);
        return fillBuffer(runtime, timestamp);
      });

    auto object = Object(runtime);
    object.setProperty(runtime, "fillBuffer", std::move(fillBufferFunc));
    
    runtime.global().setProperty(runtime, "AttractorJSI", std::move(object));
  }
}
```

### 3. TypeScript Interface
```typescript
declare global {
  interface AttractorJSI {
    fillBuffer(timestamp: string): ArrayBuffer;
  }
  
  var AttractorJSI: AttractorJSI;
}
```

## Next Steps

1. [ ] Set up the C++ files
2. [ ] Connect to native build
3. [ ] Test basic functionality

## Testing

```javascript
// In your JavaScript code:
function testAttractorJSI() {
  const buffer = global.AttractorJSI.fillBuffer("2025-08-02");
  const bytes = new Uint8Array(buffer);
  console.log("Bytes from C++:", Array.from(bytes));
  // Should print: Bytes from C++: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
}
```
