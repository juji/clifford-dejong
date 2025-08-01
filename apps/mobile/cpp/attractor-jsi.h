// attractor-jsi.h
// Minimal C++ JSI header for Clifford/deJong attractor calculation
// Output: std::vector<uint32_t> RGBA buffer
#pragma once
#include <jsi/jsi.h>
#include <vector>
#include <string>

namespace attractorjsi {

  struct AttractorParams {
    std::string attractor; // "clifford" or "dejong"
    double a, b, c, d;
    double scale, left, top;
    double hue, saturation, brightness;
    std::vector<int> background; // RGBA, length 4
    int width, height;
    bool highQuality;
    int totalPoints;
    int pointsPerIteration;
  };

  // Progressive attractor calculation with JS callback and cancellation support
  void runAttractor(const AttractorParams& params, jsi::Function& onImageReady, jsi::Function& shouldCancel, jsi::Runtime& runtime);

  void install(jsi::Runtime& runtime);

} // namespace attractorjsi
