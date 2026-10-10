import { copyFileSync, mkdirSync } from "node:fs";
import { validateRelease } from "./validate-release.mjs";

const manifest = validateRelease();
mkdirSync(".release", { recursive: true });
for (const file of ["main.js", "manifest.json"]) copyFileSync(file, `.release/${file}`);
console.log(`Staged ${manifest.version}: .release/main.js and .release/manifest.json`);
