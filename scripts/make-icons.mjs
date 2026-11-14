// Renders the app icons: node scripts/make-icons.mjs (run once; the PNGs are committed).
import { createRequire } from "node:module";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { bottleSVG } from "../src/ui/pixels.js";

const { chromium } = createRequire(import.meta.url)("playwright");
const BACKGROUND = "#eef3f8"; // --bg in styles.css
const out = fileURLToPath(new URL("../icons/", import.meta.url));
await mkdir(out, { recursive: true });

// The bottle is coloured by classes from styles.css, so the page loads it.
const appCss = await readFile(new URL("../styles.css", import.meta.url), "utf8");

const browser = await chromium.launch();
for (const size of [192, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<!doctype html><style>${appCss}
    html, body { margin: 0; height: 100%; background: ${BACKGROUND}; }
    body { display: flex; align-items: center; justify-content: center; }
    svg { height: 78%; width: auto; shape-rendering: crispEdges; }
  </style>${bottleSVG(true)}`);
  await page.screenshot({ path: `${out}icon-${size}.png` });
  await page.close();
}
await browser.close();
