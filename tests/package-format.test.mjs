import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (relative) => readFile(path.join(root, relative), "utf8");
const json = async (relative) => JSON.parse(await read(relative));

test("all published packages use the MIT License", async () => {
  const versions = { bundle: "0.1.1", layout: "0.1.0", ui: "0.1.0" };
  for (const [name, version] of Object.entries(versions)) {
    const manifest = await json(`packages/${name}/package.json`);
    assert.equal(manifest.license, "MIT");
    assert.equal(manifest.version, version);
  }
  assert.match(await read("LICENSE"), /MIT License/);
});

test("bundle exports self-contained DSH plugin entry points", async () => {
  const manifest = await json("packages/bundle/package.json");
  assert.equal(manifest.exports["./layout"], "./embedded/layout/index.js");
  assert.equal(manifest.exports["./layout/package.json"], "./embedded/layout/package.json");
  assert.equal(manifest.exports["./ui"], "./embedded/ui/index.js");
  assert.equal(manifest.exports["./ui/package.json"], "./embedded/ui/package.json");
  assert.equal(manifest.dependencies.mammoth, "^1.10.0");
  assert.equal(manifest.dependencies.xlsx, "^0.18.5");
});

test("bundle replaces the layout and disables the stock workspace", async () => {
  const patch = await read("packages/bundle/cordis.patch.yml");
  assert.match(patch, /id: ui-layout\n\s+disabled: true/);
  assert.match(patch, /id: ui-workspace\n\s+disabled: true/);
  assert.match(patch, /id: workbench-layout\n\s+name: ethan-workbench\/layout/);
  assert.match(patch, /id: workbench-ui\n\s+name: ethan-workbench\/ui/);
});

test("client module ids and injection names agree with manifests", async () => {
  const layoutClient = await read("packages/layout/lib/client.js");
  const uiClient = await read("packages/ui/lib/client.js");
  const uiHost = await read("packages/ui/lib/index.js");
  const uiManifest = await json("packages/ui/package.json");
  assert.match(layoutClient, /id: "ethan-workbench-layout"/);
  assert.match(uiClient, /id: "ethan-workbench-ui"/);
  assert.match(uiHost, /id: "ethan-workbench-ui"/);
  assert.ok(uiManifest.dsh.client.inject.includes("ethan-workbench-layout"));
});

test("published source contains no local user paths or obvious secrets", async () => {
  const roots = ["packages", "README.md", "CONTRIBUTING.md", "SECURITY.md"];
  const files = [];
  async function walk(relative) {
    const full = path.join(root, relative);
    const entries = await readdir(full, { withFileTypes: true }).catch(() => null);
    if (!entries) return files.push(relative);
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      await walk(path.join(relative, entry.name));
    }
  }
  for (const item of roots) await walk(item);
  for (const file of files) {
    const source = await read(file);
    assert.doesNotMatch(source, /\/Users\/[A-Za-z0-9._-]+/);
    assert.doesNotMatch(source, /(?:sk-|ghp_|AKIA)[A-Za-z0-9_-]{16,}/);
  }
});
