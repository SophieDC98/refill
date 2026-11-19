import { load, save, STORAGE_KEY } from "./core/storage.js";
import { dueReminders } from "./core/reminders.js";
import { notificationState, askPermission, showReminder } from "./notify.js";
import { dateKey, countOn, tapBottle, reachedGoal } from "./core/days.js";
import { goal } from "./core/settings.js";
import { renderTracker } from "./ui/tracker.js";
import { renderCalendar } from "./ui/calendar.js";
import { renderSettings } from "./ui/settings-view.js";
import { burst } from "./ui/stars.js";

const windowEl = document.getElementById("window");
const root = document.getElementById("app");

// Some browsers block site data and throw on the localStorage global itself.
// Then the app runs from memory and says so.
function openStorage() {
  try {
    const storage = window.localStorage;
    storage.getItem(STORAGE_KEY);
    return { storage, usable: true };
  } catch {
    const map = new Map();
    return {
      storage: { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)) },
      usable: false,
    };
  }
}
const { storage, usable } = openStorage();

// Ask the browser to keep Refill's data permanently, so it is not deleted when the
// disk runs low. A company setting that clears site data on close still wins.
if (usable) {
  try {
    navigator.storage?.persist?.()?.catch?.(() => {});
  } catch {
    // Not supported: nothing else to do.
  }
}

const notice = document.createElement("p");
notice.className = "storage-notice";
notice.setAttribute("role", "status");
notice.textContent = "Can't save on this browser \u2014 counts will be lost when Refill closes.";
notice.hidden = usable;
windowEl.append(notice);

// A stable live region: the tracker is redrawn on every change, so only this text is updated.
const live = document.createElement("div");
live.className = "sr-only";
live.setAttribute("aria-live", "polite");
windowEl.append(live);

const state = { ...load(storage), view: "today", fixing: null };
let today = dateKey(new Date());
const todayKey = () => today;
state.fixing = today;
const now = new Date();
state.shown = { year: now.getFullYear(), month: now.getMonth() };

function persist() {
  notice.hidden = save(storage, state) && usable;
}

// Another open copy of refill saved: take its data, keep the view and the day being fixed.
function focusTarget() {
  const el = document.activeElement;
  if (!el || !root.contains(el)) return null;
  for (const attr of ["data-i", "data-k", "id", "class"]) {
    const value = el.getAttribute(attr);
    if (value) return attr === "id" ? `#${value}` : attr === "class" ? `.${value.split(" ")[0]}` : `[${attr}="${value}"]`;
  }
  return null;
}

window.addEventListener("storage", (e) => {
  if (e.storageArea !== storage || (e.key !== null && e.key !== STORAGE_KEY)) return;
  Object.assign(state, load(storage));
  if (state.view === "settings") {
    settingsView?.update(state.settings);
    return;
  }
  const target = focusTarget();
  render();
  if (target) root.querySelector(target)?.focus();
});

function onTap(index) {
  const before = countOn(state.days, state.fixing);
  state.days = tapBottle(state.days, state.fixing, index);
  const after = countOn(state.days, state.fixing);
  persist();
  render();
  if (reachedGoal(before, after, goal(state.settings))) burst(windowEl, root.querySelector("#bottles"));
}

function showMonthOf(key) {
  state.shown = { year: Number(key.slice(0, 4)), month: Number(key.slice(5, 7)) - 1 };
}

function onPick(key) {
  state.fixing = key;
  showMonthOf(key);
  render();
}

function onMonth(delta) {
  const d = new Date(state.shown.year, state.shown.month + delta, 1);
  state.shown = { year: d.getFullYear(), month: d.getMonth() };
  render();
}

function onChangeSettings(settings) {
  // The settings view updates its own fields, so it is not redrawn (keeps focus).
  state.settings = settings;
  persist();
}

let settingsView = null;

function render() {
  if (state.view === "settings") {
    settingsView = renderSettings(root, state.settings, notificationState(), {
      onChange: onChangeSettings,
      onDone() { state.view = "today"; render(); },
      onEnableNotifications: askPermission,
    });
    return;
  }
  const key = state.fixing;
  // Tracker and calendar each own a container, so one can be redrawn (and keep focus) without the other.
  let trackerRoot = root.querySelector("#tracker");
  let calendarRoot = root.querySelector("#calendar");
  if (!trackerRoot || !calendarRoot) {
    root.innerHTML = '<div id="tracker" class="part"></div><div id="calendar" class="part"></div>';
    trackerRoot = root.querySelector("#tracker");
    calendarRoot = root.querySelector("#calendar");
  }
  renderTracker(
    trackerRoot,
    { key, isToday: key === todayKey(), count: countOn(state.days, key), settings: state.settings },
    {
      onTap,
      onBack() { state.fixing = todayKey(); showMonthOf(state.fixing); render(); },
      onOpenSettings() { state.view = "settings"; render(); },
    },
  );
  const n = countOn(state.days, key);
  live.textContent = `${n} ${n === 1 ? "bottle" : "bottles"} logged, goal ${goal(state.settings)}`;
  renderCalendar(
    calendarRoot,
    { ...state.shown, days: state.days, todayKey: todayKey(), selectedKey: key, bottleCl: state.settings.bottleCl },
    { onPick, onMonth },
  );
}

render();

function rollOver(newToday) {
  const previous = today;
  today = newToday;
  // Follow the new day only if the tracker was on the old today; keep a past day Sophie is fixing.
  if (state.fixing === previous) state.fixing = today;
  if (state.shown.year === Number(previous.slice(0, 4)) && state.shown.month === Number(previous.slice(5, 7)) - 1) {
    showMonthOf(today);
  }
  if (state.view === "today") render(); // settings are redrawn when Sophie taps Done
}

function tick() {
  const now = new Date();
  if (dateKey(now) !== today) rollOver(dateKey(now));
  const { due, fired } = dueReminders(now, state.settings, countOn(state.days, today), state.fired);
  for (const { id, message } of due) showReminder(message, `${id}-${today}`);
  if (JSON.stringify(fired) !== JSON.stringify(state.fired)) {
    state.fired = fired;
    persist();
  }
}

setInterval(tick, 30 * 1000);
document.addEventListener("visibilitychange", tick);
tick();

// Offline and installable; a failed registration just leaves the app online-only.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
