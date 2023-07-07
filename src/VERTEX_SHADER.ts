export const VERTEX_SHADER = `
#version 300 es
 
// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
out vec2 v_position;
 
// all shaders have a main function
void main() {
  v_position = a_position.xy;
  // gl_Position is a special variable a vertex shader
  // is responsible for setting
  gl_Position = a_position;
}
`.trim();
