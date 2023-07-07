import { vec3 } from "./vec3";
import { parseRgb } from "./parseRgb";

export function getGradientFunctionBody(
  stops: [string, number][],
  v: string
): string {
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
