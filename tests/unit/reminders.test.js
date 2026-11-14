import test from "node:test";
import assert from "node:assert/strict";
import { dueReminders } from "../../src/core/reminders.js";
import { DEFAULT_SETTINGS as S } from "../../src/core/settings.js";

const none = { date: null, morningCheck: false, dayTotal: false };
const at = (h, m, d = 16, s = 0) => new Date(2026, 10, d, h, m, s);

test("10:59 nothing due", () => assert.deepEqual(dueReminders(at(10, 59), S, 1, none).due, []));
test("11:00 behind", () => assert.deepEqual(dueReminders(at(11, 0), S, 1, none).due,
  [{ id: "morningCheck", message: "2 more bottles to stay on track this morning (1 of 3)." }]));
test("singular", () => assert.match(dueReminders(at(11, 0), S, 2, none).due[0].message, /^1 more bottle to/));
test("on track: no message, but marked fired", () => {
  const r = dueReminders(at(11, 0), S, 3, none);
  assert.deepEqual(r.due, []); assert.equal(r.fired.morningCheck, true);
});
test("late within the hour fires, after the hour does not", () => {
  assert.equal(dueReminders(at(11, 30), S, 0, none).due.length, 1);
  assert.equal(dueReminders(at(12, 5), S, 0, none).due.length, 0);
});
test("window edges: 11:59:59 due, 12:00:00 not", () => {
  assert.equal(dueReminders(at(11, 59, 16, 59), S, 0, none).due.length, 1);
  assert.equal(dueReminders(at(12, 0), S, 0, none).due.length, 0);
});
test("fires once a day", () => {
  const first = dueReminders(at(11, 0), S, 0, none);
  assert.deepEqual(dueReminders(at(11, 1), S, 0, first.fired).due, []);
});
test("yesterday's flags don't block today", () =>
  assert.equal(dueReminders(at(11, 0, 17), S, 0, { date: "2026-11-16", morningCheck: true, dayTotal: true }).due.length, 1));
test("day total copy", () => {
  assert.equal(dueReminders(at(16, 0), S, 5, none).due[0].message, "You drank 5 out of 8 bottles.");
  assert.equal(dueReminders(at(16, 0), S, 8, none).due[0].message, "8 out of 8 bottles 🎉 Goal reached!");
});
test("weekend: nothing, fired unchanged", () => {
  const r = dueReminders(at(11, 0, 14), S, 0, none);
  assert.deepEqual(r.due, []); assert.deepEqual(r.fired, none);
});
test("switched off: nothing", () =>
  assert.deepEqual(dueReminders(at(16, 0), { ...S, dayTotal: { on: false, time: "16:00" } }, 0, none).due, []));
test("custom time", () =>
  assert.equal(dueReminders(at(10, 0), { ...S, morningCheck: { on: true, time: "10:00" } }, 0, none).due.length, 1));
test("pure: inputs are not mutated", () => {
  const fired = { date: null, morningCheck: false, dayTotal: false };
  const r = dueReminders(at(11, 0), S, 0, fired);
  assert.deepEqual(fired, none); assert.notEqual(r.fired, fired);
});
