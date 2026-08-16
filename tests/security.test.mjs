import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (relative) => readFile(path.join(root, relative), "utf8");

test("symlinks cannot read or write outside the workspace", async () => {
  const base = await mkdtemp(path.join(os.tmpdir(), "dsh-cockpit-symlink-"));
  try {
    const workspace = path.join(base, "workspace");
    await mkdir(workspace);
    const secret = path.join(base, "secret.txt");
    await writeFile(secret, "SECRET DATA");
    // A symlink placed inside the workspace pointing at an outside file: the
    // lexical path stays within the root, so only realpath resolution catches it.
    await symlink(secret, path.join(workspace, "escape.txt"));

    const { readWorkspaceText, writeWorkspaceText, statWorkspaceFile } = await import("../packages/ui/lib/index.js");

    await assert.rejects(() => readWorkspaceText(workspace, "escape.txt"), /path-outside-workspace/);
    await assert.rejects(() => statWorkspaceFile(workspace, "escape.txt"), /path-outside-workspace/);
    await assert.rejects(() => writeWorkspaceText(workspace, "escape.txt", "overwritten"), /path-outside-workspace/);

    // The outside file must be untouched.
    assert.equal(await readFile(secret, "utf8"), "SECRET DATA");

    // A symlink that stays inside the workspace keeps working.
    const inside = path.join(workspace, "real.txt");
    await writeFile(inside, "inside data");
    await symlink(inside, path.join(workspace, "alias.txt"));
    const value = await readWorkspaceText(workspace, "alias.txt");
    assert.equal(value.content, "inside data");
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

test("a symlinked workspace root is still usable", async () => {
  const base = await mkdtemp(path.join(os.tmpdir(), "dsh-cockpit-rootlink-"));
  try {
    const real = path.join(base, "real-workspace");
    await mkdir(real);
    await writeFile(path.join(real, "file.txt"), "hello");
    const linked = path.join(base, "linked-workspace");
    await symlink(real, linked);

    // Passing the symlinked path as the root must not be mistaken for an escape.
    const { readWorkspaceText } = await import("../packages/ui/lib/index.js");
    const value = await readWorkspaceText(linked, "file.txt");
    assert.equal(value.content, "hello");
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

test("uploads are capped so a single request cannot fill the disk", async () => {
  const source = await read("packages/ui/lib/index.js");
  const upload = source.slice(source.indexOf("export async function uploadWorkspaceFile"), source.indexOf("export function assertSameOrigin"));
  // Streaming straight to disk bypasses the readJson body cap, so uploadFile
  // needs its own limit rather than relying on MAX_BODY_BYTES.
  assert.match(upload, /MAX_UPLOAD_BYTES/, "uploadFile must enforce an explicit upload size cap");
  assert.match(source, /const MAX_UPLOAD_BYTES/, "MAX_UPLOAD_BYTES must be defined");
});

test("oversized uploads are rejected and leave no partial file", async () => {
  const { uploadWorkspaceFile, MAX_UPLOAD_BYTES } = await import("../packages/ui/lib/index.js");
  const workspace = await mkdtemp(path.join(os.tmpdir(), "dsh-cockpit-upload-"));
  try {
    const { Readable } = await import("node:stream");
    const chunk = Buffer.alloc(1024 * 1024, 0x61);
    let sent = 0;
    const body = new Readable({
      read() {
        if (sent > MAX_UPLOAD_BYTES + chunk.length) return this.push(null);
        sent += chunk.length;
        this.push(chunk);
      }
    });

    await assert.rejects(() => uploadWorkspaceFile(body, workspace, "", "big.bin"), /upload-too-large/);

    // Neither the final file nor the temporary artefact may survive.
    const { readdir } = await import("node:fs/promises");
    assert.deepEqual(await readdir(workspace), [], "no partial or temporary file may remain");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("published readme carries no hardcoded version", async () => {
  // The bundle README ships inside the npm tarball, where a version in the
  // heading goes stale the moment the next release is published.
  const readme = await read("packages/bundle/README.md");
  assert.doesNotMatch(
    readme.split("\n")[0],
    /\d+\.\d+\.\d+/,
    "bundle README heading must not pin a version; npm already shows it"
  );
});

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
