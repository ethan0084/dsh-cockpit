import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const workspace = async () => mkdtemp(path.join(os.tmpdir(), "dsh-cockpit-files-"));

test("writing a file detects a concurrent change on disk", async () => {
  const root = await workspace();
  try {
    const { readWorkspaceText, writeWorkspaceText } = await import("../packages/ui/lib/index.js");
    const file = path.join(root, "note.txt");
    await writeFile(file, "original");

    const opened = await readWorkspaceText(root, "note.txt");

    // Someone else (the agent, an editor) rewrites the file after it was opened.
    await new Promise((resolve) => setTimeout(resolve, 12));
    await writeFile(file, "changed by someone else");

    await assert.rejects(
      () => writeWorkspaceText(root, "note.txt", "my edit", opened.mtimeMs),
      (error) => error.code === "FILE_CHANGED"
    );
    // The competing write must survive rather than being silently overwritten.
    assert.equal(await readFile(file, "utf8"), "changed by someone else");

    // Writing without an expected mtime still succeeds.
    const saved = await writeWorkspaceText(root, "note.txt", "my edit");
    assert.equal(await readFile(file, "utf8"), "my edit");
    assert.equal(saved.size, Buffer.byteLength("my edit"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("copying an entry never overwrites an existing name", async () => {
  const root = await workspace();
  try {
    const { transferWorkspaceEntry } = await import("../packages/ui/lib/index.js");
    await mkdir(path.join(root, "target"));
    await writeFile(path.join(root, "file.txt"), "source");
    await writeFile(path.join(root, "target/file.txt"), "already here");

    const result = await transferWorkspaceEntry(root, "file.txt", "target", "copy");

    // The pre-existing file keeps its content; the copy is renamed alongside it.
    assert.equal(await readFile(path.join(root, "target/file.txt"), "utf8"), "already here");
    assert.notEqual(result.path, path.join("target", "file.txt"));
    assert.equal(await readFile(path.join(root, result.path), "utf8"), "source");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("moving an entry refuses to clobber the destination", async () => {
  const root = await workspace();
  try {
    const { transferWorkspaceEntry } = await import("../packages/ui/lib/index.js");
    await mkdir(path.join(root, "target"));
    await writeFile(path.join(root, "file.txt"), "source");
    await writeFile(path.join(root, "target/file.txt"), "already here");

    await assert.rejects(
      () => transferWorkspaceEntry(root, "file.txt", "target", "move"),
      (error) => error.code === "DESTINATION_EXISTS"
    );
    // Both files must still be intact after the refusal.
    assert.equal(await readFile(path.join(root, "file.txt"), "utf8"), "source");
    assert.equal(await readFile(path.join(root, "target/file.txt"), "utf8"), "already here");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a directory cannot be moved inside itself", async () => {
  const root = await workspace();
  try {
    const { transferWorkspaceEntry } = await import("../packages/ui/lib/index.js");
    await mkdir(path.join(root, "outer/inner"), { recursive: true });

    await assert.rejects(
      () => transferWorkspaceEntry(root, "outer", "outer/inner", "move"),
      /cannot-transfer-into-itself/
    );
    await assert.rejects(
      () => transferWorkspaceEntry(root, "", "outer", "move"),
      /cannot-transfer-workspace-root/
    );
    assert.deepEqual(await readdir(path.join(root, "outer")), ["inner"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("uploads land under a non-colliding name and keep their timestamp", async () => {
  const root = await workspace();
  try {
    const { uploadWorkspaceFile } = await import("../packages/ui/lib/index.js");
    const { Readable } = await import("node:stream");
    await writeFile(path.join(root, "photo.png"), "existing");

    const when = Date.now() - 86_400_000;
    const result = await uploadWorkspaceFile(
      Readable.from([Buffer.from("uploaded bytes")]),
      root,
      "",
      "photo.png",
      String(when)
    );

    // The existing file is untouched and the upload gets a distinct name.
    assert.equal(await readFile(path.join(root, "photo.png"), "utf8"), "existing");
    assert.equal(await readFile(path.join(root, result.path), "utf8"), "uploaded bytes");
    const uploaded = await stat(path.join(root, result.path));
    assert.ok(Math.abs(uploaded.mtimeMs - when) < 2000, "declared mtime should be applied");

    // No temporary upload artefact may be left behind.
    const leftovers = (await readdir(root)).filter((name) => name.startsWith(".dsh-upload-"));
    assert.deepEqual(leftovers, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("entry names are rejected when they contain a path separator", async () => {
  const root = await workspace();
  try {
    const { uploadWorkspaceFile } = await import("../packages/ui/lib/index.js");
    const { Readable } = await import("node:stream");
    for (const name of ["../escape.txt", "nested/file.txt", "", ".", ".."]) {
      await assert.rejects(
        () => uploadWorkspaceFile(Readable.from([Buffer.from("x")]), root, "", name),
        /invalid-name/,
        `must reject ${JSON.stringify(name)}`
      );
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
