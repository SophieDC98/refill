// Browser notifications: the only module that touches Notification and the service worker.
const STATES = { granted: "on", default: "off", denied: "blocked" };

export function notificationState() {
  if (typeof Notification === "undefined") return "unsupported";
  return STATES[Notification.permission] ?? "unsupported";
}

// Only called from the settings button's click (browsers want a user gesture).
export async function askPermission() {
  try {
    if (typeof Notification !== "undefined") await Notification.requestPermission();
  } catch {
    // The state below tells what happened.
  }
  return notificationState();
}

export async function showReminder(message, tag) {
  try {
    if (notificationState() !== "on") return;
    // The same tag replaces a notification instead of stacking, so two open copies show one.
    const options = { body: message, tag, icon: "icons/icon-192.png" };
    const worker = navigator.serviceWorker;
    const registration = worker?.controller ? await worker.ready : null;
    if (registration) await registration.showNotification("Refill", options);
    else new Notification("Refill", options);
  } catch {
    // A reminder that cannot be shown is not worth breaking the app.
  }
}
