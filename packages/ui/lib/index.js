/* Ethan Workbench UI. Copyright (C) 2026 Ethan. MIT License. */
import { promises as fs, createReadStream, createWriteStream, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { pipeline } from "node:stream/promises";
import mammoth from "mammoth";
import XLSX from "xlsx";

const API_PATH = "/dsh-workspace/api";
const ASSET_PATH = "/dsh-workspace/asset";
const MAX_TEXT_BYTES = 12 * 1024 * 1024;
const MAX_BODY_BYTES = 14 * 1024 * 1024;
const CLIENT_PATH = fileURLToPath(new URL("./client.js", import.meta.url));
const CLIENT_REV = createHash("sha1").update(readFileSync(CLIENT_PATH)).digest("hex").slice(0, 12);
const CLIENT_ENTRY = {
  id: "ethan-workbench-ui",
  url: `/dsh-workspace/client.js?rev=${CLIENT_REV}`,
  rev: CLIENT_REV,
  inject: [
    "@deepseek-ai/dsh-client-runtime",
    "ethan-workbench-layout",
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

async function listDirectory(root, relative) {
  const { target } = targetFrom(root, relative);
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

async function readText(root, relative) {
  const { target } = targetFrom(root, relative);
  const stat = await fs.stat(target);
  if (!stat.isFile()) throw new Error("not-a-file");
  if (stat.size > MAX_TEXT_BYTES) throw new Error("text-file-too-large");
  return { content: await fs.readFile(target, "utf8"), size: stat.size, mtimeMs: stat.mtimeMs };
}

async function statFile(root, relative) {
  const { target } = targetFrom(root, relative);
  const stat = await fs.stat(target);
  return { size: stat.size, mtimeMs: stat.mtimeMs, directory: stat.isDirectory() };
}

async function revealInFinder(root, relative) {
  const { target } = targetFrom(root, relative);
  await fs.access(target);
  await new Promise((resolve, reject) => {
    const child = spawn("open", ["-R", target], { stdio: "ignore" });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error("finder-reveal-failed")));
  });
  return { path: target };
}

async function writeText(root, relative, content, expectedMtimeMs) {
  if (typeof content !== "string") throw new Error("invalid-content");
  if (Buffer.byteLength(content) > MAX_TEXT_BYTES) throw new Error("text-file-too-large");
  const { target } = targetFrom(root, relative);
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

async function transferEntry(rootValue, sourceValue, destinationValue, mode) {
  if (mode !== "copy" && mode !== "move") throw new Error("invalid-transfer-mode");
  const sourceResult = targetFrom(rootValue, sourceValue);
  const destinationResult = targetFrom(rootValue, destinationValue ?? "");
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

async function uploadFile(req, rootValue, destinationValue, nameValue, lastModifiedValue) {
  const destinationResult = targetFrom(rootValue, destinationValue ?? "");
  const destinationStat = await fs.stat(destinationResult.target);
  if (!destinationStat.isDirectory()) throw new Error("destination-not-directory");
  const name = safeEntryName(nameValue);
  const finalTarget = await uniqueTarget(destinationResult.target, name);
  const temporaryTarget = path.join(destinationResult.target, `.dsh-upload-${randomUUID()}.tmp`);
  try {
    await pipeline(req, createWriteStream(temporaryTarget, { flags: "wx" }));
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

function previewDocument(root, relative) {
  const { target } = targetFrom(root, relative);
  const ext = path.extname(target).toLowerCase();
  if (ext === ".docx") {
    return mammoth.convertToHtml({ path: target }).then((result) => ({
      kind: "html",
      html: result.value,
      warnings: result.messages.map((message) => message.message)
    }));
  }
  if (ext === ".xlsx" || ext === ".xls") {
    const workbook = XLSX.readFile(target, { cellDates: true });
    return Promise.resolve({
      kind: "workbook",
      sheets: workbook.SheetNames.map((name) => ({ name, html: XLSX.utils.sheet_to_html(workbook.Sheets[name], { id: `sheet-${name}` }) }))
    });
  }
  throw new Error("preview-not-supported");
}

async function handleApi(req, res) {
  const url = new URL(req.url ?? API_PATH, "http://127.0.0.1");
  const op = url.searchParams.get("op") ?? "";
  try {
    if (req.method === "GET" && op === "list") {
      json(res, 200, { ok: true, entries: await listDirectory(url.searchParams.get("root"), url.searchParams.get("path") ?? "") });
      return;
    }
    if (req.method === "GET" && op === "read") {
      json(res, 200, { ok: true, ...(await readText(url.searchParams.get("root"), url.searchParams.get("path"))) });
      return;
    }
    if (req.method === "GET" && op === "stat") {
      json(res, 200, { ok: true, ...(await statFile(url.searchParams.get("root"), url.searchParams.get("path"))) });
      return;
    }
    if (req.method === "GET" && op === "preview") {
      json(res, 200, { ok: true, ...(await previewDocument(url.searchParams.get("root"), url.searchParams.get("path"))) });
      return;
    }
    if (req.method === "POST" && op === "reveal") {
      json(res, 200, { ok: true, ...(await revealInFinder(url.searchParams.get("root"), url.searchParams.get("path"))) });
      return;
    }
    if ((req.method === "PUT" || req.method === "POST") && op === "write") {
      const body = await readJson(req);
      json(res, 200, { ok: true, ...(await writeText(body.root, body.path, body.content, body.expectedMtimeMs)) });
      return;
    }
    if (req.method === "POST" && op === "transfer") {
      const body = await readJson(req);
      json(res, 200, { ok: true, ...(await transferEntry(body.root, body.source, body.destination, body.mode)) });
      return;
    }
    if (req.method === "POST" && op === "upload") {
      json(res, 200, { ok: true, ...(await uploadFile(req, url.searchParams.get("root"), url.searchParams.get("destination") ?? "", url.searchParams.get("name"), url.searchParams.get("lastModified"))) });
      return;
    }
    json(res, 404, { ok: false, error: "unknown-operation" });
  } catch (error) {
    const code = error?.code === "FILE_CHANGED" || error?.code === "DESTINATION_EXISTS" ? 409 : error?.message === "text-file-too-large" || error?.message === "request-too-large" ? 413 : 400;
    json(res, code, { ok: false, error: error instanceof Error ? error.message : String(error) });
  }
}

async function handleAsset(req, res) {
  const url = new URL(req.url ?? ASSET_PATH, "http://127.0.0.1");
  try {
    const { target } = targetFrom(url.searchParams.get("root"), url.searchParams.get("path"));
    const stat = await fs.stat(target);
    if (!stat.isFile()) throw new Error("not-a-file");
    const type = contentTypes.get(path.extname(target).toLowerCase()) ?? "application/octet-stream";
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
        "content-type": type,
        "content-length": end - start + 1,
        "content-range": `bytes ${start}-${end}/${stat.size}`,
        "accept-ranges": "bytes",
        "cache-control": "private, max-age=0"
      });
      createReadStream(target, { start, end }).pipe(res);
      return;
    }
    res.writeHead(200, {
      "content-type": type,
      "content-length": stat.size,
      "accept-ranges": "bytes",
      "cache-control": "private, max-age=0"
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
  }, "ethan-workbench-ui routes");
}
