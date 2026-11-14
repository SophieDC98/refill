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

test("storage blocked by the browser: the app still works and says it cannot save", async () => {
  const context = await browser.newContext();
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

test("settings open in one copy follow a change saved by the other", async () => {
  const context = await browser.newContext();
  const a = await context.newPage();
  const b = await context.newPage();
  const errors = [...watchErrors(a), ...watchErrors(b)];
  await a.goto(server.url + "/index.html");
  await b.goto(server.url + "/index.html");
  await a.getByText("0 of 8").waitFor();
  await b.getByText("0 of 8").waitFor();

  await a.getByRole("button", { name: /Settings/ }).click();
  await a.locator("#bottleCl").waitFor();
  await b.getByRole("button", { name: /Settings/ }).click();
  await b.locator("#bottleCl").fill("33");
  await b.locator("#bottleCl").dispatchEvent("change");

  await a.waitForFunction(() => document.querySelector("#bottleCl").value === "33");
  // an edit here keeps the other copy's change
  await a.locator("#lunch").fill("3");
  await a.locator("#lunch").dispatchEvent("change");
  await a.getByRole("button", { name: "Done" }).click();
  await a.getByText("33cl bottles").waitFor();
  assert.deepEqual(errors, []);
  await context.close();
});

test("a stable live region announces the total", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = watchErrors(page);
  await page.goto(server.url + "/index.html");
  await page.getByText("0 of 8").waitFor();
  await page.locator('.bottle[data-i="0"]').click();
  await page.waitForFunction(() => document.querySelector('[aria-live="polite"]')?.textContent === "1 bottle logged, goal 8");
  assert.equal(await page.locator('#tracker [aria-live]').count(), 0);
  assert.deepEqual(errors, []);
  await context.close();
});
