import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, rm, truncate, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (relative) => readFile(path.join(root, relative), "utf8");
const json = async (relative) => JSON.parse(await read(relative));

test("all published packages use the MIT License", async () => {
  const versions = { bundle: "0.2.3", layout: "0.2.3", ui: "0.2.3" };
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
  assert.equal(manifest.dependencies.xlsx, undefined);
  assert.ok(manifest.files.includes("vendor"));
  const uiManifest = await json("packages/ui/package.json");
  assert.equal(uiManifest.dependencies.xlsx, "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz");
  const build = await read("scripts/build-bundle.mjs");
  assert.match(build, /xlsx\/xlsx\.mjs/);
  assert.match(build, /SHEETJS-LICENSE/);
});

test("workbook previews use the patched SheetJS release", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "dsh-cockpit-workbook-"));
  try {
    const { utils, write } = createRequire(path.join(root, "packages/ui/package.json"))("xlsx");
    const { previewDocument } = await import("../packages/ui/lib/index.js");
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, utils.aoa_to_sheet([["name", "value"], ["secure", 203]]), "Sheet 1");
    await writeFile(path.join(temporaryRoot, "sample.xlsx"), write(workbook, { type: "buffer", bookType: "xlsx" }));
    const preview = await previewDocument(temporaryRoot, "sample.xlsx");
    assert.equal(preview.kind, "workbook");
    assert.equal(preview.sheets[0].name, "Sheet 1");
    assert.match(preview.sheets[0].html, /secure/);
    const oversized = path.join(temporaryRoot, "oversized.xlsx");
    await writeFile(oversized, "");
    await truncate(oversized, 25 * 1024 * 1024 + 1);
    await assert.rejects(() => previewDocument(temporaryRoot, "oversized.xlsx"), /office-file-too-large/);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("bundle replaces the layout and disables the stock workspace", async () => {
  const patch = await read("packages/bundle/cordis.patch.yml");
  assert.match(patch, /id: ui-layout\n\s+disabled: true/);
  assert.match(patch, /id: ui-workspace\n\s+disabled: true/);
  assert.match(patch, /id: cockpit-layout\n\s+name: dsh-cockpit\/layout/);
  assert.match(patch, /id: cockpit-ui\n\s+name: dsh-cockpit\/ui/);
});

test("client module ids and injection names agree with manifests", async () => {
  const layoutClient = await read("packages/layout/lib/client.js");
  const uiClient = await read("packages/ui/lib/client.js");
  const uiHost = await read("packages/ui/lib/index.js");
  const uiManifest = await json("packages/ui/package.json");
  assert.match(layoutClient, /id: "dsh-cockpit-layout"/);
  assert.match(uiClient, /id: "dsh-cockpit-ui"/);
  assert.match(uiHost, /id: "dsh-cockpit-ui"/);
  assert.ok(uiManifest.dsh.client.inject.includes("dsh-cockpit-layout"));
});

test("workspace terminal runs commands from the selected project root", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "dsh-cockpit-terminal-"));
  try {
    await mkdir(path.join(temporaryRoot, "nested"));
    const { runTerminalCommand } = await import("../packages/ui/lib/index.js");
    const result = await runTerminalCommand(temporaryRoot, "pwd && printf 'terminal-ok'");
    assert.equal(result.code, 0);
    assert.match(result.output, new RegExp(temporaryRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(result.output, /terminal-ok/);
    const changed = await runTerminalCommand(temporaryRoot, "cd nested", result.cwd);
    assert.equal(changed.code, 0);
    assert.equal(changed.cwd, path.join(temporaryRoot, "nested"));
    const continued = await runTerminalCommand(temporaryRoot, "pwd", changed.cwd);
    assert.equal(continued.output.trim(), path.join(temporaryRoot, "nested"));
    const failed = await runTerminalCommand(temporaryRoot, "printf 'stdout-ok\\n'; printf 'stderr-ok\\n' >&2; false", changed.cwd);
    assert.equal(failed.code, 1);
    assert.match(failed.output, /stdout-ok/);
    assert.match(failed.output, /stderr-ok/);
    assert.equal(failed.cwd, path.join(temporaryRoot, "nested"));
    await assert.rejects(() => runTerminalCommand(temporaryRoot, "pwd", "missing-directory"), /ENOENT/);
    const oversized = await runTerminalCommand(temporaryRoot, "node -e \"process.stdout.write('x'.repeat(1100000))\"");
    assert.equal(oversized.truncated, true);
    assert.match(oversized.output, /输出超过 1 MB/);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("workspace client exposes a terminal toggle and lower panel", async () => {
  const source = await read("packages/ui/lib/client.js");
  assert.match(source, /className: "dwu-terminalToggle"/);
  assert.match(source, /className: "dwu-main"/);
  assert.match(source, /terminalOpen && h\(TerminalPanel/);
  assert.match(source, /op=terminal/);
  assert.match(source, /event\.key === "`"/);
  assert.doesNotMatch(source, /className: "dwu-terminalTitle"/);
  assert.match(source, /\.dwu-workHead\{[^}]*padding:0 52px 0 12px/);
});

test("workspace tabs distinguish tree previews from AI-pinned files", async () => {
  const source = await read("packages/ui/lib/client.js");
  assert.match(source, /onOpen\(entry\.path, "preview"\)/);
  assert.match(source, /onDoubleClick: entry\.directory \? undefined : \(\) => onOpen\(entry\.path, "pinned"\)/);
  assert.match(source, /detail\.mode === "preview"/);
  assert.match(source, /data-preview/);
  assert.match(source, /mode: "pinned", source: "ai", context: "keep"/);
  assert.match(source, /AI file tab routing/);
  assert.match(source, /tabModelVersion/);
});

test("published source contains no retired branding, local user paths, or obvious secrets", async () => {
  const roots = ["packages", "skills", "README.md", "CONTRIBUTING.md", "SECURITY.md"];
  const files = [];
  async function walk(relative) {
    if (relative === "packages/bundle/embedded") return;
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
    assert.doesNotMatch(source, /ethan-workbench|Ethan Workbench/);
    assert.doesNotMatch(source, /\/Users\/[A-Za-z0-9._-]+/);
    assert.doesNotMatch(source, /(?:sk-|ghp_|AKIA)[A-Za-z0-9_-]{16,}/);
  }
});
