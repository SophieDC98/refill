import { goal } from "./settings.js";
import { dateKey } from "./days.js";

const WINDOW_MS = 60 * 60 * 1000;

const isDue = (now, { on, time }) => {
  if (!on) return false;
  const [h, m] = time.split(":").map(Number);
  const elapsed = now - new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  return elapsed >= 0 && elapsed < WINDOW_MS;
};

export function dueReminders(now, settings, count, fired) {
  const day = now.getDay();
  if (day === 0 || day === 6) return { due: [], fired };

  const today = dateKey(now);
  const flags = fired.date === today ? fired : { morningCheck: false, dayTotal: false };
  const next = { date: today, morningCheck: flags.morningCheck, dayTotal: flags.dayTotal };
  const due = [];

  if (!next.morningCheck && isDue(now, settings.morningCheck)) {
    next.morningCheck = true;
    const { morning } = settings.parts;
    const left = morning - count;
    if (left > 0) {
      due.push({
        id: "morningCheck",
        message: `${left} more bottle${left === 1 ? "" : "s"} to stay on track this morning (${count} of ${morning}).`,
      });
    }
  }

  if (!next.dayTotal && isDue(now, settings.dayTotal)) {
    next.dayTotal = true;
    const target = goal(settings);
    due.push({
      id: "dayTotal",
      message: count >= target
        ? `${count} out of ${target} bottles 🎉 Goal reached!`
        : `You drank ${count} out of ${target} bottles.`,
    });
  }

  return { due, fired: next };
}
