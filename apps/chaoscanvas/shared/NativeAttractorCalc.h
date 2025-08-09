#pragma once

#include <NativeAttractorCalcSpecsJSI.h>
#include <jsi/jsi.h>
#include <cstdint>
#include <functional>
#include <memory>
#include <string>
#include <utility>
#include <vector>

namespace facebook::react {

enum PerformanceRating {
  VERY_SLOW = 1,
  SLOW = 2,
  MEDIUM = 3,
  FAST = 4,
  VERY_FAST = 5,
  UNKNOWN = 0
};

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

struct AccumulationContext {
  uint32_t* densityPtr;
  size_t densitySize;
  int& maxDensity;
  double& x;
  double& y;
  const int pointsToCalculate;
  const int w;
  const int h;
  const AttractorParameters& attractorParams;
  const double centerX;
  const double centerY;
  const std::function<std::pair<double, double>(double, double, double, double, double, double)>&
    fn;
};

struct ImageDataCreationContext {
  uint32_t* imageData;
  int imageSize;
  const uint32_t* densityPtr;
  size_t densitySize;
  int maxDensity;
  bool highQuality;
  const AttractorParameters& attractorParams;
};

class NativeAttractorCalc : public NativeAttractorCalcCxxSpec<NativeAttractorCalc> {
 public:
  NativeAttractorCalc(std::shared_ptr<CallInvoker> jsInvoker);

  double ratePerformance(jsi::Runtime& rt);
  std::string getBuildNumber(jsi::Runtime& rt);

  jsi::Value calculateAttractor(
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
  );

 private:
  std::function<double(double)> bezierEasing(double p0, double p1, double p2, double p3);
  RGB hsvToRgb(double h, double s, double v);
  uint32_t getColorData(
    double density,
    double maxDensity,
    double h,
    double s,
    double v,
    double progress = 1.0,
    const std::vector<int>& background = {0, 0, 0, 255}
  );
  uint32_t getLowQualityPoint(double hue, double saturation, double brightness);
  double smoothing(double num, double scale);
  std::pair<double, double> clifford(double x, double y, double a, double b, double c, double d);
  std::pair<double, double> dejong(double x, double y, double a, double b, double c, double d);
  std::function<std::pair<double, double>(double, double, double, double, double, double)>
  getAttractorFunction(std::string attractor);
  void accumulateDensity(AccumulationContext& context);
  void createImageData(ImageDataCreationContext& context);
  // Helper method to convert JSI object to AttractorParameters
  AttractorParameters extractAttractorParameters(jsi::Runtime& rt, jsi::Object& jsiParams);

  struct StartAttractorCalculationThreadParams {
    std::string timestamp;

    uint32_t* densityBufferPtr;
    uint32_t* imageBufferPtr;
    bool highQuality;

    // Use AttractorParameters struct directly
    AttractorParameters attractorParams;

    int width;
    int height;
    double x;
    double y;
    int maxDensity;

    int pointsToCalculate;

    std::shared_ptr<jsi::Function> resolveFunc;
    std::shared_ptr<jsi::Function> rejectFunc;
  };

  void startAttractorCalculationThread(StartAttractorCalculationThreadParams& params);
};

}  // namespace facebook::react
