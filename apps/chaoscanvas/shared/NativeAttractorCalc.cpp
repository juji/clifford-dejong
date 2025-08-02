#include "NativeAttractorCalc.h"
#include <jsi/jsi.h>

namespace facebook::react {

  NativeAttractorCalc::NativeAttractorCalc(std::shared_ptr<CallInvoker> jsInvoker): NativeAttractorCalcCxxSpec(std::move(jsInvoker)) {}

  jsi::Value NativeAttractorCalc::calculateAttractor(jsi::Runtime& rt, std::string timestamp, jsi::Function onProgress, jsi::Function onUpdate) {
    // Create a Promise using JSI directly
    
    // Get the Promise constructor from global
    auto promiseCtor = rt.global().getPropertyAsFunction(rt, "Promise");
    
    // Store copies of the callback functions
    auto onProgressCopy = std::make_shared<jsi::Function>(std::move(onProgress));
    auto onUpdateCopy = std::make_shared<jsi::Function>(std::move(onUpdate));
    
    // Create a new Promise
    auto promise = promiseCtor.callAsConstructor(rt, 
      jsi::Function::createFromHostFunction(rt, 
        jsi::PropNameID::forAscii(rt, "executor"),
        2,  // resolve and reject
        [timestamp, onProgressCopy, onUpdateCopy](jsi::Runtime& runtime, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
          if (count < 2) {
            throw jsi::JSError(runtime, "Promise executor received less than 2 arguments");
          }
          
          auto resolveFunc = args[0].asObject(runtime).asFunction(runtime);
          auto rejectFunc = args[1].asObject(runtime).asFunction(runtime);
          
          try {
            // Simulating attractor calculation with progress updates
            for (int i = 0; i < 10; i++) {
              // Calculate progress (0-1)
              double progress = (i + 1) / 10.0;
              
              // Call progress callback
              onProgressCopy->call(runtime, jsi::Value(progress));
              
              // Generate some dummy pixel data as uint8 values
              std::vector<uint8_t> pixels;
              for (int j = 0; j < 100; j++) {
                pixels.push_back(static_cast<uint8_t>((i * j) % 256));
              }
              
              // Convert the uint8 array to a comma-separated string
              std::string pixelString;
              for (size_t j = 0; j < pixels.size(); j++) {
                pixelString += std::to_string(pixels[j]);
                if (j < pixels.size() - 1) {
                  pixelString += ",";
                }
              }
              
              // Call update callback with pixel data and done flag
              bool done = (i == 9);  // Done on last iteration
              onUpdateCopy->call(runtime, jsi::String::createFromUtf8(runtime, pixelString), jsi::Value(done));
            }
            
            std::string result = "Attractor calculation completed for timestamp: " + timestamp;
            
            // Resolve the promise with the result
            resolveFunc.call(runtime, jsi::String::createFromUtf8(runtime, result));
          } catch (const std::exception& e) {
            // Reject the promise if there's an error
            rejectFunc.call(runtime, jsi::String::createFromUtf8(runtime, e.what()));
          }
          
          return jsi::Value::undefined();
        }));
    
    return promise;
  }

} // namespace facebook::react