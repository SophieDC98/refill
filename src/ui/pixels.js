// Pixel art, drawn as SVG rects so it stays crisp at any size.

const BW = 14;
const BH = 32;
const WATER_FROM = 9;
// Left edge of the glass outline per row; the right edge mirrors it.
const EDGE = { 3: 4, 4: 4, 5: 5, 6: 5, 7: 5, 8: 4, 9: 4, 10: 4, 11: 3, 12: 3, 13: 3, 14: 3 };
const edge = (y) => EDGE[y] ?? (y >= 15 && y <= 30 ? 2 : null);

function px(x, y, full) {
  if (y === 0) return x >= 4 && x <= 9 ? "cap" : null;
  if (y === 1) return x >= 3 && x <= 10 ? "cap" : null;
  if (y === 2) return x >= 3 && x <= 10 ? (x % 2 ? "capd" : "cap") : null;
  if (y === 31) return x >= 3 && x <= 10 ? "out" : null;
  const left = edge(y);
  if (left === null) return null;
  const right = BW - 1 - left;
  if (x < left || x > right) return null;
  if (x === left || x === right) return "out";
  if (y === 12 && x >= 5 && x <= 8) return "labd";
  if (y === 13 && x >= 4 && x <= 9) return "labd";
  if (y === 14 && x >= 5 && x <= 8) return "labd";
  if (y === 21 || y === 28) return "labd";
  if (y === 22 || y === 27) return "lab";
  if (y >= 23 && y <= 26) return "labd";
  const wet = full && y >= WATER_FROM;
  if (x === left + 1 && y >= 4) return wet ? "waterhi" : "glasshi";
  if (full && y === WATER_FROM) return "watertop";
  return wet ? "water" : "glass";
}

// The bottle as a list of [x, y, colour] cells, for drawing it somewhere other than SVG (the app icons).
export function bottlePixels(full) {
  const cells = [];
  for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
    const c = px(x, y, full);
    if (c) cells.push([x, y, c]);
  }
  return { width: BW, height: BH, cells };
}

export function bottleSVG(full) {
  let rects = "";
  for (let y = 0; y < BH; y++) {
    let x = 0;
    while (x < BW) {
      const c = px(x, y, full);
      if (!c) { x++; continue; }
      let w = 1;
      while (x + w < BW && px(x + w, y, full) === c) w++;
      rects += `<rect class="p-${c}" x="${x}" y="${y}" width="${w}" height="1"/>`;
      x += w;
    }
  }
  return `<svg viewBox="0 0 ${BW} ${BH}" aria-hidden="true">${rects}</svg>`;
}

const STAR = ["...s...", "...s...", "sssSsss", ".sSSSs.", "..sss..", ".ss.ss.", "s.....s"];

export function starSVG() {
  const rects = STAR.map((row, y) =>
    [...row]
      .map((c, x) => (c === "." ? "" : `<rect class="p-${c === "S" ? "stard" : "star"}" x="${x}" y="${y}" width="1" height="1"/>`))
      .join(""),
  ).join("");
  return `<svg viewBox="0 0 7 7" aria-hidden="true">${rects}</svg>`;
}
