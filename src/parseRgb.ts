export function parseRgb(stopColor: string): {
  r: number;
  g: number;
  b: number;
} {
  const r = parseInt(stopColor.slice(1, 3), 16) / 255;
  const g = parseInt(stopColor.slice(3, 5), 16) / 255;
  const b = parseInt(stopColor.slice(5, 7), 16) / 255;
  return { r, g, b };
}
