self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("fetch", (e) => e.respondWith(fetch(e.request)));
self.addEventListener("push", (e) => {
  const data = e.data.json();
  self.registration.showNotification(data.title, { body: data.body, icon: "/icon-192.png", vibrate: [200,100,200] });
});
