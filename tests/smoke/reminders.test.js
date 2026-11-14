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

// Monday 16 Nov 2026. `permission` null removes Notification altogether.
async function open({ at, days = {}, permission = "granted" }) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = watchErrors(page);
  await page.clock.install({ time: at });
  await page.addInitScript(
    ([perm, d]) => {
      window.__shown = [];
      // Without a service worker the app shows notifications through the Notification mock below.
      delete Navigator.prototype.serviceWorker;
      if (perm === null) {
        delete window.Notification;
      } else {
        window.Notification = class {
          static permission = perm;
          static requestPermission() {
            return Promise.resolve(window.Notification.permission);
          }
          constructor(title, options) {
            window.__shown.push(options.body);
          }
        };
      }
      if (!localStorage.getItem("refill")) {
        localStorage.setItem("refill", JSON.stringify({ version: 1, settings: {}, days: d, fired: {} }));
      }
    },
    [permission, days],
  );
  await page.goto(server.url + "/index.html");
  await page.locator("#tracker").waitFor();
  return { context, page, errors };
}

const shown = (page) => page.evaluate(() => window.__shown);

test("reminders: morning check fires once, even after a reload", async () => {
  const { context, page, errors } = await open({ at: new Date(2026, 10, 16, 10, 59), days: { "2026-11-16": 1 } });
  assert.deepEqual(await shown(page), []);
  await page.clock.runFor(90 * 1000);
  assert.deepEqual(await shown(page), ["2 more bottles to stay on track this morning (1 of 3)."]);
  await page.clock.runFor(5 * 60 * 1000);
  await page.reload();
  await page.locator("#tracker").waitFor();
  await page.clock.runFor(60 * 1000);
  assert.deepEqual(await shown(page), []);
  assert.deepEqual(errors, []);
  await context.close();
});

test("reminders: day total at 16:00", async () => {
  const { context, page, errors } = await open({ at: new Date(2026, 10, 16, 15, 59), days: { "2026-11-16": 8 } });
  await page.clock.runFor(90 * 1000);
  assert.deepEqual(await shown(page), ["8 out of 8 bottles 🎉 Goal reached!"]);
  assert.deepEqual(errors, []);
  await context.close();
});

test("reminders: past midnight the tracker moves to the new day", async () => {
  const { context, page, errors } = await open({ at: new Date(2026, 10, 16, 23, 59), days: { "2026-11-16": 3 } });
  await page.getByText("3 of 8").waitFor();
  await page.clock.runFor(90 * 1000);
  await page.getByText("0 of 8").waitFor();
  assert.equal(await page.getByText("Fixing").count(), 0);
  assert.deepEqual(errors, []);
  await context.close();
});

test("reminders: rollover leaves a deliberately fixed past day alone", async () => {
  const { context, page, errors } = await open({ at: new Date(2026, 10, 16, 23, 59), days: { "2026-11-10": 2 } });
  await page.locator('.cell[data-k="2026-11-10"]').click();
  await page.getByText("Fixing").waitFor();
  await page.clock.runFor(90 * 1000);
  await page.getByText("2 of 8").waitFor();
  assert.equal(await page.getByText("Fixing").count(), 1);
  assert.deepEqual(errors, []);
  await context.close();
});

test("notifications: settings text follows the permission", async () => {
  for (const [permission, text] of [
    ["granted", "Notifications are on."],
    ["default", "Notifications are off."],
    ["denied", "Notifications are blocked by Windows or your company. refill can't remind you."],
    [null, "This browser can't show notifications."],
  ]) {
    const { context, page, errors } = await open({ at: new Date(2026, 10, 16, 10, 0), permission });
    await page.locator("#openSettings").click();
    await page.getByText(text).waitFor();
    assert.equal(await page.locator("#enableNotifications").count(), permission === "default" ? 1 : 0);
    assert.deepEqual(errors, []);
    await context.close();
  }
});

test("notifications: Turn on asks permission and updates the row", async () => {
  const { context, page, errors } = await open({ at: new Date(2026, 10, 16, 10, 0), permission: "default" });
  await page.evaluate(() => {
    window.Notification.requestPermission = () => {
      window.Notification.permission = "granted";
      return Promise.resolve("granted");
    };
  });
  await page.locator("#openSettings").click();
  await page.locator("#enableNotifications").click();
  await page.getByText("Notifications are on.").waitFor();
  assert.equal(await page.locator("#enableNotifications").count(), 0);
  assert.deepEqual(errors, []);
  await context.close();
});
