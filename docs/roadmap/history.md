# History

Status: done.

## What it builds

The pixel month calendar under the tracker, and fixing a day.

## Depends on

[Tracker](tracker.md).

## Bound by

The design in `docs/superpowers/specs/2026-11-14-refill-design.md`, built from
the plan in `docs/superpowers/plans/2026-11-14-refill.md`.

## Progress

- **Task 5, month calendar and fixing a day** (`47125fc`, `2748438`). The
  pixel calendar under the tracker: all seven days, each shaded from white to
  dark blue by the litres drunk, ‹ › to earlier months, and tapping a past
  day to fix it, with "Back to today". Smoke tests pin the date and check the
  shades, weekends, future days and fixing one day only. Review found the ›
  button moved keyboard focus to ‹ and focused cells lost their outline; both
  fixed, and today's cell is now announced to screen readers.
