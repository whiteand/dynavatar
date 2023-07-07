export interface IShaderSettings {
  stops: [string, number][];
  lightningCoef: number;
  light: [number, number, number];
  scale: number;
}

const VERTEX_SHADER = `
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

function vec3(r: number, g: number, b: number) {
  return `vec3(${r.toFixed(4)}, ${g.toFixed(4)}, ${b.toFixed(4)})`;
}

function getGradientFunctionBody(stops: [string, number][], v: string) {
  if (stops.length <= 0) {
    return "return vec3(0.0);";
  }
  if (stops.length <= 1) {
    const { r, g, b } = parseRgb(stops[0][0]);
    return `return ${vec3(r, g, b)};`;
  }
  const lines: string[] = [];
  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const stopOffset = stop[1];
    const stopColor = stop[0];
    const { r, g, b } = parseRgb(stopColor);
    lines.push(`const vec3 color${i} = ${vec3(r, g, b)};`);
    lines.push(`const float stop${i} = ${stopOffset.toFixed(4)};`);
  }
  lines.push(`if (${v} < stop0) return color0;`);
  for (let i = 0; i < stops.length - 1; i++) {
    const startC = `color${i}`;
    const startS = `stop${i}`;
    if (i === stops.length - 1) {
      continue;
    }
    const endC = `color${i + 1}`;
    const endS = `stop${i + 1}`;
    lines.push(`if (${v} < ${endS}) {`);
    lines.push(
      `  return mix(${startC}, ${endC}, (${v} - ${startS}) / (${endS} - ${startS}));`
    );
    lines.push("}");
  }
  lines.push(`return color${stops.length - 1};`);
  const res = lines.join("\n");
  return res;
}

const getFragmentShader = ({
  stops,
  scale,
  lightningCoef,
  light,
}: IShaderSettings) =>
  `
#version 300 es
 
precision highp float;
 
in vec2 v_position;
 
uniform float u_random[4];

out vec4 outColor;

vec3 gradient_get_color(float x) {
  ${getGradientFunctionBody(stops, "x")}
}

float rand(int ind) {
  return u_random[ind];
}
vec3 get_color(vec2 uv, float iTime);
const float scale = ${scale.toFixed(8)};

void main() {
  float fx = (v_position.x + 1.0) * 2.0;
  float fy = (v_position.y + 1.0) * 2.0;
  vec3 color = get_color(vec2(fx * scale + rand(0), fy * scale + rand(1)), rand(2));
  outColor = vec4(color, 1);
}
float noise(vec2 p, float ltime)
{
  return sin(p.x*10.) * sin(p.y*(3. + sin(ltime/11.))) + .2; 
}

mat2 rotate(float angle)
{
  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

float fbm(vec2 p, float ltime)
{
  p *= 1.1;
  float f = 0.;
  float amp = .5;
  for( int i = 0; i < 3; i++) {
    mat2 modify = rotate(ltime/50. * float(i*i));
    f += amp*noise(p, ltime);
    p = modify * p;
    p *= 2.;
    amp /= 2.2;
  }
  return f;
}

float pattern(vec2 p, float ltime, out vec2 q, out vec2 r) {
  q = vec2( fbm(p + vec2(1.), ltime),
	    fbm(rotate(.1*ltime)*p + vec2(3.), ltime));
  r = vec2( fbm(rotate(.2)*q + vec2(0.), ltime),
	    fbm(q + vec2(0.), ltime));
  return fbm(p + 1.*r, ltime);

}

float get_height(vec2 uv, float iTime) {
  float ctime = iTime + fbm(uv/8., iTime)*40.;
  float ftime = fract(ctime/6.);
  float ltime = floor(ctime/6.) + (1.-cos(ftime*3.1415)/2.);
  ltime = ltime*6.;
  vec2 q;
  vec2 r;
  float f = pattern(uv, ltime, q, r);
  float minF = -0.5;
  float maxF = 0.8;
  float x = (f - minF) / (maxF - minF);
  return x;
}

vec3 get_normal(vec2 uv, float iTime) {
  float h = get_height(uv, iTime);
  const float delta = 0.1 * scale;
  float dhdx = get_height(vec2(uv.x + delta, uv.y), iTime) - h;
  float dhdy = get_height(vec2(uv.x, uv.y + 0.001), iTime) - h;
  vec3 norm = normalize(vec3(dhdx, dhdy, 0.0));
  return norm;
}

vec3 get_color(vec2 uv, float iTime) {
  float x = get_height(uv, iTime);
  vec3 color = gradient_get_color(x);
  const vec3 light = normalize(vec3(
    ${light.map((x) => x.toFixed(4)).join(", ")}
  ));
  vec3 norm = get_normal(uv, iTime);
  float cosin = dot(norm, light);
  const float c = ${lightningCoef.toFixed(4)};
  vec3 shift = vec3(cosin);
  return color * (1.-c) + shift * c;
}
`.trim();

function parseRgb(stopColor: string) {
  const r = parseInt(stopColor.slice(1, 3), 16) / 255;
  const g = parseInt(stopColor.slice(3, 5), 16) / 255;
  const b = parseInt(stopColor.slice(5, 7), 16) / 255;
  return { r, g, b };
}

//     | 1
//     |
//-1   |    1
//-----|-----
//     |
//     |
//     | -1

function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) return shader;

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return null;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) return program;

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
  return null;
}

export function draw(
  shaderSettings: IShaderSettings,
  /// Should have 4 floats
  random: Float32Array,
  canvas: HTMLCanvasElement,
  width: number,
  height: number
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

  gl.viewport(0, 0, width * 2, height * 2);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);

  // Load random into the GPU uniform u_random
  const publicKeyUniformLocation = gl.getUniformLocation(program, "u_random");
  gl.uniform1fv(publicKeyUniformLocation, random);

  gl.bindVertexArray(vao);

  gl.drawArrays(
    gl.TRIANGLES,
    0, // offset,
    quadrant.length >> 1
  );
}
