//------------------------------------------------------------------------------
// WebAssembly Attractor Calculator Module
//
// This module implements Clifford and deJong attractors in C++ compiled to WebAssembly
// It provides the same functionality as the React Native native module but runs in browsers
// through WebAssembly.
//
// The module exposes:
// - AttractorCalculator class with calculation methods
// - Performance rating functions to determine device capabilities
//------------------------------------------------------------------------------

#include <emscripten/bind.h>
#include <algorithm>
#include <chrono>
#include <cmath>
#include <functional>
#include <string>
#include <tuple>
#include <vector>

namespace attractor {

// Represents an RGB color
struct RGB {
  int r, g, b;
};

struct AttractorParameters {
  std::string attractor;
  double a;
  double b;
  double c;
  double d;
  double hue;
  double saturation;
  double brightness;
  std::vector<int> background;
  double scale;
  double left;
  double top;
};

// Version information
std::string version = "2.0.1";

// A C++ implementation of the BezierEasing function from the original JS.
// It returns a lambda function that calculates the easing.
std::function<double(double)>
bezierEasing(double p0, double p1, double p2, double p3) {
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
hsvToRgb(double h, double s, double v) {
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
getColorData(
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

uint32_t
getLowQualityPoint(double hue, double saturation, double brightness) {
  RGB rgb = hsvToRgb(hue, saturation, brightness);
  return (255 << 24) | (rgb.b << 16) | (rgb.g << 8) | rgb.r;
}

double
smoothing(double num, double scale) {
  const double factor = 0.222;
  // Use C++ random to match JavaScript's Math.random() < 0.5 behavior
  return num +
    (static_cast<double>(std::rand()) / RAND_MAX < 0.5 ? -factor : factor) * (1.0 / scale);
}

std::pair<double, double>
clifford(double x, double y, double a, double b, double c, double d) {
  return {std::sin(a * y) + c * std::cos(a * x), std::sin(b * x) + d * std::cos(b * y)};
}

std::pair<double, double>
dejong(double x, double y, double a, double b, double c, double d) {
  return {std::sin(a * y) - std::cos(b * x), std::sin(c * x) - std::cos(d * y)};
}

// AttractorCalculator class to manage attractor calculations in WASM
class AttractorCalculator {
 public:
  AttractorCalculator() {
  }

  std::string
  getBuildNumber() {
    return version;
  }

  // accumulate attractor density
  emscripten::val
  calculateAttractorDensity(
    emscripten::val jsAttractorParams,
    emscripten::val jsDensityBuffer,
    emscripten::val jsInfoBuffer,
    int width,
    int height,
    double x,
    double y,
    int pointsToCalculate
  ) {
    // Extract parameters from JS object
    AttractorParameters attractorParams = extractAttractorParameters(jsAttractorParams);

    // Get buffer pointers from JS using typed arrays directly
    emscripten::val densityArray = emscripten::val::global("Uint32Array").new_(jsDensityBuffer);
    emscripten::val infoArray = emscripten::val::global("Int32Array").new_(jsInfoBuffer);

    // Get attractor function based on type
    std::function<std::pair<double, double>(double, double, double, double, double, double)>
      attractorFunc;
    if (attractorParams.attractor == "clifford") {
      attractorFunc = clifford;
    } else if (attractorParams.attractor == "dejong") {
      attractorFunc = dejong;
    } else {
      // Return error object
      emscripten::val error = emscripten::val::object();
      error.set(
        "error",
        "Invalid attractor type: " + attractorParams.attractor + ". Must be 'clifford' or 'dejong'."
      );
      return error;
    }

    // Initialize calculation variables
    double centerX = width / 2.0 + attractorParams.left;
    double centerY = height / 2.0 + attractorParams.top;

    // Accumulate density
    accumulateDensity(
      densityArray,
      infoArray,
      x,
      y,
      pointsToCalculate,
      width,
      height,
      attractorParams,
      centerX,
      centerY,
      attractorFunc
    );

    // Return result object
    emscripten::val result = emscripten::val::object();
    result.set("x", x);
    result.set("y", y);
    result.set("pointsAdded", pointsToCalculate);

    return result;
  }

  emscripten::val
  createAttractorImage(
    emscripten::val jsAttractorParams,
    emscripten::val jsDensityBuffer,
    emscripten::val jsImageBuffer,
    emscripten::val jsInfoBuffer,
    bool highQuality,
    int width,
    int height,
    double x,
    double y,
    int pointsToCalculate
  ) {
    // Extract parameters from JS object
    AttractorParameters attractorParams = extractAttractorParameters(jsAttractorParams);

    // Get buffer pointers from JS using typed arrays directly
    emscripten::val densityArray = emscripten::val::global("Uint32Array").new_(jsDensityBuffer);
    emscripten::val imageArray = emscripten::val::global("Uint32Array").new_(jsImageBuffer);
    emscripten::val infoArray = emscripten::val::global("Int32Array").new_(jsInfoBuffer);

    // Create image data
    createImageData(
      imageArray, width * height, densityArray, infoArray, highQuality, attractorParams
    );

    return emscripten::val::object();
  }

  // Calculate attractor points and return density and image data
  emscripten::val
  calculateAttractor(
    emscripten::val jsAttractorParams,
    emscripten::val jsDensityBuffer,
    emscripten::val jsImageBuffer,
    emscripten::val jsInfoBuffer,
    bool highQuality,
    int width,
    int height,
    double x,
    double y,
    int pointsToCalculate,
    bool shouldDraw
  ) {
    // Extract parameters from JS object
    AttractorParameters attractorParams = extractAttractorParameters(jsAttractorParams);

    // Get buffer pointers from JS using typed arrays directly
    emscripten::val densityArray = emscripten::val::global("Uint32Array").new_(jsDensityBuffer);
    emscripten::val infoArray = emscripten::val::global("Int32Array").new_(jsInfoBuffer);
    emscripten::val imageArray = emscripten::val::global("Uint32Array").new_(jsImageBuffer);

    // Get attractor function based on type
    std::function<std::pair<double, double>(double, double, double, double, double, double)>
      attractorFunc;
    if (attractorParams.attractor == "clifford") {
      attractorFunc = clifford;
    } else if (attractorParams.attractor == "dejong") {
      attractorFunc = dejong;
    } else {
      // Return error object
      emscripten::val error = emscripten::val::object();
      error.set(
        "error",
        "Invalid attractor type: " + attractorParams.attractor + ". Must be 'clifford' or 'dejong'."
      );
      return error;
    }

    // Initialize calculation variables
    double centerX = width / 2.0 + attractorParams.left;
    double centerY = height / 2.0 + attractorParams.top;

    // Accumulate density
    accumulateDensity(
      densityArray,
      infoArray,
      x,
      y,
      pointsToCalculate,
      width,
      height,
      attractorParams,
      centerX,
      centerY,
      attractorFunc
    );

    // Create image data
    if (shouldDraw) {
      createImageData(
        imageArray, width * height, densityArray, infoArray, highQuality, attractorParams
      );
    }

    // Return result object
    emscripten::val result = emscripten::val::object();
    result.set("x", x);
    result.set("y", y);
    result.set("pointsAdded", pointsToCalculate);

    return result;
  }

 private:
  // Extract parameters from JS object
  AttractorParameters
  extractAttractorParameters(emscripten::val jsParams) {
    emscripten::val jsBackground = jsParams["background"];
    std::vector<int> background;

    for (int i = 0; i < jsBackground["length"].as<int>(); i++) {
      background.push_back(jsBackground[i].as<int>());
    }

    return {
      jsParams["attractor"].as<std::string>(),
      jsParams["a"].as<double>(),
      jsParams["b"].as<double>(),
      jsParams["c"].as<double>(),
      jsParams["d"].as<double>(),
      jsParams["hue"].as<double>(),
      jsParams["saturation"].as<double>(),
      jsParams["brightness"].as<double>(),
      background,
      jsParams["scale"].as<double>(),
      jsParams["left"].as<double>(),
      jsParams["top"].as<double>()
    };
  }

  // Accumulate density function
  void
  accumulateDensity(
    emscripten::val& densityArray,
    emscripten::val& infoArray,
    double& x,
    double& y,
    const int pointsToCalculate,
    const int w,
    const int h,
    const AttractorParameters& attractorParams,
    const double centerX,
    const double centerY,
    const std::function<std::pair<double, double>(double, double, double, double, double, double)>&
      fn
  ) {
    int i = 0;
    int densitySize = w * h;

    while (i < pointsToCalculate && infoArray[1].as<int>() == 0) {
      auto next =
        fn(x, y, attractorParams.a, attractorParams.b, attractorParams.c, attractorParams.d);
      x = smoothing(next.first, attractorParams.scale);
      y = smoothing(next.second, attractorParams.scale);

      double screenX = x * attractorParams.scale;
      double screenY = y * attractorParams.scale;
      int px = static_cast<int>(std::floor(centerX + screenX));
      int py = static_cast<int>(std::floor(centerY + screenY));

      if (px >= 0 && px < w && py >= 0 && py < h) {
        int idx = py * w + px;
        if (idx >= 0 && idx < densitySize) {
          // Get current value, increment it, and update the array
          int currentVal = densityArray[idx].as<int>();
          int newVal = currentVal + 1;
          densityArray.set(idx, newVal);

          if (newVal > infoArray[0].as<int>()) {
            infoArray.set(0, newVal);
          }
        }
      }

      i++;
    }
  }

  // Create image data function
  void
  createImageData(
    emscripten::val& imageArray,
    int imageSize,
    const emscripten::val& densityArray,
    emscripten::val& infoArray,
    bool highQuality,
    const AttractorParameters& attractorParams
  ) {
    int loopLimit = imageSize;
    int maxDensity = infoArray[0].as<int>();

    uint32_t bgColor = 0;
    if (!attractorParams.background.empty()) {
      uint32_t bgA = attractorParams.background.size() > 3 ? attractorParams.background[3] : 255;
      uint32_t bgB = attractorParams.background.size() > 2 ? attractorParams.background[2] : 0;
      uint32_t bgG = attractorParams.background.size() > 1 ? attractorParams.background[1] : 0;
      uint32_t bgR = attractorParams.background[0];
      bgColor = (bgA << 24) | (bgB << 16) | (bgG << 8) | bgR;
    }

    if (infoArray[1].as<int>() != 0) {
      // Cancel the operation
      return;
    }

    int i = 0;
    while (i < loopLimit && infoArray[1].as<int>() == 0) {
      int dval = densityArray[i].as<int>();
      if (dval > 0) {
        if (highQuality) {
          uint32_t colorData = getColorData(
            dval,
            maxDensity,
            attractorParams.hue,
            attractorParams.saturation,
            attractorParams.brightness,
            1.0,
            attractorParams.background
          );
          imageArray.set(i, colorData);
        } else {
          uint32_t colorData = getLowQualityPoint(
            attractorParams.hue, attractorParams.saturation, attractorParams.brightness
          );
          imageArray.set(i, colorData);
        }
      } else {
        imageArray.set(i, bgColor);
      }
      i++;
    }
  }

  // Methods that work with JavaScript arrays directly - these are the only ones we need
};

// Performance rating enum (matching the native implementation)
enum PerformanceRating {
  VERY_SLOW = 1,
  SLOW = 2,
  MEDIUM = 3,
  FAST = 4,
  VERY_FAST = 5,
  UNKNOWN = 0
};

// Rate performance function
double
ratePerformance() {
  const int num_iterations = 1000000;  // 1 million iterations for a quicker test
  volatile double result = 0.0;

  auto start = std::chrono::high_resolution_clock::now();

  for (int i = 0; i < num_iterations; ++i) {
    result += std::sin(static_cast<double>(i)) * std::cos(static_cast<double>(i));
  }

  auto end = std::chrono::high_resolution_clock::now();
  std::chrono::duration<double, std::milli> elapsed = end - start;

  if (elapsed.count() == 0) {
    return static_cast<double>(VERY_FAST);  // Execution was too fast to measure
  }

  double score = num_iterations / elapsed.count();

  // These thresholds are calibrated based on typical performance ranges
  PerformanceRating rating = VERY_FAST;
  // if (score > 200000) {
  //   rating = VERY_FAST;
  // } else if (score > 100000) {
  //   rating = FAST;
  // } else if (score > 50000) {
  //   rating = MEDIUM;
  // } else if (score > 10000) {
  //   rating = SLOW;
  // } else {
  //   rating = VERY_SLOW;
  // }
  return static_cast<double>(rating);
}

}  // namespace attractor

// Emscripten bindings
EMSCRIPTEN_BINDINGS(attractor_module) {
  emscripten::class_<attractor::AttractorCalculator>("AttractorCalculator")
    .constructor<>()
    .function("getBuildNumber", &attractor::AttractorCalculator::getBuildNumber)
    .function("calculateAttractor", &attractor::AttractorCalculator::calculateAttractor)
    .function(
      "calculateAttractorDensity", &attractor::AttractorCalculator::calculateAttractorDensity
    )
    .function("createAttractorImage", &attractor::AttractorCalculator::createAttractorImage);

  emscripten::function("ratePerformance", &attractor::ratePerformance);

  // Enum binding
  emscripten::enum_<attractor::PerformanceRating>("PerformanceRating")
    .value("VERY_SLOW", attractor::PerformanceRating::VERY_SLOW)
    .value("SLOW", attractor::PerformanceRating::SLOW)
    .value("MEDIUM", attractor::PerformanceRating::MEDIUM)
    .value("FAST", attractor::PerformanceRating::FAST)
    .value("VERY_FAST", attractor::PerformanceRating::VERY_FAST)
    .value("UNKNOWN", attractor::PerformanceRating::UNKNOWN);
}
