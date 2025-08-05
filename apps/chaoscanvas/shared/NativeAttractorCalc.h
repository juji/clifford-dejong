#pragma once

#include <NativeAttractorCalcSpecsJSI.h>

#include <memory>
#include <string>
#include <vector>
#include <functional>
#include <cstdint>
#include <utility>

namespace facebook::react {

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
    std::vector<uint32_t>& density;
    double& max_density;
    double& x;
    double& y;
    int& totalPoints;
    const int pointsPerIteration;
    const int w;
    const int h;
    const double scale;
    const double a;
    const double b;
    const double c;
    const double d;
    const double centerX;
    const double centerY;
    const int totalAttractorPoints;
    const std::function<std::pair<double, double>(double, double, double, double, double, double)>& fn;
};

struct ImageDataCreationContext {
    uint32_t* imageData;
    size_t imageSize;
    const std::vector<uint32_t>& density;
    double max_density;
    double h;
    double s;
    double v;
    bool hQuality;
    const std::vector<int>& background;
};

class NativeAttractorCalc : public NativeAttractorCalcCxxSpec<NativeAttractorCalc> {
public:
  NativeAttractorCalc(std::shared_ptr<CallInvoker> jsInvoker);

  jsi::Object calculateAttractor(
    jsi::Runtime& rt, 
    std::string timestamp, 
    jsi::Object buffer, 
    jsi::Object attractorParameters,
    int width,
    int height,
    int drawInterval,
    int progressInterval,
    bool highQuality,
    int totalAttractorPoints,
    int pointsPerIteration,
    jsi::Function onProgress, 
    jsi::Function onImageUpdate
  );

private:
  std::function<double(double)> bezier_easing(double p0, double p1, double p2, double p3);
  RGB hsv_to_rgb(double h, double s, double v);
  uint32_t get_color_data(
    double density,
    double max_density,
    double h,
    double s,
    double v,
    double progress = 1.0,
    const std::vector<int>& background = {0, 0, 0, 255}
  );
  uint32_t get_low_quality_point(double hue, double saturation, double brightness);
  double smoothing(double num, double scale);
  std::pair<double, double> clifford(double x, double y, double a, double b, double c, double d);
  std::pair<double, double> dejong(double x, double y, double a, double b, double c, double d);
  std::function<std::pair<double, double>(double, double, double, double, double, double)> get_attractor_function(
    const AttractorParameters& params
  );
  void accumulate_density(AccumulationContext& context);
  void create_image_data(ImageDataCreationContext& context);
  
  void startAttractorCalculationThread(
    std::shared_ptr<std::string> timestamp,
    std::shared_ptr<jsi::Function> onProgressCopy,
    std::shared_ptr<jsi::Function> onImageUpdateCopy,
    uint8_t* bufferPtr,
    size_t bufferSize,
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
  );
};

} // namespace facebook::react
