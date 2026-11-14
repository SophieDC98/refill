import { load, save } from "./core/storage.js";
import { dateKey, countOn, tapBottle, reachedGoal } from "./core/days.js";
import { goal } from "./core/settings.js";
import { renderTracker } from "./ui/tracker.js";
import { renderCalendar } from "./ui/calendar.js";
import { renderSettings } from "./ui/settings-view.js";
import { burst } from "./ui/stars.js";

const windowEl = document.getElementById("window");
const root = document.getElementById("app");

const state = { ...load(localStorage), view: "today", editing: null };
const todayKey = () => dateKey(new Date());
state.editing = todayKey();
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
    renderSettings(root, state.settings, "off", {
      onChange: onChangeSettings,
      onDone() { state.view = "today"; render(); },
      onEnableNotifications() {},
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
