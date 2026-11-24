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
cache-first, so the installed app opens offline. The fonts (Pixelify Sans and Inter, latin, variable, under the OFL; licences in
`fonts/`) are bundled and precached, so nothing is fetched from other sites and
they work offline. A new worker takes over on the next
load (`skipWaiting` on install, `clients.claim` on activate) and deletes older
caches. Every precache request bypasses the HTTP cache (`cache: "reload"`), so a
new worker never stores stale files. Publishing goes through GitHub Actions (`.github/workflows/pages.yml`, with
Pages' source set to "GitHub Actions"), not straight from the branch, because
the app has no build step and cannot know its own commit. Before publishing,
`scripts/stamp-version.mjs` writes the commit's short hash and date into
`src/version.js`, which Settings shows ("Refill a7e262d · 24 Nov 2026"), and names
the offline cache after the commit (`refill-a7e262d`). So every push updates
installed copies with no manual cache bump. Run locally, the app says
"development".
