#include "NativeAttractorCalc.h"
// #include "attractors.h"
#include <jsi/jsi.h>

#include <algorithm>
#include <atomic>
#include <chrono>
#include <cmath>
#include <functional>
#include <thread>
#include <tuple>
#include <vector>

namespace facebook::react {

std::string version = "2.0.1";

// A C++ implementation of the BezierEasing function from the original JS.
// It returns a lambda function that calculates the easing.
std::function<double(double)>
NativeAttractorCalc::bezierEasing(double p0, double p1, double p2, double p3) {
  // Define these functions to match the JavaScript implementation exactly
  // All captures are by value [=] to ensure they work properly when returned

  // These can be static since they don't depend on the parameters
  auto A = [](double aA1, double aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; };
  auto B = [](double aA1, double aA2) { return 3.0 * aA2 - 6.0 * aA1; };
  auto C = [](double aA1) { return 3.0 * aA1; };

  // This needs to capture the A, B, C functions
  auto calc_bezier = [=](double t, double aA1, double aA2) {
    return ((A(aA1, aA2) * t + B(aA1, aA2)) * t + C(aA1)) * t;
  };

  // This needs to capture the A, B, C functions
  auto get_slope = [=](double t, double aA1, double aA2) {
    return 3.0 * A(aA1, aA2) * t * t + 2.0 * B(aA1, aA2) * t + C(aA1);
  };

  // Capture everything by value to match JS implementation exactly
  auto get_t_for_x = [=](double aX) {
    double aGuessT = aX;
    for (int i = 0; i < 4; ++i) {
      double currentSlope = get_slope(aGuessT, p0, p2);
      if (currentSlope == 0.0) {
        return aGuessT;
      }
      double currentX = calc_bezier(aGuessT, p0, p2) - aX;
      aGuessT -= currentX / currentSlope;
    }
    return aGuessT;
  };

  // Return the final function with everything captured by value
  return [=](double x) {
    if (x <= 0.0) {
      return 0.0;
    }
    if (x >= 1.0) {
      return 1.0;
    }
    return calc_bezier(get_t_for_x(x), p1, p3);
  };
}

RGB
NativeAttractorCalc::hsvToRgb(double h, double s, double v) {
  // Exactly match JavaScript hsv2rgb implementation
  // Clamp input values to valid ranges
  h = std::max(0.0, std::min(359.0, h));
  s = std::max(0.0, std::min(100.0, s));
  v = std::max(0.0, std::min(100.0, v));

  // Normalize s and v to 0-1 range
  s /= 100.0;
  v /= 100.0;

  // Handle grayscale case (s === 0)
  if (s == 0.0) {
    int val = std::round(v * 255);
    return {val, val, val};
  }

  // Convert hue to sector (0-5)
  h /= 60.0;
  int i = std::floor(h);
  double f = h - i;

  // Calculate color components
  double p = v * (1.0 - s);
  double q = v * (1.0 - s * f);
  double t = v * (1.0 - s * (1 - f));

  // Assign RGB based on hue sector
  double r, g, b;
  switch (i) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    default:
      r = v;
      g = p;
      b = q;
      break;  // Handles case 5 and any overflow
  }

  // Return RGB values scaled to 0-255 range and rounded to integers
  return {
    static_cast<int>(std::round(r * 255)),
    static_cast<int>(std::round(g * 255)),
    static_cast<int>(std::round(b * 255))
  };
}

uint32_t
NativeAttractorCalc::getColorData(
  double density,
  double maxDensity,
  double h,
  double s,
  double v,
  double progress,
  const std::vector<int>& background
) {
  // Exactly match JavaScript behavior
  if (density <= 0) {
    return 0;
  }

  // Prevent log(1) = 0 or log of negative/zero numbers
  if (maxDensity <= 1.0) {
    maxDensity = 1.01;
  }

  auto saturation_bezier = bezierEasing(0.79, -0.34, 0.54, 1.18);
  auto density_bezier = bezierEasing(0.75, 0.38, 0.24, 1.33);
  auto opacity_bezier = bezierEasing(0.24, 0.27, 0.13, 0.89);

  // Match JS exactly - first calculate log values
  double mdens = std::log(maxDensity);
  double pdens = std::log(density);

  // Match JS hsv2rgb call exactly
  double satFactor = std::max(0.0, std::min(1.0, saturation_bezier(pdens / mdens)));
  RGB rgb = hsvToRgb(h, s - satFactor * s, v);

  // Match JS density_alpha calculation exactly
  double density_alpha = std::max(0.0, std::min(1.0, density_bezier(pdens / mdens)));

  // Get background color components with defaults matching JS behavior
  // In JS: (background && background[0]) || 0
  int bgR = background.size() > 0 ? background[0] : 0;
  int bgG = background.size() > 1 ? background[1] : 0;
  int bgB = background.size() > 2 ? background[2] : 0;

  // Blend colors based on density_alpha exactly as JS does
  int blendedR = std::round(rgb.r * density_alpha + bgR * (1 - density_alpha));
  int blendedG = std::round(rgb.g * density_alpha + bgG * (1 - density_alpha));
  int blendedB = std::round(rgb.b * density_alpha + bgB * (1 - density_alpha));

  // Match JS exactly: opacityBezier(progress || 1)
  double effectiveProgress = progress <= 0 ? 1.0 : progress;
  uint32_t alpha = static_cast<uint32_t>(std::round(opacity_bezier(effectiveProgress) * 255));

  // Match JS bit-shifting pattern exactly
  return (alpha << 24) | (static_cast<uint32_t>(blendedB) << 16) |
    (static_cast<uint32_t>(blendedG) << 8) | static_cast<uint32_t>(blendedR);
}

double
NativeAttractorCalc::ratePerformance(jsi::Runtime& rt) {
  const int num_iterations = 10000000;  // 10 million iterations for a quicker test
  volatile double result = 0.0;

  auto start = std::chrono::high_resolution_clock::now();

  for (int i = 0; i < num_iterations; ++i) {
    result += std::sin(static_cast<double>(i)) * std::cos(static_cast<double>(i));
  }

  auto end = std::chrono::high_resolution_clock::now();
  std::chrono::duration<double, std::milli> elapsed = end - start;

  if (elapsed.count() == 0) {
    return static_cast<double>(VERY_FAST);  // Execution was too fast to measure, which is
                                            // the best possible outcome.
  }

  double score = num_iterations / elapsed.count();

  // These thresholds are calibrated based on typical performance ranges.
  // They might need adjustment for your specific target devices.
  // Score is in iterations per millisecond.
  PerformanceRating rating;
  if (score > 500000) {
    rating = VERY_FAST;
  } else if (score > 200000) {
    rating = FAST;
  } else if (score > 50000) {
    rating = MEDIUM;
  } else if (score > 10000) {
    rating = SLOW;
  } else {
    rating = VERY_SLOW;
  }
  return static_cast<double>(rating);
}

std::string
NativeAttractorCalc::getBuildNumber(jsi::Runtime& rt) {
  return version;
}

uint32_t
NativeAttractorCalc::getLowQualityPoint(double hue, double saturation, double brightness) {
  RGB rgb = hsvToRgb(hue, saturation, brightness);
  return (255 << 24) | (rgb.b << 16) | (rgb.g << 8) | rgb.r;
}

double
NativeAttractorCalc::smoothing(double num, double scale) {
  const double factor = 0.222;
  // Use C++ random to match JavaScript's Math.random() < 0.5 behavior
  return num +
    (static_cast<double>(std::rand()) / RAND_MAX < 0.5 ? -factor : factor) * (1.0 / scale);
}

std::pair<double, double>
NativeAttractorCalc::clifford(double x, double y, double a, double b, double c, double d) {
  return {std::sin(a * y) + c * std::cos(a * x), std::sin(b * x) + d * std::cos(b * y)};
}

std::pair<double, double>
NativeAttractorCalc::dejong(double x, double y, double a, double b, double c, double d) {
  return {std::sin(a * y) - std::cos(b * x), std::sin(c * x) - std::cos(d * y)};
}

using AttractorFn =
  std::function<std::pair<double, double>(double, double, double, double, double, double)>;

AttractorFn
NativeAttractorCalc::getAttractorFunction(std::string attractor) {
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
  throw std::runtime_error(
    "Invalid attractor type: " + attractor + ". Must be 'clifford' or 'dejong'."
  );
}

void
NativeAttractorCalc::accumulateDensity(AccumulationContext& context) {
  int i = 0;
  while (i < context.pointsToCalculate) {
    auto next = context.fn(
      context.x,
      context.y,
      context.attractorParams.a,
      context.attractorParams.b,
      context.attractorParams.c,
      context.attractorParams.d
    );
    context.x = smoothing(next.first, context.attractorParams.scale);
    context.y = smoothing(next.second, context.attractorParams.scale);

    double screenX = context.x * context.attractorParams.scale;
    double screenY = context.y * context.attractorParams.scale;
    int px = static_cast<int>(std::floor(context.centerX + screenX));
    int py = static_cast<int>(std::floor(context.centerY + screenY));

    if (px >= 0 && px < context.w && py >= 0 && py < context.h) {
      int idx = py * context.w + px;
      if (idx >= 0 && idx < static_cast<int>(context.densitySize)) {
        context.densityPtr[idx]++;
        if (context.densityPtr[idx] > context.maxDensity) {
          context.maxDensity = context.densityPtr[idx];
        }
      }
    }

    i++;
  }
}

void
NativeAttractorCalc::createImageData(ImageDataCreationContext& context) {
  int loopLimit = context.imageSize;

  uint32_t bgColor = 0;
  if (!context.attractorParams.background.empty()) {
    uint32_t bgA =
      context.attractorParams.background.size() > 3 ? context.attractorParams.background[3] : 255;
    uint32_t bgB =
      context.attractorParams.background.size() > 2 ? context.attractorParams.background[2] : 0;
    uint32_t bgG =
      context.attractorParams.background.size() > 1 ? context.attractorParams.background[1] : 0;
    uint32_t bgR = context.attractorParams.background[0];
    bgColor = (bgA << 24) | (bgB << 16) | (bgG << 8) | bgR;
  }

  int i = 0;
  while (i < loopLimit) {
    uint32_t dval = context.densityPtr[i];
    if (dval > 0) {
      if (context.highQuality) {
        context.imageData[i] = getColorData(
          dval,
          context.maxDensity,
          context.attractorParams.hue,
          context.attractorParams.saturation,
          context.attractorParams.brightness,
          1.0,
          context.attractorParams.background
        );
      } else {
        context.imageData[i] = getLowQualityPoint(
          context.attractorParams.hue,
          context.attractorParams.saturation,
          context.attractorParams.brightness
        );
      }
    } else {
      context.imageData[i] = bgColor;
    }
    i++;
  }
}

NativeAttractorCalc::NativeAttractorCalc(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeAttractorCalcCxxSpec(std::move(jsInvoker)) {
}

void
NativeAttractorCalc::startAttractorCalculationThread(
  StartAttractorCalculationThreadParams& params
) {
  // Manually create a thread to run the calculation in the background
  std::thread([this, params]() {
    try {
      // get attractor function
      auto attractorFunc = getAttractorFunction(params.attractorParams.attractor);

      // Initialize calculation variables - use the passed density buffer
      // directly Note: We're no longer clearing the density buffer to allow
      // accumulation across calls
      size_t densitySize = params.width * params.height;

      double centerX = params.width / 2.0 + params.attractorParams.left;
      double centerY = params.height / 2.0 + params.attractorParams.top;

      // Create reference-able variables
      int maxDensityRef = params.maxDensity;
      double xRef = params.x;
      double yRef = params.y;

      AccumulationContext context = {
        .densityPtr = params.densityBufferPtr,
        .densitySize = densitySize,
        .maxDensity = maxDensityRef,
        .x = xRef,
        .y = yRef,
        .pointsToCalculate = params.pointsToCalculate,
        .w = params.width,
        .h = params.height,
        .attractorParams = params.attractorParams,
        .centerX = centerX,
        .centerY = centerY,
        .fn = attractorFunc,
      };
      accumulateDensity(context);

      // Draw the current state on the buffer
      ImageDataCreationContext imageContext = {
        .imageData = reinterpret_cast<uint32_t*>(params.imageBufferPtr),
        .imageSize = params.width * params.height,
        .densityPtr = params.densityBufferPtr,
        .densitySize = densitySize,
        .maxDensity = maxDensityRef,
        .highQuality = params.highQuality,
        .attractorParams = params.attractorParams
      };
      createImageData(imageContext);

      // resolve the promise with the result
      this->jsInvoker_->invokeAsync([resolveFunc = params.resolveFunc,
                                     timestamp = params.timestamp,
                                     maxDensityRef,
                                     xRef,
                                     yRef,
                                     pointsToCalculate =
                                       params.pointsToCalculate](jsi::Runtime& runtime) {
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
      this->jsInvoker_->invokeAsync([rejectFunc = params.rejectFunc,
                                     error_message](jsi::Runtime& runtime) {
        rejectFunc->call(runtime, jsi::String::createFromUtf8(runtime, error_message));
      });
    }
  }).detach();  // Detach the thread to allow the JS function to return
                // immediately
}

// Helper method to convert JSI object to AttractorParameters
AttractorParameters
NativeAttractorCalc::extractAttractorParameters(jsi::Runtime& rt, jsi::Object& jsiParams) {
  jsi::Array backgroundArray = jsiParams.getProperty(rt, "background").asObject(rt).asArray(rt);
  std::vector<int> background;
  for (size_t i = 0; i < backgroundArray.size(rt); ++i) {
    background.push_back(static_cast<int>(backgroundArray.getValueAtIndex(rt, i).asNumber()));
  }

  return {
    std::string(jsiParams.getProperty(rt, "attractor").asString(rt).utf8(rt)),
    jsiParams.getProperty(rt, "a").asNumber(),
    jsiParams.getProperty(rt, "b").asNumber(),
    jsiParams.getProperty(rt, "c").asNumber(),
    jsiParams.getProperty(rt, "d").asNumber(),
    jsiParams.getProperty(rt, "hue").asNumber(),
    jsiParams.getProperty(rt, "saturation").asNumber(),
    jsiParams.getProperty(rt, "brightness").asNumber(),
    background,
    jsiParams.getProperty(rt, "scale").asNumber(),
    jsiParams.getProperty(rt, "left").asNumber(),
    jsiParams.getProperty(rt, "top").asNumber()
  };
}

jsi::Value
NativeAttractorCalc::calculateAttractor(
  jsi::Runtime& rt,
  std::string timestamp,
  jsi::Object densityBuffer,
  jsi::Object imageBuffer,
  bool highQuality,

  jsi::Object attractorParameters,
  int width,
  int height,
  double x,
  double y,
  int maxDensity,

  int pointsToCalculate
) {
  // Extract parameters from JSI object
  AttractorParameters attractorParams = extractAttractorParameters(rt, attractorParameters);

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
  auto promise = promiseCtor.callAsConstructor(
    rt,
    jsi::Function::createFromHostFunction(
      rt,
      jsi::PropNameID::forAscii(rt, "executor"),
      2,      // resolve and reject
      [this,  // Capture 'this' to access callInvoker
       timestamp,
       densityBufferPtr,
       imageBufferPtr,
       attractorParams,  // Pass the extracted AttractorParameters
       width,
       height,
       x,
       y,
       maxDensity,
       highQuality,
       pointsToCalculate](
        jsi::Runtime& runtime, const jsi::Value&, const jsi::Value* args, size_t count
      ) -> jsi::Value {
        auto resolveFunc =
          std::make_shared<jsi::Function>(args[0].asObject(runtime).asFunction(runtime));
        auto rejectFunc =
          std::make_shared<jsi::Function>(args[1].asObject(runtime).asFunction(runtime));

        // Create the thread parameters
        StartAttractorCalculationThreadParams threadParams = {
          timestamp,
          densityBufferPtr,
          imageBufferPtr,
          highQuality,
          attractorParams,  // Use the AttractorParameters struct that was passed in capture
          width,
          height,
          x,
          y,
          maxDensity,
          pointsToCalculate,
          resolveFunc,
          rejectFunc
        };

        // Start the attractor calculation in a separate thread
        startAttractorCalculationThread(threadParams);
        return jsi::Value::undefined();
      }
    )
  );

  // 6. Return the Promise
  return promise;
}

}  // namespace facebook::react