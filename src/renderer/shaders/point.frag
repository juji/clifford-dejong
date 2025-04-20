precision highp float;

// Uniforms
uniform vec3 u_hsvColor; // h (0-1), s (0-1), v (0-1)
uniform float u_alpha;

// --- Cubic Bezier Function ---
// Evaluates a cubic bezier curve defined by P0=0, P1, P2, P3=1
// P1 and P2 are vec2 control points (x, y)
// t is the input value (0 to 1)
float cubicBezier(vec2 P1, vec2 P2, float t) {
    // Clamp t to ensure it's within [0, 1]
    t = clamp(t, 0.0, 1.0);
    // Calculate coefficients
    float u = 1.0 - t;
    float tt = t * t;
    float uu = u * u;
    float uuu = uu * u;
    float ttt = tt * t;
    // Calculate point on the curve (we only need the y-component for 1D easing)
    // P = uuu*P0 + 3.*uu*t*P1 + 3.*u*tt*P2 + ttt*P3
    // Since P0=(0,0) and P3=(1,1), we simplify for the y-component:
    float y = 3.0 * uu * t * P1.y + 3.0 * u * tt * P2.y + ttt;
    return y;
}

// --- HSV to RGB Conversion ---
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    // --- Define Bezier Control Points (matching context2d.ts) ---
    // Saturation: BezierEasing(.79,-0.34,.54,1.18) -> P1=(0.79, -0.34), P2=(0.54, 1.18)
    vec2 satP1 = vec2(0.79, -0.34);
    vec2 satP2 = vec2(0.54, 1.18);

    // Brightness/Value: BezierEasing(.75,.38,.24,1.33) -> P1=(0.75, 0.38), P2=(0.24, 1.33)
    vec2 valP1 = vec2(0.75, 0.38);
    vec2 valP2 = vec2(0.24, 1.33);

    // --- Apply Bezier Curves to Saturation and Value ---
    float easedSaturation = cubicBezier(satP1, satP2, u_hsvColor.y);
    float easedValue = cubicBezier(valP1, valP2, u_hsvColor.z);

    // Clamp results to ensure they stay within valid ranges [0, 1]
    easedSaturation = clamp(easedSaturation, 0.0, 1.0);
    easedValue = clamp(easedValue, 0.0, 1.0);

    // --- Convert Eased HSV to RGB ---
    vec3 rgbColor = hsv2rgb(vec3(u_hsvColor.x, easedSaturation, easedValue));

    // --- Output Final Color ---
    // Output the color with the specified alpha for blending
    gl_FragColor = vec4(rgbColor, u_alpha);
}
