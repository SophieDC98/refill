import { load, save } from "./core/storage.js";
import { dateKey, countOn, tapBottle, reachedGoal } from "./core/days.js";
import { goal } from "./core/settings.js";
import { renderTracker } from "./ui/tracker.js";
import { burst } from "./ui/stars.js";

const windowEl = document.getElementById("window");
const root = document.getElementById("app");

const state = { ...load(localStorage), view: "today", editing: null };
const todayKey = () => dateKey(new Date());
state.editing = todayKey();

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

function render() {
  const key = state.editing;
  renderTracker(
    root,
    { key, isToday: key === todayKey(), count: countOn(state.days, key), settings: state.settings },
    {
      onTap,
      onBack() { state.editing = todayKey(); render(); },
      onOpenSettings() {},
    },
  );
}

render();
