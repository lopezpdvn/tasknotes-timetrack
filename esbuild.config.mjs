import * as esbuild from "esbuild";

const options = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian"],
  format: "cjs",
  platform: "browser",
  target: "es2018",
  outfile: "main.js",
  sourcemap: false,
  logLevel: "info",
  banner: { js: "/* Generated from src/main.ts. Do not edit main.js directly. */" },
};

if (process.argv.includes("--watch")) {
  const context = await esbuild.context(options);
  await context.watch();
} else {
  await esbuild.build(options);
}
