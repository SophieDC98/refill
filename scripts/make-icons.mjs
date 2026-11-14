// Renders the app icons: node scripts/make-icons.mjs (run once; the PNGs are committed).
// The icon is the pixel bottle tipped diagonally across a rounded water-blue tile,
// so it fills the square and stays readable at taskbar size.
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { bottlePixels } from "../src/ui/pixels.js";

const { chromium } = createRequire(import.meta.url)("playwright");
const out = fileURLToPath(new URL("../icons/", import.meta.url));
await mkdir(out, { recursive: true });

const TILE = "#5aa2ec";
// The light palette from styles.css, with a navy outline and cap that read on the blue tile.
const PALETTE = {
  out: "#0f1a3d", cap: "#0f1a3d", capd: "#2a3d80", glass: "#f1f6fb", glasshi: "#ffffff",
  water: "#a9d4f5", watertop: "#d2eafb", waterhi: "#e3f2fd", lab: "#ffffff", labd: "#283c86",
};

const browser = await chromium.launch();
for (const size of [192, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<!doctype html><style>html,body{margin:0;background:transparent}</style><canvas width="${size}" height="${size}"></canvas>`);
  await page.evaluate(({ size, pixels, palette, tile }) => {
    const ctx = document.querySelector("canvas").getContext("2d");
    ctx.fillStyle = tile;
    ctx.beginPath(); ctx.roundRect(0, 0, size, size, size * 0.2); ctx.fill();
    const { width, height, cells } = pixels;
    const s = (size * 0.98) / height;
    ctx.translate(size / 2, size / 2);
    ctx.rotate(Math.PI / 4);
    for (const [x, y, c] of cells) {
      ctx.fillStyle = palette[c];
      ctx.fillRect(-width * s / 2 + x * s, -height * s / 2 + y * s, s + 0.5, s + 0.5);
    }
  }, { size, pixels: bottlePixels(true), palette: PALETTE, tile: TILE });
  await page.locator("canvas").screenshot({ path: `${out}icon-${size}.png`, omitBackground: true });
  await page.close();
}
await browser.close();
