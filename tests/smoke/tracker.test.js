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

test("tracker: counts the days at goal, and today joins when the goal is reached", async () => {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    const days = { "2026-01-05": 8, "2026-01-06": 3, "2026-01-10": 9 };
    localStorage.setItem("refill", JSON.stringify({ version: 1, days }));
  });
  const page = await context.newPage();
  const errors = watchErrors(page);
  await page.goto(server.url + "/index.html");
  await page.getByText("2 days fully refilled").waitFor();
  for (let i = 0; i < 8; i++) await page.locator('.bottle[data-i="7"]').click();
  await page.getByText("3 days fully refilled").waitFor();
  await page.locator('.bottle[data-i="0"]').click();
  await page.getByText("2 days fully refilled").waitFor();
  assert.deepEqual(errors, []);
  await context.close();
});

test("tracker: with no days at goal yet, it says so (Not fully refilled yet)", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = watchErrors(page);
  await page.goto(server.url + "/index.html");
  await page.getByText("Not fully refilled yet").waitFor();
  assert.deepEqual(errors, []);
  await context.close();
});
