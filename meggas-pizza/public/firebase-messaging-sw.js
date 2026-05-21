// public/firebase-messaging-sw.js
// ⚠️ IMPORTANTE: Reemplaza los valores de firebaseConfig con los tuyos
// Son los mismos que pusiste en src/firebase.js

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
   apiKey: "AIzaSyATipeF2-sePr15g3MWItUnqiwZWWoZn18",
  authDomain: "meggas-pizza.firebaseapp.com",
  projectId: "meggas-pizza",
  storageBucket: "meggas-pizza.firebasestorage.app",
  messagingSenderId: "135910620658",
  appId: "1:135910620658:web:6097b51641ba8da8ae7f6b"
});

const messaging = firebase.messaging();

// Notificación cuando la app está en SEGUNDO PLANO o CERRADA
messaging.onBackgroundMessage(function(payload) {
  console.log('Pedido recibido en background:', payload);

  const { title, body } = payload.notification;

  self.registration.showNotification(title, {
    body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'nuevo-pedido',
    renotify: true,
    requireInteraction: true, // La notificación no desaparece hasta que la tocan
    actions: [
      { action: 'ver', title: '🍕 Ver pedido' }
    ]
  });
});

// Al tocar la notificación, abre la pantalla de cocina
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/cocina')
  );
});
