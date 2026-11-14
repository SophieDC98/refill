import { goal, withGoal, withPart, withBottleCl } from "../core/settings.js";

const field = (id, label, value, min, max) =>
  `<label class="field" for="${id}">${label}<input type="number" id="${id}" value="${value}" min="${min}" max="${max}"></label>`;

const reminder = (id, title, sub, { on }) =>
  `<div class="rem"><div class="what"><strong>${title}</strong><span>${sub}</span></div>` +
  `<input type="time" id="${id}Time" aria-label="${title} time">` +
  `<label class="switch"><input type="checkbox" id="${id}On"${on ? " checked" : ""} aria-label="${title} on or off"><span></span></label></div>`;

const NOTIF_TEXT = {
  on: "Notifications are on.",
  off: "Notifications are off.",
  blocked: "Notifications are blocked by Windows or your company. refill can't remind you.",
  unsupported: "This browser can't show notifications.",
};

export function renderSettings(root, settings, notifState, { onChange, onDone, onEnableNotifications }) {
  const { morning, lunch, afternoon } = settings.parts;
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
    `<div id="notif"></div>` +
    `</fieldset></div>`;

  // Fields are updated in place after a change (not rebuilt), so keyboard focus stays put.
  let current = settings;
  const show = () => {
    const { morning, lunch, afternoon } = current.parts;
    const values = {
      morning, lunch, afternoon, goal: goal(current), bottleCl: current.bottleCl,
      morningCheckTime: current.morningCheck.time, dayTotalTime: current.dayTotal.time,
    };
    for (const [id, v] of Object.entries(values)) root.querySelector(`#${id}`).value = v;
    root.querySelector("#morningCheckOn").checked = current.morningCheck.on;
    root.querySelector("#dayTotalOn").checked = current.dayTotal.on;
  };
  show();
  const edit = (id, apply) => {
    root.querySelector(`#${id}`).onchange = (e) => {
      current = apply(e.target);
      onChange(current);
      show();
    };
  };
  const num = (input) => Math.round(Number(input.value) || 0);
  for (const part of ["morning", "lunch", "afternoon"]) edit(part, (el) => withPart(current, part, num(el)));
  edit("goal", (el) => withGoal(current, num(el)));
  edit("bottleCl", (el) => withBottleCl(current, num(el)));
  for (const key of ["morningCheck", "dayTotal"]) {
    edit(`${key}On`, (el) => ({ ...current, [key]: { ...current[key], on: el.checked } }));
    // An emptied time keeps the previous time.
    edit(`${key}Time`, (el) =>
      el.value ? { ...current, [key]: { ...current[key], time: el.value } } : current,
    );
  }

  root.querySelector("#done").onclick = onDone;

  // The notifications row is updated in place, like the fields above.
  const showNotif = (state) => {
    const text = NOTIF_TEXT[state] ?? NOTIF_TEXT.unsupported;
    const button = state === "off" ? `<button type="button" class="primary" id="enableNotifications">Turn on</button>` : "";
    root.querySelector("#notif").innerHTML = `<div class="rem"><span class="note">${text}</span>${button}</div>`;
    const enable = root.querySelector("#enableNotifications");
    if (enable) {
      enable.onclick = async () => {
        showNotif(await onEnableNotifications());
        (root.querySelector("#enableNotifications") ?? root.querySelector("#done")).focus();
      };
    }
  };
  showNotif(notifState);
}
