import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";

const version = process.argv[2];
assert.ok(version, "Usage: npm run release:version -- x.y.z");
assert.match(version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/, "Use a stable x.y.z version");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const manifest = readJson("manifest.json");
const before = manifest.version.split(".").map(Number);
const after = version.split(".").map(Number);
const firstDifference = after.findIndex((part, i) => part !== before[i]);
assert.ok(firstDifference >= 0 && after[firstDifference] > before[firstDifference], "The new version must be greater than the current version");
const pkg = readJson("package.json");
const lock = readJson("package-lock.json");
const versions = readJson("versions.json");
manifest.version = pkg.version = lock.version = lock.packages[""].version = version;
versions[version] = manifest.minAppVersion;
for (const [file, data] of Object.entries({
  "manifest.json": manifest, "package.json": pkg,
  "package-lock.json": lock, "versions.json": versions,
})) writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Version set to ${version}. Run npm run check before committing and tagging.`);
