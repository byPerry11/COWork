import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

// TypeScript declarations for the service worker global scope
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & typeof globalThis & ServiceWorkerGlobalScope;

// ─── Serwist: Precaching, Runtime Caching & Offline Fallback ─────────────────
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// ─── Push Notifications (migrated from existing sw.js) ───────────────────────

// Push event - show notification when push is received
self.addEventListener("push", (event: PushEvent) => {
  console.log("[SW] Push received:", event);

  let notificationData: Record<string, any> = {
    title: "COWork",
    body: "You have a new notification",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    data: {
      url: "/dashboard/notifications",
    },
  };

  // Parse the push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || "notification",
        requireInteraction: data.requireInteraction || false,
        data: {
          url: data.url || notificationData.data.url,
          ...data.data,
        },
      };
    } catch (error) {
      console.error("[SW] Error parsing push data:", error);
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      actions: [
        {
          action: "open",
          title: "View",
        },
        {
          action: "close",
          title: "Dismiss",
        },
      ],
    } as NotificationOptions
  );

  event.waitUntil(promiseChain);
});

// Notification click event - navigate to the specified URL
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  console.log("[SW] Notification click:", event);

  event.notification.close();

  // Handle different actions
  if (event.action === "close") {
    return;
  }

  // Default action or 'open' action
  const urlToOpen = event.notification.data?.url || "/dashboard/notifications";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList: readonly WindowClient[]) => {
        // Check if there's already a window open with the app
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline notifications
self.addEventListener("sync", (event: any) => {
  console.log("[SW] Background sync:", event.tag);

  if (event.tag === "sync-notifications") {
    event.waitUntil(
      fetch("/api/notifications/pending")
        .then((response) => response.json())
        .then((notifications: any[]) => {
          notifications.forEach((notification) => {
            self.registration.showNotification(
              notification.title,
              notification
            );
          });
        })
        .catch((error: Error) => {
          console.error("[SW] Error syncing notifications:", error);
        })
    );
  }
});
