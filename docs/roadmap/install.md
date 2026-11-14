# Install

Status: done.

## What it builds

Installing refill from Edge as its own window, working offline, and hosting it on GitHub Pages.

## Depends on

[Tracker](tracker.md).

## Bound by

The design in `docs/superpowers/specs/2026-11-14-refill-design.md`, built from
the plan in `docs/superpowers/plans/2026-11-14-refill.md`.

## Progress

- **Task 8, installable app** (`bdd9a0c`). The app manifest and a pixel
  bottle icon, so Edge can install refill as its own window, and a service
  worker that keeps it working offline. The README explains installing it
  and the [platform](../adr/platform.md) decision now covers hosting and
  updates. Smoke tests check the manifest, that every app file is saved for
  offline use, and that refill still opens with the server switched off.
  Review: approved. Switching on GitHub Pages waits for Sophie's go.
