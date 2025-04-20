precision highp float;

// Attributes
attribute float a_pointIndex; // Index of the point (0 to NUM_POINTS - 1)

// Uniforms
uniform sampler2D u_positionTexture; // Texture containing point positions (x,y in rg)
uniform vec2 u_textureSize;     // Size of the position texture (POINTS_TEXTURE_SIZE)
uniform vec2 u_canvasResolution; // Size of the output canvas
uniform float u_pointSize;       // Size of the points to draw
uniform float u_scale;           // Scale factor for attractor coords
uniform vec2 u_translate;       // Translation offset for attractor coords

// Function to calculate texture coordinates from point index
vec2 getTexCoordFromIndex(float index, vec2 textureSize) {
    float y = floor(index / textureSize.x);
    float x = mod(index, textureSize.x);
    // Add 0.5 to sample the center of the texel
    return (vec2(x, y) + 0.5) / textureSize;
}

void main() {
    // Calculate texture coordinates for this point
    vec2 texCoord = getTexCoordFromIndex(a_pointIndex, u_textureSize);

    // Read the point's logical position (x, y) from the texture
    vec2 logicalPos = texture2D(u_positionTexture, texCoord).xy;

    // Apply scale and translation
    vec2 scaledPos = logicalPos * u_scale + u_translate;

    // Convert scaled position to clip space (-1 to 1)
    // Assumes canvas origin is top-left, WebGL clip space is bottom-left
    vec2 zeroToOne = scaledPos / u_canvasResolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;

    // Output position (flip y for WebGL)
    gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);

    // Set point size
    gl_PointSize = u_pointSize;
}
