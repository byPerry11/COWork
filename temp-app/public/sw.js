// Service Worker for Push Notifications
// This file handles push events and notification clicks

// Install event - cache static assets if needed
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing')
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating')
  event.waitUntil(clients.claim())
})

// Push event - show notification when push is received
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event)

  let notificationData = {
    title: 'TPVapp',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: {
      url: '/dashboard/notifications'
    }
  }

  // Parse the push data if available
  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || 'notification',
        requireInteraction: data.requireInteraction || false,
        data: {
          url: data.url || notificationData.data.url,
          ...data.data
        }
      }
    } catch (error) {
      console.error('[SW] Error parsing push data:', error)
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
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'open',
          title: 'View',
          icon: '/check-icon.png'
        },
        {
          action: 'close',
          title: 'Dismiss',
          icon: '/close-icon.png'
        }
      ]
    }
  )

  event.waitUntil(promiseChain)
})

// Notification click event - navigate to the specified URL
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event)
  
  event.notification.close()

  // Handle different actions
  if (event.action === 'close') {
    return
  }

  // Default action or 'open' action
  const urlToOpen = event.notification.data.url || '/dashboard/notifications'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open with the app
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus()
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Background sync for offline notifications (optional)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(
      // Fetch pending notifications from the queue
      fetch('/api/notifications/pending')
        .then(response => response.json())
        .then(notifications => {
          notifications.forEach(notification => {
            self.registration.showNotification(notification.title, notification)
          })
        })
        .catch(error => {
          console.error('[SW] Error syncing notifications:', error)
        })
    )
  }
})
