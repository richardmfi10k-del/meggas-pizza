// src/pages/AdminLogin.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function AdminLogin() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin() {
    if (login(password)) {
      navigate("/admin");
    } else {
      setError("Contraseña incorrecta");
    }
  }

  return (
    <div className="page" style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "100vh" }}>
      <div className="brand-bar" style={{ marginBottom: "2rem" }}>
        <span className="brand-logo">🍕</span>
        <div>
          <div className="brand-name">Megga's Pizza</div>
          <div className="brand-sub">Panel de administración</div>
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: "1rem" }}>🔐 Acceso del dueño</div>
        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="Ingresa la contraseña"
            autoFocus
          />
        </div>
        {error && <div className="toast" style={{ marginBottom: "0.75rem" }}>⚠️ {error}</div>}
        <button className="btn-primary" onClick={handleLogin}>Entrar al panel</button>
      </div>

      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
        <a href="/" style={{ fontSize: 13, color: "#999", textDecoration: "none" }}>← Volver al menú</a>
      </div>

      <div style={{ textAlign: "center", marginTop: "0.5rem", fontSize: 12, color: "#ccc" }}>
        Contraseña por defecto: meggas2024 — cámbiala en Configuración
      </div>
    </div>
  );
}
