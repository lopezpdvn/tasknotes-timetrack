import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

export function validateRelease(tag) {
  const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
  const manifest = readJson("manifest.json");
  const pkg = readJson("package.json");
  const lock = readJson("package-lock.json");
  const versions = readJson("versions.json");
  assert.match(manifest.version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/, "Use a stable x.y.z version");
  assert.equal(pkg.version, manifest.version, "Package and manifest versions differ");
  assert.equal(lock.version, manifest.version, "Lockfile and manifest versions differ");
  assert.equal(lock.packages[""].version, manifest.version, "Lockfile root version differs");
  assert.equal(versions[manifest.version], manifest.minAppVersion, "versions.json entry differs");
  assert.equal(manifest.id, "tasknotes-timetrack");
  if (tag !== undefined) assert.equal(tag, manifest.version, "Tag must equal manifest version exactly (no v prefix)");
  assert.ok(readFileSync("main.js", "utf8").trim(), "Build main.js before releasing");
  return manifest;
}

if (process.argv[1]?.endsWith("validate-release.mjs")) {
  const manifest = validateRelease(process.argv[2]);
  console.log(`Release metadata valid: ${manifest.version}`);
}
