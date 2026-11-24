// Stamps the published commit into the app before GitHub Pages publishes it:
//   node scripts/stamp-version.mjs <site folder> <short commit hash> <commit date YYYY-MM-DD>
// Writes the commit and date into src/version.js and names sw.js's offline cache
// after the commit, so every publish updates installed copies. Fails loudly if a
// placeholder is missing, so a broken stamp never gets published.
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const [dir, commit, date] = process.argv.slice(2);
if (!dir || !/^[0-9a-f]{7,40}$/.test(commit ?? "") || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) {
  console.error("usage: node scripts/stamp-version.mjs <site folder> <short commit hash> <YYYY-MM-DD>");
  process.exit(1);
}

async function replace(file, from, to) {
  const path = join(dir, file);
  const text = await readFile(path, "utf8");
  if (!text.includes(from)) {
    console.error(`${file}: expected to find ${from}`);
    process.exit(1);
  }
  await writeFile(path, text.replace(from, to));
}

await replace("src/version.js", 'export const COMMIT = "development";', `export const COMMIT = "${commit}";`);
await replace("src/version.js", 'export const DATE = "";', `export const DATE = "${date}";`);
await replace("sw.js", 'const CACHE = "refill-development";', `const CACHE = "refill-${commit}";`);
console.log(`Stamped ${commit} (${date})`);
