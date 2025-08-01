// attractor-jsi.cpp
// Minimal C++ JSI implementation for Clifford/deJong attractor calculation

#include "attractor-jsi.h"

#include <jsi/jsi.h>

#include <cmath>

#include <vector>

#include <string>

#include <algorithm>

using namespace facebook;
using namespace attractorjsi;

namespace {
  // BezierEasing: Used for color and opacity transitions
  class BezierEasing {
    public: BezierEasing(double p0, double p1, double p2, double p3): p0_(p0),
    p1_(p1),
    p2_(p2),
    p3_(p3) {}
    double operator()(double x) const {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      return calcBezier(getTforX(x), p1_, p3_);
    }
    private: double p0_,
    p1_,
    p2_,
    p3_;
    double A(double aA1, double aA2) const {
      return 1.0 - 3.0 * aA2 + 3.0 * aA1;
    }
    double B(double aA1, double aA2) const {
      return 3.0 * aA2 - 6.0 * aA1;
    }
    double C(double aA1) const {
      return 3.0 * aA1;
    }
    double calcBezier(double t, double aA1, double aA2) const {
      return ((A(aA1, aA2) * t + B(aA1, aA2)) * t + C(aA1)) * t;
    }
    double getSlope(double t, double aA1, double aA2) const {
      return 3.0 * A(aA1, aA2) * t * t + 2.0 * B(aA1, aA2) * t + C(aA1);
    }
    double getTforX(double aX) const {
      double aGuessT = aX;
      for (int i = 0; i < 4; ++i) {
        double currentSlope = getSlope(aGuessT, p0_, p2_);
        if (currentSlope == 0.0) return aGuessT;
        double currentX = calcBezier(aGuessT, p0_, p2_) - aX;
        aGuessT -= currentX / currentSlope;
      }
      return aGuessT;
    }
  };

  // Convert HSV color to RGB
  std::vector < int > hsv2rgb(double h, double s, double v) {
    double r, g, b;
    h = std::max(0.0, std::min(359.0, h));
    s = std::max(0.0, std::min(100.0, s));
    v = std::max(0.0, std::min(100.0, v));
    s /= 100.0;
    v /= 100.0;
    if (s == 0) {
      r = g = b = v;
      return {
        (int) std::round(r * 255),
        (int) std::round(g * 255),
        (int) std::round(b * 255)
      };
    }
    h /= 60.0;
    int i = (int) std::floor(h);
    double f = h - i;
    double p = v * (1 - s);
    double q = v * (1 - s * f);
    double t = v * (1 - s * (1 - f));
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
      break;
    }
    return {
      (int) std::round(r * 255),
      (int) std::round(g * 255),
      (int) std::round(b * 255)
    };
  }

  BezierEasing saturationBezier(0.79, -0.34, 0.54, 1.18);
  BezierEasing densityBezier(0.75, 0.38, 0.24, 1.33);
  BezierEasing opacityBezier(0.24, 0.27, 0.13, 0.89);
  
  // Blend color and pack RGBA for high quality points
  uint32_t getColorData(
    double density, double maxDensity,
    double h, double s, double v,
    double progress,
    const std::vector < int > & background
  ) {
    double mdens = std::log(maxDensity);
    double pdens = std::log(density);
    auto rgb = hsv2rgb(h, s - std::max(0.0, std::min(1.0, saturationBezier(pdens / mdens))) * s, v);
    double density_alpha = std::max(0.0, std::min(1.0, densityBezier(pdens / mdens)));
    int bgR = background.size() > 0 ? background[0] : 0;
    int bgG = background.size() > 1 ? background[1] : 0;
    int bgB = background.size() > 2 ? background[2] : 0;
    int blendedR = (int) std::round(rgb[0] * density_alpha + bgR * (1 - density_alpha));
    int blendedG = (int) std::round(rgb[1] * density_alpha + bgG * (1 - density_alpha));
    int blendedB = (int) std::round(rgb[2] * density_alpha + bgB * (1 - density_alpha));
    int alpha = (int)(opacityBezier(progress) * 255);
    return ((alpha & 0xFF) << 24) | ((blendedB & 0xFF) << 16) | ((blendedG & 0xFF) << 8) | (blendedR & 0xFF);
  }

  // Pack RGBA for low quality points
  uint32_t getLowQualityPoint(double hue, double saturation, double brightness) {
    auto rgb = hsv2rgb(hue == 0 ? 120 : hue, saturation == 0 ? 100 : saturation, brightness == 0 ? 100 : brightness);
    return (255 << 24) | (rgb[2] << 16) | (rgb[1] << 8) | rgb[0];
  }

  // Add random smoothing to attractor coordinates
  double smoothing(double num, double scale) {
    double factor = 0.2;
    return num + ((rand() % 2 == 0 ? -factor : factor) * (1.0 / scale));
  }

  // Clifford attractor formula
  std::pair < double, double > clifford(double x, double y, double a, double b, double c, double d) {
    return {
      std::sin(a * y) + c * std::cos(a * x),
      std::sin(b * x) + d * std::cos(b * y)
    };
  }
  // deJong attractor formula
  std::pair < double, double > dejong(double x, double y, double a, double b, double c, double d) {
    return {
      std::sin(a * y) - std::cos(b * x),
      std::sin(c * x) - std::cos(d * y)
    };
  }
}

// Progressive attractor calculation with JS callback only
// Matches JS logic and triggers JS callback at progressive draw points (every drawAt iterations or at end)
void attractorjsi::runAttractor(const AttractorParams & params, jsi::Function & onImageReady, jsi::Function & shouldCancel, jsi::Runtime & runtime) {
  // Attractor calculation loop
  int wVal = params.width;
  int hVal = params.height;
  int totalAttractorPointsVal = params.totalPoints;
  int pointsPerIterationVal = params.pointsPerIteration;
  double scale = params.scale;
  double left = params.left;
  double top = params.top;
  double hue = params.hue;
  double saturation = params.saturation;
  double brightness = params.brightness;
  const std::vector < int > & background = params.background;
  bool hQualityVal = params.highQuality;
  std::string attractor = params.attractor;
  double a = params.a, b = params.b, c = params.c, d = params.d;
  const int SCALE = 150;
  int cx = wVal / 2 + left;
  int cy = hVal / 2 + top;
  double s = scale * SCALE;
  int drawAt = 10;

  // Density buffer for attractor points
  std::vector < uint32_t > densityVal(wVal * hVal, 0);
  double xVal = 0, yVal = 0;
  double maxDensityVal = 1;
  int totalPointsVal = 0;
  int totalItterationVal = 0;

  // Select attractor function
  auto fn = attractor == "clifford" ? clifford : dejong;

  while (totalPointsVal < totalAttractorPointsVal) {
    // Check for cancellation before each iteration
    if (shouldCancel.call(runtime).getBool()) {
      break;
    }
    int i = 0;
    while (i < pointsPerIterationVal && totalPointsVal < totalAttractorPointsVal) {
      if (shouldCancel.call(runtime).getBool()) {
        break;
      }
      auto xy = fn(xVal, yVal, a, b, c, d);
      xVal = xy.first;
      yVal = xy.second;
      double sx = smoothing(xVal, s);
      double sy = smoothing(yVal, s);
      double screenX = sx * s;
      double screenY = sy * s;
      int px = (int) std::floor(cx + screenX);
      int py = (int) std::floor(cy + screenY);
      if (px >= 0 && px < wVal && py >= 0 && py < hVal) {
        int idx = py * wVal + px;
        densityVal[idx] = densityVal[idx] + 1;
        if (densityVal[idx] > maxDensityVal) maxDensityVal = densityVal[idx];
      }
      i++;
      totalPointsVal++;
    }
    totalItterationVal++;
    // Progressive draw condition: triggers JS callback every drawAt iterations or at end
    if (
      (
        totalItterationVal == 2 || 
        totalItterationVal % drawAt == 0 || 
        totalPointsVal == totalAttractorPointsVal
      ) && !shouldCancel.call(runtime).getBool()
    ) {

      // Build imageData from density buffer
      std::vector < uint32_t > imageData(wVal * hVal, 0);
      int j = 0;
      int loopLimit = wVal * hVal
      while(j < loopLimit){
        if (shouldCancel.call(runtime).getBool()) {
          break;
        }
        int dval = densityVal[j];
        if (dval > 0) {
          if (hQualityVal) {
            imageData[j] = getColorData(dval, maxDensityVal, hue, saturation, brightness, (double) totalPointsVal / totalAttractorPointsVal, background);
          } else {
            imageData[j] = getLowQualityPoint(hue, saturation, brightness);
          }
        } else {
          int bgA = background.size() > 3 ? background[3] : 0;
          int bgB = background.size() > 2 ? background[2] : 0;
          int bgG = background.size() > 1 ? background[1] : 0;
          int bgR = background.size() > 0 ? background[0] : 0;
          imageData[j] = ((bgA & 0xFF) << 24) | ((bgB & 0xFF) << 16) | ((bgG & 0xFF) << 8) | (bgR & 0xFF);
        }
        
        j++;
      }

      // Send imageData to JS via callback if not cancelled
      if (!shouldCancel.call(runtime).getBool()) {
        jsi::Value jsBuffer = vectorToArrayBuffer(runtime, imageData);
        onImageReady.call(runtime, jsBuffer);
      }
    }
  }
}

// Convert std::vector<uint32_t> to JS ArrayBuffer
jsi::Value vectorToArrayBuffer(jsi::Runtime & runtime,
  const std::vector < uint32_t > & vec) {
  size_t byteLength = vec.size() * sizeof(uint32_t);
  auto buffer = runtime.global().getPropertyAsFunction(runtime, "ArrayBuffer").callAsConstructor(runtime, {
    (int) byteLength
  }).getObject(runtime);
  auto arrayBufferData = buffer.getArrayBuffer(runtime) -> data(runtime);
  memcpy(arrayBufferData, vec.data(), byteLength);
  return jsi::Value(buffer);
}

// JSI binding: Expose runAttractor with callback to JS
void attractorjsi::install(jsi::Runtime & runtime) {
  auto runAttractorHost = [](jsi::Runtime & runtime,
    const jsi::Value * args,
      size_t count) -> jsi::Value {
    if (count < 3 || !args[0].isObject() || !args[1].isObject() || !args[1].asObject(runtime).isFunction(runtime) || !args[2].isObject() || !args[2].asObject(runtime).isFunction(runtime)) {
      throw jsi::JSError(runtime, "runAttractor: missing or invalid params/callback/cancel");
    }
    auto paramsObj = args[0].getObject(runtime);
    auto onImageReady = args[1].asObject(runtime).asFunction(runtime);
    auto shouldCancel = args[2].asObject(runtime).asFunction(runtime);
    AttractorParams params;
    params.attractor = paramsObj.getProperty(runtime, "attractor").asString(runtime).utf8(runtime);
    params.a = paramsObj.getProperty(runtime, "a").asNumber();
    params.b = paramsObj.getProperty(runtime, "b").asNumber();
    params.c = paramsObj.getProperty(runtime, "c").asNumber();
    params.d = paramsObj.getProperty(runtime, "d").asNumber();
    params.scale = paramsObj.getProperty(runtime, "scale").asNumber();
    params.left = paramsObj.getProperty(runtime, "left").asNumber();
    params.top = paramsObj.getProperty(runtime, "top").asNumber();
    params.hue = paramsObj.getProperty(runtime, "hue").asNumber();
    params.saturation = paramsObj.getProperty(runtime, "saturation").asNumber();
    params.brightness = paramsObj.getProperty(runtime, "brightness").asNumber();
    params.width = (int) paramsObj.getProperty(runtime, "width").asNumber();
    params.height = (int) paramsObj.getProperty(runtime, "height").asNumber();
    params.highQuality = paramsObj.getProperty(runtime, "highQuality").asBool();
    params.totalPoints = (int) paramsObj.getProperty(runtime, "totalPoints").asNumber();
    params.pointsPerIteration = (int) paramsObj.getProperty(runtime, "pointsPerIteration").asNumber();
    // background: JS array of 4 numbers
    auto bgArr = paramsObj.getProperty(runtime, "background").getObject(runtime);
    size_t bgLen = bgArr.getProperty(runtime, "length").asNumber();
    for (size_t i = 0; i < bgLen; ++i) {
      params.background.push_back(bgArr.getPropertyAtIndex(runtime, i).asNumber());
    }
    runAttractor(params, onImageReady, shouldCancel, runtime);
    return jsi::Value::undefined();
  };
  runtime.global().setProperty(runtime, "runAttractorCpp", jsi::Function::createFromHostFunction(
    runtime,
    jsi::PropNameID::forAscii(runtime, "runAttractorCpp"),
    3,
    runAttractorHost
  ));
}