precision highp float; // Use high precision for calculations

// Uniforms
uniform sampler2D u_prevState; // Texture with previous positions (x,y in rg channels)
uniform vec4 u_params;      // Attractor parameters (a, b, c, d)
uniform vec2 u_resolution;  // Resolution of the texture (POINTS_TEXTURE_SIZE)
uniform float u_attractorType; // 0.0 for Clifford, 1.0 for De Jong

// Function for Clifford Attractor
vec2 clifford(vec2 pos, vec4 p) {
    return vec2(
        sin(p.x * pos.y) + p.z * cos(p.x * pos.x),
        sin(p.y * pos.x) + p.w * cos(p.y * pos.y)
    );
}

// Function for De Jong Attractor
vec2 deJong(vec2 pos, vec4 p) {
    return vec2(
        sin(p.x * pos.y) - cos(p.y * pos.x),
        sin(p.z * pos.x) - cos(p.w * pos.y)
    );
}

void main() {
    // Calculate texture coordinates for the current pixel
    vec2 texCoord = gl_FragCoord.xy / u_resolution;

    // Read the previous position (x, y) from the texture
    vec4 prevState = texture2D(u_prevState, texCoord);
    vec2 prevPos = prevState.xy;

    // Calculate the next position based on the selected attractor
    vec2 nextPos;
    if (u_attractorType < 0.5) {
        nextPos = clifford(prevPos, u_params);
    } else {
        nextPos = deJong(prevPos, u_params);
    }

    // TODO: Add smoothing? (Requires random numbers or another texture lookup)

    // Write the new position (x, y) to the output texture
    // Store in rg channels. ba channels can be used for other data if needed.
    gl_FragColor = vec4(nextPos, prevState.z, prevState.w);
}
