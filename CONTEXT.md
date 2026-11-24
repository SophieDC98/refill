# refill

Refill helps me hydrate by tracking the water bottles I drink daily.

This file is the glossary and nothing else: each word the project uses for its
own concepts, defined in a sentence or two, with the words to avoid. No
implementation, no decisions, no code. A general programming term does not
belong here.

## Language

**Bottle**:
One bottle of water, of the bottle size set in the settings (20cl by default).

**Logged**:
A bottle marked as drunk. It is drawn full.
_Avoid_: drunk, filled

**Daily goal**:
How many bottles to log in a day. It always equals the sum of the parts.

**Schedule**:
How the daily goal is split over the day, such as 3 / 2 / 3.
_Avoid_: plan

**Part**:
One piece of the schedule: morning, lunch or afternoon.
_Avoid_: block

**Extra bottle**:
A bottle logged beyond the daily goal.
_Avoid_: bonus bottle

**Reminder**:
A notification refill shows while it is open. There are two, named by what
they say, never by their times.
_Avoid_: nudge

**Morning check**:
The reminder that fires only when the morning part is behind.

**Day total**:
The reminder with the day's count of logged bottles against the daily goal.

**Fixing a day**:
Changing the count of a past day.
_Avoid_: editing, backfilling

**Fully refilled**:
A day whose logged bottles reached the daily goal (the current one, since days
don't store their own). Refill counts these days since the beginning; missing a
day never resets the count.
_Avoid_: streak
