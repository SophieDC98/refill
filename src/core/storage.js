import { DEFAULT_SETTINGS, goal, withPart, withBottleCl } from "./settings.js";

export const STORAGE_KEY = "refill";
export const VERSION = 1;

const emptyFired = () => ({ date: null, morningCheck: false, dayTotal: false });

const defaults = () => ({
  settings: structuredClone(DEFAULT_SETTINGS),
  days: {},
  fired: emptyFired(),
});

const isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);

const isCount = (v) => Number.isInteger(v) && v >= 0;
const TIME = /^\d\d:\d\d$/;
const DAY = /^\d{4}-\d\d-\d\d$/;

function cleanReminder(stored, fallback) {
  const r = isObject(stored) ? stored : {};
  return {
    on: typeof r.on === "boolean" ? r.on : fallback.on,
    time: typeof r.time === "string" && TIME.test(r.time) ? r.time : fallback.time,
  };
}

// Stored data is not trusted: every field goes through the same rules as the settings view.
function cleanSettings(stored) {
  const s = isObject(stored) ? stored : {};
  const given = isObject(s.parts) ? s.parts : {};
  // Start from no bottles so a stored goal of up to 20 is not clipped by the default parts.
  let clean = { ...DEFAULT_SETTINGS, parts: { morning: 0, lunch: 0, afternoon: 0 } };
  for (const part of ["morning", "lunch", "afternoon"]) {
    if (Number.isFinite(given[part])) clean = withPart(clean, part, Math.round(given[part]));
  }
  if (goal(clean) === 0) clean = { ...clean, parts: { ...DEFAULT_SETTINGS.parts } };
  if (Number.isFinite(s.bottleCl)) clean = withBottleCl(clean, Math.round(s.bottleCl));
  return {
    ...clean,
    morningCheck: cleanReminder(s.morningCheck, DEFAULT_SETTINGS.morningCheck),
    dayTotal: cleanReminder(s.dayTotal, DEFAULT_SETTINGS.dayTotal),
  };
}

function cleanDays(stored) {
  if (!isObject(stored)) return {};
  return Object.fromEntries(Object.entries(stored).filter(([k, v]) => DAY.test(k) && isCount(v)));
}

function cleanFired(stored) {
  const f = isObject(stored) ? stored : {};
  return {
    date: typeof f.date === "string" ? f.date : null,
    morningCheck: f.morningCheck === true,
    dayTotal: f.dayTotal === true,
  };
}

export function load(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return defaults();
    const data = JSON.parse(raw);
    if (!isObject(data) || data.version !== VERSION) return defaults();
    return {
      settings: cleanSettings(data.settings),
      days: cleanDays(data.days),
      fired: cleanFired(data.fired),
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
