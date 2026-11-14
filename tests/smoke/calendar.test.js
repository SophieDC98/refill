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

// "Today" is Wednesday 18 Nov 2026; days are seeded relative to it.
async function open(days) {
  const context = await browser.newContext();
  await blockFonts(context);
  const page = await context.newPage();
  const errors = watchErrors(page);
  await page.clock.setFixedTime(new Date(2026, 10, 18, 10, 0));
  const settings = { bottleCl: 20 };
  await page.addInitScript(
    ([s, d]) => {
      if (!localStorage.getItem("refill")) {
        localStorage.setItem("refill", JSON.stringify({ version: 1, settings: s, days: d, fired: {} }));
      }
    },
    [settings, days],
  );
  await page.goto(server.url + "/index.html");
  await page.locator(".cal").waitFor();
  return { context, page, errors };
}

const cell = (page, key) => page.locator(`.cell[data-k="${key}"]`);

test("calendar: shades, weekends, future days, month navigation", async () => {
  const { context, page, errors } = await open({
    "2026-11-02": 6, // Monday, 120cl
    "2026-11-07": 10, // Saturday, 200cl
    "2026-11-08": 1, // Sunday
    "2026-10-20": 3,
  });
  assert.match(await cell(page, "2026-11-02").getAttribute("class"), /\bs2\b/);
  assert.match(await cell(page, "2026-11-07").getAttribute("class"), /\bs4\b/);
  assert.match(await cell(page, "2026-11-03").getAttribute("class"), /\bs0\b/);
  assert.deepEqual(await page.locator(".grid .dow").allTextContents(), ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]);
  assert.equal(await cell(page, "2026-11-08").isEnabled(), true);
  assert.equal(await page.locator(".cell.future").count(), 12);
  assert.equal(await page.locator(".cell.future[data-k]").count(), 0);
  assert.equal(await page.locator(".calnav .next").isDisabled(), true);
  await page.getByText("Tap a day to fix it").waitFor();

  await page.locator(".calnav .prev").click();
  await page.getByText("October 2026").waitFor();
  assert.equal(await cell(page, "2026-10-20").count(), 1);
  assert.equal(await page.locator(".calnav .prev").isDisabled(), true); // earliest logged day is in October
  await page.locator(".calnav .next").click();
  await page.getByText("November 2026").waitFor();
  assert.deepEqual(errors, []);
  await context.close();
});

test("calendar: previous month is disabled on the current month when nothing is logged", async () => {
  const { context, page, errors } = await open({});
  assert.equal(await page.locator(".calnav .prev").isDisabled(), true);
  assert.equal(await page.locator(".calnav .next").isDisabled(), true);
  assert.deepEqual(errors, []);
  await context.close();
});

test("calendar: fixing a day changes only that day, back returns to today", async () => {
  const { context, page, errors } = await open({ "2026-11-07": 2, "2026-11-18": 1 });
  await cell(page, "2026-11-07").click();
  await page.getByText("Fixing").waitFor();
  await page.getByText("2 of 8").waitFor();
  await page.locator('.bottle[data-i="2"]').click();
  await page.getByText("3 of 8").waitFor();
  assert.match(await cell(page, "2026-11-07").getAttribute("class"), /\bs1\b/);
  assert.equal(await cell(page, "2026-11-07").getAttribute("aria-label"), "7 Nov: 3 bottles, 0.6 L");
  assert.match(await cell(page, "2026-11-07").getAttribute("class"), /\bsel\b/);

  await page.getByRole("button", { name: "Back to today" }).click();
  await page.getByText("1 of 8").waitFor();
  assert.equal(await cell(page, "2026-11-18").getAttribute("aria-label"), "18 Nov: 1 bottle, 0.2 L");

  await cell(page, "2026-11-07").click();
  await page.getByText("Fixing").waitFor();
  await cell(page, "2026-11-18").click(); // picking today returns to today
  await page.getByText("Today,").waitFor();
  assert.deepEqual(errors, []);
  await context.close();
});

test("calendar: focus stays on the arrow pressed; today is marked; focused cells have a ring", async () => {
  const { context, page, errors } = await open({ "2026-09-10": 1, "2026-11-02": 1 });
  const active = () => page.evaluate(() => document.activeElement.className);
  await page.locator(".calnav .prev").click();
  await page.getByText("October 2026").waitFor();
  assert.equal(await active(), "prev");
  await page.locator(".calnav .next").click();
  await page.getByText("November 2026").waitFor();
  // › is now disabled on the current month, so focus moves to ‹
  assert.equal(await active(), "prev");
  await page.locator(".calnav .prev").click();
  await page.locator(".calnav .prev").click();
  await page.getByText("September 2026").waitFor();
  await page.locator(".calnav .next").click();
  await page.getByText("October 2026").waitFor();
  assert.equal(await active(), "next");

  await page.locator(".calnav .next").click();
  assert.equal(await page.locator('.cell[aria-current="date"]').getAttribute("data-k"), "2026-11-18");
  await page.keyboard.press("Tab");
  await page.locator('.cell[data-k="2026-11-18"]').focus();
  const outline = await page.locator('.cell[data-k="2026-11-18"]').evaluate((el) => getComputedStyle(el).outlineWidth);
  assert.equal(outline, "3px");
  assert.deepEqual(errors, []);
  await context.close();
});
