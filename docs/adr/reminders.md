# Reminders

Refill reminds only while its page is open: it has no server to push from, so
the open page checks the clock and decides which reminder is due. The rules are
pure (`dueReminders`) so they are tested without a clock or a browser.

A reminder is due from its time until 60 minutes after it, Monday to Friday. The
window lets a page opened or woken a little late still remind, while a page
opened in the afternoon does not replay the morning check. Each reminder fires
at most once a day: the flags are stored with the date they belong to, so a new
day starts them clear and a reload does not repeat a reminder. The morning check
is marked fired even when the morning part is already done, so it stays silent
for the rest of the window.

A reminder whose time passes while notifications are off or not allowed counts
as fired for the day: switching notifications on later does not replay it.
