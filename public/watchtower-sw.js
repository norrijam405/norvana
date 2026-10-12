self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Acre Era Watchtower", body: event.data ? event.data.text() : "Watchtower has an update." };
  }

  const title = data.title || "Acre Era Watchtower";
  const options = {
    body: data.body || "Something needs your attention.",
    icon: "/watchtower-icon.svg",
    badge: "/watchtower-icon.svg",
    tag: data.tag || "watchtower-owner-alert",
    data: { url: data.url || "/admin/cockpit" },
    renotify: Boolean(data.renotify),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : "/admin/cockpit";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
