import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, copyFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { COMMIT, DATE, versionLabel } from "../../src/version.js";

const repo = fileURLToPath(new URL("../..", import.meta.url));

test("the committed files say 'development'; publishing stamps the real commit", () => {
  assert.equal(COMMIT, "development");
  assert.equal(DATE, "");
});

test("the label shows the short commit and the commit date", () => {
  assert.equal(versionLabel("a7e262d", "2026-11-24"), "Refill a7e262d · 24 Nov 2026");
  assert.equal(versionLabel("development", ""), "Refill development");
});

test("stamping writes the commit into the app and names the offline cache after it", async () => {
  const dir = await mkdtemp(join(tmpdir(), "refill-stamp-"));
  await mkdir(join(dir, "src"));
  await copyFile(join(repo, "src/version.js"), join(dir, "src/version.js"));
  await copyFile(join(repo, "sw.js"), join(dir, "sw.js"));
  execFileSync("node", [join(repo, "scripts/stamp-version.mjs"), dir, "a7e262d", "2026-11-24"]);
  const version = await readFile(join(dir, "src/version.js"), "utf8");
  const sw = await readFile(join(dir, "sw.js"), "utf8");
  assert.match(version, /export const COMMIT = "a7e262d";/);
  assert.match(version, /export const DATE = "2026-11-24";/);
  assert.match(sw, /const CACHE = "refill-a7e262d";/);
});

test("stamping refuses bad input instead of publishing a broken app", () => {
  assert.throws(() => execFileSync("node", [join(repo, "scripts/stamp-version.mjs"), repo, "not a hash", "2026-11-24"], { stdio: "pipe" }));
});
