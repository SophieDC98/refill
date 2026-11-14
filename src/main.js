import { load, save } from "./core/storage.js";
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

const state = { ...load(localStorage), view: "today", editing: null };
let today = dateKey(new Date());
const todayKey = () => today;
state.editing = today;
const now = new Date();
state.shown = { year: now.getFullYear(), month: now.getMonth() };

function persist() {
  save(localStorage, state);
}

function onTap(index) {
  const before = countOn(state.days, state.editing);
  state.days = tapBottle(state.days, state.editing, index);
  const after = countOn(state.days, state.editing);
  persist();
  render();
  if (reachedGoal(before, after, goal(state.settings))) burst(windowEl, root.querySelector("#bottles"));
}

function showMonthOf(key) {
  state.shown = { year: Number(key.slice(0, 4)), month: Number(key.slice(5, 7)) - 1 };
}

function onPick(key) {
  state.editing = key;
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

function render() {
  if (state.view === "settings") {
    renderSettings(root, state.settings, notificationState(), {
      onChange: onChangeSettings,
      onDone() { state.view = "today"; render(); },
      onEnableNotifications: askPermission,
    });
    return;
  }
  const key = state.editing;
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
      onBack() { state.editing = todayKey(); showMonthOf(state.editing); render(); },
      onOpenSettings() { state.view = "settings"; render(); },
    },
  );
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
  if (state.editing === previous) state.editing = today;
  if (state.shown.year === Number(previous.slice(0, 4)) && state.shown.month === Number(previous.slice(5, 7)) - 1) {
    showMonthOf(today);
  }
  if (state.view === "today") render(); // settings are redrawn when Sophie taps Done
}

function tick() {
  const now = new Date();
  if (dateKey(now) !== today) rollOver(dateKey(now));
  const { due, fired } = dueReminders(now, state.settings, countOn(state.days, today), state.fired);
  for (const { message } of due) showReminder(message);
  if (JSON.stringify(fired) !== JSON.stringify(state.fired)) {
    state.fired = fired;
    persist();
  }
}

setInterval(tick, 30 * 1000);
document.addEventListener("visibilitychange", tick);
tick();
