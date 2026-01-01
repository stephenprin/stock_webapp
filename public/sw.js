// Service Worker for Push Notifications

// Activate immediately
self.addEventListener("activate", function (event) {
  console.log("[Service Worker] Activated");
  event.waitUntil(self.clients.claim());
});

// Install
self.addEventListener("install", function (event) {
  console.log("[Service Worker] Installed");
  self.skipWaiting(); // Activate immediately
});

self.addEventListener("push", function (event) {
  console.log("[Service Worker] Push Received.");
  
  let notificationData = {
    title: "Stock Tracker Alert",
    body: "You have a new notification",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: {},
  };

  // Try to parse the push data
  if (event.data) {
    try {
      // Try JSON first
      const payload = event.data.json();
      console.log("[Service Worker] Parsed payload:", payload);
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        data: payload.data || notificationData.data,
      };
    } catch (e) {
      // If JSON parsing fails, try text
      try {
        const text = event.data.text();
        console.log("[Service Worker] Payload as text:", text);
        if (text) {
          const payload = JSON.parse(text);
          notificationData = {
            title: payload.title || notificationData.title,
            body: payload.body || notificationData.body,
            icon: payload.icon || notificationData.icon,
            badge: payload.badge || notificationData.badge,
            data: payload.data || notificationData.data,
          };
        }
      } catch (textError) {
        console.error("[Service Worker] Error parsing push payload:", e, textError);
        // Use default notification
        notificationData.body = "You have a new stock alert!";
      }
    }
  } else {
    console.log("[Service Worker] No data in push event, using defaults");
  }

  console.log("[Service Worker] Notification data:", notificationData);

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.data?.symbol || "stock-alert",
    data: notificationData.data,
    requireInteraction: true, // Keep notification visible until user interacts
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
    silent: false,
    renotify: true, // Allow showing notification again even if tag matches
    actions: notificationData.data?.url
      ? [
          {
            action: "open",
            title: "View Details",
          },
        ]
      : [],
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
      .then(() => {
        console.log("[Service Worker] Notification shown successfully:", {
          title: notificationData.title,
          body: notificationData.body,
          options: notificationOptions,
        });
      })
      .catch((error) => {
        console.error("[Service Worker] Error showing notification:", error);
        // Fallback: try showing a simple notification
        return self.registration.showNotification("Stock Tracker Alert", {
          body: "You have a new notification",
          icon: "/favicon.ico",
          badge: "/favicon.ico",
        });
      })
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", function (event) {
  console.log("[Service Worker] Notification click Received.");

  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then(function (clientList) {
        // Check if there is already a window/tab open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener("notificationclick", function (event) {
  if (event.action === "open") {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || "/dashboard";

    event.waitUntil(
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then(function (clientList) {
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client.url === urlToOpen && "focus" in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

