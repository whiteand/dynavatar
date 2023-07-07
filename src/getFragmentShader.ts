import { IShaderSettings } from "./IShaderSettings";
import { getGradientFunctionBody } from "./getGradientFunctionBody";

export const getFragmentShader = ({
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
