import { promises as fs } from "fs";
import path from "path";

async function readDir(dir, files = []) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = path.join(dir, dirent.name);
    console.log(res);
    if (dirent.isDirectory()) {
      await readDir(res, files);
    } else {
      files.push(res);
    }
  }
  return files;
}

// Files that are irrelevant for action scripts,
// e.g. the Firefox-internal ES module map
const skipFiles = new Set(["lib.gecko.modules.d.ts"]);

async function bundle() {
  const dir = "node_modules/zotero-types";
  const files = await readDir(dir);
  const dtsFiles = files.filter(
    (file) => file.endsWith(".d.ts") && !skipFiles.has(path.basename(file)),
  );
  // Add the action.d.ts file
  dtsFiles.push("scripts/action.d.ts");
  const fileContents = await Promise.all(
    dtsFiles.map((file) => fs.readFile(file, "utf-8")),
  );
  let content = fileContents.join("\n");
  // Remove all lines starts with `/// `
  content = content.replace(/^\/\/\/ .*\n/gm, "");
  // Remove all `export {};` lines, which breaks the language server
  content = content.replace(/export .*\n/g, "");
  // LazyModules is defined in the skipped lib.gecko.modules.d.ts
  content = content.replace(
    /^type LazyModules = import\(.*\)\.LazyModules;$/m,
    "type LazyModules = Record<never, never>;",
  );
  await fs.writeFile("addon/content/action-types.d.ts", content);
}

bundle();
