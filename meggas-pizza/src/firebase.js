// src/firebase.js
// ⚠️ Reemplaza con tus credenciales reales de Firebase Console

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
   apiKey: "AIzaSyATipeF2-sePr15g3MWItUnqiwZWWoZn18",
  authDomain: "meggas-pizza.firebaseapp.com",
  projectId: "meggas-pizza",
  storageBucket: "meggas-pizza.firebasestorage.app",
  messagingSenderId: "135910620658",
  appId: "1:135910620658:web:6097b51641ba8da8ae7f6b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const messaging = getMessaging(app);

// Solicita permiso y obtiene el token del dispositivo
export async function requestNotificationPermission(vapidKey) {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Permiso de notificaciones denegado");
      return null;
    }
    const token = await getToken(messaging, { vapidKey });
    console.log("Token FCM:", token);
    return token;
  } catch (error) {
    console.error("Error obteniendo token:", error);
    return null;
  }
}

// Escucha mensajes cuando la app está ABIERTA
export function onForegroundMessage(callback) {
  return onMessage(messaging, callback);
}

export default app;
