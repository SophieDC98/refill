# refill

Refill helps me hydrate by tracking the water bottles I drink daily.

It is a small static web app: no build, no framework, no runtime dependencies.
Your data stays in the browser's localStorage.

## What it does so far

- Shows the day's bottles in the morning, lunch and afternoon parts, drawn as
  pixel art. Tap a bottle to log the next one; tap a logged bottle to undo.
- Shows "N of G" and the litres, and how many are left to go.
- Past the daily goal it adds an extra bottle, and a burst of stars marks
  reaching the goal.
- Shows a month calendar below the bottles, one blocky square per day, shaded
  by how much you drank (0 L up to 2 L+). Step back and forward through the
  months with the arrows.
- Tap a past day to fix it: the bottles show that day, with a "Fixing" bar,
  and tapping a bottle changes only that day. "Back to today" (or tapping
  today) returns.
- Settings: the bottles in each part, the daily goal (changing it adds or
  removes bottles in the afternoon), the bottle size, and the morning check and
  day total reminders (on or off, and the time). Lowering the goal never
  removes bottles you already logged.

## Run it locally

- `npm run serve` serves the app; open http://localhost:8000.
- `npm test` runs the unit tests.
- `npm run test:smoke` runs the smoke tests (needs Playwright installed).
