import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { VERSION } from "../../src/version.js";

test("the version is a whole number", () => assert.match(String(VERSION), /^\d+$/));

test("the service worker's cache name follows the version, so every release updates installed copies", async () => {
  const sw = await readFile(new URL("../../sw.js", import.meta.url), "utf8");
  assert.match(sw, new RegExp(`const CACHE = "refill-v${VERSION}";`));
  assert.match(sw, /"src\/version\.js"/);
});
