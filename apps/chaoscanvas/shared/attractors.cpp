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

std::function<std::pair<double, double>(double, double, double, double, double, double)> get_attractor_function(
  const attractors::AttractorParameters& params
) {
    if (params.attractor == "clifford") {
        return clifford;
    } else if (params.attractor == "dejong") {
        return dejong;
    }
    throw std::invalid_argument("Unknown attractor: " + params.attractor);
}

void accumulate_density(AccumulationContext& context) {
  int i = 0;
  while (i < context.pointsPerIteration && context.totalPoints < context.totalAttractorPoints) {
    auto next = context.fn(context.x, context.y, context.a, context.b, context.c, context.d);
    context.x = next.first;
    context.y = next.second;

    double sx = smoothing(context.x, context.scale);
    double sy = smoothing(context.y, context.scale);
    double screenX = sx * context.scale;
    double screenY = sy * context.scale;
    int px = static_cast<int>(std::floor(context.centerX + screenX));
    int py = static_cast<int>(std::floor(context.centerY + screenY));

    if (px >= 0 && px < context.w && py >= 0 && py < context.h) {
      int idx = py * context.w + px;
      if (idx >= 0 && idx < static_cast<int>(context.density.size())) {
        context.density[idx]++;
        if (context.density[idx] > context.max_density) context.max_density = context.density[idx];
      }
    }
    context.totalPoints++;
    i++;
  }
}

void create_image_data(ImageDataCreationContext& context) {
  size_t loopLimit = context.imageSize;

  uint32_t bgColor = 0;
  if (!context.background.empty()) {
    uint32_t bgA = context.background.size() > 3 ? context.background[3] : 255;
    uint32_t bgB = context.background.size() > 2 ? context.background[2] : 0;
    uint32_t bgG = context.background.size() > 1 ? context.background[1] : 0;
    uint32_t bgR = context.background[0];
    bgColor = (bgA << 24) | (bgB << 16) | (bgG << 8) | bgR;
  }

  size_t i = 0;
  while (i < loopLimit) {
    if (i < context.density.size() && context.density[i] > 0) {
      uint32_t dval = context.density[i];
      context.imageData[i] = context.hQuality
        ? get_color_data(dval, context.max_density, context.h, context.s, context.v, 1.0, context.background)
        : get_low_quality_point(context.h, context.s, context.v);
    } else {
      context.imageData[i] = bgColor;
    }
    i++;
  }
}

} // namespace attractors
