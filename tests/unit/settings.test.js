import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SETTINGS, goal, withGoal, withPart, withBottleCl } from "../../src/core/settings.js";

test("default goal is 8", () => assert.equal(goal(DEFAULT_SETTINGS), 8));
test("raising the goal adds to the afternoon", () =>
  assert.deepEqual(withGoal(DEFAULT_SETTINGS, 10).parts, { morning: 3, lunch: 2, afternoon: 5 }));
test("lowering below morning+lunch takes lunch, then morning", () =>
  assert.deepEqual(withGoal(DEFAULT_SETTINGS, 2).parts, { morning: 2, lunch: 0, afternoon: 0 }));
test("goal is clamped to 1..20", () => {
  assert.equal(goal(withGoal(DEFAULT_SETTINGS, 0)), 1);
  assert.equal(goal(withGoal(DEFAULT_SETTINGS, 99)), 20);
});
test("a part cannot bring the goal to 0", () => {
  const one = withGoal(DEFAULT_SETTINGS, 1);
  assert.equal(withPart(one, "morning", 0), one);
});
test("inputs are not mutated", () => {
  withGoal(DEFAULT_SETTINGS, 12);
  assert.equal(goal(DEFAULT_SETTINGS), 8);
});
test("bottle size is clamped", () => assert.equal(withBottleCl(DEFAULT_SETTINGS, 1).bottleCl, 5));
test("a part change never pushes the goal over 20", () => {
  const big = { ...DEFAULT_SETTINGS, parts: { morning: 10, lunch: 5, afternoon: 5 } };
  assert.equal(withPart(big, "lunch", 10).parts.lunch, 5);
  assert.equal(goal(withPart(big, "afternoon", 10)), 20);
  assert.equal(withPart(DEFAULT_SETTINGS, "afternoon", 10).parts.afternoon, 10);
});
