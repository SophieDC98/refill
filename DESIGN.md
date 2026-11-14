# refill design

This file holds what refill is for: its vision, its goals and what it
will not do. It never holds how the code is built, which belongs in
`docs/adr/`, and it never links a decision or names a file in the code. It
changes when the direction changes, not when a decision does, and it stays
under 150 lines.

## Vision

Refill helps me hydrate by tracking the water bottles I drink daily. It runs
in the browser on a locked-down work PC, with nothing to install.

## Goals

- One-tap logging: logging a bottle, or fixing a wrong tap, takes one tap, so
  it never interrupts work.
- Fun to look at: cute pixel bottles and a star burst make it something I like
  having open.

The reminders and the history calendar are in the first version too, but they
are not the core. If something has to give, they go first.

## Non-goals

- Other drinks: no coffee, tea or calorie tracking.
- Reminders while the app is closed.
- Sharing or anything social, such as leaderboards or competitions.
- A phone app.
- Reminders at weekends.
