// src/pages/KitchenLogin.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function KitchenLogin() {
  const { config } = useApp();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin() {
    // Usa una contraseña separada para cocina guardada en config
    // Si no existe kitchenPassword, usa la misma del admin como fallback
    const kitchenPw = config.kitchenPassword || config.adminPassword;
    if (password === kitchenPw) {
      // Guarda en sessionStorage — dura mientras el navegador esté abierto
      sessionStorage.setItem("kitchen_auth", "true");
      navigate("/cocina");
    } else {
      setError("Contraseña incorrecta");
      setPassword("");
    }
  }

  return (
    <div className="page" style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "100vh" }}>
      <div className="brand-bar" style={{ marginBottom: "2rem" }}>
        <span className="brand-logo">🍕</span>
        <div>
          <div className="brand-name">Megga's Pizza</div>
          <div className="brand-sub">Pantalla de cocina</div>
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: "0.5rem" }}>👨‍🍳 Acceso a cocina</div>
        <div style={{ fontSize: 13, color: "#666", marginBottom: "1rem" }}>
          Solo el personal del negocio puede ver esta pantalla.
        </div>
        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="Ingresa la contraseña de cocina"
            autoFocus
          />
        </div>
        {error && (
          <div className="toast" style={{ marginBottom: "0.75rem" }}>⚠️ {error}</div>
        )}
        <button className="btn-primary" onClick={handleLogin}>
          Entrar a cocina
        </button>
      </div>

      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
        <a href="/" style={{ fontSize: 13, color: "#999", textDecoration: "none" }}>← Volver al menú</a>
      </div>
      <div style={{ textAlign: "center", marginTop: "0.5rem", fontSize: 12, color: "#ccc" }}>
        La contraseña se configura en el panel admin → Configuración
      </div>
    </div>
  );
}
