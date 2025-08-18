//------------------------------------------------------------------------------
// WebAssembly Attractor Calculator Module
//
// This module implements Clifford and deJong attractors in C++ compiled to WebAssembly
// It provides the same functionality as the React Native native module but runs in browsers
// through WebAssembly.
//
// The module exposes:
// - Calculation functions for attractors (calculateAttractor, calculateAttractorDensity)
// - Image creation function (createAttractorImage)
// - Performance rating function to determine device capabilities (ratePerformance)
//------------------------------------------------------------------------------

#include <emscripten/bind.h>
#include <emscripten/val.h>
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
  const double factor = 0.2;
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

// Standalone utility functions to manage attractor calculations in WASM

// Get build version
std::string
getBuildNumber() {
  return version;
}

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

// Context for accumulating density into a typed array (WASM side)
struct AccumulationContext {
  emscripten::val* jsDensityArray;         // Pointer to JS Uint32Array view (nullable)
  std::vector<uint32_t>* cppDensityArray;  // Pointer to std::vector<uint32_t> (nullable)
  emscripten::val* jsInfoArray;            // Pointer to JS Uint32Array view (nullable)
  std::vector<uint32_t>* cppInfoArray;     // Pointer to std::vector<uint32_t> (nullable)
  double x;
  double y;
  int pointsToCalculate;
  int w;
  int h;
  AttractorParameters attractorParams;
  double centerX;
  double centerY;
  std::function<std::pair<double, double>(double, double, double, double, double, double)> fn;
  bool updateProgress;
};

// Accumulate density function
void
accumulateDensity(AccumulationContext& context) {
  int i = 0;
  int densitySize = context.w * context.h;

  // Helper functions to access info array values
  auto getCancelFlag = [&]() -> int {
    if (context.jsInfoArray)
      return (*context.jsInfoArray)[1].as<int>();
    if (context.cppInfoArray)
      return (*context.cppInfoArray)[1];
    return 0;
  };

  auto getMaxDensity = [&]() -> int {
    if (context.jsInfoArray)
      return (*context.jsInfoArray)[0].as<int>();
    if (context.cppInfoArray)
      return (*context.cppInfoArray)[0];
    return 0;
  };

  auto setMaxDensity = [&](uint32_t value) {
    if (context.jsInfoArray)
      context.jsInfoArray->set(0, value);
    if (context.cppInfoArray)
      (*context.cppInfoArray)[0] = value;
  };

  auto getProgress = [&]() -> int {
    if (context.jsInfoArray)
      return (*context.jsInfoArray)[3].as<int>();
    if (context.cppInfoArray)
      return (*context.cppInfoArray)[3];
    return 0;
  };

  auto setProgress = [&](int value) {
    if (context.jsInfoArray)
      context.jsInfoArray->set(3, value);
    if (context.cppInfoArray)
      (*context.cppInfoArray)[3] = value;
  };

  while (i < context.pointsToCalculate && getCancelFlag() == 0) {
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
      if (idx >= 0 && idx < densitySize) {
        // Handle both JS and C++ array types
        if (context.jsDensityArray) {
          // Use JS array
          int currentVal = (*context.jsDensityArray)[idx].as<int>();
          int newVal = currentVal + 1;
          context.jsDensityArray->set(idx, newVal);

          if (newVal > getMaxDensity()) {
            setMaxDensity(newVal);
          }
        } else if (context.cppDensityArray) {
          // Use C++ vector
          (*context.cppDensityArray)[idx]++;
          uint32_t newVal = (*context.cppDensityArray)[idx];

          if (newVal > getMaxDensity()) {
            setMaxDensity(newVal);
          }
        }
      }
    }

    i++;

    if (context.updateProgress && (i % 100000 == 0 || i == context.pointsToCalculate - 1)) {
      // Update progress, this will result in <100 to let other process define what 100 is
      int newProgress =
        static_cast<int>(i / static_cast<double>(context.pointsToCalculate) * 100.0);
      if (newProgress != getProgress()) {
        setProgress(newProgress);
      }
    }
  }
}

// Context for image data creation (WASM side)
struct ImageDataCreationContext {
  emscripten::val* jsImageArray;         // Pointer to JS Uint32Array view (nullable)
  std::vector<uint32_t>* cppImageArray;  // Pointer to std::vector<uint32_t> (nullable)
  int imageSize;
  emscripten::val* jsDensityArray;         // Pointer to JS Uint32Array view (nullable)
  std::vector<uint32_t>* cppDensityArray;  // Pointer to std::vector<uint32_t> (nullable)
  emscripten::val* jsInfoArray;            // Pointer to JS Uint32Array view (nullable)
  std::vector<uint32_t>* cppInfoArray;     // Pointer to std::vector<uint32_t> (nullable)
  bool highQuality;
  AttractorParameters attractorParams;
};

// Create image data function
void
createImageData(ImageDataCreationContext& context) {
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

  // Helper functions to access info array values
  auto getCancelFlag = [&]() -> int {
    if (context.jsInfoArray)
      return (*context.jsInfoArray)[1].as<int>();
    if (context.cppInfoArray)
      return (*context.cppInfoArray)[1];
    return 0;
  };

  auto getMaxDensity = [&]() -> int {
    if (context.jsInfoArray)
      return (*context.jsInfoArray)[0].as<int>();
    if (context.cppInfoArray)
      return (*context.cppInfoArray)[0];
    return 1;
  };

  if (getCancelFlag() != 0) {
    // Cancel the operation
    return;
  }

  int i = 0;
  while (i < loopLimit && getCancelFlag() == 0) {
    int dval = 0;

    // Handle both JS and C++ array types for density data
    if (context.jsDensityArray) {
      dval = (*context.jsDensityArray)[i].as<int>();
    } else if (context.cppDensityArray) {
      dval = (*context.cppDensityArray)[i];
    }

    if (dval > 0) {
      if (context.highQuality) {
        uint32_t colorData = getColorData(
          dval,
          getMaxDensity(),
          context.attractorParams.hue,
          context.attractorParams.saturation,
          context.attractorParams.brightness,
          1.0,
          context.attractorParams.background
        );

        // Handle both JS and C++ array types for image output
        if (context.jsImageArray) {
          context.jsImageArray->set(i, colorData);
        } else if (context.cppImageArray) {
          (*context.cppImageArray)[i] = colorData;
        }
      } else {
        uint32_t colorData = getLowQualityPoint(
          context.attractorParams.hue,
          context.attractorParams.saturation,
          context.attractorParams.brightness
        );

        // Handle both JS and C++ array types for image output
        if (context.jsImageArray) {
          context.jsImageArray->set(i, colorData);
        } else if (context.cppImageArray) {
          (*context.cppImageArray)[i] = colorData;
        }
      }
    } else {
      // Handle both JS and C++ array types for image output
      if (context.jsImageArray) {
        context.jsImageArray->set(i, bgColor);
      } else if (context.cppImageArray) {
        (*context.cppImageArray)[i] = bgColor;
      }
    }
    i++;
  }
}

// Context for density calculation
struct AttractorLoopContext {
  emscripten::val attractorParams;
  emscripten::val densityBuffer;
  emscripten::val infoBuffer;
  emscripten::val imageBuffer;
  bool highQuality;
  int pointsToCalculate;
  int width;
  int height;
  double x;
  double y;
  int loopNum;
  int drawAt;
};

emscripten::val
calculateAttractorLoop(emscripten::val jsCtx) {
  AttractorLoopContext ctx = {
    .attractorParams = jsCtx["attractorParams"],
    .densityBuffer = jsCtx["densityBuffer"],
    .infoBuffer = jsCtx["infoBuffer"],
    .imageBuffer = jsCtx["imageBuffer"],
    .highQuality = jsCtx["highQuality"].as<bool>(),
    .pointsToCalculate = jsCtx["pointsToCalculate"].as<int>(),
    .width = jsCtx["width"].as<int>(),
    .height = jsCtx["height"].as<int>(),
    .x = jsCtx["x"].as<double>(),
    .y = jsCtx["y"].as<double>(),
    .loopNum = jsCtx["loopNum"].as<int>(),
    .drawAt = jsCtx["drawAt"].as<int>()
  };

  // Extract parameters from JS object
  AttractorParameters attractorParams = extractAttractorParameters(ctx.attractorParams);

  // Get buffer pointers from JS using typed arrays directly
  // emscripten::val densityArray = emscripten::val::global("Uint32Array").new_(ctx.densityBuffer);
  emscripten::val imageArray = emscripten::val::global("Uint32Array").new_(ctx.imageBuffer);
  emscripten::val infoArray = emscripten::val::global("Uint32Array").new_(ctx.infoBuffer);

  // Create C++ vector for fast computation (initialize to zero)
  std::vector<uint32_t> uint32DensityArray(ctx.width * ctx.height, 0);
  std::vector<uint32_t> uint32ImageArray(ctx.width * ctx.height, 0);
  std::vector<uint32_t> uint32InfoArray(infoArray["length"].as<int>(), 0);

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
  double centerX = ctx.width / 2.0 + attractorParams.left;
  double centerY = ctx.height / 2.0 + attractorParams.top;

  int pointsToCalculate =
    static_cast<int>(ctx.pointsToCalculate / static_cast<double>(ctx.loopNum));
  int num = 0;

  // Accumulate density
  AccumulationContext accumCtx = {
    .jsDensityArray = nullptr,
    .cppDensityArray = &uint32DensityArray,
    .jsInfoArray = nullptr,
    .cppInfoArray = &uint32InfoArray,
    .x = ctx.x,
    .y = ctx.y,
    .pointsToCalculate = pointsToCalculate,
    .w = ctx.width,
    .h = ctx.height,
    .attractorParams = attractorParams,
    .centerX = centerX,
    .centerY = centerY,
    .fn = attractorFunc,
    .updateProgress = false
  };

  // Create image data
  ImageDataCreationContext imgCtx = {
    .jsImageArray = nullptr,
    .cppImageArray = &uint32ImageArray,
    .imageSize = ctx.width * ctx.height,
    .jsDensityArray = nullptr,
    .cppDensityArray = &uint32DensityArray,
    .jsInfoArray = nullptr,
    .cppInfoArray = &uint32InfoArray,
    .highQuality = ctx.highQuality,
    .attractorParams = attractorParams
  };

  int totalLoop = 0;
  while (num < ctx.loopNum) {
    accumulateDensity(accumCtx);

    if ((totalLoop % ctx.drawAt) == 0 || num == ctx.loopNum - 1) {
      createImageData(imgCtx);
      // Copy C++ image data to JavaScript array for display
      int i = 0;
      while (i < imgCtx.imageSize) {
        imageArray.set(i, (*imgCtx.cppImageArray)[i]);
        i++;
      }
    }
    totalLoop = totalLoop + pointsToCalculate;
    num++;

    // Copy progress
    infoArray.set(3, static_cast<uint32_t>(num / static_cast<double>(ctx.loopNum) * 100.0));

    // Copy cancelation
    uint32InfoArray[1] = infoArray[1].as<int>();
  }

  emscripten::val result = emscripten::val::object();
  result.set("x", accumCtx.x);
  result.set("y", accumCtx.y);
  result.set("pointsAdded", ctx.pointsToCalculate);

  return result;
}

// Context for density calculation
struct AttractorDensityContext {
  emscripten::val attractorParams;
  emscripten::val densityBuffer;
  emscripten::val infoBuffer;
  int width;
  int height;
  double x;
  double y;
  int pointsToCalculate;
};

// Accumulate attractor density
emscripten::val
calculateAttractorDensity(emscripten::val jsCtx) {
  // Extract all parameters from the JavaScript object
  AttractorDensityContext ctx = {
    .attractorParams = jsCtx["attractorParams"],
    .densityBuffer = jsCtx["densityBuffer"],
    .infoBuffer = jsCtx["infoBuffer"],
    .width = jsCtx["width"].as<int>(),
    .height = jsCtx["height"].as<int>(),
    .x = jsCtx["x"].as<double>(),
    .y = jsCtx["y"].as<double>(),
    .pointsToCalculate = jsCtx["pointsToCalculate"].as<int>()
  };

  // Extract parameters from JS object
  AttractorParameters attractorParams = extractAttractorParameters(ctx.attractorParams);

  // Get buffer pointers from JS using typed arrays directly
  emscripten::val densityArray = emscripten::val::global("Uint32Array").new_(ctx.densityBuffer);
  emscripten::val infoArray = emscripten::val::global("Uint32Array").new_(ctx.infoBuffer);

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
  double centerX = ctx.width / 2.0 + attractorParams.left;
  double centerY = ctx.height / 2.0 + attractorParams.top;

  // Accumulate density
  AccumulationContext accumCtx = {
    .jsDensityArray = &densityArray,
    .cppDensityArray = nullptr,
    .jsInfoArray = &infoArray,
    .cppInfoArray = nullptr,
    .x = ctx.x,
    .y = ctx.y,
    .pointsToCalculate = ctx.pointsToCalculate,
    .w = ctx.width,
    .h = ctx.height,
    .attractorParams = attractorParams,
    .centerX = centerX,
    .centerY = centerY,
    .fn = attractorFunc,
    .updateProgress = true
  };
  accumulateDensity(accumCtx);

  // Return result object
  emscripten::val result = emscripten::val::object();
  result.set("x", accumCtx.x);
  result.set("y", accumCtx.y);
  result.set("pointsAdded", ctx.pointsToCalculate);

  return result;
}

// Context for creating attractor images
struct AttractorImageContext {
  emscripten::val attractorParams;
  emscripten::val densityBuffer;
  emscripten::val imageBuffer;
  emscripten::val infoBuffer;
  bool highQuality;
  int width;
  int height;
};

emscripten::val
createAttractorImage(emscripten::val jsCtx) {
  // Extract all parameters from the JavaScript object
  AttractorImageContext ctx = {
    .attractorParams = jsCtx["attractorParams"],
    .densityBuffer = jsCtx["densityBuffer"],
    .imageBuffer = jsCtx["imageBuffer"],
    .infoBuffer = jsCtx["infoBuffer"],
    .highQuality = jsCtx["highQuality"].as<bool>(),
    .width = jsCtx["width"].as<int>(),
    .height = jsCtx["height"].as<int>()
  };

  // Extract parameters from JS object
  AttractorParameters attractorParams = extractAttractorParameters(ctx.attractorParams);

  // Get buffer pointers from JS using typed arrays directly
  emscripten::val densityArray = emscripten::val::global("Uint32Array").new_(ctx.densityBuffer);
  emscripten::val imageArray = emscripten::val::global("Uint32Array").new_(ctx.imageBuffer);
  emscripten::val infoArray = emscripten::val::global("Uint32Array").new_(ctx.infoBuffer);

  // Create image data
  ImageDataCreationContext imgCtx = {
    .jsImageArray = &imageArray,
    .cppImageArray = nullptr,
    .imageSize = ctx.width * ctx.height,
    .jsDensityArray = &densityArray,
    .cppDensityArray = nullptr,
    .jsInfoArray = &infoArray,
    .cppInfoArray = nullptr,
    .highQuality = ctx.highQuality,
    .attractorParams = attractorParams
  };
  createImageData(imgCtx);

  return emscripten::val::object();
}

// Calculation context struct to encapsulate all parameters for attractor calculation
struct AttractorCalculationContext {
  emscripten::val attractorParams;
  emscripten::val densityBuffer;
  emscripten::val imageBuffer;
  emscripten::val infoBuffer;
  bool highQuality;
  int width;
  int height;
  double x;
  double y;
  int pointsToCalculate;
  bool shouldDraw;
};

// Calculate attractor points and return density and image data using a struct-based approach
emscripten::val
calculateAttractor(emscripten::val jsCtx) {
  // Extract all parameters from the JavaScript object
  AttractorCalculationContext ctx = {
    .attractorParams = jsCtx["attractorParams"],
    .densityBuffer = jsCtx["densityBuffer"],
    .imageBuffer = jsCtx["imageBuffer"],
    .infoBuffer = jsCtx["infoBuffer"],
    .highQuality = jsCtx["highQuality"].as<bool>(),
    .width = jsCtx["width"].as<int>(),
    .height = jsCtx["height"].as<int>(),
    .x = jsCtx["x"].as<double>(),
    .y = jsCtx["y"].as<double>(),
    .pointsToCalculate = jsCtx["pointsToCalculate"].as<int>(),
    .shouldDraw = jsCtx["shouldDraw"].as<bool>()
  };

  // Extract parameters from JS object
  AttractorParameters attractorParams = extractAttractorParameters(ctx.attractorParams);

  // Get buffer pointers from JS using typed arrays directly
  emscripten::val densityArray = emscripten::val::global("Uint32Array").new_(ctx.densityBuffer);
  emscripten::val infoArray = emscripten::val::global("Uint32Array").new_(ctx.infoBuffer);
  emscripten::val imageArray = emscripten::val::global("Uint32Array").new_(ctx.imageBuffer);

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
  double centerX = ctx.width / 2.0 + attractorParams.left;
  double centerY = ctx.height / 2.0 + attractorParams.top;

  // Accumulate density
  AccumulationContext accumCtx = {
    .jsDensityArray = &densityArray,
    .cppDensityArray = nullptr,
    .jsInfoArray = &infoArray,
    .cppInfoArray = nullptr,
    .x = ctx.x,
    .y = ctx.y,
    .pointsToCalculate = ctx.pointsToCalculate,
    .w = ctx.width,
    .h = ctx.height,
    .attractorParams = attractorParams,
    .centerX = centerX,
    .centerY = centerY,
    .fn = attractorFunc,
    .updateProgress = true
  };
  accumulateDensity(accumCtx);

  // Create image data
  if (ctx.shouldDraw) {
    ImageDataCreationContext imgCtx = {
      .jsImageArray = &imageArray,
      .cppImageArray = nullptr,
      .imageSize = ctx.width * ctx.height,
      .jsDensityArray = &densityArray,
      .cppDensityArray = nullptr,
      .jsInfoArray = &infoArray,
      .cppInfoArray = nullptr,
      .highQuality = ctx.highQuality,
      .attractorParams = attractorParams
    };
    createImageData(imgCtx);
  }

  // Return result object
  emscripten::val result = emscripten::val::object();
  result.set("x", accumCtx.x);
  result.set("y", accumCtx.y);
  result.set("pointsAdded", ctx.pointsToCalculate);

  return result;
}

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
  // Export all functions directly
  emscripten::function("getBuildNumber", &attractor::getBuildNumber);
  // Bind the struct-based functions
  emscripten::function("calculateAttractor", &attractor::calculateAttractor);
  emscripten::function("calculateAttractorDensity", &attractor::calculateAttractorDensity);
  emscripten::function("createAttractorImage", &attractor::createAttractorImage);
  emscripten::function("calculateAttractorLoop", &attractor::calculateAttractorLoop);

  // Enum binding
  emscripten::enum_<attractor::PerformanceRating>("PerformanceRating")
    .value("VERY_SLOW", attractor::PerformanceRating::VERY_SLOW)
    .value("SLOW", attractor::PerformanceRating::SLOW)
    .value("MEDIUM", attractor::PerformanceRating::MEDIUM)
    .value("FAST", attractor::PerformanceRating::FAST)
    .value("VERY_FAST", attractor::PerformanceRating::VERY_FAST)
    .value("UNKNOWN", attractor::PerformanceRating::UNKNOWN);
}
