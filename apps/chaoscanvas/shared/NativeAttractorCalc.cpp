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
    // Default or error case
    return [=](double x, double y, double a, double b, double c, double d) {
        return std::make_pair(0.0, 0.0);
    };
}

void NativeAttractorCalc::accumulate_density(AccumulationContext& context) {
    auto result = context.fn(context.x, context.y, context.a, context.b, context.c, context.d);
    context.x = result.first;
    context.y = result.second;

    int screen_x = static_cast<int>(context.x * context.scale + context.centerX);
    int screen_y = static_cast<int>(context.y * context.scale + context.centerY);

    if (screen_x >= 0 && screen_x < context.w && screen_y >= 0 && screen_y < context.h) {
        int index = screen_y * context.w + screen_x;
        if (index < context.density.size()) {
            context.density[index]++;
            if (context.density[index] > context.max_density) {
                context.max_density = context.density[index];
            }
        }
    }
}

void NativeAttractorCalc::create_image_data(ImageDataCreationContext& context) {
    for (size_t i = 0; i < context.imageSize && i < context.density.size(); ++i) {
        if (context.density[i] > 0) {
            double progress = static_cast<double>(i) / context.imageSize;
            context.imageData[i] = get_color_data(
                context.density[i],
                context.max_density,
                context.h,
                context.s,
                context.v,
                progress,
                context.background
            );
        } else {
            context.imageData[i] = 0; // Or some background color
        }
    }
}

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
    if (!buffer.isArrayBuffer(rt)) {
      throw jsi::JSError(rt, "Third argument must be an ArrayBuffer.");
    }
    auto arrayBuffer = buffer.getArrayBuffer(rt);
    uint8_t* bufferPtr = arrayBuffer.data(rt);
    size_t bufferSize = arrayBuffer.size(rt);

    auto onProgressCopy = std::make_shared<jsi::Function>(std::move(onProgress));
    auto onImageUpdateCopy = std::make_shared<jsi::Function>(std::move(onImageUpdate));
    auto attractorParamsCopy = std::make_shared<AttractorParameters>(std::move(attractorParams));
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
          attractorParamsCopy,
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
            timestamp,
            onProgressCopy,
            onImageUpdateCopy,
            bufferPtr,
            bufferSize,
            resolveFunc,
            rejectFunc,
            cancelled,
            attractorParamsCopy,
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
                this->jsInvoker_->invokeAsync([rejectFunc](jsi::Runtime& runtime) {
                  rejectFunc->call(runtime, jsi::String::createFromUtf8(runtime, "Cancelled from C++"));
                });
                return; // Exit the thread
              }

              // get attractor function
              auto attractorFunc = get_attractor_function(*attractorParamsCopy);

              // Initialize calculation variables
              std::vector<uint32_t> density(*widthCopy * *heightCopy, 0);
              
              double max_density = 0.0;
              double x = 0.0, y = 0.0;
              double centerX = *widthCopy / 2.0 + attractorParamsCopy->left;
              double centerY = *heightCopy / 2.0 + attractorParamsCopy->top;

              int totalPoints = 0;
              while(totalPoints < *totalAttractorPointsCopy) {

                // this allows cancellation
                std::this_thread::sleep_for(std::chrono::milliseconds(1));
                if (cancelled->load()) {
                  // When cancelled, reject the promise from the JS thread
                  this->jsInvoker_->invokeAsync([rejectFunc](jsi::Runtime& runtime) {
                    rejectFunc->call(runtime, jsi::String::createFromUtf8(runtime, "Cancelled"));
                  });
                  return; // Exit the thread
                }
                
                int i = 0;

                // Perform calculations
                while(i < *pointsPerIterationCopy && totalPoints < *totalAttractorPointsCopy) {

                  // this allows cancellation
                  std::this_thread::sleep_for(std::chrono::milliseconds(1));
                  if (cancelled->load()) {
                    // When cancelled, reject the promise from the JS thread
                    this->jsInvoker_->invokeAsync([rejectFunc](jsi::Runtime& runtime) {
                      rejectFunc->call(runtime, jsi::String::createFromUtf8(runtime, "Cancelled"));
                    });
                    return; // Exit the thread
                  }
                  
                  AccumulationContext context = {
                    .density = density,
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
                    .fn = attractorFunc
                  };
                  accumulate_density(context);

                  // on time, draw on the canvas
                  if (
                    totalPoints == 2 ||
                    totalPoints % *drawOnCopy == 0 ||
                    totalPoints == *totalAttractorPointsCopy - 1
                  ) {

                    // this allows cancellation
                    std::this_thread::sleep_for(std::chrono::milliseconds(1));
                    if (cancelled->load()) {
                      // When cancelled, reject the promise from the JS thread
                      this->jsInvoker_->invokeAsync([rejectFunc](jsi::Runtime& runtime) {
                        rejectFunc->call(runtime, jsi::String::createFromUtf8(runtime, "Cancelled"));
                      });
                      return; // Exit the thread
                    }

                    // Draw the current state on the canvas
                    ImageDataCreationContext imageContext = {
                      .imageData = reinterpret_cast<uint32_t*>(bufferPtr),
                      .imageSize = bufferSize / sizeof(uint32_t),
                      .density = density,
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
                  double progress = static_cast<double>(totalPoints) / *totalAttractorPointsCopy;
                  this->jsInvoker_->invokeAsync([onProgressCopy, progress](jsi::Runtime& runtime) {
                    // rejectFunc->call(runtime, jsi::String::createFromUtf8(runtime, "Cancelled"));
                    onProgressCopy->call(runtime, jsi::Value(progress));
                  });

                  i = i + 1;
                  totalPoints = totalPoints + 1;
                }

              }


            // Simulating attractor calculation
            // for (int i = 0; i < 10; i++) {
            //   if (cancelled->load()) {
            //     // When cancelled, reject the promise from the JS thread
            //     this->jsInvoker_->invokeAsync([rejectFunc](jsi::Runtime& runtime) {
            //       rejectFunc->call(runtime, jsi::String::createFromUtf8(runtime, "Cancelled from C++"));
            //     });
            //     return; // Exit the thread
            //   }

            //   // sleep for a short duration to simulate work on the background thread
            //   std::this_thread::sleep_for(std::chrono::milliseconds(100));

            //   // Schedule progress and update callbacks on the JS thread
            //   if (cancelled->load()) {
            //     // When cancelled, reject the promise from the JS thread
            //     this->jsInvoker_->invokeAsync([rejectFunc](jsi::Runtime& runtime) {
            //       rejectFunc->call(runtime, jsi::String::createFromUtf8(runtime, "Cancelled from C++"));
            //     });
            //     return; // Exit the thread
            //   }

            //   double progress = (i + 1) / 10.0;
            //   this->jsInvoker_->invokeAsync([onProgressCopy, progress](jsi::Runtime& runtime) {
            //     onProgressCopy->call(runtime, jsi::Value(progress));
            //   });

            //   // This is a dummy implementation.
            //   for (size_t j = 0; j < bufferSize; j++) {
            //       bufferPtr[j] = static_cast<uint8_t>(i);
            //   }

            //   bool done = (i == 9);
            //   this->jsInvoker_->invokeAsync([onImageUpdateCopy, done](jsi::Runtime& runtime) {
            //     onImageUpdateCopy->call(runtime, jsi::Value(done));
            //   });
            // }                          
            
            // Schedule the final resolution on the JS thread
            this->jsInvoker_->invokeAsync([resolveFunc, timestamp, cancelled](jsi::Runtime& runtime) {
              if (cancelled->load()) return;
              std::string result = "Attractor calculation completed for timestamp: " + timestamp;
              resolveFunc->call(runtime, jsi::String::createFromUtf8(runtime, result));
            });

          } catch (const std::exception& e) {
            std::string error_message = e.what();
            // Schedule rejection on the JS thread
            this->jsInvoker_->invokeAsync([rejectFunc, error_message](jsi::Runtime& runtime) {
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