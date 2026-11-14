# Tracker

Status: done.

## What it builds

Logging bottles with one tap, the pixel bottles, the star burst, settings, and saving the data in the browser.

## Depends on

Nothing.

## Bound by

The design in `docs/superpowers/specs/2026-11-14-refill-design.md`, built from
the plan in `docs/superpowers/plans/2026-11-14-refill.md`.

## Progress

- **Task 1, core settings and days** (`af5332f`). The rules behind the
  tracker: the daily goal as the sum of the schedule's parts, changing the
  goal through the afternoon part, logging and unlogging a bottle, extra
  bottles past the goal, and the calendar shades. 13 unit tests. Also
  recorded the [platform](../adr/platform.md) decision. Review: approved.
- **Task 2, storage** (`40163af`). Saving settings, days and reminder flags
  as one versioned document in the browser, falling back to defaults when
  storage is blocked or corrupt. 5 unit tests. Recorded the
  [storage](../adr/storage.md) decision. Built in its own session. Review:
  approved.
- **Task 3, app page, tracker and star burst** (`ebf8157`, `688cb03`). The
  page itself: the pixel bottles grouped by part, "N of 8" with litres, today
  or fixing a past day, and the yellow star burst on reaching the goal. A
  smoke test drives it in a real browser. Review found the test failed
  without internet (the page loads its font from Google), fixed by blocking
  the font in tests.
- **Task 4, settings** (`a08f956`, `856dd91`). The settings view: the
  schedule's parts, daily goal, bottle size, and both reminders' times and
  switches, kept in step and saved. Smoke tests cover clamping, lowering the
  goal below what's logged, and settings surviving a reload. Review found
  keyboard focus was lost after each change and three tests skipped the
  error check; both fixed.
