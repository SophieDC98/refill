// Takes the README screenshots: node scripts/readme-shots.mjs (the PNGs are committed).
// Uses a fixed day (Wednesday 18 November 2026, 14:30) and made-up example history.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { startServer } from "../tests/smoke/serve.js";

const { chromium } = createRequire(import.meta.url)("playwright");
const root = fileURLToPath(new URL("..", import.meta.url));
const out = (name) => fileURLToPath(new URL(`../docs/images/${name}`, import.meta.url));
const NOW = new Date(2026, 10, 18, 14, 30);

// Example history from 1 September to yesterday: mostly 6 to 9 bottles on work days,
// a few light days, and the odd weekend bottle. Seeded, so every run looks the same.
function exampleDays() {
  const days = {};
  let seed = 11;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (const d = new Date(2026, 8, 1); d < new Date(2026, 10, 18); d.setDate(d.getDate() + 1)) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const r = rnd();
    const n = weekend ? (r < 0.3 ? 1 + Math.floor(rnd() * 2) : 0) : r < 0.08 ? 0 : r < 0.25 ? 3 + Math.floor(rnd() * 3) : r < 0.85 ? 6 + Math.floor(rnd() * 3) : 9 + Math.floor(rnd() * 2);
    if (n) days[key] = n;
  }
  days["2026-11-18"] = 5;
  return days;
}

const state = {
  version: 1,
  settings: { parts: { morning: 3, lunch: 2, afternoon: 3 }, bottleCl: 20, morningCheck: { on: true, time: "11:00" }, dayTotal: { on: true, time: "16:00" } },
  days: exampleDays(),
  fired: { date: "2026-11-18", morningCheck: true, dayTotal: false },
};

const server = await startServer(root);
const browser = await chromium.launch();

async function open(colorScheme) {
  const context = await browser.newContext({ viewport: { width: 400, height: 900 }, deviceScaleFactor: 2, colorScheme, locale: "en-GB", serviceWorkers: "block" });
  await context.addInitScript((s) => localStorage.setItem("refill", JSON.stringify(s)), state);
  // Show settings as they look once notifications are allowed (headless browsers deny them).
  await context.addInitScript(() => {
    window.Notification = class { static permission = "granted"; static requestPermission() { return Promise.resolve("granted"); } };
  });
  const page = await context.newPage();
  await page.clock.install({ time: NOW });
  await page.goto(server.url + "/");
  await page.locator(".bottle").first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  return { context, page };
}

for (const scheme of ["light", "dark"]) {
  const { context, page } = await open(scheme);
  await page.locator("#window").screenshot({ path: out(`app-${scheme}.png`) });
  await context.close();
}

{
  const { context, page } = await open("light");
  // Log the last three bottles; the third one reaches the goal and starts the star burst.
  for (let i = 0; i < 3; i++) await page.locator('.bottle[data-i="7"]').click();
  await page.mouse.move(0, 0);
  await page.locator(".burst").waitFor();
  await page.waitForTimeout(250); // stars mid-flight
  await page.locator("#tracker").screenshot({ path: out("goal.png") });
  await page.locator("#calendar").screenshot({ path: out("calendar.png") });
  await context.close();
}

{
  const { context, page } = await open("light");
  await page.locator("#openSettings").click();
  await page.locator("#goal").waitFor();
  await page.locator("#window").screenshot({ path: out("settings.png") });
  await context.close();
}

await browser.close();
await server.close();
