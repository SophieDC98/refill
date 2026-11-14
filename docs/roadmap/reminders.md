# Reminders

Status: done.

## What it builds

The morning check and the day total, shown as Windows notifications while refill is open, Monday to Friday.

## Depends on

[Tracker](tracker.md).

## Bound by

The design in `docs/superpowers/specs/2026-11-14-refill-design.md`, built from
the plan in `docs/superpowers/plans/2026-11-14-refill.md`.

## Progress

- **Task 6, reminder rules** (`c4f4a54`). The rules deciding when a reminder
  shows and what it says: Monday to Friday only, each at its own time and
  switch, late by up to an hour if refill was closed, at most once a day, and
  the morning check only when behind the morning part. The exact messages
  match the design. 13 unit tests, down to the second at the hour's edge.
  Recorded the [reminders](../adr/reminders.md) decision. Review: approved.
- **Task 7, notifications, clock and midnight** (`f4619ad`). refill checks
  the clock every 30 seconds and when its window comes back into view, shows
  due reminders as Windows notifications, and starts the new day at midnight
  without a reload. Settings show whether notifications are on, off, blocked
  or unsupported, with a "Turn on" button. Also fixed an earlier find: past
  midnight the tracker no longer shows yesterday as a day being fixed. Smoke
  tests fake the clock and Windows notifications. Review: approved.
