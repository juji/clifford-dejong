precision mediump float;

// Uniforms
uniform vec3 u_hsvColor; // Base color (H:[0,1], S:[0,1], V:[0,1])
uniform float u_alpha;   // Base alpha for points

// Function to convert HSV to RGB (from context2d)
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    // Calculate color based on base HSV
    vec3 rgb = hsv2rgb(u_hsvColor);

    // Output the final color with the specified alpha
    // gl_PointCoord gives coords within the point (0-1), useful for rounded points
    // float dist = distance(gl_PointCoord, vec2(0.5));
    // if (dist > 0.5) discard; // Make points circular

    gl_FragColor = vec4(rgb, u_alpha);
}
