# Storage

Refill keeps everything in one versioned JSON document in `localStorage` under
the key `refill`: the settings, the days and which notifications have fired.
Days are stored as `{ "YYYY-MM-DD": count }`. The version lets a later change
migrate the data; an unknown version loads the defaults. Reads and writes never
throw, because browsers can block storage.

Clearing browser data loses the history. See [backup](../ideas/backup.md).
