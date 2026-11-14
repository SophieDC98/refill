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

async function open() {
  const context = await browser.newContext();
  await blockFonts(context);
  const page = await context.newPage();
  const errors = watchErrors(page);
  await page.goto(server.url + "/index.html");
  await page.getByText("0 of 8").waitFor();
  return { context, page, errors };
}

const openSettings = (page) => page.locator("#openSettings").click();
const done = (page) => page.locator("#done").click();

test("settings: changing the goal adds bottles to the afternoon", async () => {
  const { context, page, errors } = await open();
  await openSettings(page);
  await page.locator("#goal").fill("10");
  await page.locator("#goal").blur();
  await page.waitForFunction(() => document.querySelector("#afternoon").value === "5");
  await done(page);
  await page.getByText("0 of 10").waitFor();
  assert.equal(await page.locator(".bottle").count(), 10);
  assert.deepEqual(errors, []);
  await context.close();
});

test("settings: out-of-range goal is clamped and shown", async () => {
  const { context, page } = await open();
  await openSettings(page);
  await page.locator("#goal").fill("99");
  await page.locator("#goal").blur();
  await page.waitForFunction(() => document.querySelector("#goal").value === "20");
  await context.close();
});

test("settings: bottle size changes the litres", async () => {
  const { context, page } = await open();
  await page.locator('.bottle[data-i="0"]').click();
  await page.locator('.bottle[data-i="1"]').click();
  await page.getByText("2 of 8").waitFor();
  await openSettings(page);
  await page.locator("#bottleCl").fill("50");
  await page.locator("#bottleCl").blur();
  await done(page);
  await page.getByText("1.0 L").waitFor();
  await context.close();
});

test("settings: lowering the goal keeps the logged bottles", async () => {
  const { context, page } = await open();
  for (let i = 0; i < 9; i++) await page.locator(`.bottle[data-i="${i}"]`).click();
  await page.getByText("9 of 8").waitFor();
  await openSettings(page);
  await page.locator("#goal").fill("6");
  await page.locator("#goal").blur();
  await done(page);
  await page.getByText("9 of 6").waitFor();
  assert.equal(await page.locator(".bottle:not(.ghost)").count(), 9);
  await context.close();
});

test("settings: a reminder switched off stays off after reload", async () => {
  const { context, page, errors } = await open();
  await openSettings(page);
  assert.equal(await page.locator("#dayTotalOn").isChecked(), true);
  await page.locator("#dayTotalOn").uncheck({ force: true });
  await page.reload();
  await openSettings(page);
  assert.equal(await page.locator("#dayTotalOn").isChecked(), false);
  assert.equal(await page.locator("#morningCheckOn").isChecked(), true);
  assert.deepEqual(errors, []);
  await context.close();
});
