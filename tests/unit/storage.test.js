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
