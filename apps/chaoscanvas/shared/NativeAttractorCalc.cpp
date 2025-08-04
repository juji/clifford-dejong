#include "NativeAttractorCalc.h"
#include <jsi/jsi.h>
#include <atomic>
#include <thread>
#include <chrono>
#include <cmath>
#include <vector>
#include <functional>
#include <tuple>
#include <algorithm>

// Mathematical and color utility functions ported from TypeScript

namespace attractors {

// Represents an RGB color
struct RGB {
    int r, g, b;
};

// A C++ implementation of the BezierEasing function from the original JS.
// It returns a lambda function that calculates the easing.
std::function<double(double)> bezier_easing(double p0, double p1, double p2, double p3) {
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

RGB hsv_to_rgb(double h, double s, double v) {
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

uint32_t get_color_data(
    double density,
    double max_density,
    double h,
    double s,
    double v,
    double progress = 1.0,
    const std::vector<int>& background = {0, 0, 0, 255}
) {
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

    int bgR = background.size() > 0 ? background[0] : 0;
    int bgG = background.size() > 1 ? background[1] : 0;
    int bgB = background.size() > 2 ? background[2] : 0;

    int blendedR = std::round(rgb.r * density_alpha + bgR * (1.0 - density_alpha));
    int blendedG = std::round(rgb.g * density_alpha + bgG * (1.0 - density_alpha));
    int blendedB = std::round(rgb.b * density_alpha + bgB * (1.0 - density_alpha));

    uint32_t alpha_channel = static_cast<uint32_t>(opacity_bezier(progress) * 255);

    return (alpha_channel << 24) | (blendedB << 16) | (blendedG << 8) | blendedR;
}

uint32_t get_low_quality_point(double hue, double saturation, double brightness) {
    RGB rgb = hsv_to_rgb(hue, saturation, brightness);
    return (255 << 24) | (rgb.b << 16) | (rgb.g << 8) | rgb.r;
}

double smoothing(double num, double scale) {
    double factor = 0.2;
    return num + ((rand() / (double)RAND_MAX) < 0.5 ? -factor : factor) * (1.0 / scale);
}

std::pair<double, double> clifford(double x, double y, double a, double b, double c, double d) {
    return {
        std::sin(a * y) + c * std::cos(a * x),
        std::sin(b * x) + d * std::cos(b * y)
    };
}

std::pair<double, double> dejong(double x, double y, double a, double b, double c, double d) {
    return {
        std::sin(a * y) - std::cos(b * x),
        std::sin(c * x) - std::cos(d * y)
    };
}

} // namespace attractors

namespace facebook::react {


  NativeAttractorCalc::NativeAttractorCalc(std::shared_ptr<CallInvoker> jsInvoker): NativeAttractorCalcCxxSpec(std::move(jsInvoker)) {}

  jsi::Object NativeAttractorCalc::calculateAttractor(
    jsi::Runtime& rt,
    std::string timestamp,
    jsi::Object buffer,
    jsi::Function onProgress,
    jsi::Function onUpdate
  ) {
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

        // Manually create a thread to run the calculation in the background
        std::thread([
          this,
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
                // When cancelled, reject the promise from the JS thread
                this->jsInvoker_->invokeAsync([&runtime, rejectFunc]() {
                  rejectFunc->call(runtime, jsi::String::createFromUtf8(runtime, "Cancelled from C++"));
                });
                return; // Exit the thread
              }

              // sleep for a short duration to simulate work on the background thread
              std::this_thread::sleep_for(std::chrono::milliseconds(100));

              // Schedule progress and update callbacks on the JS thread
              this->jsInvoker_->invokeAsync([&runtime, onProgressCopy, onUpdateCopy, bufferPtr, bufferSize, i, cancelled]() {
                if (cancelled->load()) return;

                double progress = (i + 1) / 10.0;
                onProgressCopy->call(runtime, jsi::Value(progress));

                // This is a dummy implementation.
                for (size_t j = 0; j < bufferSize; j++) {
                    bufferPtr[j] = static_cast<uint8_t>(i);
                }

                bool done = (i == 9);
                onUpdateCopy->call(runtime, jsi::Value((int)bufferSize), jsi::Value(done));
              });
            }

            // Schedule the final resolution on the JS thread
            this->jsInvoker_->invokeAsync([&runtime, resolveFunc, timestamp, cancelled]() {
              if (cancelled->load()) return;
              std::string result = "Attractor calculation completed for timestamp: " + timestamp;
              resolveFunc->call(runtime, jsi::String::createFromUtf8(runtime, result));
            });

          } catch (const std::exception& e) {
            // Schedule rejection on the JS thread
            this->jsInvoker_->invokeAsync([&runtime, rejectFunc, e]() {
              rejectFunc->call(runtime, jsi::String::createFromUtf8(runtime, e.what()));
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