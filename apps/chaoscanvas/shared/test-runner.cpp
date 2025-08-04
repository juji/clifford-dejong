#define CATCH_CONFIG_MAIN
#include "catch.hpp"


#include "attractors.h"

#include <vector>
#include <cstdint>
#include <cmath>

TEST_CASE("HSV to RGB conversion", "[color]") {
    SECTION("should convert pure red") {
        attractors::RGB rgb = attractors::hsv_to_rgb(0, 100, 100);
        REQUIRE(rgb.r == 255);
        REQUIRE(rgb.g == 0);
        REQUIRE(rgb.b == 0);
    }
    SECTION("should convert pure green") {
        attractors::RGB rgb = attractors::hsv_to_rgb(120, 100, 100);
        REQUIRE(rgb.r == 0);
        REQUIRE(rgb.g == 255);
        REQUIRE(rgb.b == 0);
    }
    SECTION("should convert pure blue") {
        attractors::RGB rgb = attractors::hsv_to_rgb(240, 100, 100);
        REQUIRE(rgb.r == 0);
        REQUIRE(rgb.g == 0);
        REQUIRE(rgb.b == 255);
    }
    SECTION("should convert gray") {
        attractors::RGB rgb = attractors::hsv_to_rgb(0, 0, 50);
        REQUIRE(rgb.r == 128);
        REQUIRE(rgb.g == 128);
        REQUIRE(rgb.b == 128);
    }
}

TEST_CASE("Accumulate Density Calculation", "[attractor]") {
    int w = 100;
    int h = 100;
    std::vector<uint32_t> density(w * h, 0);
    double max_density = 0;
    double x = 0.1, y = 0.1;
    int totalPoints = 0;
    int totalAttractorPoints = 1000;

    attractors::accumulate_density(
      density,
      max_density,
      x,
      y,
      totalPoints,
      1000, // points per iteration
      w,
      h,
      10.0, // scale
      -1.4, 1.6, 1.0, 0.7, // a, b, c, d
      w / 2.0, // centerX
      h / 2.0, // centerY
      totalAttractorPoints,
      attractors::clifford
    );

    REQUIRE(totalPoints == 1000);
    REQUIRE(max_density > 0);

    // Check if at least one density point was plotted
    bool point_plotted = false;
    for(const auto& d : density) {
        if (d > 0) {
            point_plotted = true;
            break;
        }
    }
    REQUIRE(point_plotted == true);
}

TEST_CASE("Create Image Data Function", "[attractor]") {
    int w = 10;
    int h = 10;
    size_t imageSize = w * h;
    std::vector<uint32_t> imageData(imageSize);
    std::vector<uint32_t> density(imageSize, 0);
    density[0] = 1;
    density[1] = 2;
    double max_density = 2;

    attractors::create_image_data(imageData.data(), imageSize, density, max_density, 180, 100, 100);

    // Check the color of the first pixel (should not be black/transparent)
    REQUIRE(imageData[0] != 0);
    // Check the color of a background pixel (should be black with full alpha)
    REQUIRE(imageData[imageSize - 1] == 0xFF000000);
}
