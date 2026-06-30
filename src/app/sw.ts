import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Las rutas SSR de Next.js no están en el precache: hay que servirlas desde red.
    // Sin este handler, Serwist devuelve "no-response" al navegar a cualquier página.
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "pages",
        networkTimeoutSeconds: 3,
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();

// Handler de notificaciones push entrantes
self.addEventListener("push", (event: PushEvent) => {
  let data: { title?: string; body?: string; icon?: string; url?: string } = {};
  try {
    if (event.data) data = event.data.json() as typeof data;
  } catch {
    if (event.data) data = { body: event.data.text() };
  }
  const title = data.title ?? "OpenGig";
  const options: NotificationOptions = {
    body: data.body ?? "Tienes una nueva notificación.",
    icon: data.icon ?? "/OpenGig_favicon.svg",
    badge: "/OpenGig_favicon.svg",
    data: { url: data.url ?? "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Al hacer click en la notificación, abrir la URL asociada
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const url: string = (event.notification.data as { url?: string } | null)?.url ?? "/";
  event.waitUntil(
    (self.clients as Clients)
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && "focus" in client) return (client as WindowClient).focus();
        }
        return (self.clients as Clients).openWindow(url);
      })
  );
});
