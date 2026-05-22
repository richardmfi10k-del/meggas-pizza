// src/App.js — VERSIÓN ACTUALIZADA
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import MenuPage from "./pages/MenuPage";
import KitchenPage from "./pages/KitchenPage";
import KitchenLogin from "./pages/KitchenLogin";
import AdminLogin from "./pages/AdminLogin";
import AdminPage from "./pages/AdminPage";
import "./index.css";

// ── Versión de la app — cambia este número cada vez que hagas un deploy importante
const APP_VERSION = "2.1";

// ── Guard para proteger la pantalla de cocina ──
function KitchenGuard() {
  const auth = sessionStorage.getItem("kitchen_auth");
  if (auth === "true") return <KitchenPage />;
  return <Navigate to="/cocina/login" replace />;
}

// ── Detector de versión nueva (problema 5: caché del navegador) ──
function VersionChecker() {
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("app_version");
    if (stored && stored !== APP_VERSION) {
      setShowReload(true);
    }
    localStorage.setItem("app_version", APP_VERSION);
  }, []);

  if (!showReload) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
      background: "#C0000A", color: "#FFE600", padding: "10px 16px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      fontFamily: "Nunito, sans-serif", fontSize: 14, fontWeight: 700
    }}>
      <span>🔄 Hay una versión nueva de la app</span>
      <button
        onClick={() => window.location.reload(true)}
        style={{
          background: "#FFE600", color: "#C0000A", border: "none",
          borderRadius: 8, padding: "6px 14px", fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit", fontSize: 13
        }}
      >
        Actualizar ahora
      </button>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <VersionChecker />
      <BrowserRouter>
        <Routes>
          <Route path="/"              element={<MenuPage />} />
          <Route path="/cocina/login"  element={<KitchenLogin />} />
          <Route path="/cocina"        element={<KitchenGuard />} />
          <Route path="/admin/login"   element={<AdminLogin />} />
          <Route path="/admin"         element={<AdminPage />} />
          <Route path="*"              element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
