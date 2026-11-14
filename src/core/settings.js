export const DEFAULT_SETTINGS = {
  parts: { morning: 3, lunch: 2, afternoon: 3 },
  bottleCl: 20,
  morningCheck: { on: true, time: "11:00" },
  dayTotal: { on: true, time: "16:00" },
};

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export function goal(settings) {
  const { morning, lunch, afternoon } = settings.parts;
  return morning + lunch + afternoon;
}

export function withGoal(settings, n) {
  let excess = goal(settings) - clamp(n, 1, 20);
  const parts = { ...settings.parts };
  if (excess < 0) {
    parts.afternoon -= excess;
  } else {
    for (const part of ["afternoon", "lunch", "morning"]) {
      const take = Math.min(parts[part], excess);
      parts[part] -= take;
      excess -= take;
    }
  }
  return { ...settings, parts };
}

export function withPart(settings, part, n) {
  const others = goal(settings) - settings.parts[part];
  const parts = { ...settings.parts, [part]: clamp(n, 0, Math.max(0, Math.min(10, 20 - others))) };
  const next = { ...settings, parts };
  return goal(next) === 0 ? settings : next;
}

export function withBottleCl(settings, cl) {
  return { ...settings, bottleCl: clamp(cl, 5, 150) };
}
