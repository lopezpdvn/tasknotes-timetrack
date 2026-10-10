import assert from "node:assert/strict";
import { copyFileSync, existsSync, lstatSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { validateRelease } from "./validate-release.mjs";

const manifest = validateRelease();
const releaseDir = resolve(".release");
assert.equal(dirname(releaseDir), process.cwd(), "Release staging must stay inside the repository");
if (existsSync(releaseDir)) {
  assert.ok(!lstatSync(releaseDir).isSymbolicLink(), "Release staging must not be a symbolic link");
  rmSync(releaseDir, { recursive: true });
}
mkdirSync(releaseDir);
for (const file of ["main.js", "manifest.json"]) copyFileSync(file, join(releaseDir, file));
console.log(`Staged ${manifest.version}: .release/main.js and .release/manifest.json`);
