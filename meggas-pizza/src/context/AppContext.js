// src/context/AppContext.js — FIX: Seed inteligente por colección
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection, doc, onSnapshot, setDoc, updateDoc,
  addDoc, serverTimestamp, getDocs, writeBatch, runTransaction
} from "firebase/firestore";
import { db, requestNotificationPermission, onForegroundMessage } from "../firebase";
import {
  defaultSizes, defaultCategories, defaultProducts,
  defaultConfig, defaultVariants
} from "../defaultData";

const AppContext = createContext();
const VAPID_KEY = "TU_VAPID_KEY_AQUI"; // Firebase Console → meggas-pizza → Cloud Messaging → Web Push certificates

export function AppProvider({ children }) {
  const [sizes, setSizes]           = useState(defaultSizes);
  const [categories, setCategories] = useState(defaultCategories);
  const [products, setProducts]     = useState(defaultProducts);
  const [variants, setVariants]     = useState(defaultVariants);
  const [config, setConfig]         = useState(defaultConfig);
  const [orders, setOrders]         = useState([]);
  const [loaded, setLoaded]         = useState(false);
  const [isAdmin, setIsAdmin]       = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);

  // ── Seed inteligente — verifica CADA colección por separado ──────────────
  // Así si agregamos una colección nueva en el futuro, se crea sola
  // aunque las demás colecciones ya tengan datos
  async function seedCollectionIfEmpty(collectionName, data, keyField = "id") {
    try {
      const snap = await getDocs(collection(db, collectionName));
      if (snap.empty && data.length > 0) {
        console.log(`Creando colección ${collectionName} con ${data.length} documentos...`);
        const batch = writeBatch(db);
        data.forEach(item => batch.set(doc(db, collectionName, item[keyField]), item));
        await batch.commit();
        console.log(`✅ Colección ${collectionName} creada`);
      }
    } catch (e) {
      console.log(`Error en seed de ${collectionName}:`, e.message);
    }
  }

  async function seedConfigIfEmpty() {
    try {
      const snap = await getDocs(collection(db, "config"));
      if (snap.empty) {
        await setDoc(doc(db, "config", "main"), defaultConfig);
        console.log("✅ Config creada");
      }
    } catch (e) {
      console.log("Error en seed de config:", e.message);
    }
  }

  async function seedAll() {
    // Cada colección se verifica INDEPENDIENTEMENTE
    // Si variants está vacía la crea, aunque categories tenga datos
    await seedCollectionIfEmpty("categories", defaultCategories);
    await seedCollectionIfEmpty("products",   defaultProducts);
    await seedCollectionIfEmpty("sizes",      defaultSizes);
    await seedCollectionIfEmpty("variants",   defaultVariants);
    await seedConfigIfEmpty();
  }

  async function enableNotifications() {
    try {
      const token = await requestNotificationPermission(VAPID_KEY);
      if (token) {
        setNotifEnabled(true);
        await setDoc(doc(db, "fcm_tokens", token), {
          token, device: navigator.userAgent, createdAt: serverTimestamp()
        });
        return true;
      }
      return false;
    } catch (e) { return false; }
  }

  useEffect(() => {
    // Ejecuta seed inteligente al iniciar
    seedAll();

    const unsubs = [];
    try {
      unsubs.push(onSnapshot(collection(db, "sizes"), snap => {
        const d = snap.docs.map(x => ({ id: x.id, ...x.data() }));
        if (d.length) setSizes(d.sort((a, b) => a.order - b.order));
      }));

      unsubs.push(onSnapshot(collection(db, "categories"), snap => {
        const d = snap.docs.map(x => ({ id: x.id, ...x.data() })).filter(c => c.active);
        if (d.length) setCategories(d.sort((a, b) => a.order - b.order));
      }));

      unsubs.push(onSnapshot(collection(db, "products"), snap => {
        const d = snap.docs.map(x => ({ id: x.id, ...x.data() }));
        if (d.length) setProducts(d.sort((a, b) => a.order - b.order));
      }));

      // ── Listener variantes ──────────────────────────────────────────────
      unsubs.push(onSnapshot(collection(db, "variants"), snap => {
        const d = snap.docs.map(x => ({ id: x.id, ...x.data() }))
          .filter(v => v.active !== false);
        console.log(`Variantes cargadas desde Firebase: ${d.length}`);
        setVariants(d);
      }));

      unsubs.push(onSnapshot(doc(db, "config", "main"), snap => {
        if (snap.exists()) setConfig(snap.data());
      }));

      unsubs.push(onSnapshot(collection(db, "orders"), snap => {
        const d = snap.docs
          .map(x => ({ id: x.id, ...x.data() }))
          .filter(o => o.status !== "entregado")
          .sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0));
        setOrders(d);
      }));

      onForegroundMessage(() => {});
    } catch (e) {
      console.log("Error iniciando listeners:", e.message);
    }

    setLoaded(true);
    return () => unsubs.forEach(u => u());
  }, []);

  // ── Número de pedido único y atómico ─────────────────────────────────────
  function getJornadaColombia() {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
    const hour = now.getHours();
    if (hour < 6) now.setDate(now.getDate() - 1);
    const yyyy = now.getFullYear();
    const mm   = String(now.getMonth() + 1).padStart(2, "0");
    const dd   = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  async function getNextOrderNumber() {
    try {
      const configRef = doc(db, "config", "main");
      return await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(configRef);
        if (!snap.exists()) throw new Error("Config no encontrado");
        const data           = snap.data();
        const jornada        = getJornadaColombia();
        const lastOrderDate  = data.lastOrderDate ?? "";
        const currentCounter = data.orderCounter  ?? 0;
        const nextCounter    = lastOrderDate !== jornada ? 1 : currentCounter + 1;
        transaction.update(configRef, { orderCounter: nextCounter, lastOrderDate: jornada });
        return nextCounter;
      });
    } catch (e) {
      return (config.orderCounter || 0) + 1;
    }
  }

  async function createOrder(orderData) {
    try {
      const orderNumber = await getNextOrderNumber();
      const ref = await addDoc(collection(db, "orders"), {
        ...orderData, orderNumber, status: "nuevo", createdAt: serverTimestamp(),
      });
      return { id: ref.id, orderNumber };
    } catch (e) {
      const orderNumber = (config.orderCounter || 0) + 1;
      const o = {
        ...orderData, id: "demo-" + Date.now(), orderNumber,
        status: "nuevo", createdAt: { seconds: Date.now() / 1000 }
      };
      setOrders(prev => [...prev, o]);
      return { id: o.id, orderNumber };
    }
  }

  async function updateOrderStatus(id, status) {
    try { await updateDoc(doc(db, "orders", id), { status }); }
    catch (e) { setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o)); }
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────
  async function saveCategory(cat) {
    try { await setDoc(doc(db, "categories", cat.id), cat); }
    catch (e) { setCategories(prev => { const ex = prev.find(c => c.id === cat.id); return ex ? prev.map(c => c.id === cat.id ? cat : c) : [...prev, cat]; }); }
  }
  async function deleteCategory(id) {
    try { await updateDoc(doc(db, "categories", id), { active: false }); }
    catch (e) { setCategories(prev => prev.filter(c => c.id !== id)); }
  }
  async function saveProduct(product) {
    try { await setDoc(doc(db, "products", product.id), product); }
    catch (e) { setProducts(prev => { const ex = prev.find(p => p.id === product.id); return ex ? prev.map(p => p.id === product.id ? product : p) : [...prev, product]; }); }
  }
  async function deleteProduct(id) {
    try { await updateDoc(doc(db, "products", id), { active: false }); }
    catch (e) { setProducts(prev => prev.filter(p => p.id !== id)); }
  }
  async function saveSize(size) {
    try { await setDoc(doc(db, "sizes", size.id), size); }
    catch (e) { setSizes(prev => { const ex = prev.find(s => s.id === size.id); return ex ? prev.map(s => s.id === size.id ? size : s) : [...prev, size]; }); }
  }
  async function saveConfig(newConfig) {
    try { await setDoc(doc(db, "config", "main"), newConfig); }
    catch (e) { setConfig(newConfig); }
  }

  // ── CRUD Variantes ────────────────────────────────────────────────────────
  async function saveVariant(variant) {
    try { await setDoc(doc(db, "variants", variant.id), variant); }
    catch (e) { setVariants(prev => { const ex = prev.find(v => v.id === variant.id); return ex ? prev.map(v => v.id === variant.id ? variant : v) : [...prev, variant]; }); }
  }
  async function deleteVariant(id) {
    try { await updateDoc(doc(db, "variants", id), { active: false }); }
    catch (e) { setVariants(prev => prev.filter(v => v.id !== id)); }
  }

  function login(pw) { if (pw === config.adminPassword) { setIsAdmin(true); return true; } return false; }
  function logout() { setIsAdmin(false); }

  return (
    <AppContext.Provider value={{
      sizes, categories, products, variants, config, orders, loaded, isAdmin, notifEnabled,
      createOrder, updateOrderStatus,
      saveCategory, deleteCategory,
      saveProduct, deleteProduct,
      saveSize, saveConfig,
      saveVariant, deleteVariant,
      login, logout, enableNotifications
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
