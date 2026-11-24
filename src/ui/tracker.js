import { goal } from "../core/settings.js";
import { slots, litres, daysAtGoalText } from "../core/days.js";
import { bottleSVG, starSVG } from "./pixels.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayLabel(key) {
  const d = new Date(`${key}T00:00:00`);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function bottleHTML(i, full, goalCount) {
  const extra = i >= goalCount;
  const ghost = extra && !full;
  const action = full ? "logged. Tap to undo" : extra ? "extra bottle. Tap to log" : "not yet. Tap to log";
  return `<button type="button" class="bottle${ghost ? " ghost" : ""}" data-i="${i}" aria-label="Bottle ${i + 1}, ${action}">${bottleSVG(full)}</button>`;
}

export function renderTracker(root, { key, isToday, count, settings, daysAtGoal }, { onTap, onBack, onOpenSettings }) {
  const g = goal(settings);
  const { morning, lunch, afternoon } = settings.parts;
  const groups = [
    ["morning", 0, morning],
    ["lunch", morning, morning + lunch],
    ["afternoon", morning + lunch, g],
    ["extra", g, slots(count, g)],
  ].filter(([, from, to]) => to > from);

  const bottles = groups
    .map(([label, from, to]) => {
      let row = "";
      for (let i = from; i < to; i++) row += bottleHTML(i, i < count, g);
      return `<div class="group"><div class="row">${row}</div><span class="lbl">${label}</span></div>`;
    })
    .join("");

  const label = dayLabel(key);
  const daybar = isToday
    ? `<div class="daybar"><span>Today, ${label}</span><span>${count >= g ? "Goal reached 🎉" : `${g - count} to go`}</span></div>`
    : `<div class="daybar fixing"><span>Fixing <strong>${label}</strong></span><button type="button" class="linkbtn" id="backToday">Back to today</button></div>`;

  root.innerHTML =
    `<div class="head"><h2>Refill</h2><button type="button" class="iconbtn" id="openSettings">&#9881; Settings</button></div>` +
    daybar +
    `<div class="bottles" id="bottles">${bottles}</div>` +
    `<div class="total"><span class="big">${count} of ${g}</span><span class="sub">${litres(count, settings.bottleCl).toFixed(1)} L · ${settings.bottleCl}cl bottles</span>` +
    `<span class="at-goal">${starSVG()}${daysAtGoalText(daysAtGoal)}</span></div>`;

  root.querySelector("#openSettings").onclick = onOpenSettings;
  const back = root.querySelector("#backToday");
  if (back) back.onclick = onBack;
  root.querySelector("#bottles").onclick = (e) => {
    const button = e.target.closest(".bottle");
    if (!button) return;
    const i = Number(button.dataset.i);
    onTap(i);
    // The tracker is redrawn on every tap; keep keyboard focus on the same spot.
    (root.querySelector(`.bottle[data-i="${i}"]`) ?? root.querySelector(".bottle"))?.focus();
  };
}
