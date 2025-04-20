attribute vec2 a_position;

void main() {
  // Simple pass-through vertex shader
  gl_Position = vec4(a_position, 0.0, 1.0);
}
