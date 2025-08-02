#include "NativeAttractorCalc.h"
#include <jsi/jsi.h>

namespace facebook::react {

  NativeAttractorCalc::NativeAttractorCalc(std::shared_ptr<CallInvoker> jsInvoker): NativeAttractorCalcCxxSpec(std::move(jsInvoker)) {}

  jsi::Value NativeAttractorCalc::calculateAttractor(jsi::Runtime& rt, std::string timestamp) {
    // Create a Promise using JSI directly
    
    // Get the Promise constructor from global
    auto promiseCtor = rt.global().getPropertyAsFunction(rt, "Promise");
    
    // Create a new Promise
    auto promise = promiseCtor.callAsConstructor(rt, 
      jsi::Function::createFromHostFunction(rt, 
        jsi::PropNameID::forAscii(rt, "executor"),
        2,  // resolve and reject
        [timestamp](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
          if (count < 2) {
            throw jsi::JSError(rt, "Promise executor received less than 2 arguments");
          }
          
          auto resolveFunc = args[0].asObject(rt).asFunction(rt);
          auto rejectFunc = args[1].asObject(rt).asFunction(rt);
          
          try {
            // Implement your attractor calculation logic here
            std::string result = "Attractor calculated for timestamp: " + timestamp;
            
            // Resolve the promise with the result
            resolveFunc.call(rt, jsi::String::createFromUtf8(rt, result));
          } catch (const std::exception& e) {
            // Reject the promise if there's an error
            rejectFunc.call(rt, jsi::String::createFromUtf8(rt, e.what()));
          }
          
          return jsi::Value::undefined();
        }));
    
    return promise;
  }

} // namespace facebook::react