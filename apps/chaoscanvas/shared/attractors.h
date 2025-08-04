

#include <vector>
#include <functional>
#include <memory>
#include <cstdint>
#include <utility>

namespace attractors {

// Represents an RGB color
struct RGB {
    int r, g, b;
};

// --- Function Declarations ---

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

void accumulate_density(
  std::vector<uint32_t>& density,
  double& max_density,
  double& xVal,
  double& yVal,
  int& totalPoints,
  const int pointsPerIteration,
  const int wVal,
  const int hVal,
  const double scale,
  const double a,
  const double b,
  const double c,
  const double d,
  const double centerX,
  const double centerY,
  const int totalAttractorPoints,
  const std::function<std::pair<double, double>(double, double, double, double, double, double)>& fn
);

void create_image_data(
  uint32_t* imageData,
  size_t imageSize,
  const std::vector<uint32_t>& density,
  double max_density,
  double h,
  double s,
  double v,
  bool hQuality = true,
  const std::vector<int>& background = {0, 0, 0, 255}
);

} // namespace attractors
