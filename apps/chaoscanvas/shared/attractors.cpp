#include "attractors.h"
#include <cmath>

// Mathematical and color utility functions ported from TypeScript
namespace attractors {

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
  const std::function<std::pair<double, double>(double xVal, double yVal, double a, double b, double c, double d)>& fn
) {
  int i = 0;
  while (i < pointsPerIteration && totalPoints < totalAttractorPoints) {
    auto next = fn(xVal, yVal, a, b, c, d);
    xVal = next.first;
    yVal = next.second;

    double sx = smoothing(xVal, scale);
    double sy = smoothing(yVal, scale);
    double screenX = sx * scale;
    double screenY = sy * scale;
    int px = static_cast<int>(std::floor(centerX + screenX));
    int py = static_cast<int>(std::floor(centerY + screenY));

    if (px >= 0 && px < wVal && py >= 0 && py < hVal) {
      int idx = py * wVal + px;
      if (idx >= 0 && idx < static_cast<int>(density.size())) {
        density[idx]++;
        if (density[idx] > max_density) max_density = density[idx];
      }
    }
    totalPoints++;
    i++;
  }
}

void create_image_data(
  uint32_t* imageData,
  size_t imageSize, // in pixels (width * height)
  const std::vector<uint32_t>& density,
  double max_density,
  double h,
  double s,
  double v,
  bool hQuality,
  const std::vector<int>& background
) {
  size_t loopLimit = imageSize;

  uint32_t bgColor = 0;
  if (!background.empty()) {
    uint32_t bgA = background.size() > 3 ? background[3] : 255;
    uint32_t bgB = background.size() > 2 ? background[2] : 0;
    uint32_t bgG = background.size() > 1 ? background[1] : 0;
    uint32_t bgR = background[0];
    bgColor = (bgA << 24) | (bgB << 16) | (bgG << 8) | bgR;
  }

  size_t i = 0;
  while (i < loopLimit) {
    if (i < density.size() && density[i] > 0) {
      uint32_t dval = density[i];
      imageData[i] = hQuality
        ? get_color_data(dval, max_density, h, s, v, 1.0, background)
        : get_low_quality_point(h, s, v);
    } else {
      imageData[i] = bgColor;
    }
    i++;
  }
}

} // namespace attractors
