import { shade, countOn, litres } from "../core/days.js";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const monthIndex = (year, month) => year * 12 + month;
const keyOf = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

function earliestMonth(days, todayKey) {
  const logged = Object.keys(days).filter((k) => days[k] > 0).sort();
  const key = logged[0] ?? todayKey;
  return monthIndex(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1);
}

export function renderCalendar(root, { year, month, days, todayKey, selectedKey, bottleCl }, { onPick, onMonth }) {
  const todayMonth = monthIndex(Number(todayKey.slice(0, 4)), Number(todayKey.slice(5, 7)) - 1);
  const shown = monthIndex(year, month);
  const canPrev = shown > earliestMonth(days, todayKey);
  const canNext = shown < todayMonth;

  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const last = new Date(year, month + 1, 0).getDate();
  let cells = DOW.map((x) => `<span class="dow">${x}</span>`).join("");
  cells += '<span class="cell blank" aria-hidden="true"></span>'.repeat(lead);
  for (let d = 1; d <= last; d++) {
    const key = keyOf(year, month, d);
    if (key > todayKey) {
      cells += `<span class="cell future">${d}</span>`;
      continue;
    }
    const n = countOn(days, key);
    const current = key === todayKey ? ' aria-current="date"' : "";
    const cls = `cell s${shade(n, bottleCl)}${key === todayKey ? " today" : ""}${key === selectedKey && key !== todayKey ? " sel" : ""}`;
    const label = `${d} ${MONTHS[month].slice(0, 3)}: ${n} ${n === 1 ? "bottle" : "bottles"}, ${litres(n, bottleCl).toFixed(1)} L`;
    cells += `<button type="button" class="${cls}" data-k="${key}"${current} aria-label="${label}">${d}</button>`;
  }

  root.innerHTML =
    `<section class="cal" aria-label="History">` +
    `<div class="calhead"><h3>${MONTHS[month]} ${year}</h3><div class="calnav">` +
    `<button type="button" class="prev" aria-label="Previous month"${canPrev ? "" : " disabled"}>&#8249;</button>` +
    `<button type="button" class="next" aria-label="Next month"${canNext ? "" : " disabled"}>&#8250;</button></div></div>` +
    `<div class="grid">${cells}</div>` +
    `<div class="legend"><span>0 L</span><span class="sw">${[0, 1, 2, 3, 4].map((i) => `<i style="background:var(--shade-${i})"></i>`).join("")}</span>` +
    `<span>2 L+</span><span class="hint">Tap a day to fix it</span></div></section>`;

  const focusAfter = (selector) => root.querySelector(selector)?.focus();
  // The calendar is redrawn on every click; keep focus on the arrow pressed, or the other one if it became disabled.
  const focusArrow = (pressed, other) => {
    const el = root.querySelector(pressed);
    (el && !el.disabled ? el : root.querySelector(other))?.focus();
  };
  root.querySelector(".prev").onclick = () => { onMonth(-1); focusArrow(".prev", ".next"); };
  root.querySelector(".next").onclick = () => { onMonth(1); focusArrow(".next", ".prev"); };
  root.querySelector(".grid").onclick = (e) => {
    const button = e.target.closest(".cell[data-k]");
    if (!button) return;
    const key = button.dataset.k;
    onPick(key);
    // The calendar is redrawn on every pick; keep keyboard focus on the same day if it is still shown.
    focusAfter(`.cell[data-k="${key}"]`);
  };
}
