#include "NativeAttractorCalc.h"
#include <jsi/jsi.h>

namespace facebook::react {

  NativeAttractorCalc::NativeAttractorCalc(std::shared_ptr<CallInvoker> jsInvoker): NativeAttractorCalcCxxSpec(std::move(jsInvoker)) {}

  jsi::Value NativeAttractorCalc::calculateAttractor(
    jsi::Runtime& rt,
    std::string timestamp,
    jsi::Object buffer,
    jsi::Function onProgress,
    jsi::Function onUpdate) {
  // 1. Validate and get the ArrayBuffer
  if (!buffer.isArrayBuffer(rt)) {
    throw jsi::JSError(rt, "Third argument must be an ArrayBuffer.");
  }
  auto arrayBuffer = buffer.getArrayBuffer(rt);
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
        this->jsInvoker_->invokeAsync([
          &runtime, 
          timestamp, 
          onProgressCopy, 
          onUpdateCopy, 
          bufferPtr, 
          bufferSize, 
          resolveFunc, 
          rejectFunc
        ]() {
          try {
            
            // Simulating attractor calculation
            for (int i = 0; i < 10; i++) {
              double progress = (i + 1) / 10.0;
              onProgressCopy->call(runtime, jsi::Value(progress));

              // 2. Write directly into the ArrayBuffer
              // This is a dummy implementation.
              for (size_t j = 0; j < bufferSize; j++) {
                  bufferPtr[j] = static_cast<uint8_t>(i);
              }

              // 3. Call onUpdate with bytes written
              bool done = (i == 9);
              onUpdateCopy->call(runtime, jsi::Value((int)bufferSize), jsi::Value(done));
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