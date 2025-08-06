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

std::string version = "2.0.1";

// A C++ implementation of the BezierEasing function from the original JS.
// It returns a lambda function that calculates the easing.
std::function<double(double)> NativeAttractorCalc::bezierEasing(double p0, double p1, double p2, double p3) {
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

RGB NativeAttractorCalc::hsvToRgb(double h, double s, double v) {
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

uint32_t NativeAttractorCalc::getColorData(
  double density,
  double maxDensity,
  double h,
  double s,
  double v,
  double progress,
  const std::vector<int>& background
) {
    if (maxDensity <= 1.0) maxDensity = 1.01; // prevent log(1) = 0
    if (density <= 0) return 0;

    auto saturation_bezier = bezierEasing(0.79, -0.34, 0.54, 1.18);
    auto density_bezier = bezierEasing(0.75, 0.38, 0.24, 1.33);
    auto opacity_bezier = bezierEasing(0.24, 0.27, 0.13, 0.89);

    double mdens = std::log(maxDensity);
    double pdens = std::log(density);

    RGB rgb = hsvToRgb(
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

uint32_t NativeAttractorCalc::getLowQualityPoint(double hue, double saturation, double brightness) {
    RGB rgb = hsvToRgb(hue, saturation, brightness);
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

std::function<std::pair<double, double>(double, double, double, double, double, double)> NativeAttractorCalc::getAttractorFunction(
  std::string attractor
) {
    if (attractor == "clifford") {
        return [=, this](double x, double y, double a, double b, double c, double d) {
            return clifford(x, y, a, b, c, d);
        };
    } else if (attractor == "dejong") {
        return [=, this](double x, double y, double a, double b, double c, double d) {
            return dejong(x, y, a, b, c, d);
        };
    }
    
    // Error case - throw an exception for invalid attractor type
    throw std::runtime_error("Invalid attractor type: " + attractor + ". Must be 'clifford' or 'dejong'.");
}

void NativeAttractorCalc::accumulateDensity(AccumulationContext& context) {

  int i = 0;
  while (i < context.pointsToCalculate) {
    
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
        if (context.densityPtr[idx] > context.maxDensity) context.maxDensity = context.densityPtr[idx];
      }
    }

    i++;
  }
    
}

void NativeAttractorCalc::createImageData(ImageDataCreationContext& context) {

  int loopLimit = context.imageSize;

  uint32_t bgColor = 0;
  if (!context.background.empty()) {
    uint32_t bgA = context.background.size() > 3 ? context.background[3] : 255;
    uint32_t bgB = context.background.size() > 2 ? context.background[2] : 0;
    uint32_t bgG = context.background.size() > 1 ? context.background[1] : 0;
    uint32_t bgR = context.background[0];
    bgColor = (bgA << 24) | (bgB << 16) | (bgG << 8) | bgR;
  }

  int i = 0;
  while (i < loopLimit) {
    uint32_t dval = context.densityPtr[i];
    context.imageData[i] = dval > 0 ? (
      context.highQuality
      ? getColorData(dval, context.maxDensity, context.h, context.s, context.v, 1.0, context.background)
      : getLowQualityPoint(context.h, context.s, context.v)
    ) : bgColor;
    i++;
  }

}

  NativeAttractorCalc::NativeAttractorCalc(std::shared_ptr<CallInvoker> jsInvoker): NativeAttractorCalcCxxSpec(std::move(jsInvoker)) {}

  void NativeAttractorCalc::startAttractorCalculationThread(
    std::string timestamp,
    uint32_t* densityBufferPtr,
    uint32_t* imageBufferPtr,
    bool highQuality,

    std::string attractor,
    double a, double b, double c, double d,
    double hue, double saturation, double brightness,
    std::vector<int> background,

    double scale, double left, double top,
    int width, int height,
    double x, double y,
    int maxDensity,

    int pointsToCalculate,
    
    std::shared_ptr<jsi::Function> resolveFunc,
    std::shared_ptr<jsi::Function> rejectFunc
  ) {
    // Manually create a thread to run the calculation in the background
    std::thread([
      this,

      timestamp,
      densityBufferPtr,
      imageBufferPtr,
      highQuality,
          
      attractor,
      a, b, c, d,
      hue, saturation, brightness,
      background,

      scale, left, top,
      width, height,
      x, y,
      maxDensity,

      pointsToCalculate,
      
      resolveFunc,
      rejectFunc
    ]() {
      try {

        // get attractor function
        auto attractorFunc = getAttractorFunction(attractor);

        // Initialize calculation variables - use the passed density buffer directly
        // Note: We're no longer clearing the density buffer to allow accumulation across calls
        size_t densitySize = width * height;
        
        double centerX = width / 2.0 + left;
        double centerY = height / 2.0 + top;
        
        // Create reference-able variables
        int maxDensityRef = maxDensity; 
        double xRef = x;
        double yRef = y;

        AccumulationContext context = {

          .densityPtr = densityBufferPtr,
          .densitySize = densitySize,
          .maxDensity = maxDensityRef,
          .x = xRef,
          .y = yRef,
          .pointsToCalculate = pointsToCalculate,
          .w = width,
          .h = height,
          .scale = scale,

          .a = a,
          .b = b,
          .c = c,
          .d = d,
          
          .centerX = centerX,
          .centerY = centerY,

          .fn = attractorFunc,
        };
        accumulateDensity(context);

        // Draw the current state on the buffer
        ImageDataCreationContext imageContext = {
          .imageData = reinterpret_cast<uint32_t*>(imageBufferPtr),
          .imageSize = width * height,
          .densityPtr = densityBufferPtr,
          .densitySize = densitySize,
          .maxDensity = maxDensityRef,
          .h = hue,
          .s = saturation,
          .v = brightness,
          .highQuality = highQuality,
          .background = background
        };
        createImageData(imageContext);
          
        // resolve the promise with the result
        this->jsInvoker_->invokeAsync([
          resolveFunc, 
          timestamp, 
          maxDensityRef, 
          xRef, 
          yRef, 
          pointsToCalculate
        ](jsi::Runtime& runtime) {

          jsi::Object result = jsi::Object(runtime);
          result.setProperty(runtime, "timestamp", jsi::String::createFromUtf8(runtime, timestamp));
          result.setProperty(runtime, "maxDensity", jsi::Value(maxDensityRef));
          result.setProperty(runtime, "x", jsi::Value(xRef));
          result.setProperty(runtime, "y", jsi::Value(yRef));
          result.setProperty(runtime, "pointsAdded", jsi::Value(pointsToCalculate));
          resolveFunc->call(runtime, result);

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

  jsi::Value NativeAttractorCalc::calculateAttractor(
    jsi::Runtime& rt,

    std::string timestamp,
    jsi::Object densityBuffer,
    jsi::Object imageBuffer,
    bool highQuality,
    
    jsi::Object attractorParameters,
    int width, int height,
    double x, double y,
    int maxDensity,

    int pointsToCalculate
  ) {

    // 0. Parse AttractorParameters
    AttractorParameters attractorParams;
    std::string attractor = attractorParameters.getProperty(rt, "attractor").asString(rt).utf8(rt);
    double a = attractorParameters.getProperty(rt, "a").asNumber();
    double b = attractorParameters.getProperty(rt, "b").asNumber();
    double c = attractorParameters.getProperty(rt, "c").asNumber();
    double d = attractorParameters.getProperty(rt, "d").asNumber();
    double hue = attractorParameters.getProperty(rt, "hue").asNumber();
    double saturation = attractorParameters.getProperty(rt, "saturation").asNumber();
    double brightness = attractorParameters.getProperty(rt, "brightness").asNumber();
    double scale = attractorParameters.getProperty(rt, "scale").asNumber();
    double top = attractorParameters.getProperty(rt, "top").asNumber();
    double left = attractorParameters.getProperty(rt, "left").asNumber();

    jsi::Array backgroundArray = attractorParameters.getProperty(rt, "background").asObject(rt).asArray(rt);
    std::vector<int> background;
    for (size_t i = 0; i < backgroundArray.size(rt); ++i) {
      background.push_back(static_cast<int>(backgroundArray.getValueAtIndex(rt, i).asNumber()));
    }

    // 1. Validate and get the ArrayBuffer
    if (!densityBuffer.isArrayBuffer(rt)) {
      throw jsi::JSError(rt, "Third argument must be an ArrayBuffer.");
    }

    if (!imageBuffer.isArrayBuffer(rt)) {
      throw jsi::JSError(rt, "Fourth argument must be an ArrayBuffer.");
    }

    auto densityArrayBuffer = densityBuffer.getArrayBuffer(rt);
    uint32_t* densityBufferPtr = reinterpret_cast<uint32_t*>(densityArrayBuffer.data(rt));
    
    auto imageArrayBuffer = imageBuffer.getArrayBuffer(rt);
    uint32_t* imageBufferPtr = reinterpret_cast<uint32_t*>(imageArrayBuffer.data(rt));

    // 4. Create a Promise
    auto promiseCtor = rt.global().getPropertyAsFunction(rt, "Promise");
    auto promise = promiseCtor.callAsConstructor(rt,
      jsi::Function::createFromHostFunction(rt,
        jsi::PropNameID::forAscii(rt, "executor"),
        2, // resolve and reject
        [ this, // Capture 'this' to access callInvoker
          timestamp,
          
          densityBufferPtr,
          imageBufferPtr,
          
          attractor,
          a, b, c, d,
          hue, saturation, brightness,
          background,

          scale, left, top,
          width, height,
          x, y,
          maxDensity,

          highQuality,
          pointsToCalculate
        ](jsi::Runtime& runtime, const jsi::Value&, const jsi::Value* args, size_t count) -> jsi::Value {
          auto resolveFunc = std::make_shared<jsi::Function>(args[0].asObject(runtime).asFunction(runtime));
          auto rejectFunc = std::make_shared<jsi::Function>(args[1].asObject(runtime).asFunction(runtime));

          // 5. Start the attractor calculation in a separate thread
          startAttractorCalculationThread(
            timestamp,
            densityBufferPtr,
            imageBufferPtr,
            highQuality,
            
            attractor,
            a, b, c, d,
            hue, saturation, brightness,
            background,

            scale, left, top,
            width, height,
            x, y,
            maxDensity,
             
            pointsToCalculate,

            resolveFunc,
            rejectFunc
          );

          return jsi::Value::undefined();
        }));
  
  // 6. Return the Promise
  return promise;
}

} // namespace facebook::react