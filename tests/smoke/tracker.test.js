import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { startServer } from "./serve.js";
import { watchErrors } from "./offline.js";

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

test("tracker: log, undo, reach the goal, keep it after reload", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = watchErrors(page);

  await page.goto(server.url + "/index.html");
  await page.getByText("0 of 8").waitFor();
  assert.equal(await page.locator(".bottle").count(), 8);

  await page.locator('.bottle[data-i="5"]').click();
  await page.getByText("1 of 8").waitFor();

  await page.locator('.bottle[data-i="0"]').click();
  await page.getByText("0 of 8").waitFor();

  for (let i = 0; i < 8; i++) await page.locator(`.bottle[data-i="${i}"]`).click();
  await page.waitForSelector(".burst");
  await page.getByText("8 of 8").waitFor();
  await page.getByText("Goal reached").waitFor();
  assert.equal(await page.locator(".bottle").count(), 9);

  await page.reload();
  await page.getByText("8 of 8").waitFor();
  assert.deepEqual(errors, []);
  await context.close();
});
