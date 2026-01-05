// Push notification handler for service worker
// This file is imported by the Workbox-generated service worker

// Handle push notifications
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push received:", event);

  if (!event.data) {
    console.log("[Service Worker] Push event but no data");
    return;
  }

  try {
    const data = event.data.json();
    console.log("[Service Worker] Push data:", data);

    const options = {
      body: data.body || "Tienes una nueva notificación",
      icon: data.icon || "/pwa-192x192.png",
      badge: data.badge || "/pwa-192x192.png",
      tag: data.tag || "default",
      data: data.data || {},
      actions: data.actions || [],
      vibrate: [100, 50, 100],
      requireInteraction: true,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "DIEGCUTZ", options)
    );
  } catch (error) {
    console.error("[Service Worker] Error parsing push data:", error);
    
    // Fallback for non-JSON data
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification("DIEGCUTZ", {
        body: text,
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
      })
    );
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification click:", event);

  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  let urlToOpen = "/";

  // Handle different actions
  if (action === "view") {
    urlToOpen = data.url || "/";
  } else if (action === "dismiss") {
    return;
  } else if (data.url) {
    urlToOpen = data.url;
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus an existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open a new window if none exists
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  console.log("[Service Worker] Notification closed:", event);
});
