import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SETTINGS } from "../../src/core/settings.js";
import { load, save } from "../../src/core/storage.js";

const mem = (init = {}) => ({ d: { ...init }, getItem(k) { return this.d[k] ?? null; }, setItem(k, v) { this.d[k] = v; } });
const throwing = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };

test("empty storage gives defaults", () => assert.deepEqual(load(mem()).settings, DEFAULT_SETTINGS));
test("round trip", () => {
  const s = mem(); save(s, { settings: DEFAULT_SETTINGS, days: { "2026-11-13": 6 }, fired: { date: null, morningCheck: false, dayTotal: false } });
  assert.equal(load(s).days["2026-11-13"], 6);
});
test("corrupt JSON gives defaults", () => assert.deepEqual(load(mem({ refill: "{nope" })).days, {}));
test("throwing storage gives defaults and save returns false", () => {
  assert.deepEqual(load(throwing).days, {});
  assert.equal(save(throwing, load(throwing)), false);
});
test("missing settings keys are filled from defaults", () => {
  const s = mem({ refill: JSON.stringify({ version: 1, settings: { bottleCl: 33 }, days: {} }) });
  assert.equal(load(s).settings.bottleCl, 33);
  assert.deepEqual(load(s).settings.parts, DEFAULT_SETTINGS.parts);
});

const stored = (data) => mem({ refill: JSON.stringify({ version: 1, ...data }) });
test("a malicious bottleCl string is replaced by the default", () => {
  const s = load(stored({ settings: { bottleCl: '"><img src=x onerror=alert(1)>' }, days: {} })).settings;
  assert.equal(s.bottleCl, DEFAULT_SETTINGS.bottleCl);
});
test("out-of-range numbers are clamped", () => {
  const s = load(stored({ settings: { bottleCl: 9999, parts: { morning: 99, lunch: 99, afternoon: 99 } } })).settings;
  assert.equal(s.bottleCl, 150);
  assert.ok(s.parts.morning + s.parts.lunch + s.parts.afternoon <= 20);
});
test("a legitimate stored goal of 20 survives", () => {
  const s = load(stored({ settings: { parts: { morning: 10, lunch: 10, afternoon: 0 } } })).settings;
  assert.deepEqual(s.parts, { morning: 10, lunch: 10, afternoon: 0 });
});
test("a bad reminder time or flag falls back to the default", () => {
  const s = load(stored({ settings: { morningCheck: { time: "<b>", on: "yes" }, dayTotal: { time: "9:5", on: false } } })).settings;
  assert.deepEqual(s.morningCheck, DEFAULT_SETTINGS.morningCheck);
  assert.deepEqual(s.dayTotal, { on: false, time: DEFAULT_SETTINGS.dayTotal.time });
  assert.equal(load(stored({ settings: { morningCheck: { time: "07:45" } } })).settings.morningCheck.time, "07:45");
});
test("only non-negative integer day counts are kept", () => {
  const { days } = load(stored({ days: { "2026-11-02": 4, "2026-11-03": "5", "2026-11-04": -1, "2026-11-05": 1.5, "2026-11-06": null } }));
  assert.deepEqual(days, { "2026-11-02": 4 });
});
test("fired fields are typed", () => {
  const { fired } = load(stored({ fired: { date: 5, morningCheck: "yes", dayTotal: true } }));
  assert.deepEqual(fired, { date: null, morningCheck: false, dayTotal: true });
});
