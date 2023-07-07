import { IShaderSettings } from "./IShaderSettings";

export const DEFAULT_STOPS: [string, number][] = [
  ["#3ee1fe", 0.09],
  ["#5064c8", 0.45],
  ["#ff80dd", 0.73],
];

export const DEFAULT_SHADER_SETTINGS: IShaderSettings = {
  stops: DEFAULT_STOPS,
  lightningCoef: 0.0329,
  light: [-1, 0.021, 1],
  scale: 0.012402961552606947,
};
