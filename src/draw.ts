import { DEFAULT_SHADER_SETTINGS } from "./DEFAULT_SHADER_SETTINGS";
import { IShaderSettings } from "./IShaderSettings";
import { VERTEX_SHADER } from "./VERTEX_SHADER";
import { createProgram } from "./createProgram";
import { createShader } from "./createShader";
import { getFragmentShader } from "./getFragmentShader";

export function drawDynavatar(
  /// Should have 4 floats
  random: Float32Array,
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  shaderSettings: IShaderSettings = DEFAULT_SHADER_SETTINGS
): void {
  const gl = canvas.getContext("webgl2");
  if (!gl) return;

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  if (!vertexShader) return;

  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    getFragmentShader(shaderSettings)
  );
  if (!fragmentShader) return;

  const program = createProgram(gl, vertexShader, fragmentShader);
  if (!program) return;

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const positionBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  const quadrant = new Float32Array([-1, 1, 1, 1, -1, -1, -1, -1, 1, 1, 1, -1]);

  gl.bufferData(gl.ARRAY_BUFFER, quadrant, gl.STATIC_DRAW);

  const vao = gl.createVertexArray();

  gl.bindVertexArray(vao);

  gl.enableVertexAttribArray(positionAttributeLocation);

  const size = 2;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.vertexAttribPointer(
    positionAttributeLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );

  gl.viewport(0, 0, width, height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);

  // Load random into the GPU uniform u_random
  const randomUniformLocation = gl.getUniformLocation(program, "u_random");
  gl.uniform1fv(randomUniformLocation, random);

  gl.bindVertexArray(vao);

  gl.drawArrays(
    gl.TRIANGLES,
    0, // offset,
    quadrant.length >> 1
  );
}
