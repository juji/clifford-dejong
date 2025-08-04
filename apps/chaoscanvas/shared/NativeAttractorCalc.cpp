#include "NativeAttractorCalc.h"
#include "attractors.h"
#include <jsi/jsi.h>
#include <atomic>
#include <thread>
#include <chrono>
#include <cmath>
#include <vector>
#include <functional>
#include <tuple>
#include <algorithm>

namespace facebook::react {


  NativeAttractorCalc::NativeAttractorCalc(std::shared_ptr<CallInvoker> jsInvoker): NativeAttractorCalcCxxSpec(std::move(jsInvoker)) {}

  jsi::Object NativeAttractorCalc::calculateAttractor(
    jsi::Runtime& rt,
    std::string timestamp,
    jsi::Object buffer,
    jsi::Object paramsAttractor,
    int width,
    int height,
    int drawOn,
    bool highQuality,
    int totalAttractorPoints,
    int pointsPerIteration,
    jsi::Function onProgress,
    jsi::Function onImageUpdate
  ) {

    // 0. Parse AttractorParameters
    // attractors::AttractorParameters attractorParams;
    // attractorParams.attractor = paramsAttractor.getProperty(rt, "attractor").asString(rt).utf8(rt);
    // attractorParams.a = paramsAttractor.getProperty(rt, "a").asNumber();
    // attractorParams.b = paramsAttractor.getProperty(rt, "b").asNumber();
    // attractorParams.c = paramsAttractor.getProperty(rt, "c").asNumber();
    // attractorParams.d = paramsAttractor.getProperty(rt, "d").asNumber();
    // attractorParams.hue = paramsAttractor.getProperty(rt, "hue").asNumber();
    // attractorParams.saturation = paramsAttractor.getProperty(rt, "saturation").asNumber();
    // attractorParams.brightness = paramsAttractor.getProperty(rt, "brightness").asNumber();
    // attractorParams.scale = paramsAttractor.getProperty(rt, "scale").asNumber();
    // attractorParams.left = paramsAttractor.getProperty(rt, "left").asNumber();
    // attractorParams.top = paramsAttractor.getProperty(rt, "top").asNumber();

    jsi::Array backgroundArray = paramsAttractor.getProperty(rt, "background").asObject(rt).asArray(rt);
    std::vector<int> backgroundVec;
    for (size_t i = 0; i < backgroundArray.size(rt); ++i) {
      backgroundVec.push_back(static_cast<int>(backgroundArray.getValueAtIndex(rt, i).asNumber()));
    }
    // attractorParams.background = backgroundVec;

    // 1. Validate and get the ArrayBuffer
    if (!buffer.isArrayBuffer(rt)) {
      throw jsi::JSError(rt, "Third argument must be an ArrayBuffer.");
    }
    auto arrayBuffer = buffer.getArrayBuffer(rt);
    uint8_t* bufferPtr = arrayBuffer.data(rt);
    size_t bufferSize = arrayBuffer.size(rt);

    auto onProgressCopy = std::make_shared<jsi::Function>(std::move(onProgress));
    auto onImageUpdateCopy = std::make_shared<jsi::Function>(std::move(onImageUpdate));
    // auto attractorParamsCopy = std::make_shared<attractors::AttractorParameters>(std::move(attractorParams));
    auto widthCopy = std::make_shared<int>(width);
    auto heightCopy = std::make_shared<int>(height);
    auto drawOnCopy = std::make_shared<int>(drawOn);
    auto highQualityCopy = std::make_shared<bool>(highQuality);
    auto totalAttractorPointsCopy = std::make_shared<int>(totalAttractorPoints);
    auto pointsPerIterationCopy = std::make_shared<int>(pointsPerIteration);

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
        onImageUpdateCopy,
        bufferPtr,
        bufferSize,
        cancelled,
        // attractorParamsCopy,
        widthCopy,
        heightCopy,
        drawOnCopy,
        highQualityCopy,
        totalAttractorPointsCopy,
        pointsPerIterationCopy
      ](jsi::Runtime& runtime, const jsi::Value&, const jsi::Value* args, size_t count) -> jsi::Value {
        auto resolveFunc = std::make_shared<jsi::Function>(args[0].asObject(runtime).asFunction(runtime));
        auto rejectFunc = std::make_shared<jsi::Function>(args[1].asObject(runtime).asFunction(runtime));

        // Manually create a thread to run the calculation in the background
        std::thread([
          this,
          &runtime,
          timestamp,
          onProgressCopy,
          onImageUpdateCopy,
          bufferPtr,
          bufferSize,
          resolveFunc,
          rejectFunc,
          cancelled,
          // attractorParamsCopy,
          widthCopy,
          heightCopy,
          drawOnCopy,
          highQualityCopy,
          totalAttractorPointsCopy,
          pointsPerIterationCopy
        ]() {
          try {

            if (cancelled->load()) {
              // When cancelled, reject the promise from the JS thread
              this->jsInvoker_->invokeAsync([&runtime, rejectFunc]() {
                rejectFunc->call(runtime, jsi::String::createFromUtf8(runtime, "Cancelled from C++"));
              });
              return; // Exit the thread
            }

            // get attractor function
            // auto attractorFunc = attractors::get_attractor_function(*attractorParamsCopy);

            // Initialize calculation variables
            std::vector<uint32_t> density(*widthCopy * *heightCopy, 0);
            // double max_density = 0.0;
            // double x = 0.0, y = 0.0;
            // double centerX = *widthCopy / 2.0 + attractorParamsCopy->left;
            // double centerY = *heightCopy / 2.0 + attractorParamsCopy->top;

            // int totalPoints = 0;
            // while(totalPoints < *totalAttractorPointsCopy) {

            //   if (cancelled->load()) {
            //     // When cancelled, reject the promise from the JS thread
            //     this->jsInvoker_->invokeAsync([&runtime, rejectFunc]() {
            //       rejectFunc->call(runtime, jsi::String::createFromUtf8(runtime, "Cancelled"));
            //     });
            //     return; // Exit the thread
            //   }
              
            //   int i = 0;

            //   // Perform calculations
            //   while(i < *pointsPerIterationCopy && totalPoints < *totalAttractorPointsCopy) {

            //     if (cancelled->load()) {
            //       // When cancelled, reject the promise from the JS thread
            //       this->jsInvoker_->invokeAsync([&runtime, rejectFunc]() {
            //         rejectFunc->call(runtime, jsi::String::createFromUtf8(runtime, "Cancelled"));
            //       });
            //       return; // Exit the thread
            //     }
                
            //     attractors::AccumulationContext context = {
            //       .density = density,
            //       .max_density = max_density,
            //       .x = x,
            //       .y = y,
            //       .totalPoints = totalPoints,
            //       .pointsPerIteration = *pointsPerIterationCopy,
            //       .w = *widthCopy,
            //       .h = *heightCopy,
            //       .scale = attractorParamsCopy->scale,
            //       .a = attractorParamsCopy->a,
            //       .b = attractorParamsCopy->b,
            //       .c = attractorParamsCopy->c,
            //       .d = attractorParamsCopy->d,
            //       .centerX = centerX,
            //       .centerY = centerY,
            //       .totalAttractorPoints = *totalAttractorPointsCopy,
            //       .fn = attractorFunc
            //     };
            //     attractors::accumulate_density(context);

            //     // on time, draw on the canvas
            //     if (
            //       totalPoints == 2 ||
            //       totalPoints % *drawOnCopy == 0 ||
            //       totalPoints == *totalAttractorPointsCopy - 1
            //     ) {

            //       if (cancelled->load()) {
            //         // When cancelled, reject the promise from the JS thread
            //         this->jsInvoker_->invokeAsync([&runtime, rejectFunc]() {
            //           rejectFunc->call(runtime, jsi::String::createFromUtf8(runtime, "Cancelled"));
            //         });
            //         return; // Exit the thread
            //       }

            //       // Draw the current state on the canvas
            //       attractors::ImageDataCreationContext imageContext = {
            //         .imageData = reinterpret_cast<uint32_t*>(bufferPtr),
            //         .imageSize = bufferSize / sizeof(uint32_t),
            //         .density = density,
            //         .max_density = max_density,
            //         .h = attractorParamsCopy->hue,
            //         .s = attractorParamsCopy->saturation,
            //         .v = attractorParamsCopy->brightness,
            //         .hQuality = *highQualityCopy,
            //         .background = attractorParamsCopy->background
            //       };
            //       attractors::create_image_data(imageContext);

            //     }

            //     // update progress
            //     double progress = totalPoints / *totalAttractorPointsCopy;
            //     onProgressCopy->call(runtime, jsi::Value(progress));

            //     i++;
            //     totalPoints++;
            //   }

            // }


            // Simulating attractor calculation
            for (int i = 0; i < 10; i++) {
              if (cancelled->load()) {
                // When cancelled, reject the promise from the JS thread
                this->jsInvoker_->invokeAsync([&runtime, rejectFunc]() {
                  rejectFunc->call(runtime, jsi::String::createFromUtf8(runtime, "Cancelled from C++"));
                });
                return; // Exit the thread
              }

              // sleep for a short duration to simulate work on the background thread
              std::this_thread::sleep_for(std::chrono::milliseconds(100));

              // Schedule progress and update callbacks on the JS thread
              if (cancelled->load()) {
                // When cancelled, reject the promise from the JS thread
                this->jsInvoker_->invokeAsync([&runtime, rejectFunc]() {
                  rejectFunc->call(runtime, jsi::String::createFromUtf8(runtime, "Cancelled from C++"));
                });
                return; // Exit the thread
              }

              double progress = (i + 1) / 10.0;
              onProgressCopy->call(runtime, jsi::Value(progress));

              // This is a dummy implementation.
              for (size_t j = 0; j < bufferSize; j++) {
                  bufferPtr[j] = static_cast<uint8_t>(i);
              }

              bool done = (i == 9);
              onImageUpdateCopy->call(runtime, jsi::Value(done));
            }

            // Schedule the final resolution on the JS thread
            this->jsInvoker_->invokeAsync([&runtime, resolveFunc, timestamp, cancelled]() {
              if (cancelled->load()) return;
              std::string result = "Attractor calculation completed for timestamp: " + timestamp;
              resolveFunc->call(runtime, jsi::String::createFromUtf8(runtime, result));
            });

          } catch (const std::exception& e) {
            std::string error_message = e.what();
            // Schedule rejection on the JS thread
            this->jsInvoker_->invokeAsync([&runtime, rejectFunc, error_message]() {
              rejectFunc->call(runtime, jsi::String::createFromUtf8(runtime, error_message));
            });
          }
        }).detach(); // Detach the thread to allow the JS function to return immediately

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