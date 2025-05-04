self.addEventListener("install", (event) => {
    console.log("Service Worker installed");
  });
  
  self.addEventListener("activate", (event) => {
    console.log("Service Worker activated");
  });
  
  self.addEventListener("push", (event) => {
    const data = event.data?.json();
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192x192.png"
    });
  });