import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { startServer } from "./serve.js";
import { blockFonts, watchErrors } from "./offline.js";

const { chromium } = createRequire(import.meta.url)("playwright");

let server, browser;
before(async () => {
  server = await startServer(fileURLToPath(new URL("../..", import.meta.url)));
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  await server?.close();
});

test("storage blocked by the browser: the app still works and says it cannot save", async () => {
  const context = await browser.newContext();
  await blockFonts(context);
  await context.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() { throw new DOMException("The operation is insecure.", "SecurityError"); },
    });
  });
  const page = await context.newPage();
  const errors = watchErrors(page);
  await page.goto(server.url + "/index.html");
  await page.getByText("0 of 8").waitFor();
  assert.equal(await page.locator(".bottle").count(), 8);
  await page.locator('.bottle[data-i="0"]').click();
  await page.getByText("1 of 8").waitFor();
  await page.getByText("Can't save on this browser").waitFor();
  assert.deepEqual(errors, []);
  await context.close();
});

test("two open copies follow each other instead of overwriting", async () => {
  const context = await browser.newContext();
  await blockFonts(context);
  const a = await context.newPage();
  const b = await context.newPage();
  const errors = [...watchErrors(a), ...watchErrors(b)];
  await a.goto(server.url + "/index.html");
  await b.goto(server.url + "/index.html");
  await a.getByText("0 of 8").waitFor();
  await b.getByText("0 of 8").waitFor();

  await a.locator('.bottle[data-i="0"]').click();
  await a.getByText("1 of 8").waitFor();
  await b.getByText("1 of 8").waitFor();

  await b.locator('.bottle[data-i="1"]').click();
  await b.getByText("2 of 8").waitFor();
  await a.getByText("2 of 8").waitFor();
  assert.deepEqual(errors, []);
  await context.close();
});
