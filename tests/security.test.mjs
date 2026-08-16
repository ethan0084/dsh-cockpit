import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (relative) => readFile(path.join(root, relative), "utf8");

test("terminal cwd cannot escape the workspace root", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "dsh-cockpit-escape-"));
  try {
    await mkdir(path.join(temporaryRoot, "nested"));
    const { runTerminalCommand } = await import("../packages/ui/lib/index.js");

    // Relative traversal must be rejected, not resolved outside the workspace.
    await assert.rejects(
      () => runTerminalCommand(temporaryRoot, "pwd", "../../../../etc"),
      /path-outside-workspace/
    );
    // An absolute path outside the workspace must be rejected too.
    await assert.rejects(
      () => runTerminalCommand(temporaryRoot, "pwd", "/etc"),
      /path-outside-workspace/
    );

    // Legitimate in-workspace cwd values keep working, relative and absolute.
    const relative = await runTerminalCommand(temporaryRoot, "pwd", "nested");
    assert.equal(relative.cwd, path.join(temporaryRoot, "nested"));
    const absolute = await runTerminalCommand(temporaryRoot, "pwd", path.join(temporaryRoot, "nested"));
    assert.equal(absolute.cwd, path.join(temporaryRoot, "nested"));
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("terminal never reports a cwd outside the workspace root", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "dsh-cockpit-report-"));
  try {
    const { runTerminalCommand } = await import("../packages/ui/lib/index.js");
    // The shell may cd anywhere; the reported cwd must be clamped to the root so
    // the next command cannot be seeded with an out-of-workspace directory.
    const result = await runTerminalCommand(temporaryRoot, "cd /etc && pwd");
    assert.equal(result.cwd, temporaryRoot);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("every mutating api operation is guarded against cross-origin requests", async () => {
  const source = await read("packages/ui/lib/index.js");
  const guarded = source.slice(source.indexOf("async function handleApi"));
  // Each state-changing branch must assert same-origin before doing work.
  for (const op of ["reveal", "write", "transfer", "upload", "terminal"]) {
    const branch = guarded.slice(guarded.indexOf(`op === "${op}"`));
    const body = branch.slice(0, branch.indexOf("return;"));
    assert.ok(
      body.includes("assertSameOrigin(req)"),
      `operation "${op}" must call assertSameOrigin before mutating state`
    );
  }
});

test("cross-origin requests are rejected by the same-origin guard", async () => {
  const { assertSameOrigin } = await import("../packages/ui/lib/index.js");

  // Browser-supplied Sec-Fetch-Site is the primary signal.
  assert.throws(() => assertSameOrigin({ headers: { "sec-fetch-site": "cross-site" } }), /cross-origin-request/);
  assert.throws(() => assertSameOrigin({ headers: { "sec-fetch-site": "same-site" } }), /cross-origin-request/);
  // A mismatched Origin header is rejected even without Sec-Fetch-Site.
  assert.throws(
    () => assertSameOrigin({ headers: { origin: "http://evil.example", host: "127.0.0.1:5173" } }),
    /cross-origin-request/
  );
  // Same-origin and direct navigations are allowed.
  assert.doesNotThrow(() => assertSameOrigin({ headers: { "sec-fetch-site": "same-origin" } }));
  assert.doesNotThrow(() => assertSameOrigin({ headers: { "sec-fetch-site": "none" } }));
  assert.doesNotThrow(() =>
    assertSameOrigin({ headers: { origin: "http://127.0.0.1:5173", host: "127.0.0.1:5173" } })
  );
});

test("markdown preview refuses dangerous link schemes", async () => {
  const client = await read("packages/ui/lib/client.js");
  const match = /function safeUrl\(([\s\S]*?)\n    }/.exec(client);
  assert.ok(match, "client must expose a safeUrl helper for markdown links");

  const safeUrl = new Function(`${match[0]}; return safeUrl;`)();
  for (const bad of [
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "  javascript:alert(1)",
    "java\tscript:alert(1)",
    "data:text/html;base64,PHNjcmlwdD4=",
    "vbscript:msgbox(1)"
  ]) {
    assert.equal(safeUrl(bad), "#", `must neutralise ${bad}`);
  }
  for (const good of ["https://example.com", "http://example.com", "mailto:a@b.c", "#anchor", "./relative.md"]) {
    assert.equal(safeUrl(good), good, `must preserve ${good}`);
  }
});

test("markdown link rendering routes hrefs through safeUrl", async () => {
  const client = await read("packages/ui/lib/client.js");
  // The anchor href must be built from safeUrl output, never the raw capture.
  assert.doesNotMatch(
    client,
    /<a href="\$2"/,
    "markdown links must not interpolate the raw URL capture into href"
  );
  assert.match(
    client,
    /<a href="\$\{escapeHtml\(safeUrl\(href\)\)\}"/,
    "markdown links must escape the safeUrl result"
  );
});

test("asset responses apply hardening headers on both full and range replies", async () => {
  const source = await read("packages/ui/lib/index.js");
  const asset = source.slice(source.indexOf("async function handleAsset"), source.indexOf("function handleClient"));

  // Both the 200 and 206 branches must spread the hardened header set.
  assert.equal(
    (asset.match(/\.\.\.assetHeaders/g) ?? []).length,
    2,
    "full and range responses must both send the hardened headers"
  );
  assert.doesNotMatch(asset, /"content-type": type/, "asset route must not send a raw content type");
});

test("svg assets are served as non-renderable downloads", async () => {
  const { assetHeadersFor } = await import("../packages/ui/lib/index.js");

  const svg = assetHeadersFor(".svg");
  assert.equal(svg["content-type"], "application/octet-stream", "svg must not keep an inline-renderable type");
  assert.match(svg["content-disposition"], /attachment/, "svg must be forced to download");
  assert.equal(svg["x-content-type-options"], "nosniff");

  const png = assetHeadersFor(".png");
  assert.equal(png["content-type"], "image/png", "ordinary images keep their type");
  assert.equal(png["x-content-type-options"], "nosniff");
  assert.match(png["content-security-policy"], /sandbox|default-src/);
});
