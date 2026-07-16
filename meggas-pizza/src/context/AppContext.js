// src/context/AppContext.js — MULTI-TENANT: todo scoped a restaurants/{slug}/...
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection, doc, onSnapshot, setDoc, updateDoc,
  addDoc, serverTimestamp, getDocs, getDoc, writeBatch, runTransaction
} from "firebase/firestore";
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, sendPasswordResetEmail, deleteUser
} from "firebase/auth";
import { db, auth, requestNotificationPermission, onForegroundMessage } from "../firebase";
import {
  defaultSizes, defaultCategories, defaultProducts,
  defaultConfig, defaultVariants, defaultAdditions
} from "../defaultData";

const AppContext = createContext();
const VAPID_KEY = "BGCxhib2oWAJlz5hZ9yAz8vKz_lrFbOrmAgNh2MMHEnEQQvG-20vXzxSZFIqtYy29MB3ut5rF0JqCOHD8vqqsOU"; // ← tu VAPID Key real

// Aclara (percent > 0) u oscurece (percent < 0) un color hex. percent va de -1 a 1.
function shadeColor(hex, percent) {
  const f = parseInt(hex.slice(1), 16);
  const t = percent < 0 ? 0 : 255;
  const p = percent < 0 ? percent * -1 : percent;
  const R = f >> 16, G = (f >> 8) & 0x00ff, B = f & 0x0000ff;
  return "#" + (
    0x1000000 +
    (Math.round((t - R) * p) + R) * 0x10000 +
    (Math.round((t - G) * p) + G) * 0x100 +
    (Math.round((t - B) * p) + B)
  ).toString(16).slice(1);
}

// Todas las rutas de Firestore de este restaurante cuelgan de aquí
function scoped(slug, sub) {
  return sub ? `restaurants/${slug}/${sub}` : `restaurants/${slug}`;
}

export function AppProvider({ slug, children }) {
  // "checking" | "not_found" | "ok" | "error"
  const [restaurantStatus, setRestaurantStatus] = useState("checking");
  const [restaurantMeta, setRestaurantMeta]     = useState(null); // {name, status, plan, ownerClaimed, ownerUid}

  const [sizes, setSizes]           = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts]     = useState([]);
  const [variants, setVariants]     = useState([]);
  const [additions, setAdditions]   = useState([]);
  const [ingredients, setIngredients] = useState([]); // listo para la próxima mejora (bloqueo por ingrediente)
  const [config, setConfig]         = useState(defaultConfig);
  const [orders, setOrders]         = useState([]);
  const [loaded, setLoaded]         = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);

  // ── Auth del dueño del restaurante (Firebase Auth real) ───────────────────
  const [ownerUser, setOwnerUser]   = useState(null);
  const [isAdmin, setIsAdmin]       = useState(false);
  const [authChecked, setAuthChecked] = useState(false); // evita parpadeo/redirect prematuro

  // 1. Verifica que el restaurante exista antes de hacer nada más
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setRestaurantStatus("checking");
    (async () => {
      try {
        const rSnap = await getDoc(doc(db, "restaurants", slug));
        if (cancelled) return;
        if (!rSnap.exists()) { setRestaurantStatus("not_found"); return; }
        setRestaurantStatus("ok");
      } catch (e) {
        if (!cancelled) setRestaurantStatus("error");
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  // ── Seed inteligente — verifica CADA colección por separado ──────────────
  async function seedCollectionIfEmpty(sub, data, keyField = "id") {
    try {
      const snap = await getDocs(collection(db, scoped(slug, sub)));
      if (snap.empty && data.length > 0) {
        const batch = writeBatch(db);
        data.forEach(item => batch.set(doc(db, scoped(slug, sub), item[keyField]), item));
        await batch.commit();
      }
    } catch (e) {
      console.log(`Error en seed de ${sub}:`, e.message);
    }
  }

  async function seedConfigIfEmpty() {
    try {
      const snap = await getDoc(doc(db, scoped(slug, "config/main")));
      if (!snap.exists()) {
        await setDoc(doc(db, scoped(slug, "config/main")), defaultConfig);
      }
    } catch (e) {
      console.log("Error en seed de config:", e.message);
    }
  }

  async function seedAll() {
    await seedCollectionIfEmpty("categories", defaultCategories);
    await seedCollectionIfEmpty("products",   defaultProducts);
    await seedCollectionIfEmpty("sizes",      defaultSizes);
    await seedCollectionIfEmpty("variants",   defaultVariants);
    await seedCollectionIfEmpty("additions",  defaultAdditions);
    // "ingredients" NO se siembra con datos por defecto — cada negocio define los suyos
    await seedConfigIfEmpty();
  }

  // ── Color de marca por restaurante — se aplica como variables CSS ────────
  // Toma config.colorPrimary (elegido por el dueño en Configuración) y
  // recalcula automáticamente la versión oscura (hover) y clara (fondos
  // suaves) para no tener que pedirle 3 colores al dueño, solo 1.
  useEffect(() => {
    const primary = config.colorPrimary || "#C0000A";
    document.documentElement.style.setProperty("--red", primary);
    document.documentElement.style.setProperty("--red-dark", shadeColor(primary, -0.35));
    document.documentElement.style.setProperty("--red-light", shadeColor(primary, 0.92));
  }, [config.colorPrimary]);

  async function enableNotifications() {
    try {
      const token = await requestNotificationPermission(VAPID_KEY);
      if (token) {
        setNotifEnabled(true);
        await setDoc(doc(db, scoped(slug, "fcm_tokens"), token), {
          token, device: navigator.userAgent, createdAt: serverTimestamp()
        });
        return true;
      }
      return false;
    } catch (e) { return false; }
  }

  // 2. Una vez confirmado que el restaurante existe: seed + listeners
  useEffect(() => {
    if (restaurantStatus !== "ok" || !slug) return;

    seedAll();
    const unsubs = [];
    try {
      unsubs.push(onSnapshot(doc(db, "restaurants", slug), snap => {
        if (snap.exists()) setRestaurantMeta({ id: snap.id, ...snap.data() });
      }));

      unsubs.push(onSnapshot(collection(db, scoped(slug, "sizes")), snap => {
        const d = snap.docs.map(x => ({ id: x.id, ...x.data() }));
        setSizes(d.sort((a, b) => a.order - b.order));
      }));

      unsubs.push(onSnapshot(collection(db, scoped(slug, "categories")), snap => {
        const d = snap.docs.map(x => ({ id: x.id, ...x.data() })).filter(c => c.active);
        setCategories(d.sort((a, b) => a.order - b.order));
      }));

      unsubs.push(onSnapshot(collection(db, scoped(slug, "products")), snap => {
        const d = snap.docs.map(x => ({ id: x.id, ...x.data() }));
        setProducts(d.sort((a, b) => a.order - b.order));
      }));

      unsubs.push(onSnapshot(collection(db, scoped(slug, "variants")), snap => {
        const d = snap.docs.map(x => ({ id: x.id, ...x.data() })).filter(v => v.active !== false);
        setVariants(d);
      }));

      unsubs.push(onSnapshot(collection(db, scoped(slug, "additions")), snap => {
        const d = snap.docs.map(x => ({ id: x.id, ...x.data() }));
        setAdditions(d.sort((a, b) => (a.order || 0) - (b.order || 0)));
      }));

      unsubs.push(onSnapshot(collection(db, scoped(slug, "ingredients")), snap => {
        const d = snap.docs.map(x => ({ id: x.id, ...x.data() }));
        setIngredients(d);
      }));

      unsubs.push(onSnapshot(doc(db, scoped(slug, "config/main")), snap => {
        if (snap.exists()) setConfig(snap.data());
      }));

      unsubs.push(onSnapshot(collection(db, scoped(slug, "orders")), snap => {
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
  }, [restaurantStatus, slug]);

  // 3. Sesión del dueño (Firebase Auth) — se re-evalúa si cambia el slug,
  //    así estar logueado en el admin de OTRO restaurante nunca da acceso aquí.
  useEffect(() => {
    if (!slug) return;
    setAuthChecked(false);
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setOwnerUser(null); setIsAdmin(false); setAuthChecked(true); return; }
      try {
        const uSnap = await getDoc(doc(db, "users", user.uid));
        const data = uSnap.exists() ? uSnap.data() : null;
        const belongsHere = data && data.role === "restaurant_owner" && data.restaurantSlug === slug;
        setOwnerUser(belongsHere ? user : null);
        setIsAdmin(!!belongsHere);
      } catch (e) {
        setOwnerUser(null); setIsAdmin(false);
      }
      setAuthChecked(true);
    });
    return () => unsub();
  }, [slug]);

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
    const configRef = doc(db, scoped(slug, "config/main"));
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
  }

  async function createOrder(orderData) {
    const orderNumber = await getNextOrderNumber();
    const ref = await addDoc(collection(db, scoped(slug, "orders")), {
      ...orderData, orderNumber, status: "nuevo", createdAt: serverTimestamp(),
    });
    return { id: ref.id, orderNumber };
  }

  async function updateOrderStatus(id, status) {
    await updateDoc(doc(db, scoped(slug, "orders"), id), { status });
  }

  // ── CRUD menú ────────────────────────────────────────────────────────────
  async function saveCategory(cat) { await setDoc(doc(db, scoped(slug, "categories"), cat.id), cat); }
  async function deleteCategory(id) { await updateDoc(doc(db, scoped(slug, "categories"), id), { active: false }); }
  async function saveProduct(product) { await setDoc(doc(db, scoped(slug, "products"), product.id), product); }
  async function deleteProduct(id) { await updateDoc(doc(db, scoped(slug, "products"), id), { active: false }); }
  async function saveSize(size) { await setDoc(doc(db, scoped(slug, "sizes"), size.id), size); }
  async function saveConfig(newConfig) { await setDoc(doc(db, scoped(slug, "config/main")), newConfig); }

  async function saveVariant(variant) { await setDoc(doc(db, scoped(slug, "variants"), variant.id), variant); }
  async function deleteVariant(id) { await updateDoc(doc(db, scoped(slug, "variants"), id), { active: false }); }

  async function saveAddition(addition) { await setDoc(doc(db, scoped(slug, "additions"), addition.id), addition); }
  async function deleteAddition(id) { await updateDoc(doc(db, scoped(slug, "additions"), id), { active: false }); }

  // Scaffold listo para la mejora de "bloqueo por ingrediente agotado"
  async function saveIngredient(ingredient) { await setDoc(doc(db, scoped(slug, "ingredients"), ingredient.id), ingredient); }
  async function deleteIngredient(id) { await updateDoc(doc(db, scoped(slug, "ingredients"), id), { active: false }); }

  // ── Auth del dueño — crear cuenta (reclamo), iniciar sesión, recuperar ───
  // NOTA: son 2 escrituras SECUENCIALES, no una transacción atómica. Se hizo
  // así a propósito porque la regla de Firestore que protege restaurants/{slug}
  // exige que users/{uid} YA exista antes de permitir el reclamo — meterlo en
  // una sola transacción dependía de que las reglas vieran la escritura de
  // "users" todavía pendiente dentro de la misma transacción al validar la
  // de "restaurants", y no queríamos apostar por ese comportamiento.
  // Riesgo aceptado: si el paso 2 falla justo después del paso 1 (muy
  // improbable), queda un users/{uid} "huérfano" sin el restaurante marcado
  // como reclamado — recuperable a mano por el super_admin si llega a pasar.
  async function signupOwner(email, password) {
    let cred;
    try {
      cred = await createUserWithEmailAndPassword(auth, email, password);
    } catch (e) {
      const msg = e.code === "auth/email-already-in-use" ? "Ese correo ya está registrado."
        : e.code === "auth/weak-password" ? "La contraseña debe tener al menos 6 caracteres."
        : "No se pudo crear la cuenta: " + e.message;
      return { ok: false, error: msg };
    }

    // Paso 1: verifica que el restaurante siga sin reclamar y crea users/{uid}
    try {
      const rSnap = await getDoc(doc(db, "restaurants", slug));
      if (!rSnap.exists()) throw new Error("Restaurante no encontrado");
      if (rSnap.data().ownerClaimed) throw new Error("ALREADY_CLAIMED");
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid, email, role: "restaurant_owner",
        restaurantSlug: slug, createdAt: serverTimestamp()
      });
    } catch (e) {
      try { await deleteUser(cred.user); } catch (_) {}
      const msg = e.message === "ALREADY_CLAIMED"
        ? "Este restaurante ya tiene una cuenta creada. Si eres el dueño, usa 'Iniciar sesión' o recupera tu contraseña."
        : e.message;
      return { ok: false, error: msg };
    }

    // Paso 2: marca el restaurante como reclamado (ahora sí, users/{uid} ya existe)
    try {
      await updateDoc(doc(db, "restaurants", slug), { ownerClaimed: true, ownerUid: cred.user.uid });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: "Tu cuenta se creó, pero hubo un problema marcando el restaurante como reclamado. Escríbenos para resolverlo manualmente." };
    }
  }

  async function loginOwner(email, password) {
    let cred;
    try {
      cred = await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      return { ok: false, error: "Correo o contraseña incorrectos." };
    }
    // El login de Firebase puede ser válido pero pertenecer a OTRO
    // restaurante — sin esto, la persona se quedaba viendo cómo "no pasaba
    // nada" (login exitoso, pero rebotado en silencio por AdminGuard).
    try {
      const uSnap = await getDoc(doc(db, "users", cred.user.uid));
      const data = uSnap.exists() ? uSnap.data() : null;
      const belongsHere = data && data.role === "restaurant_owner" && data.restaurantSlug === slug;
      if (!belongsHere) {
        await signOut(auth);
        return { ok: false, error: "Esta cuenta no tiene acceso a este restaurante." };
      }
      return { ok: true };
    } catch (e) {
      await signOut(auth);
      return { ok: false, error: "No se pudo verificar el acceso. Intenta de nuevo." };
    }
  }

  async function resetOwnerPassword(email) {
    try { await sendPasswordResetEmail(auth, email); return { ok: true }; }
    catch (e) { return { ok: false, error: "No se pudo enviar el correo de recuperación." }; }
  }

  function logout() { signOut(auth); }

  return (
    <AppContext.Provider value={{
      slug, restaurantStatus, restaurantMeta,
      sizes, categories, products, variants, additions, ingredients, config, orders, loaded,
      isAdmin, authChecked, ownerUser, notifEnabled,
      createOrder, updateOrderStatus,
      saveCategory, deleteCategory,
      saveProduct, deleteProduct,
      saveSize, saveConfig,
      saveVariant, deleteVariant,
      saveAddition, deleteAddition,
      saveIngredient, deleteIngredient,
      signupOwner, loginOwner, resetOwnerPassword, logout,
      enableNotifications
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
