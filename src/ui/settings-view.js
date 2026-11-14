import { goal, withGoal, withPart, withBottleCl } from "../core/settings.js";

const field = (id, label, value, min, max) =>
  `<label class="field" for="${id}">${label}<input type="number" id="${id}" value="${value}" min="${min}" max="${max}"></label>`;

const reminder = (id, title, sub, { on, time }) =>
  `<div class="rem"><div class="what"><strong>${title}</strong><span>${sub}</span></div>` +
  `<input type="time" id="${id}Time" value="${time}" aria-label="${title} time">` +
  `<label class="switch"><input type="checkbox" id="${id}On"${on ? " checked" : ""} aria-label="${title} on or off"><span></span></label></div>`;

export function renderSettings(root, settings, notifState, { onChange, onDone, onEnableNotifications }) {
  const { morning, lunch, afternoon } = settings.parts;
  const notif =
    notifState === "off"
      ? `<div class="rem"><span class="note">Notifications are off.</span><button type="button" class="primary" id="enableNotifications">Turn on</button></div>`
      : "";

  root.innerHTML =
    `<div class="head"><h2>Settings</h2><button type="button" class="iconbtn" id="done">Done</button></div>` +
    `<div class="settings">` +
    `<fieldset><legend>Your day</legend><div class="fields3">` +
    field("morning", "Morning", morning, 0, 10) +
    field("lunch", "Lunch", lunch, 0, 10) +
    field("afternoon", "Afternoon", afternoon, 0, 10) +
    `</div><div class="fields2">` +
    field("goal", "Daily goal", goal(settings), 1, 20) +
    field("bottleCl", "Bottle size (cl)", settings.bottleCl, 5, 150) +
    `</div><p class="note">The goal is morning + lunch + afternoon. Changing the goal adds or removes bottles in the afternoon.</p></fieldset>` +
    `<fieldset><legend>Reminders · Mon–Fri</legend>` +
    reminder("morningCheck", "Morning check", "Only when you're behind on the morning", settings.morningCheck) +
    reminder("dayTotal", "Day total", "How many of your goal you drank", settings.dayTotal) +
    notif +
    `</fieldset></div>`;

  // Each change re-renders so the fields show the clamped settings.
  const edit = (id, apply) => {
    root.querySelector(`#${id}`).onchange = (e) => onChange(apply(e.target));
  };
  const num = (input) => Math.round(Number(input.value) || 0);
  for (const part of ["morning", "lunch", "afternoon"]) edit(part, (el) => withPart(settings, part, num(el)));
  edit("goal", (el) => withGoal(settings, num(el)));
  edit("bottleCl", (el) => withBottleCl(settings, num(el)));
  for (const key of ["morningCheck", "dayTotal"]) {
    edit(`${key}On`, (el) => ({ ...settings, [key]: { ...settings[key], on: el.checked } }));
    // An emptied time keeps the previous time.
    edit(`${key}Time`, (el) =>
      el.value ? { ...settings, [key]: { ...settings[key], time: el.value } } : settings,
    );
  }

  root.querySelector("#done").onclick = onDone;
  const enable = root.querySelector("#enableNotifications");
  if (enable) enable.onclick = onEnableNotifications;
}
