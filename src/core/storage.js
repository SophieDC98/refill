import { DEFAULT_SETTINGS } from "./settings.js";

export const STORAGE_KEY = "refill";
export const VERSION = 1;

const emptyFired = () => ({ date: null, morningCheck: false, dayTotal: false });

const defaults = () => ({
  settings: structuredClone(DEFAULT_SETTINGS),
  days: {},
  fired: emptyFired(),
});

const isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);

function mergeSettings(stored) {
  const s = isObject(stored) ? stored : {};
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    parts: { ...DEFAULT_SETTINGS.parts, ...s.parts },
    morningCheck: { ...DEFAULT_SETTINGS.morningCheck, ...s.morningCheck },
    dayTotal: { ...DEFAULT_SETTINGS.dayTotal, ...s.dayTotal },
  };
}

export function load(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return defaults();
    const data = JSON.parse(raw);
    if (!isObject(data) || data.version !== VERSION) return defaults();
    return {
      settings: mergeSettings(data.settings),
      days: isObject(data.days) ? data.days : {},
      fired: isObject(data.fired) ? { ...emptyFired(), ...data.fired } : emptyFired(),
    };
  } catch {
    return defaults();
  }
}

export function save(storage, { settings, days, fired }) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, settings, days, fired }));
    return true;
  } catch {
    return false;
  }
}
