// src/context/AppContext.js — VERSIÓN 2
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection, doc, onSnapshot, setDoc, updateDoc,
  addDoc, serverTimestamp, getDocs, writeBatch
} from "firebase/firestore";
import { db, requestNotificationPermission, onForegroundMessage } from "../firebase";
import { defaultSizes, defaultCategories, defaultProducts, defaultConfig } from "../defaultData";

const AppContext = createContext();
const VAPID_KEY = "TU_VAPID_KEY_AQUI"; // ← mismo que antes

export function AppProvider({ children }) {
  const [sizes, setSizes]           = useState(defaultSizes);
  const [categories, setCategories] = useState(defaultCategories);
  const [products, setProducts]     = useState(defaultProducts);
  const [config, setConfig]         = useState(defaultConfig);
  const [orders, setOrders]         = useState([]);
  const [loaded, setLoaded]         = useState(false);
  const [isAdmin, setIsAdmin]       = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);

  async function seedIfEmpty() {
    try {
      const snap = await getDocs(collection(db, "categories"));
      if (snap.empty) {
        const batch = writeBatch(db);
        defaultCategories.forEach(c => batch.set(doc(db, "categories", c.id), c));
        defaultProducts.forEach(p => batch.set(doc(db, "products", p.id), p));
        defaultSizes.forEach(s => batch.set(doc(db, "sizes", s.id), s));
        await batch.commit();
        await setDoc(doc(db, "config", "main"), defaultConfig);
      }
    } catch (e) { console.log("Usando datos locales"); }
  }

  async function enableNotifications() {
    try {
      const token = await requestNotificationPermission(VAPID_KEY);
      if (token) {
        setNotifEnabled(true);
        await setDoc(doc(db, "fcm_tokens", token), { token, device: navigator.userAgent, createdAt: serverTimestamp() });
        return true;
      }
      return false;
    } catch (e) { return false; }
  }

  useEffect(() => {
    seedIfEmpty();
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
        const d = snap.docs.map(x => ({ id: x.id, ...x.data() })).filter(p => p.active);
        if (d.length) setProducts(d.sort((a, b) => a.order - b.order));
      }));
      unsubs.push(onSnapshot(doc(db, "config", "main"), snap => {
        if (snap.exists()) setConfig(snap.data());
      }));
      unsubs.push(onSnapshot(collection(db, "orders"), snap => {
        const d = snap.docs.map(x => ({ id: x.id, ...x.data() }))
          .filter(o => o.status !== "entregado")
          .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        setOrders(d);
      }));
      onForegroundMessage(() => {});
    } catch (e) { console.log("Modo demo"); }
    setLoaded(true);
    return () => unsubs.forEach(u => u());
  }, []);

  async function createOrder(orderData) {
    try {
      const ref = await addDoc(collection(db, "orders"), { ...orderData, status: "nuevo", createdAt: serverTimestamp() });
      return ref.id;
    } catch (e) {
      const o = { ...orderData, id: "demo-" + Date.now(), status: "nuevo", createdAt: { seconds: Date.now() / 1000 } };
      setOrders(prev => [...prev, o]);
      return o.id;
    }
  }

  async function updateOrderStatus(id, status) {
    try { await updateDoc(doc(db, "orders", id), { status }); }
    catch (e) { setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o)); }
  }

  // ── Categorías ──
  async function saveCategory(cat) {
    try { await setDoc(doc(db, "categories", cat.id), cat); }
    catch (e) { setCategories(prev => { const ex = prev.find(c => c.id === cat.id); return ex ? prev.map(c => c.id === cat.id ? cat : c) : [...prev, cat]; }); }
  }
  async function deleteCategory(id) {
    try { await updateDoc(doc(db, "categories", id), { active: false }); }
    catch (e) { setCategories(prev => prev.filter(c => c.id !== id)); }
  }

  // ── Productos ──
  async function saveProduct(product) {
    try { await setDoc(doc(db, "products", product.id), product); }
    catch (e) { setProducts(prev => { const ex = prev.find(p => p.id === product.id); return ex ? prev.map(p => p.id === product.id ? product : p) : [...prev, product]; }); }
  }
  async function deleteProduct(id) {
    try { await updateDoc(doc(db, "products", id), { active: false }); }
    catch (e) { setProducts(prev => prev.filter(p => p.id !== id)); }
  }

  // ── Tamaños ──
  async function saveSize(size) {
    try { await setDoc(doc(db, "sizes", size.id), size); }
    catch (e) { setSizes(prev => { const ex = prev.find(s => s.id === size.id); return ex ? prev.map(s => s.id === size.id ? size : s) : [...prev, size]; }); }
  }

  async function saveConfig(newConfig) {
    try { await setDoc(doc(db, "config", "main"), newConfig); }
    catch (e) { setConfig(newConfig); }
  }

  function login(pw) { if (pw === config.adminPassword) { setIsAdmin(true); return true; } return false; }
  function logout() { setIsAdmin(false); }

  return (
    <AppContext.Provider value={{
      sizes, categories, products, config, orders, loaded, isAdmin, notifEnabled,
      createOrder, updateOrderStatus,
      saveCategory, deleteCategory,
      saveProduct, deleteProduct,
      saveSize, saveConfig,
      login, logout, enableNotifications
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
