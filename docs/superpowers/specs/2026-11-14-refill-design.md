# refill: design

Date: 2026-11-14. Owner: Sophie.

## Intent

Sophie drinks water at work from small 20cl bottles and wants to drink a set
number each day (normally 8). refill is a tiny app that counts the bottles,
nudges her at two moments in the day, and shows how past days went. Her work
PC is a locked-down Windows machine that blocks most programs, so it has to run
in the browser with nothing to install.

Success: she keeps it open in a small window all day, logging a bottle takes
one tap, and the two reminders tell her where she stands without nagging.

## Goals

- Count today's bottles with one tap per bottle, and fix a wrong tap just as
  easily.
- Remind at 11:00 when she is behind on the morning plan, and at 16:00 with
  the day's total.
- Show past days in a month calendar below the tracker, and let her fix a
  past day she forgot to log.
- Look cute: pixel-art bottles modelled on her work bottle.

## Non-goals

- Syncing between devices, accounts or logins.
- A phone app.
- Reminders while the app is closed (that would need a server sending
  pushes).
- Reminders at weekends.

## Anti-goals (a failure even if it works)

- Needing anything installed that requires admin rights, or anything the
  work PC is likely to block (scripts, executables, `.hta`).
- Sending her data anywhere. Counts stay in her browser.
- Nagging: a reminder that tells her nothing new.

## Constraints

- Windows work PC, Edge (Chrome also fine). No admin rights.
- Static files only: hosted free on GitHub Pages from the `SophieDC98/refill`
  repository, at `https://sophiedc98.github.io/refill/`, served over HTTPS so
  Edge can install it as an app.
- No build step and no framework, so the repo is the site.

## Approaches considered

1. **A plain browser page** (a local HTML file). Least likely to be blocked, but it
   lives in a tab, cannot be installed as its own window, and is easy to
   forget.
2. **The page as an installed app window** (picked). The same page, hosted on
   GitHub Pages and installed from Edge (⋯ → Apps → Install this site as an
   app). It gets its own small window, a taskbar icon and can start at
   sign-in. If the company blocks installing, it still works as a pinned tab
   with the same reminders.
3. **A native desktop popup or tray icon** (PowerShell, `.hta`). Feels most
   like a real app, but these are exactly what work PCs block.
4. **An Excel sheet with a button.** Works anywhere Office does, but it can't
   give reminders or the look she wants.

Sophie picked 2, because she wants the reminders and the small-window feel.

## What she decided

### Today's bottles

- A row of pixel bottles, one per bottle in the daily goal. Every bottle
  starts empty each morning.
- Tapping anywhere on the row fills the next empty bottle, left to right.
  Tapping a filled bottle empties the last filled one. The row always reads
  like a progress bar.
- Under the row: "5 of 8 · 1.0 L".

### Reminders

Each reminder is a Windows notification shown by the app while it is open
(minimized is fine).

- **Morning reminder, 11:00 by default.** It fires only when she is behind the
  morning part of her schedule, for example "2 more bottles to stay on track
  this morning (1 of 3)". When she is on track, no notification.
- **Afternoon reminder, 16:00 by default.** Always fires: "You drank 5 out of
  8 bottles." When the goal is reached: "8 out of 8 bottles 🎉 Goal reached!"
- Monday to Friday only.
- Each reminder has its own on/off switch and editable time.

### Settings

- The schedule: bottles for the morning, lunch and afternoon (default 3 / 2 /
  3).
- The daily goal (default 8).
- The bottle size (default 20cl), used for the litres shown.
- Both reminder times and on/off switches.

### History

- A month calendar below the tracker, with all seven days (Monday first),
  and ‹ › to flip to earlier months. Weekends are shown for a complete-looking
  month and can be logged like any day.
- Each day is coloured by how much she drank, not by the goal: white for
  nothing, getting darker blue the more she drank.
- Tapping a past day opens its bottles in the tracker to adjust, with a way
  back to today.

### Look

- Pixel-art bottles modelled on her work bottle, from her photo: a small
  clear glass bottle that tapers to a lipped neck, a navy crown cap, a small
  navy oval label on the shoulder and a wide navy band lower down. Empty
  bottles show clear glass; drunk ones fill with light-blue water. No brand
  name or logo is drawn.
- The calendar is pixel styled too: square blocky cells, a pixel font for the
  numbers.
- Reaching the goal sets off a short burst of yellow pixel stars over the
  bottles (a still version when the system asks for reduced motion).

## My calls (Sophie can overrule)

- **Goal and schedule kept in step.** The goal is the sum of the three
  schedule parts. Changing a part updates the goal. Changing the goal directly
  adds or removes bottles from the afternoon part. This avoids a schedule that
  doesn't add up to the goal.
- **The morning reminder compares against the morning part only** (3 by
  default). Lunch is not checked at 11:00.
- **A missed reminder fires late, within the hour.** If the app opens or
  wakes up after a reminder time, it still fires once if less than 60 minutes
  have passed. After that, that reminder is skipped for the day. Each reminder
  fires at most once a day.
- **Extra bottles past the goal.** Once the goal is reached, a faded extra
  bottle appears so she can log more than the goal. Without it, the darkest
  calendar shade (2 L) could never be reached.
- **The day rolls over at midnight, local time**, even if the window stays
  open overnight. Today's cell is shown in the calendar too.
- **Calendar shades:** the shade follows the litres drunk, in five steps from
  white (nothing) to dark blue (2 L or more, which is 10 bottles of 20cl).
  Litres rather than bottles, so a different bottle size still shades fairly.
  In dark mode, "nothing" is the empty cell colour instead of bright white.
- **Notifications are switched on with a button in settings**, because
  browsers only ask for permission after a click. Settings show whether
  notifications are allowed, blocked by Windows or the company, or not asked
  yet.
- **The window is laid out for about 360px wide**, so it fits in a screen
  corner. It also follows Windows light or dark mode.
- **It works offline once loaded**, through a service worker, so a flaky
  network doesn't break it.

## Left to the builder

- Code structure, as long as the counting, schedule and reminder logic is
  plain JavaScript that can be tested without a browser.
- How the pixel art is drawn (SVG, CSS or canvas), and the app icon.
- How often it checks the clock for reminders (about every 30 seconds is
  enough).
- Storage format in the browser, with a version number so it can change
  later.

## Known risks

- The company may block installing sites as apps, notifications, or both.
  The pinned-tab fallback covers the first. If notifications are blocked,
  the app should say so in settings rather than fail silently.
- Clearing browser data wipes the history. A backup and restore option is a
  good next idea, not part of this build.
- Windows "Do not disturb" hides notifications. That is out of the app's
  hands.
