/* DSH Cockpit UI. Copyright (C) 2026 DSH Cockpit contributors. MIT License. */
import { promises as fs, createReadStream, createWriteStream, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { pipeline } from "node:stream/promises";
import { Transform } from "node:stream";
import mammoth from "mammoth";
import { read as readWorkbook, set_cptable, utils as workbookUtils } from "xlsx";
import * as spreadsheetCodepages from "xlsx/dist/cpexcel.full.mjs";

set_cptable(spreadsheetCodepages);

const API_PATH = "/dsh-workspace/api";
const ASSET_PATH = "/dsh-workspace/asset";
const MAX_TEXT_BYTES = 12 * 1024 * 1024;
const MAX_BODY_BYTES = 14 * 1024 * 1024;
// Uploads stream straight to disk, so they never pass through the readJson body
// cap and need a limit of their own.
export const MAX_UPLOAD_BYTES = 512 * 1024 * 1024;
const MAX_OFFICE_BYTES = 25 * 1024 * 1024;
const MAX_TERMINAL_COMMAND_BYTES = 16 * 1024;
const MAX_TERMINAL_OUTPUT_BYTES = 1024 * 1024;
const TERMINAL_TIMEOUT_MS = 120 * 1000;
const CLIENT_PATH = fileURLToPath(new URL("./client.js", import.meta.url));
const CLIENT_REV = createHash("sha1").update(readFileSync(CLIENT_PATH)).digest("hex").slice(0, 12);
const CLIENT_ENTRY = {
  id: "dsh-cockpit-ui",
  url: `/dsh-workspace/client.js?rev=${CLIENT_REV}`,
  rev: CLIENT_REV,
  inject: [
    "@deepseek-ai/dsh-client-runtime",
    "dsh-cockpit-layout",
    "@deepseek-ai/dsh-client-ui-conversation"
  ]
};

const contentTypes = new Map([
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
  [".mp4", "video/mp4"],
  [".mov", "video/quicktime"],
  [".webm", "video/webm"],
  [".mp3", "audio/mpeg"],
  [".wav", "audio/wav"],
  [".m4a", "audio/mp4"]
]);

// SVG is an executable document type: served inline from the same origin it can
// run script against the workspace API, so it is downgraded to a download.
const inlineUnsafeTypes = new Set([".svg"]);

export function assetHeadersFor(extension) {
  const declared = contentTypes.get(extension) ?? "application/octet-stream";
  const unsafe = inlineUnsafeTypes.has(extension);
  const headers = {
    "content-type": unsafe ? "application/octet-stream" : declared,
    "x-content-type-options": "nosniff",
    "content-security-policy": "default-src 'none'; sandbox",
    "cache-control": "private, max-age=0"
  };
  if (unsafe) headers["content-disposition"] = "attachment";
  return headers;
}

function json(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    "cache-control": "no-store"
  });
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("request-too-large");
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function targetFrom(rootValue, relativeValue = "") {
  if (typeof rootValue !== "string" || !path.isAbsolute(rootValue)) throw new Error("invalid-root");
  if (typeof relativeValue !== "string" || relativeValue.includes("\0")) throw new Error("invalid-path");
  const root = path.resolve(rootValue);
  const target = path.resolve(root, relativeValue);
  if (target !== root && !target.startsWith(root + path.sep)) throw new Error("path-outside-workspace");
  return { root, target };
}

function containedBy(root, target) {
  return target === root || target.startsWith(root + path.sep);
}

// The lexical check above compares strings, so a symlink inside the workspace
// pointing outside still passes it. Resolving both sides catches that. The root
// itself is resolved too, so a symlinked workspace root is not mistaken for an
// escape. Missing entries fall back to their nearest existing ancestor, which is
// what a create still needs to be validated against.
async function realTargetFrom(rootValue, relativeValue = "") {
  const { root, target } = targetFrom(rootValue, relativeValue);
  const realRoot = await fs.realpath(root);
  let candidate = target;
  for (;;) {
    try {
      const realTarget = await fs.realpath(candidate);
      const suffix = path.relative(candidate, target);
      const resolved = suffix ? path.join(realTarget, suffix) : realTarget;
      if (!containedBy(realRoot, resolved)) throw new Error("path-outside-workspace");
      return { root, target, realRoot, realTarget: resolved };
    } catch (error) {
      if (error?.message === "path-outside-workspace") throw error;
      if (error?.code !== "ENOENT") throw error;
      const parent = path.dirname(candidate);
      if (parent === candidate) throw new Error("path-outside-workspace");
      candidate = parent;
    }
  }
}

export async function listWorkspaceDirectory(root, relative) {
  const { target } = await realTargetFrom(root, relative);
  const dirents = (await fs.readdir(target, { withFileTypes: true })).slice(0, 2000);
  const entries = await Promise.all(dirents.map(async (entry) => {
    const absolute = path.join(target, entry.name);
    let stat;
    try { stat = await fs.stat(absolute); } catch { stat = null; }
    return {
      name: entry.name,
      path: path.relative(path.resolve(root), absolute),
      directory: entry.isDirectory(),
      symlink: entry.isSymbolicLink(),
      hidden: entry.name.startsWith("."),
      size: stat?.size ?? 0,
      mtimeMs: stat?.mtimeMs ?? 0
    };
  }));
  entries.sort((a, b) => Number(b.directory) - Number(a.directory) || a.name.localeCompare(b.name, undefined, { numeric: true }));
  return entries;
}

export async function readWorkspaceText(root, relative) {
  const { target } = await realTargetFrom(root, relative);
  const stat = await fs.stat(target);
  if (!stat.isFile()) throw new Error("not-a-file");
  if (stat.size > MAX_TEXT_BYTES) throw new Error("text-file-too-large");
  return { content: await fs.readFile(target, "utf8"), size: stat.size, mtimeMs: stat.mtimeMs };
}

export async function statWorkspaceFile(root, relative) {
  const { target } = await realTargetFrom(root, relative);
  const stat = await fs.stat(target);
  return { size: stat.size, mtimeMs: stat.mtimeMs, directory: stat.isDirectory() };
}

async function revealInFinder(root, relative) {
  const { target } = await realTargetFrom(root, relative);
  await fs.access(target);
  await new Promise((resolve, reject) => {
    const child = spawn("open", ["-R", target], { stdio: "ignore" });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error("finder-reveal-failed")));
  });
  return { path: target };
}

export async function writeWorkspaceText(root, relative, content, expectedMtimeMs) {
  if (typeof content !== "string") throw new Error("invalid-content");
  if (Buffer.byteLength(content) > MAX_TEXT_BYTES) throw new Error("text-file-too-large");
  const { target } = await realTargetFrom(root, relative);
  const before = await fs.stat(target);
  if (!before.isFile()) throw new Error("not-a-file");
  if (typeof expectedMtimeMs === "number" && Math.abs(before.mtimeMs - expectedMtimeMs) > 1) {
    const error = new Error("file-changed-on-disk");
    error.code = "FILE_CHANGED";
    throw error;
  }
  await fs.writeFile(target, content, "utf8");
  const after = await fs.stat(target);
  return { size: after.size, mtimeMs: after.mtimeMs };
}

function safeEntryName(value) {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0") || path.basename(value) !== value || value === "." || value === "..") throw new Error("invalid-name");
  return value;
}

async function exists(target) {
  try { await fs.access(target); return true; } catch { return false; }
}

async function uniqueTarget(directory, name) {
  const direct = path.join(directory, name);
  if (!(await exists(direct))) return direct;
  const parsed = path.parse(name);
  for (let index = 1; index < 10000; index += 1) {
    const suffix = index === 1 ? " 副本" : ` 副本 ${index}`;
    const candidate = path.join(directory, `${parsed.name}${suffix}${parsed.ext}`);
    if (!(await exists(candidate))) return candidate;
  }
  throw new Error("too-many-name-conflicts");
}

export async function transferWorkspaceEntry(rootValue, sourceValue, destinationValue, mode) {
  if (mode !== "copy" && mode !== "move") throw new Error("invalid-transfer-mode");
  const sourceResult = await realTargetFrom(rootValue, sourceValue);
  const destinationResult = await realTargetFrom(rootValue, destinationValue ?? "");
  if (sourceResult.target === sourceResult.root) throw new Error("cannot-transfer-workspace-root");
  const sourceStat = await fs.lstat(sourceResult.target);
  const destinationStat = await fs.stat(destinationResult.target);
  if (!destinationStat.isDirectory()) throw new Error("destination-not-directory");
  if (sourceStat.isDirectory() && (destinationResult.target === sourceResult.target || destinationResult.target.startsWith(sourceResult.target + path.sep))) throw new Error("cannot-transfer-into-itself");
  const name = path.basename(sourceResult.target);
  const directTarget = path.join(destinationResult.target, name);
  if (mode === "move" && directTarget === sourceResult.target) return { path: path.relative(sourceResult.root, sourceResult.target), unchanged: true };
  const finalTarget = mode === "copy" ? await uniqueTarget(destinationResult.target, name) : directTarget;
  if (mode === "move" && await exists(finalTarget)) {
    const error = new Error("destination-exists");
    error.code = "DESTINATION_EXISTS";
    throw error;
  }
  if (mode === "copy") await fs.cp(sourceResult.target, finalTarget, { recursive: true, force: false, errorOnExist: true, preserveTimestamps: true });
  else await fs.rename(sourceResult.target, finalTarget);
  return { path: path.relative(sourceResult.root, finalTarget), directory: sourceStat.isDirectory() };
}

export async function uploadWorkspaceFile(req, rootValue, destinationValue, nameValue, lastModifiedValue) {
  const destinationResult = await realTargetFrom(rootValue, destinationValue ?? "");
  const destinationStat = await fs.stat(destinationResult.target);
  if (!destinationStat.isDirectory()) throw new Error("destination-not-directory");
  const name = safeEntryName(nameValue);
  const finalTarget = await uniqueTarget(destinationResult.target, name);
  const temporaryTarget = path.join(destinationResult.target, `.dsh-upload-${randomUUID()}.tmp`);
  try {
    const declared = Number(req.headers?.["content-length"]);
    if (Number.isFinite(declared) && declared > MAX_UPLOAD_BYTES) throw new Error("upload-too-large");
    // content-length is advisory, so the byte count is enforced as the body streams.
    let received = 0;
    const limit = new Transform({
      transform(chunk, _encoding, callback) {
        received += chunk.length;
        if (received > MAX_UPLOAD_BYTES) return callback(new Error("upload-too-large"));
        callback(null, chunk);
      }
    });
    await pipeline(req, limit, createWriteStream(temporaryTarget, { flags: "wx" }));
    await fs.rename(temporaryTarget, finalTarget);
    const lastModified = Number(lastModifiedValue);
    if (Number.isFinite(lastModified) && lastModified > 0) {
      const when = new Date(lastModified);
      await fs.utimes(finalTarget, when, when).catch(() => {});
    }
  } catch (error) {
    await fs.unlink(temporaryTarget).catch(() => {});
    throw error;
  }
  const stat = await fs.stat(finalTarget);
  return { path: path.relative(destinationResult.root, finalTarget), size: stat.size, mtimeMs: stat.mtimeMs };
}

export function assertSameOrigin(req) {
  const site = req.headers["sec-fetch-site"];
  if (typeof site === "string" && site !== "same-origin" && site !== "none") throw new Error("cross-origin-request");
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (typeof origin === "string" && typeof host === "string" && new URL(origin).host !== host) throw new Error("cross-origin-request");
}

export async function runTerminalCommand(rootValue, commandValue, cwdValue = "") {
  const { root } = targetFrom(rootValue, "");
  if (typeof cwdValue !== "string" || cwdValue.includes("\0")) throw new Error("invalid-terminal-cwd");
  // targetFrom rejects anything resolving outside the workspace; an absolute cwd
  // inside the root stays usable because path.resolve ignores the root argument.
  const { target } = await realTargetFrom(root, cwdValue);
  const stat = await fs.stat(target);
  if (!stat.isDirectory()) throw new Error("invalid-terminal-cwd");
  if (typeof commandValue !== "string" || commandValue.trim().length === 0) throw new Error("invalid-command");
  if (Buffer.byteLength(commandValue) > MAX_TERMINAL_COMMAND_BYTES) throw new Error("command-too-long");

  const windows = process.platform === "win32";
  const shell = windows ? process.env.ComSpec || "cmd.exe" : process.env.SHELL && path.isAbsolute(process.env.SHELL) ? process.env.SHELL : "/bin/sh";
  const cwdMarker = `__DSH_COCKPIT_CWD_${randomUUID()}__`;
  const script = windows
    ? `${commandValue}\r\nset "__dwu_exit=%errorlevel%"\r\necho ${cwdMarker}%CD%\r\nexit /b %__dwu_exit%`
    : `${commandValue}\n__dwu_exit=$?\nprintf '\\n${cwdMarker}%s\\n' "$PWD"\nexit "$__dwu_exit"`;
  const args = windows ? ["/d", "/s", "/c", script] : ["-lc", script];

  return await new Promise((resolve, reject) => {
    const child = spawn(shell, args, {
      cwd: target,
      env: { ...process.env, PWD: target },
      stdio: ["ignore", "pipe", "pipe"]
    });
    const stdoutChunks = [];
    const stderrChunks = [];
    let outputBytes = 0;
    let truncated = false;
    let timedOut = false;
    let settled = false;
    let timeout;

    const append = (chunks, chunk) => {
      if (truncated) return;
      const buffer = Buffer.from(chunk);
      const remaining = MAX_TERMINAL_OUTPUT_BYTES - outputBytes;
      if (remaining <= 0) {
        truncated = true;
        child.kill("SIGTERM");
        return;
      }
      const accepted = buffer.subarray(0, remaining);
      chunks.push(accepted);
      outputBytes += accepted.length;
      if (accepted.length < buffer.length) {
        truncated = true;
        child.kill("SIGTERM");
      }
    };

    child.stdout.on("data", (chunk) => append(stdoutChunks, chunk));
    child.stderr.on("data", (chunk) => append(stderrChunks, chunk));
    child.once("error", (error) => {
      settled = true;
      clearTimeout(timeout);
      reject(error);
    });
    child.once("close", (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      let stdout = Buffer.concat(stdoutChunks).toString("utf8");
      const stderr = Buffer.concat(stderrChunks).toString("utf8");
      let cwd = target;
      const markerIndex = stdout.lastIndexOf(cwdMarker);
      if (markerIndex >= 0) {
        const reported = stdout.slice(markerIndex + cwdMarker.length).split(/\r?\n/, 1)[0].trim();
        // The command may cd anywhere; only adopt the reported directory when it
        // stays inside the workspace, otherwise fall back to the starting cwd.
        if (path.isAbsolute(reported)) {
          const resolved = path.resolve(reported);
          if (resolved === root || resolved.startsWith(root + path.sep)) cwd = resolved;
        }
        stdout = stdout.slice(0, markerIndex).replace(/\r?\n$/, "");
      }
      let output = stdout + (stdout && stderr && !/\r?\n$/.test(stdout) ? "\n" : "") + stderr;
      if (truncated) output += "\n[输出超过 1 MB，命令已停止]";
      if (timedOut) output += "\n[运行超过 120 秒，命令已停止]";
      resolve({ output, cwd, code: typeof code === "number" ? code : 1, signal: signal ?? undefined, truncated, timedOut });
    });
    timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => { if (!settled) child.kill("SIGKILL"); }, 1500).unref();
    }, TERMINAL_TIMEOUT_MS);
    timeout.unref();
  });
}

export async function previewDocument(root, relative) {
  const { target } = await realTargetFrom(root, relative);
  const ext = path.extname(target).toLowerCase();
  const stat = await fs.stat(target);
  if (!stat.isFile()) throw new Error("not-a-file");
  if (stat.size > MAX_OFFICE_BYTES) throw new Error("office-file-too-large");
  if (ext === ".docx") {
    const result = await mammoth.convertToHtml({ path: target });
    return {
      kind: "html",
      html: result.value,
      warnings: result.messages.map((message) => message.message)
    };
  }
  if (ext === ".xlsx" || ext === ".xls") {
    const workbook = readWorkbook(await fs.readFile(target), { type: "buffer", cellDates: true });
    return {
      kind: "workbook",
      sheets: workbook.SheetNames.map((name) => ({ name, html: workbookUtils.sheet_to_html(workbook.Sheets[name], { id: `sheet-${name}` }) }))
    };
  }
  throw new Error("preview-not-supported");
}

async function handleApi(req, res) {
  const url = new URL(req.url ?? API_PATH, "http://127.0.0.1");
  const op = url.searchParams.get("op") ?? "";
  try {
    if (req.method === "GET" && op === "list") {
      json(res, 200, { ok: true, entries: await listWorkspaceDirectory(url.searchParams.get("root"), url.searchParams.get("path") ?? "") });
      return;
    }
    if (req.method === "GET" && op === "read") {
      json(res, 200, { ok: true, ...(await readWorkspaceText(url.searchParams.get("root"), url.searchParams.get("path"))) });
      return;
    }
    if (req.method === "GET" && op === "stat") {
      json(res, 200, { ok: true, ...(await statWorkspaceFile(url.searchParams.get("root"), url.searchParams.get("path"))) });
      return;
    }
    if (req.method === "GET" && op === "preview") {
      json(res, 200, { ok: true, ...(await previewDocument(url.searchParams.get("root"), url.searchParams.get("path"))) });
      return;
    }
    if (req.method === "POST" && op === "reveal") {
      assertSameOrigin(req);
      json(res, 200, { ok: true, ...(await revealInFinder(url.searchParams.get("root"), url.searchParams.get("path"))) });
      return;
    }
    if ((req.method === "PUT" || req.method === "POST") && op === "write") {
      assertSameOrigin(req);
      const body = await readJson(req);
      json(res, 200, { ok: true, ...(await writeWorkspaceText(body.root, body.path, body.content, body.expectedMtimeMs)) });
      return;
    }
    if (req.method === "POST" && op === "transfer") {
      assertSameOrigin(req);
      const body = await readJson(req);
      json(res, 200, { ok: true, ...(await transferWorkspaceEntry(body.root, body.source, body.destination, body.mode)) });
      return;
    }
    if (req.method === "POST" && op === "upload") {
      assertSameOrigin(req);
      json(res, 200, { ok: true, ...(await uploadWorkspaceFile(req, url.searchParams.get("root"), url.searchParams.get("destination") ?? "", url.searchParams.get("name"), url.searchParams.get("lastModified"))) });
      return;
    }
    if (req.method === "POST" && op === "terminal") {
      assertSameOrigin(req);
      const body = await readJson(req);
      json(res, 200, { ok: true, ...(await runTerminalCommand(body.root, body.command, body.cwd)) });
      return;
    }
    json(res, 404, { ok: false, error: "unknown-operation" });
  } catch (error) {
    const code = error?.message === "cross-origin-request" ? 403 : error?.code === "FILE_CHANGED" || error?.code === "DESTINATION_EXISTS" ? 409 : error?.message === "text-file-too-large" || error?.message === "request-too-large" || error?.message === "command-too-long" ? 413 : 400;
    json(res, code, { ok: false, error: error instanceof Error ? error.message : String(error) });
  }
}

async function handleAsset(req, res) {
  const url = new URL(req.url ?? ASSET_PATH, "http://127.0.0.1");
  try {
    const { target } = await realTargetFrom(url.searchParams.get("root"), url.searchParams.get("path"));
    const stat = await fs.stat(target);
    if (!stat.isFile()) throw new Error("not-a-file");
    const assetHeaders = assetHeadersFor(path.extname(target).toLowerCase());
    const range = req.headers.range;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match) {
        res.writeHead(416, { "content-range": `bytes */${stat.size}` });
        res.end();
        return;
      }
      const start = match[1] === "" ? Math.max(0, stat.size - Number(match[2])) : Number(match[1]);
      const end = match[1] === "" ? stat.size - 1 : Math.min(stat.size - 1, match[2] === "" ? stat.size - 1 : Number(match[2]));
      if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= stat.size) {
        res.writeHead(416, { "content-range": `bytes */${stat.size}` });
        res.end();
        return;
      }
      res.writeHead(206, {
        ...assetHeaders,
        "content-length": end - start + 1,
        "content-range": `bytes ${start}-${end}/${stat.size}`,
        "accept-ranges": "bytes"
      });
      createReadStream(target, { start, end }).pipe(res);
      return;
    }
    res.writeHead(200, {
      ...assetHeaders,
      "content-length": stat.size,
      "accept-ranges": "bytes"
    });
    createReadStream(target).pipe(res);
  } catch (error) {
    json(res, 404, { ok: false, error: error instanceof Error ? error.message : String(error) });
  }
}

function handleClient(_req, res) {
  const body = readFileSync(CLIENT_PATH);
  res.writeHead(200, {
    "content-type": "text/javascript; charset=utf-8",
    "content-length": body.length,
    "cache-control": "no-cache"
  });
  res.end(body);
}

function injectClientEntry(html) {
  return html.replace(/window\.__DSH_BOOT__ = ([^<]+)<\/script>/, (whole, encoded) => {
    try {
      const graph = JSON.parse(encoded.trim());
      if (!graph.entries.some((entry) => entry.id === CLIENT_ENTRY.id)) graph.entries.push(CLIENT_ENTRY);
      graph.rev = createHash("sha1").update(JSON.stringify(graph.entries)).digest("hex").slice(0, 12);
      return `window.__DSH_BOOT__ = ${JSON.stringify(graph).replaceAll("<", "\\u003c")}</script>`;
    } catch {
      return whole;
    }
  });
}

// clientModules is an ordering dependency: its index transform must run first,
// then this plugin appends the local client entry to the completed boot graph.
export const inject = ["webServer", "clientModules"];

export function apply(ctx) {
  ctx.effect(() => {
    const disposeApi = ctx.webServer.register({ kind: "exact", path: API_PATH, handler: handleApi });
    const disposeAsset = ctx.webServer.register({ kind: "exact", path: ASSET_PATH, handler: handleAsset });
    const disposeClient = ctx.webServer.register({ kind: "exact", path: "/dsh-workspace/client.js", handler: handleClient });
    const disposeIndex = ctx.webServer.tapIndex(injectClientEntry);
    return () => {
      disposeIndex();
      disposeClient();
      disposeAsset();
      disposeApi();
    };
  }, "dsh-cockpit-ui routes");
}
