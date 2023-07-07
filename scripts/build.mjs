import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  format: "cjs",
  outfile: "dist/index.cjs.js",
  tsconfig: "tsconfig.json",
});
await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  format: "esm",
  outfile: "dist/index.esm.js",
  tsconfig: "tsconfig.json",
});
