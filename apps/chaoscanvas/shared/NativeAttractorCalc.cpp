#include "NativeAttractorCalc.h"
// #include "attractors.h"
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

std::string version = "1.0.1";

// A C++ implementation of the BezierEasing function from the original JS.
// It returns a lambda function that calculates the easing.
std::function<double(double)> NativeAttractorCalc::bezier_easing(double p0, double p1, double p2, double p3) {
    auto A = [](double aA1, double aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; };
    auto B = [](double aA1, double aA2) { return 3.0 * aA2 - 6.0 * aA1; };
    auto C = [](double aA1) { return 3.0 * aA1; };

    auto calc_bezier = [&](double t, double aA1, double aA2) {
        return ((A(aA1, aA2) * t + B(aA1, aA2)) * t + C(aA1)) * t;
    };

    auto get_slope = [&](double t, double aA1, double aA2) {
        return 3.0 * A(aA1, aA2) * t * t + 2.0 * B(aA1, aA2) * t + C(aA1);
    };

    auto get_t_for_x = [&](double aX) {
        double aGuessT = aX;
        for (int i = 0; i < 4; ++i) {
            double currentSlope = get_slope(aGuessT, p0, p2);
            if (currentSlope == 0.0) return aGuessT;
            double currentX = calc_bezier(aGuessT, p0, p2) - aX;
            aGuessT -= currentX / currentSlope;
        }
        return aGuessT;
    };

    return [=](double x) {
        if (x <= 0.0) return 0.0;
        if (x >= 1.0) return 1.0;
        return calc_bezier(get_t_for_x(x), p1, p3);
    };
}

RGB NativeAttractorCalc::hsv_to_rgb(double h, double s, double v) {
    h = std::max(0.0, std::min(359.0, h));
    s = std::max(0.0, std::min(100.0, s)) / 100.0;
    v = std::max(0.0, std::min(100.0, v)) / 100.0;

    if (s == 0.0) {
        int val = std::round(v * 255);
        return {val, val, val};
    }

    h /= 60.0;
    int i = std::floor(h);
    double f = h - i;
    double p = v * (1.0 - s);
    double q = v * (1.0 - s * f);
    double t = v * (1.0 - s * (1.0 - f));

    double r, g, b;
    switch (i) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        default: r = v; g = p; b = q; break;
    }

    return {
        static_cast<int>(std::round(r * 255)),
        static_cast<int>(std::round(g * 255)),
        static_cast<int>(std::round(b * 255))
    };
}

uint32_t NativeAttractorCalc::get_color_data(
  double density,
  double max_density,
  double h,
  double s,
  double v,
  double progress,
  const std::vector<int>& background
) {
    if (max_density <= 1.0) max_density = 1.01; // prevent log(1) = 0
    if (density <= 0) return 0;

    auto saturation_bezier = bezier_easing(0.79, -0.34, 0.54, 1.18);
    auto density_bezier = bezier_easing(0.75, 0.38, 0.24, 1.33);
    auto opacity_bezier = bezier_easing(0.24, 0.27, 0.13, 0.89);

    double mdens = std::log(max_density);
    double pdens = std::log(density);

    RGB rgb = hsv_to_rgb(
        h,
        s - std::max(0.0, std::min(1.0, saturation_bezier(pdens / mdens))) * s,
        v
    );

    double density_alpha = std::max(0.0, std::min(1.0, density_bezier(pdens / mdens)));
    double opacity = std::max(0.0, std::min(1.0, opacity_bezier(progress)));
    double alpha = std::min(density_alpha, opacity) * 255;

    return (static_cast<uint32_t>(alpha) << 24) |
           (static_cast<uint32_t>(rgb.b) << 16) |
           (static_cast<uint32_t>(rgb.g) << 8) |
           static_cast<uint32_t>(rgb.r);
}

double NativeAttractorCalc::ratePerformance(jsi::Runtime& rt) {
    const int num_iterations = 10000000; // 10 million iterations for a quicker test
    volatile double result = 0.0;

    auto start = std::chrono::high_resolution_clock::now();

    for (int i = 0; i < num_iterations; ++i) {
        result += std::sin(static_cast<double>(i)) * std::cos(static_cast<double>(i));
    }

    auto end = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double, std::milli> elapsed = end - start;

    if (elapsed.count() == 0) {
        return static_cast<double>(VERY_FAST); // Execution was too fast to measure, which is the best possible outcome.
    }

    double score = num_iterations / elapsed.count();

    // These thresholds are calibrated based on typical performance ranges.
    // They might need adjustment for your specific target devices.
    // Score is in iterations per millisecond.
    PerformanceRating rating = score > 500000 ? VERY_FAST :
                               score > 200000 ? FAST :
                               score > 50000  ? MEDIUM :
                               score > 10000  ? SLOW :
                                                VERY_SLOW;
    return static_cast<double>(rating);
}

std::string NativeAttractorCalc::getBuildNumber(jsi::Runtime& rt) {
    return version;
}

uint32_t NativeAttractorCalc::get_low_quality_point(double hue, double saturation, double brightness) {
    RGB rgb = hsv_to_rgb(hue, saturation, brightness);
    return (255 << 24) | (rgb.b << 16) | (rgb.g << 8) | rgb.r;
}

double NativeAttractorCalc::smoothing(double num, double scale) {
    return std::log(num) * scale;
}

std::pair<double, double> NativeAttractorCalc::clifford(double x, double y, double a, double b, double c, double d) {
    return {
        std::sin(a * y) + c * std::cos(a * x),
        std::sin(b * x) + d * std::cos(b * y)
    };
}

std::pair<double, double> NativeAttractorCalc::dejong(double x, double y, double a, double b, double c, double d) {
    return {
        std::sin(a * y) - std::cos(b * x),
        std::sin(c * x) - std::cos(d * y)
    };
}

std::function<std::pair<double, double>(double, double, double, double, double, double)> NativeAttractorCalc::get_attractor_function(
  const AttractorParameters& params
) {
    if (params.attractor == "clifford") {
        return [=, this](double x, double y, double a, double b, double c, double d) {
            return clifford(x, y, params.a, params.b, params.c, params.d);
        };
    } else if (params.attractor == "dejong") {
        return [=, this](double x, double y, double a, double b, double c, double d) {
            return dejong(x, y, params.a, params.b, params.c, params.d);
        };
    }
    
    // Error case - throw an exception for invalid attractor type
    throw std::runtime_error("Invalid attractor type: " + params.attractor + ". Must be 'clifford' or 'dejong'.");
}

void NativeAttractorCalc::accumulate_density(AccumulationContext& context) {

  int i = 0;
  while (i < context.pointsPerIteration && context.totalPoints < context.totalAttractorPoints) {
    if (context.cancelled->load()) {
      break;
    }
    auto next = context.fn(context.x, context.y, context.a, context.b, context.c, context.d);
    context.x = next.first;
    context.y = next.second;

    double sx = smoothing(context.x, context.scale);
    double sy = smoothing(context.y, context.scale);
    double screenX = sx * context.scale;
    double screenY = sy * context.scale;
    int px = static_cast<int>(std::floor(context.centerX + screenX));
    int py = static_cast<int>(std::floor(context.centerY + screenY));

    if (px >= 0 && px < context.w && py >= 0 && py < context.h) {
      int idx = py * context.w + px;
      if (idx >= 0 && idx < static_cast<int>(context.densitySize)) {
        context.densityPtr[idx]++;
        if (context.densityPtr[idx] > context.max_density) context.max_density = context.densityPtr[idx];
      }
    }
    context.totalPoints++;
    i++;
  }
    
}

void NativeAttractorCalc::create_image_data(ImageDataCreationContext& context) {

  size_t loopLimit = context.imageSize;

  uint32_t bgColor = 0;
  if (!context.background.empty()) {
    uint32_t bgA = context.background.size() > 3 ? context.background[3] : 255;
    uint32_t bgB = context.background.size() > 2 ? context.background[2] : 0;
    uint32_t bgG = context.background.size() > 1 ? context.background[1] : 0;
    uint32_t bgR = context.background[0];
    bgColor = (bgA << 24) | (bgB << 16) | (bgG << 8) | bgR;
  }

  size_t i = 0;
  while (i < loopLimit) {
    if (i < context.densitySize && context.densityPtr[i] > 0) {
      uint32_t dval = context.densityPtr[i];
      context.imageData[i] = context.hQuality
        ? get_color_data(dval, context.max_density, context.h, context.s, context.v, 1.0, context.background)
        : get_low_quality_point(context.h, context.s, context.v);
    } else {
      context.imageData[i] = bgColor;
    }
    i++;
  }

}

  NativeAttractorCalc::NativeAttractorCalc(std::shared_ptr<CallInvoker> jsInvoker): NativeAttractorCalcCxxSpec(std::move(jsInvoker)) {}

  void NativeAttractorCalc::startAttractorCalculationThread(
    std::shared_ptr<std::string> timestamp,
    std::shared_ptr<jsi::Function> onProgressCopy,
    std::shared_ptr<jsi::Function> onImageUpdateCopy,
    uint32_t* densityBufferPtr,
    size_t densityBufferSize,
    uint8_t* imageBufferPtr,
    size_t imageBufferSize,
    std::shared_ptr<jsi::Function> resolveFunc,
    std::shared_ptr<jsi::Function> rejectFunc,
    std::shared_ptr<std::atomic<bool>> cancelled,
    std::shared_ptr<AttractorParameters> attractorParamsCopy,
    std::shared_ptr<int> widthCopy,
    std::shared_ptr<int> heightCopy,
    std::shared_ptr<int> drawIntervalCopy,
    std::shared_ptr<int> progressIntervalCopy,
    std::shared_ptr<bool> highQualityCopy,
    std::shared_ptr<int> totalAttractorPointsCopy,
    std::shared_ptr<int> pointsPerIterationCopy
  ) {
    // Manually create a thread to run the calculation in the background
    std::thread([
      this,
      timestamp,
      onProgressCopy,
      onImageUpdateCopy,
      densityBufferPtr,
      // densityBufferSize,
      imageBufferPtr,
      imageBufferSize,
      resolveFunc,
      rejectFunc,
      cancelled,
      attractorParamsCopy,
      widthCopy,
      heightCopy,
      drawIntervalCopy,
      progressIntervalCopy,
      highQualityCopy,
      totalAttractorPointsCopy,
      pointsPerIterationCopy
    ]() {
      try {

        // this allows cancellation
        std::this_thread::sleep_for(std::chrono::milliseconds(1));
        if (cancelled->load()) {
          // When cancelled, reject the promise from the JS thread
          this->jsInvoker_->invokeAsync([rejectFunc](jsi::Runtime& runtime) {
            rejectFunc->call(runtime, jsi::String::createFromUtf8(runtime, ""));
          });
          return; // Exit the thread
        }

        // get attractor function
        auto attractorFunc = get_attractor_function(*attractorParamsCopy);

        // Initialize calculation variables - use the passed density buffer directly
        // Note: We're no longer clearing the density buffer to allow accumulation across calls
        size_t densitySize = *widthCopy * *heightCopy;
        
        // Scan the buffer to find existing max density value
        double max_density = 0.0;
        for (size_t i = 0; i < densitySize; i++) {
          if (densityBufferPtr[i] > max_density) {
            max_density = densityBufferPtr[i];
          }
        }
        
        double x = 0.0, y = 0.0;
        double centerX = *widthCopy / 2.0 + attractorParamsCopy->left;
        double centerY = *heightCopy / 2.0 + attractorParamsCopy->top;
        double progress = 0.0;
        int totalPoints = 0;

        while(
          totalPoints < *totalAttractorPointsCopy && !cancelled->load()
        ) {

          // this allows cancellation
          std::this_thread::sleep_for(std::chrono::milliseconds(1));
          if (cancelled->load()) {
            break; // Exit the while loop
          }
            
          AccumulationContext context = {
            .densityPtr = densityBufferPtr,
            .densitySize = densitySize,
            .max_density = max_density,
            .x = x,
            .y = y,
            .totalPoints = totalPoints,
            .pointsPerIteration = *pointsPerIterationCopy,
            .w = *widthCopy,
            .h = *heightCopy,
            .scale = attractorParamsCopy->scale,
            .a = attractorParamsCopy->a,
            .b = attractorParamsCopy->b,
            .c = attractorParamsCopy->c,
            .d = attractorParamsCopy->d,
            .centerX = centerX,
            .centerY = centerY,
            .totalAttractorPoints = *totalAttractorPointsCopy,
            .fn = attractorFunc,
            .cancelled = cancelled
          };
          accumulate_density(context);

          // on time, draw on the canvas
          if (
            totalPoints == 10 ||
            totalPoints % *drawIntervalCopy == 0 ||
            totalPoints == (*totalAttractorPointsCopy - 1)
          ) {

            // this allows cancellation
            std::this_thread::sleep_for(std::chrono::milliseconds(1));
            if (cancelled->load()) {
              break; // Exit the while loop
            }

            // Draw the current state on the canvas
            ImageDataCreationContext imageContext = {
              .imageData = reinterpret_cast<uint32_t*>(imageBufferPtr),
              .imageSize = imageBufferSize / sizeof(uint32_t),
              .densityPtr = densityBufferPtr,
              .densitySize = densitySize,
              .max_density = max_density,
              .h = attractorParamsCopy->hue,
              .s = attractorParamsCopy->saturation,
              .v = attractorParamsCopy->brightness,
              .hQuality = *highQualityCopy,
              .background = attractorParamsCopy->background
            };
            create_image_data(imageContext);

            bool done = (totalPoints == *totalAttractorPointsCopy - 1);
            this->jsInvoker_->invokeAsync([onImageUpdateCopy, done](jsi::Runtime& runtime) {
              onImageUpdateCopy->call(runtime, jsi::Value(done));
            });
          }

          // update progress
          if(
            totalPoints % *progressIntervalCopy == 0 || 
            totalPoints == (*totalAttractorPointsCopy - 1)
          ) {

            // this allows cancellation
            std::this_thread::sleep_for(std::chrono::milliseconds(1));
            if (cancelled->load()) {
              break; // Exit the while loop
            }

            progress = static_cast<double>(totalPoints) / *totalAttractorPointsCopy;
            this->jsInvoker_->invokeAsync([
              onProgressCopy, 
              progress, 
              totalPoints, 
              totalAttractorPointsCopy
            ](jsi::Runtime& runtime) {
              // rejectFunc->call(runtime, jsi::String::createFromUtf8(runtime, "Cancelled"));
              onProgressCopy->call(
                runtime, 
                jsi::Value(progress), 
                jsi::Value(totalPoints), 
                jsi::Value(*totalAttractorPointsCopy)
              );
            });
          }
        }
          
        // return timestamp when it's done and not canceled
        this->jsInvoker_->invokeAsync([resolveFunc, rejectFunc, timestamp, cancelled](jsi::Runtime& runtime) {
          if (cancelled->load()) {
            rejectFunc->call(runtime, jsi::String::createFromUtf8(runtime, ""));
          }else{
            resolveFunc->call(runtime, jsi::String::createFromUtf8(runtime, *timestamp));
          }
        });

      } catch (const std::exception& e) {
        std::string error_message = e.what();
        // Schedule rejection on the JS thread
        this->jsInvoker_->invokeAsync([rejectFunc, error_message](jsi::Runtime& runtime) {
          rejectFunc->call(runtime, jsi::String::createFromUtf8(runtime, error_message));
        });
      }

    }).detach(); // Detach the thread to allow the JS function to return immediately
  }

  jsi::Object NativeAttractorCalc::calculateAttractor(
    jsi::Runtime& rt,
    std::string timestamp,
    jsi::Object densityBuffer,
    jsi::Object imageBuffer,
    jsi::Object paramsAttractor,
    int width,
    int height,
    int drawInterval,
    int progressInterval,
    bool highQuality,
    int totalAttractorPoints,
    int pointsPerIteration,
    jsi::Function onProgress,
    jsi::Function onImageUpdate
  ) {

    // 0. Parse AttractorParameters
    AttractorParameters attractorParams;
    attractorParams.attractor = paramsAttractor.getProperty(rt, "attractor").asString(rt).utf8(rt);
    attractorParams.a = paramsAttractor.getProperty(rt, "a").asNumber();
    attractorParams.b = paramsAttractor.getProperty(rt, "b").asNumber();
    attractorParams.c = paramsAttractor.getProperty(rt, "c").asNumber();
    attractorParams.d = paramsAttractor.getProperty(rt, "d").asNumber();
    attractorParams.hue = paramsAttractor.getProperty(rt, "hue").asNumber();
    attractorParams.saturation = paramsAttractor.getProperty(rt, "saturation").asNumber();
    attractorParams.brightness = paramsAttractor.getProperty(rt, "brightness").asNumber();
    attractorParams.scale = paramsAttractor.getProperty(rt, "scale").asNumber();
    attractorParams.left = paramsAttractor.getProperty(rt, "left").asNumber();
    attractorParams.top = paramsAttractor.getProperty(rt, "top").asNumber();

    jsi::Array backgroundArray = paramsAttractor.getProperty(rt, "background").asObject(rt).asArray(rt);
    std::vector<int> backgroundVec;
    for (size_t i = 0; i < backgroundArray.size(rt); ++i) {
      backgroundVec.push_back(static_cast<int>(backgroundArray.getValueAtIndex(rt, i).asNumber()));
    }
    attractorParams.background = backgroundVec;

    // 1. Validate and get the ArrayBuffer
    if (!densityBuffer.isArrayBuffer(rt)) {
      throw jsi::JSError(rt, "Third argument must be an ArrayBuffer.");
    }

    if (!imageBuffer.isArrayBuffer(rt)) {
      throw jsi::JSError(rt, "Fourth argument must be an ArrayBuffer.");
    }

    auto densityArrayBuffer = densityBuffer.getArrayBuffer(rt);
    uint32_t* densityBufferPtr = reinterpret_cast<uint32_t*>(densityArrayBuffer.data(rt));
    size_t densityBufferSize = densityArrayBuffer.size(rt);
    
    auto imageArrayBuffer = imageBuffer.getArrayBuffer(rt);
    uint8_t* imageBufferPtr = imageArrayBuffer.data(rt);
    size_t imageBufferSize = imageArrayBuffer.size(rt);

    // 2. Set Cancellation flag
    auto cancelled = std::make_shared<std::atomic<bool>>(false);

    // 3. Create copies of parameters that will be used in the thread
    auto timestampCopy = std::make_shared<std::string>(timestamp);
    auto onProgressCopy = std::make_shared<jsi::Function>(std::move(onProgress));
    auto onImageUpdateCopy = std::make_shared<jsi::Function>(std::move(onImageUpdate));
    auto attractorParamsCopy = std::make_shared<AttractorParameters>(attractorParams);
    auto widthCopy = std::make_shared<int>(width);
    auto heightCopy = std::make_shared<int>(height);
    auto drawIntervalCopy = std::make_shared<int>(drawInterval);
    auto progressIntervalCopy = std::make_shared<int>(progressInterval);
    auto highQualityCopy = std::make_shared<bool>(highQuality);
    auto totalAttractorPointsCopy = std::make_shared<int>(totalAttractorPoints);
    auto pointsPerIterationCopy = std::make_shared<int>(pointsPerIteration);

    // 4. Create a Promise
    auto promiseCtor = rt.global().getPropertyAsFunction(rt, "Promise");
    auto promise = promiseCtor.callAsConstructor(rt,
      jsi::Function::createFromHostFunction(rt,
        jsi::PropNameID::forAscii(rt, "executor"),
        2, // resolve and reject
        [ this, // Capture 'this' to access callInvoker
          timestampCopy,
          onProgressCopy,
          onImageUpdateCopy,
          densityBufferPtr,
          densityBufferSize,
          imageBufferPtr,
          imageBufferSize,
          cancelled,
          attractorParamsCopy,
          widthCopy,
          heightCopy,
          drawIntervalCopy,
          progressIntervalCopy,
          highQualityCopy,
          totalAttractorPointsCopy,
          pointsPerIterationCopy
        ](jsi::Runtime& runtime, const jsi::Value&, const jsi::Value* args, size_t count) -> jsi::Value {
          auto resolveFunc = std::make_shared<jsi::Function>(args[0].asObject(runtime).asFunction(runtime));
          auto rejectFunc = std::make_shared<jsi::Function>(args[1].asObject(runtime).asFunction(runtime));

          // 5. Start the attractor calculation in a separate thread
          startAttractorCalculationThread(
            timestampCopy,
            onProgressCopy,
            onImageUpdateCopy,
            densityBufferPtr,
            densityBufferSize,
            imageBufferPtr,
            imageBufferSize,
            resolveFunc,
            rejectFunc,
            cancelled,
            attractorParamsCopy,
            widthCopy,
            heightCopy,
            drawIntervalCopy,
            progressIntervalCopy,
            highQualityCopy,
            totalAttractorPointsCopy,
            pointsPerIterationCopy
          );

          return jsi::Value::undefined();
        }));

  // Create cancel function
  auto cancelFunc = jsi::Function::createFromHostFunction(rt,
    jsi::PropNameID::forAscii(rt, "cancel"),
    0,
    [cancelled](jsi::Runtime&, const jsi::Value&, const jsi::Value* , size_t) -> jsi::Value {
      cancelled->store(true);
      std::this_thread::sleep_for(std::chrono::seconds(2));
      return jsi::Value::undefined();
    });

  // Return an object with promise and cancel properties
  jsi::Object result(rt);
  result.setProperty(rt, "promise", promise);
  result.setProperty(rt, "cancel", cancelFunc);

  return result;
}

} // namespace facebook::react