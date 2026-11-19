# Storage

Refill keeps everything in one versioned JSON document in `localStorage` under
the key `refill`: the settings, the days and which notifications have fired.
Days are stored as `{ "YYYY-MM-DD": count }`. The version lets a later change
migrate the data; an unknown version loads the defaults. Reads and writes never
throw, because browsers can block storage.

Refill asks the browser to keep this data permanently (`navigator.storage.persist()`),
so it is not deleted when the disk runs low. That does not survive a setting that
clears site data when Edge closes, which Sophie's work PC enforces: a restart
there wiped the history. See [backup](../ideas/backup.md).
