// Keeps smoke tests off the network: the Google Fonts requests are aborted, and
// the console errors they cause are the only ones a test may ignore.
const FONT_HOSTS = /^https?:\/\/fonts\.(googleapis|gstatic)\.com\//;

export async function blockFonts(context) {
  await context.route(FONT_HOSTS, (route) => route.abort());
}

export function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !FONT_HOSTS.test(m.location().url)) errors.push(m.text());
  });
  return errors;
}
