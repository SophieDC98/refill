export function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function countOn(days, key) {
  return days[key] ?? 0;
}

export function tapBottle(days, key, index) {
  const count = countOn(days, key);
  return { ...days, [key]: index < count ? count - 1 : count + 1 };
}

export function slots(count, goal) {
  return Math.max(goal, count) + (count >= goal ? 1 : 0);
}

export function litres(count, bottleCl) {
  return (count * bottleCl) / 100;
}

export function shade(count, bottleCl) {
  const cl = count * bottleCl;
  if (cl === 0) return 0;
  if (cl <= 60) return 1;
  if (cl <= 120) return 2;
  if (cl < 200) return 3;
  return 4;
}

export function reachedGoal(before, after, goal) {
  return before < goal && after >= goal;
}

// How many days ever reached the goal, weekends included. Measured against the
// current goal, since days don't store their own.
export function daysAtGoal(days, goal) {
  return Object.values(days).filter((n) => n >= goal).length;
}

export function daysAtGoalText(n) {
  if (n === 0) return "Not fully refilled yet";
  return `${n} ${n === 1 ? "day" : "days"} fully refilled`;
}
