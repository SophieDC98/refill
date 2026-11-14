import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { startServer } from "./serve.js";
import { blockFonts, watchErrors } from "./offline.js";

const { chromium } = createRequire(import.meta.url)("playwright");
const root = fileURLToPath(new URL("../..", import.meta.url));

let server, browser;
before(async () => {
  server = await startServer(root);
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  await server?.close();
});

async function jsFiles(dir) {
  const out = [];
  for (const entry of await readdir(join(root, dir), { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...await jsFiles(path));
    else if (entry.name.endsWith(".js")) out.push(path);
  }
  return out;
}

test("manifest links, parses, and its icons load", async () => {
  const context = await browser.newContext();
  await blockFonts(context);
  const page = await context.newPage();
  const errors = watchErrors(page);
  await page.goto(server.url + "/index.html");
  await page.getByText("0 of 8").waitFor();

  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  const manifestUrl = new URL(href, page.url()).href;
  const response = await page.request.get(manifestUrl);
  assert.equal(response.status(), 200);
  const manifest = await response.json();
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.name, "refill");
  assert.equal(manifest.start_url, "./");
  assert.deepEqual(manifest.icons.map((i) => i.sizes).sort(), ["192x192", "512x512"]);
  for (const icon of manifest.icons) {
    const res = await page.request.get(new URL(icon.src, manifestUrl).href);
    assert.equal(res.status(), 200);
    assert.equal(res.headers()["content-type"], "image/png");
  }
  assert.deepEqual(errors, []);
  await context.close();
});

test("the precache list names every module and the manifest and icons", async () => {
  const sw = await readFile(join(root, "sw.js"), "utf8");
  const listed = new Set([...sw.matchAll(/"(\.\/[^"]*|[^"]+\.[a-z]+)"/g)].map((m) => m[1].replace(/^\.\//, "")));
  for (const file of await jsFiles("src")) assert.ok(listed.has(file), `${file} missing from precache`);
  for (const file of ["index.html", "styles.css", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"]) {
    assert.ok(listed.has(file), `${file} missing from precache`);
  }
});

test("works offline once the service worker has taken over", async () => {
  const own = await startServer(root); // its own server, so it can be stopped
  const context = await browser.newContext();
  await blockFonts(context);
  const page = await context.newPage();
  const errors = watchErrors(page);
  await page.goto(own.url + "/index.html");
  await page.getByText("0 of 8").waitFor();
  // The worker installs after the first load and controls the page from the next one.
  const controlled = () => page.evaluate(() => navigator.serviceWorker.controller !== null);
  for (let i = 0; i < 20 && !(await controlled()); i++) {
    await page.waitForTimeout(250);
    await page.reload();
  }
  assert.ok(await controlled(), "service worker never took control");

  await own.close();
  await page.reload();
  await page.getByText("0 of 8").waitFor();
  assert.equal(await page.locator(".bottle").count(), 8);
  assert.deepEqual(errors, []);
  await context.close();
});

test("the precache bypasses the HTTP cache and the cache name was bumped past v1", async () => {
  const sw = await readFile(join(root, "sw.js"), "utf8");
  assert.match(sw, /new Request\(url, \{ cache: "reload" \}\)/);
  assert.doesNotMatch(sw, /CACHE = "refill-v1"/);
});
