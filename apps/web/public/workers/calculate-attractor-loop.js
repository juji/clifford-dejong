/**
 * JavaScript implementation of calculateAttractorLoop
 * Rewritten from the C++ WebAssembly version for better performance and maintainability
 *
 * Global AttractorCalc object for use with importScripts
 */

// Global AttractorCalc object
(function () {
  "use strict";

  // Version information
  const version = "2.0.1";

  /**
   * Creates a Bezier easing function
   * @param {number} p0 - First control point
   * @param {number} p1 - Second control point
   * @param {number} p2 - Third control point
   * @param {number} p3 - Fourth control point
   * @returns {Function} Easing function
   */
  function bezierEasing(p0, p1, p2, p3) {
    const A = (aA1, aA2) => 1.0 - 3.0 * aA2 + 3.0 * aA1;
    const B = (aA1, aA2) => 3.0 * aA2 - 6.0 * aA1;
    const C = (aA1) => 3.0 * aA1;

    const calcBezier = (t, aA1, aA2) => {
      return ((A(aA1, aA2) * t + B(aA1, aA2)) * t + C(aA1)) * t;
    };

    const getSlope = (t, aA1, aA2) => {
      return 3.0 * A(aA1, aA2) * t * t + 2.0 * B(aA1, aA2) * t + C(aA1);
    };

    const getTForX = (aX) => {
      let aGuessT = aX;
      for (let i = 0; i < 4; i++) {
        const currentSlope = getSlope(aGuessT, p0, p2);
        if (currentSlope === 0.0) {
          return aGuessT;
        }
        const currentX = calcBezier(aGuessT, p0, p2) - aX;
        aGuessT -= currentX / currentSlope;
      }
      return aGuessT;
    };

    return (x) => {
      if (x <= 0.0) return 0.0;
      if (x >= 1.0) return 1.0;
      return calcBezier(getTForX(x), p1, p3);
    };
  }

  /**
   * Convert HSV to RGB
   * @param {number} h - Hue (0-359)
   * @param {number} s - Saturation (0-100)
   * @param {number} v - Value/Brightness (0-100)
   * @returns {Object} RGB object with r, g, b properties (0-255)
   */
  function hsvToRgb(h, s, v) {
    // Clamp input values to valid ranges
    h = Math.max(0.0, Math.min(359.0, h));
    s = Math.max(0.0, Math.min(100.0, s));
    v = Math.max(0.0, Math.min(100.0, v));

    // Normalize s and v to 0-1 range
    s /= 100.0;
    v /= 100.0;

    // Handle grayscale case (s === 0)
    if (s === 0.0) {
      const val = Math.round(v * 255);
      return { r: val, g: val, b: val };
    }

    // Convert hue to sector (0-5)
    h /= 60.0;
    const i = Math.floor(h);
    const f = h - i;

    // Calculate color components
    const p = v * (1.0 - s);
    const q = v * (1.0 - s * f);
    const t = v * (1.0 - s * (1 - f));

    let r, g, b;
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
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  /**
   * Get color data for a pixel based on density
   * @param {number} density - Pixel density
   * @param {number} maxDensity - Maximum density in the image
   * @param {number} h - Hue
   * @param {number} s - Saturation
   * @param {number} v - Brightness/Value
   * @param {number} progress - Progress value
   * @param {Array} background - Background color array [r, g, b, a]
   * @returns {number} 32-bit color value
   */
  function getColorData(density, maxDensity, h, s, v, progress, background) {
    if (density <= 0) return 0;

    // Prevent log(1) = 0 or log of negative/zero numbers
    if (maxDensity <= 1.0) {
      maxDensity = 1.01;
    }

    const saturationBezier = bezierEasing(0.79, -0.34, 0.54, 1.18);
    const densityBezier = bezierEasing(0.75, 0.38, 0.24, 1.33);
    const opacityBezier = bezierEasing(0.24, 0.27, 0.13, 0.89);

    // Calculate log values
    const mdens = Math.log(maxDensity);
    const pdens = Math.log(density);

    // Calculate saturation factor
    const satFactor = Math.max(
      0.0,
      Math.min(1.0, saturationBezier(pdens / mdens)),
    );
    const rgb = hsvToRgb(h, s - satFactor * s, v);

    // Calculate density alpha
    const densityAlpha = Math.max(
      0.0,
      Math.min(1.0, densityBezier(pdens / mdens)),
    );

    // Get background color components with defaults
    const bgR = (background && background[0]) || 0;
    const bgG = (background && background[1]) || 0;
    const bgB = (background && background[2]) || 0;

    // Blend colors based on density_alpha
    const blendedR = Math.round(
      rgb.r * densityAlpha + bgR * (1 - densityAlpha),
    );
    const blendedG = Math.round(
      rgb.g * densityAlpha + bgG * (1 - densityAlpha),
    );
    const blendedB = Math.round(
      rgb.b * densityAlpha + bgB * (1 - densityAlpha),
    );

    // Calculate opacity
    const effectiveProgress = progress <= 0 ? 1.0 : progress;
    const alpha = Math.round(opacityBezier(effectiveProgress) * 255);

    // Return 32-bit color value (ABGR format for little-endian)
    return (alpha << 24) | (blendedB << 16) | (blendedG << 8) | blendedR;
  }

  /**
   * Get low quality point color
   * @param {number} hue - Hue value
   * @param {number} saturation - Saturation value
   * @param {number} brightness - Brightness value
   * @returns {number} 32-bit color value
   */
  function getLowQualityPoint(hue, saturation, brightness) {
    const rgb = hsvToRgb(hue, saturation, brightness);
    return (255 << 24) | (rgb.b << 16) | (rgb.g << 8) | rgb.r;
  }

  /**
   * Apply smoothing to coordinates
   * @param {number} num - Input number
   * @param {number} scale - Scale factor
   * @returns {number} Smoothed number
   */
  function smoothing(num, scale) {
    const factor = 0.2;
    return num + (Math.random() < 0.5 ? -factor : factor) * (1.0 / scale);
  }

  /**
   * Clifford attractor function
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} a - Parameter a
   * @param {number} b - Parameter b
   * @param {number} c - Parameter c
   * @param {number} d - Parameter d
   * @returns {Array} [newX, newY]
   */
  function clifford(x, y, a, b, c, d) {
    return [
      Math.sin(a * y) + c * Math.cos(a * x),
      Math.sin(b * x) + d * Math.cos(b * y),
    ];
  }

  /**
   * DeJong attractor function
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} a - Parameter a
   * @param {number} b - Parameter b
   * @param {number} c - Parameter c
   * @param {number} d - Parameter d
   * @returns {Array} [newX, newY]
   */
  function dejong(x, y, a, b, c, d) {
    return [
      Math.sin(a * y) - Math.cos(b * x),
      Math.sin(c * x) - Math.cos(d * y),
    ];
  }

  /**
   * Accumulate density data
   * @param {Object} context - Accumulation context
   */
  function accumulateDensity(context) {
    let i = 0;
    const densitySize = context.w * context.h;

    while (i < context.pointsToCalculate && context.getCancelFlag() === 0) {
      const [nextX, nextY] = context.fn(
        context.x,
        context.y,
        context.attractorParams.a,
        context.attractorParams.b,
        context.attractorParams.c,
        context.attractorParams.d,
      );

      context.x = smoothing(nextX, context.attractorParams.scale);
      context.y = smoothing(nextY, context.attractorParams.scale);

      const screenX = context.x * context.attractorParams.scale;
      const screenY = context.y * context.attractorParams.scale;
      const px = Math.floor(context.centerX + screenX);
      const py = Math.floor(context.centerY + screenY);

      if (px >= 0 && px < context.w && py >= 0 && py < context.h) {
        const idx = py * context.w + px;
        if (idx >= 0 && idx < densitySize) {
          context.densityArray[idx]++;
          const newVal = context.densityArray[idx];

          if (newVal > context.getMaxDensity()) {
            context.setMaxDensity(newVal);
          }
        }
      }

      i++;

      if (
        context.updateProgress &&
        (i % 100000 === 0 || i === context.pointsToCalculate - 1)
      ) {
        const newProgress = Math.floor((i / context.pointsToCalculate) * 100.0);
        if (newProgress !== context.getProgress()) {
          context.setProgress(newProgress);
        }
      }
    }
  }

  /**
   * Create image data from density data
   * @param {Object} context - Image creation context
   */
  function createImageData(context) {
    const loopLimit = context.imageSize;

    let bgColor = 0;
    if (
      context.attractorParams.background &&
      context.attractorParams.background.length > 0
    ) {
      const bgA =
        context.attractorParams.background.length > 3
          ? context.attractorParams.background[3]
          : 255;
      const bgB =
        context.attractorParams.background.length > 2
          ? context.attractorParams.background[2]
          : 0;
      const bgG =
        context.attractorParams.background.length > 1
          ? context.attractorParams.background[1]
          : 0;
      const bgR = context.attractorParams.background[0];
      bgColor = (bgA << 24) | (bgB << 16) | (bgG << 8) | bgR;
    }

    if (context.getCancelFlag() !== 0) {
      return;
    }

    for (let i = 0; i < loopLimit && context.getCancelFlag() === 0; i++) {
      const dval = context.densityArray[i];

      if (dval > 0) {
        let colorData;
        if (context.highQuality) {
          colorData = getColorData(
            dval,
            context.getMaxDensity(),
            context.attractorParams.hue,
            context.attractorParams.saturation,
            context.attractorParams.brightness,
            1.0,
            context.attractorParams.background,
          );
        } else {
          colorData = getLowQualityPoint(
            context.attractorParams.hue,
            context.attractorParams.saturation,
            context.attractorParams.brightness,
          );
        }
        context.imageArray[i] = colorData;
      } else {
        context.imageArray[i] = bgColor;
      }
    }
  }

  /**
   * Main calculateAttractorLoop function
   * @param {Object} jsCtx - Context object with calculation parameters
   * @returns {Object} Result object with x, y coordinates and points added
   */
  function calculateAttractorLoop(jsCtx) {
    try {
      const {
        attractorParams,
        // densityBuffer,
        infoBuffer,
        imageBuffer,
        highQuality,
        pointsToCalculate,
        width,
        height,
        x,
        y,
        loopNum,
        drawAt,
      } = jsCtx;

      // Create typed array views
      const imageArray = new Uint32Array(imageBuffer);
      const infoArray = new Uint32Array(infoBuffer);

      // Create local arrays for fast computation
      const uint32DensityArray = new Uint32Array(width * height);
      const uint32ImageArray = new Uint32Array(width * height);
      const uint32InfoArray = new Uint32Array(infoArray.length);

      // Get attractor function based on type
      let attractorFunc;
      if (attractorParams.attractor === "clifford") {
        attractorFunc = clifford;
      } else if (attractorParams.attractor === "dejong") {
        attractorFunc = dejong;
      } else {
        return {
          error: `Invalid attractor type: ${attractorParams.attractor}. Must be 'clifford' or 'dejong'.`,
        };
      }

      // Initialize calculation variables
      const centerX = width / 2.0 + attractorParams.left * width;
      const centerY = height / 2.0 + attractorParams.top * height;

      const pointsPerLoop = Math.floor(pointsToCalculate / loopNum);
      let num = 0;

      // Helper functions for accessing info array
      const getCancelFlag = () => infoArray[1];
      const getMaxDensity = () => uint32InfoArray[0];
      const setMaxDensity = (value) => {
        uint32InfoArray[0] = value;
      };
      const getProgress = () => uint32InfoArray[3];
      const setProgress = (value) => {
        uint32InfoArray[3] = value;
      };

      // Accumulation context
      const accumContext = {
        densityArray: uint32DensityArray,
        x: x,
        y: y,
        pointsToCalculate: pointsPerLoop,
        w: width,
        h: height,
        attractorParams: attractorParams,
        centerX: centerX,
        centerY: centerY,
        fn: attractorFunc,
        updateProgress: false,
        getCancelFlag,
        getMaxDensity,
        setMaxDensity,
        getProgress,
        setProgress,
      };

      // Image creation context
      const imgContext = {
        imageArray: uint32ImageArray,
        imageSize: width * height,
        densityArray: uint32DensityArray,
        highQuality: highQuality,
        attractorParams: attractorParams,
        getCancelFlag,
        getMaxDensity,
      };

      let totalLoop = 0;
      while (num < loopNum) {
        accumulateDensity(accumContext);

        if (infoArray[1] !== 0) {
          break;
        }

        if (totalLoop % drawAt === 0 || num === loopNum - 1) {
          createImageData(imgContext);
          // Copy image data to JavaScript array for display
          for (let i = 0; i < imgContext.imageSize; i++) {
            imageArray[i] = uint32ImageArray[i];
          }
        }

        if (infoArray[1] !== 0) {
          break;
        }

        totalLoop += pointsPerLoop;
        num++;

        // Update progress
        infoArray[3] = Math.floor((num / loopNum) * 100.0);

        // Copy cancellation flag
        uint32InfoArray[1] = infoArray[1];
      }

      return {
        x: accumContext.x,
        y: accumContext.y,
        pointsAdded: pointsToCalculate,
      };
    } catch (error) {
      return {
        error: `Error in calculateAttractorLoop: ${error.message}`,
      };
    }
  }

  /**
   * Get build version
   * @returns {string} Version string
   */
  function getBuildNumber() {
    return version;
  }

  // Create global AttractorCalc object
  if (typeof self !== "undefined") {
    // Web Worker environment
    self.AttractorCalc = {
      calculateAttractorLoop,
      getBuildNumber,
      bezierEasing,
      hsvToRgb,
      getColorData,
      getLowQualityPoint,
      smoothing,
      clifford,
      dejong,
      accumulateDensity,
      createImageData,
      version,
    };
  } else if (typeof global !== "undefined") {
    // Node.js environment
    global.AttractorCalc = {
      calculateAttractorLoop,
      getBuildNumber,
      bezierEasing,
      hsvToRgb,
      getColorData,
      getLowQualityPoint,
      smoothing,
      clifford,
      dejong,
      accumulateDensity,
      createImageData,
      version,
    };
  } else if (typeof window !== "undefined") {
    // Browser environment
    window.AttractorCalc = {
      calculateAttractorLoop,
      getBuildNumber,
      bezierEasing,
      hsvToRgb,
      getColorData,
      getLowQualityPoint,
      smoothing,
      clifford,
      dejong,
      accumulateDensity,
      createImageData,
      version,
    };
  }
})(); // End IIFE
