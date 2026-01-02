self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("install", function (event) {
  self.skipWaiting(); 
});

self.addEventListener("push", function (event) {
  
  let notificationData = {
    title: "Stock Tracker Alert",
    body: "You have a new notification",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: {},
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        data: payload.data || notificationData.data,
      };
    } catch (e) {
      try {
        const text = event.data.text();
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
        console.error("Service Worker Error parsing push payload:", e, textError);
        notificationData.body = "You have a new stock alert!";
      }
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.data?.symbol || "stock-alert",
    data: notificationData.data,
    requireInteraction: true, 
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
    silent: false,
    renotify: true,
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
      .catch((error) => {
        console.error("Service Worker Error showing notification:", error);
        return self.registration.showNotification("Stock Tracker Alert", {
          body: "You have a new notification",
          icon: "/favicon.ico",
          badge: "/favicon.ico",
        });
      })
  );
});

self.addEventListener("notificationclick", function (event) {
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

