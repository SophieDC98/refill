import test from "node:test";
import assert from "node:assert/strict";
import { dateKey, countOn, tapBottle, slots, shade, reachedGoal } from "../../src/core/days.js";

test("dateKey is local", () => assert.equal(dateKey(new Date(2026, 10, 3, 23, 30)), "2026-11-03"));
test("tap past the count logs one", () => assert.equal(countOn(tapBottle({}, "k", 0), "k"), 1));
test("tap a logged bottle unlogs the last", () => assert.equal(countOn(tapBottle({ k: 5 }, "k", 1), "k"), 4));
test("slots", () => {
  assert.equal(slots(3, 8), 8);
  assert.equal(slots(8, 8), 9);
  assert.equal(slots(10, 8), 11);
});
test("shade thresholds at 20cl", () =>
  assert.deepEqual([0, 1, 3, 4, 6, 9, 10].map(n => shade(n, 20)), [0, 1, 1, 2, 2, 3, 4]));
test("reachedGoal only on crossing", () => {
  assert.equal(reachedGoal(7, 8, 8), true);
  assert.equal(reachedGoal(8, 9, 8), false);
});
