#include "NativeAttractorCalc.h"
#include <jsi/jsi.h>
#include <atomic>
#include <thread>
#include <chrono>

namespace facebook::react {

  NativeAttractorCalc::NativeAttractorCalc(std::shared_ptr<CallInvoker> jsInvoker): NativeAttractorCalcCxxSpec(std::move(jsInvoker)) {}

  jsi::Object NativeAttractorCalc::calculateAttractor(
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

  auto onProgressCopy = std::make_shared<jsi::Function>(std::move(onProgress));
  auto onUpdateCopy = std::make_shared<jsi::Function>(std::move(onUpdate));

  // Cancellation flag
  auto cancelled = std::make_shared<std::atomic<bool>>(false);

  // Create a Promise
  auto promiseCtor = rt.global().getPropertyAsFunction(rt, "Promise");
  auto promise = promiseCtor.callAsConstructor(rt,
    jsi::Function::createFromHostFunction(rt,
      jsi::PropNameID::forAscii(rt, "executor"),
      2, // resolve and reject
      [ this, // Capture 'this' to access callInvoker
        timestamp,
        onProgressCopy,
        onUpdateCopy,
        bufferPtr,
        bufferSize,
        cancelled
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
          rejectFunc,
          cancelled
        ]() {
          try {
            // Simulating attractor calculation
            for (int i = 0; i < 10; i++) {
              if (cancelled->load()) {
                throw std::runtime_error("Cancelled");
              }

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

              //sleep for a short duration to simulate work
              std::this_thread::sleep_for(std::chrono::milliseconds(100));
            }

            std::string result = "Attractor calculation completed for timestamp: " + timestamp;
            resolveFunc->call(runtime, jsi::String::createFromUtf8(runtime, result));
          } catch (const std::exception& e) {
            rejectFunc->call(runtime, jsi::String::createFromUtf8(runtime, e.what()));
          }
        });

        return jsi::Value::undefined();
      }));

  // Create cancel function
  auto cancelFunc = jsi::Function::createFromHostFunction(rt,
    jsi::PropNameID::forAscii(rt, "cancel"),
    0,
    [cancelled](jsi::Runtime&, const jsi::Value&, const jsi::Value* , size_t) -> jsi::Value {
      cancelled->store(true);
      return jsi::Value::undefined();
    });

  // Return an object with promise and cancel properties
  jsi::Object result(rt);
  result.setProperty(rt, "promise", promise);
  result.setProperty(rt, "cancel", cancelFunc);

  return result;
}

} // namespace facebook::react