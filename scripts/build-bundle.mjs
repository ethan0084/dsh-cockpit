import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const embedded = path.join(root, "packages/bundle/embedded");
const vendor = path.join(root, "packages/bundle/vendor");

await rm(embedded, { recursive: true, force: true });
await rm(vendor, { recursive: true, force: true });
await mkdir(path.join(embedded, "layout"), { recursive: true });
await mkdir(path.join(embedded, "ui"), { recursive: true });
await mkdir(vendor, { recursive: true });

const copyWithIds = async (source, destination, replacements) => {
  let body = await readFile(source, "utf8");
  for (const [from, to] of replacements) body = body.replaceAll(from, to);
  await writeFile(destination, body);
};

await cp(path.join(root, "packages/layout/lib/index.js"), path.join(embedded, "layout/index.js"));
await copyWithIds(
  path.join(root, "packages/layout/lib/client.js"),
  path.join(embedded, "layout/client.js"),
  [["id: \"dsh-cockpit-layout\"", "id: \"dsh-cockpit/layout\""]],
);

await copyWithIds(
  path.join(root, "packages/ui/lib/index.js"),
  path.join(embedded, "ui/index.js"),
  [
    ["\"xlsx/dist/cpexcel.full.mjs\"", "\"../../vendor/cpexcel.full.mjs\""],
    ["\"xlsx\"", "\"../../vendor/xlsx.mjs\""],
    ["id: \"dsh-cockpit-ui\"", "id: \"dsh-cockpit/ui\""],
    ["\"dsh-cockpit-layout\"", "\"dsh-cockpit/layout\""],
  ],
);

await cp(path.join(root, "packages/ui/node_modules/xlsx/xlsx.mjs"), path.join(vendor, "xlsx.mjs"));
await cp(path.join(root, "packages/ui/node_modules/xlsx/dist/cpexcel.full.mjs"), path.join(vendor, "cpexcel.full.mjs"));
await cp(path.join(root, "packages/ui/node_modules/xlsx/LICENSE"), path.join(vendor, "SHEETJS-LICENSE"));
await copyWithIds(
  path.join(root, "packages/ui/lib/client.js"),
  path.join(embedded, "ui/client.js"),
  [["id: \"dsh-cockpit-ui\"", "id: \"dsh-cockpit/ui\""]],
);

await writeFile(path.join(embedded, "layout/package.json"), JSON.stringify({
  name: "dsh-cockpit/layout",
  type: "module",
  exports: { ".": "./index.js", "./client": "./client.js", "./package.json": "./package.json" },
  dsh: {
    client: {
      inject: ["@deepseek-ai/dsh-client-runtime", "@deepseek-ai/dsh-client-ui-theme"],
      platform: "web",
    },
  },
}, null, 2) + "\n");

await writeFile(path.join(embedded, "ui/package.json"), JSON.stringify({
  name: "dsh-cockpit/ui",
  type: "module",
  exports: { ".": "./index.js", "./client": "./client.js", "./package.json": "./package.json" },
}, null, 2) + "\n");
