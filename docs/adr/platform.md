# Platform

Refill is a static browser app, installed from Edge and hosted on GitHub Pages
from `SophieDC98/refill`. It has no build step and no framework, because the
work PC blocks programs and the repo should be the site itself.

Rejected: a plain local HTML file, which cannot be installed as an app or
registered with a service worker; PowerShell or `.hta`, which work PCs block.

## Hosting and offline

The site is served from the `main` branch, folder `/`, with GitHub Pages, at
https://sophiedc98.github.io/refill/. It lives under `/refill/`, so every path
in the page, the manifest and the service worker is relative.

`sw.js` precaches the app files under a versioned cache name and serves them
cache-first, so the installed app opens offline. The Google Fonts are not
cached; offline the page uses system fonts. A new worker takes over on the next
load (`skipWaiting` on install, `clients.claim` on activate) and deletes older
caches. The cache name must be bumped (`refill-v1`, `refill-v2`, ...) whenever
a cached file changes, or installed copies keep the old files.
