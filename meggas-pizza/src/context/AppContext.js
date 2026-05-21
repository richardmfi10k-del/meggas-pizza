// src/context/AppContext.js
// VERSIÓN ACTUALIZADA — incluye notificaciones push

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection, doc, onSnapshot, setDoc, updateDoc,
  addDoc, serverTimestamp, getDocs, writeBatch
} from "firebase/firestore";
import { db, requestNotificationPermission, onForegroundMessage } from "../firebase";
import { defaultSizes, defaultFlavors, defaultConfig } from "../defaultData";

const AppContext = createContext();

// ⚠️ Reemplaza este valor con tu VAPID Key de Firebase
// La obtienes en: Firebase Console → Configuración del proyecto
// → Cloud Messaging → Certificados push web → Generar par de claves
const VAPID_KEY = "BC8Rdsd9b3YbrmmJYVI59O2KiHlBLb_h4P8dt5Hry8DDpfvstAoifmOYeqKlf14WvvbC-3g-QxXxrfmrjcn2Wak";

export function AppProvider({ children }) {
  const [sizes, setSizes]       = useState(defaultSizes);
  const [flavors, setFlavors]   = useState(defaultFlavors);
  const [config, setConfig]     = useState(defaultConfig);
  const [orders, setOrders]     = useState([]);
  const [loaded, setLoaded]     = useState(false);
  const [isAdmin, setIsAdmin]   = useState(false);
  const [fcmToken, setFcmToken] = useState(null);
  const [notifEnabled, setNotifEnabled] = useState(false);

  async function seedIfEmpty() {
    try {
      const snap = await getDocs(collection(db, "sizes"));
      if (snap.empty) {
        const batch = writeBatch(db);
        defaultSizes.forEach(s => batch.set(doc(db, "sizes", s.id), s));
        defaultFlavors.forEach(f => batch.set(doc(db, "flavors", f.id), f));
        await batch.commit();
        await setDoc(doc(db, "config", "main"), defaultConfig);
      }
    } catch (e) {
      console.log("Usando datos locales");
    }
  }

  // Activa notificaciones push en este dispositivo
  async function enableNotifications() {
    try {
      const token = await requestNotificationPermission(VAPID_KEY);
      if (token) {
        setFcmToken(token);
        setNotifEnabled(true);
        // Guarda el token en Firebase para poder enviar notificaciones
        await setDoc(doc(db, "fcm_tokens", token), {
          token,
          device: navigator.userAgent,
          createdAt: serverTimestamp()
        });
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error activando notificaciones:", e);
      return false;
    }
  }

  // Envía notificación a todos los tokens guardados cuando llega un pedido
  async function notifyNewOrder(order) {
    try {
      // Guarda el pedido en una cola de notificaciones
      // Firebase Functions lo envía (o puedes usar un webhook)
      await addDoc(collection(db, "notification_queue"), {
        title: "🍕 Nuevo pedido — Megga's Pizza",
        body: `${order.producto} · ${order.cliente}`,
        url: "/cocina",
        createdAt: serverTimestamp(),
        sent: false
      });
    } catch (e) {
      console.log("Notificación en cola no disponible, usando sonido local");
    }
  }

  useEffect(() => {
    seedIfEmpty();
    const unsubs = [];

    try {
      unsubs.push(onSnapshot(collection(db, "sizes"), snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (data.length) setSizes(data.sort((a, b) => a.order - b.order));
      }));

      unsubs.push(onSnapshot(collection(db, "flavors"), snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (data.length) setFlavors(data.filter(f => f.active));
      }));

      unsubs.push(onSnapshot(doc(db, "config", "main"), snap => {
        if (snap.exists()) setConfig(snap.data());
      }));

      unsubs.push(onSnapshot(collection(db, "orders"), snap => {
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(o => o.status !== "entregado")
          .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        setOrders(data);
      }));

      // Escucha mensajes cuando la app está ABIERTA
      onForegroundMessage((payload) => {
        console.log("Mensaje en primer plano:", payload);
        // El componente KitchenPage maneja el sonido y toast visual
      });

    } catch (e) {
      console.log("Firebase no conectado, modo demo");
    }

    setLoaded(true);
    return () => unsubs.forEach(u => u());
  }, []);

  async function createOrder(orderData) {
    try {
      const ref = await addDoc(collection(db, "orders"), {
        ...orderData,
        status: "nuevo",
        createdAt: serverTimestamp(),
      });
      await notifyNewOrder(orderData);
      return ref.id;
    } catch (e) {
      const localOrder = {
        ...orderData,
        id: "demo-" + Date.now(),
        status: "nuevo",
        createdAt: { seconds: Date.now() / 1000 }
      };
      setOrders(prev => [...prev, localOrder]);
      return localOrder.id;
    }
  }

  async function updateOrderStatus(orderId, status) {
    try {
      await updateDoc(doc(db, "orders", orderId), { status });
    } catch (e) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    }
  }

  async function saveFlavor(flavor) {
    try {
      await setDoc(doc(db, "flavors", flavor.id), flavor);
    } catch (e) {
      setFlavors(prev => {
        const exists = prev.find(f => f.id === flavor.id);
        return exists ? prev.map(f => f.id === flavor.id ? flavor : f) : [...prev, flavor];
      });
    }
  }

  async function deleteFlavor(id) {
    try {
      await updateDoc(doc(db, "flavors", id), { active: false });
    } catch (e) {
      setFlavors(prev => prev.filter(f => f.id !== id));
    }
  }

  async function saveSize(size) {
    try {
      await setDoc(doc(db, "sizes", size.id), size);
    } catch (e) {
      setSizes(prev => {
        const exists = prev.find(s => s.id === size.id);
        return exists ? prev.map(s => s.id === size.id ? size : s) : [...prev, size];
      });
    }
  }

  async function saveConfig(newConfig) {
    try {
      await setDoc(doc(db, "config", "main"), newConfig);
    } catch (e) {
      setConfig(newConfig);
    }
  }

  function login(password) {
    if (password === config.adminPassword) { setIsAdmin(true); return true; }
    return false;
  }
  function logout() { setIsAdmin(false); }

  return (
    <AppContext.Provider value={{
      sizes, flavors, config, orders, loaded, isAdmin,
      fcmToken, notifEnabled,
      createOrder, updateOrderStatus,
      saveFlavor, deleteFlavor, saveSize, saveConfig,
      login, logout, enableNotifications
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
