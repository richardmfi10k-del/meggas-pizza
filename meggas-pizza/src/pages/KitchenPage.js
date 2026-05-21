// src/pages/KitchenPage.js
// VERSIÓN ACTUALIZADA — con notificaciones push y sonido

import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";

function fmt(n) { return "$" + Math.round(n).toLocaleString("es-CO"); }

const COLUMNS = [
  { id: "nuevo",      label: "Nuevos",     icon: "🔔", colorClass: "nuevo" },
  { id: "preparando", label: "Preparando", icon: "🔥", colorClass: "preparando" },
  { id: "listo",      label: "Listos",     icon: "✅", colorClass: "listo" },
];

const NEXT = { nuevo: "preparando", preparando: "listo", listo: "entregado" };
const NEXT_LABEL = {
  nuevo: "Iniciar preparación",
  preparando: "Marcar listo",
  listo: "Marcar entregado"
};

// Genera un sonido de alerta con Web Audio API (sin archivo externo)
function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const times = [0, 0.25, 0.5];
    times.forEach(t => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.4, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.2);
    });
  } catch (e) {
    console.log("Audio no disponible");
  }
}

export default function KitchenPage() {
  const { orders, updateOrderStatus, enableNotifications, notifEnabled } = useApp();
  const [toast, setToast]           = useState(null);
  const [activating, setActivating] = useState(false);
  const [notifMsg, setNotifMsg]     = useState("");
  const prevIds  = useRef(new Set());
  const toastRef = useRef(null);

  // Detecta pedidos NUEVOS y dispara sonido + toast
  useEffect(() => {
    const newOrders = orders.filter(o => o.status === "nuevo");
    const currentIds = new Set(newOrders.map(o => o.id));

    newOrders.forEach(order => {
      if (!prevIds.current.has(order.id)) {
        // Pedido que no existía antes → es nuevo
        playAlertSound();
        setToast(`🍕 Nuevo pedido — ${order.producto} · ${order.cliente}`);
        clearTimeout(toastRef.current);
        toastRef.current = setTimeout(() => setToast(null), 6000);
      }
    });

    prevIds.current = currentIds;
  }, [orders]);

  async function handleEnableNotifications() {
    setActivating(true);
    const ok = await enableNotifications();
    setActivating(false);
    if (ok) {
      setNotifMsg("✅ Notificaciones activadas. Te avisaremos aunque cierres esta pestaña.");
    } else {
      setNotifMsg("⚠️ No se pudieron activar. Asegúrate de permitir notificaciones en Chrome.");
    }
    setTimeout(() => setNotifMsg(""), 5000);
  }

  async function advance(order) {
    const next = NEXT[order.status];
    if (next) await updateOrderStatus(order.id, next);
  }

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = orders.filter(o => o.status === col.id);
    return acc;
  }, {});

  return (
    <div className="page-wide">
      {/* Header */}
      <div className="admin-nav">
        <span className="admin-nav-title">🍕 Megga's Pizza — Cocina</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="live-pill"><div className="live-dot"></div>En vivo</div>
          <a href="/" className="nav-link" style={{ fontSize: 12, opacity: 0.7 }}>← Menú</a>
        </div>
      </div>

      {/* Banner activar notificaciones */}
      {!notifEnabled && (
        <div style={{
          background: "#fffbeb", border: "1px solid #f5d67a",
          borderRadius: "var(--radius, 10px)", padding: "12px 16px",
          marginBottom: "1rem", display: "flex",
          alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 10
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#854f0b" }}>
              🔔 Activa las notificaciones push
            </div>
            <div style={{ fontSize: 12, color: "#a16207", marginTop: 2 }}>
              Recibe alertas aunque esta pestaña esté cerrada
            </div>
          </div>
          <button
            className="btn-primary"
            style={{ width: "auto", padding: "8px 20px", fontSize: 13, background: "#d97706", borderColor: "#d97706" }}
            onClick={handleEnableNotifications}
            disabled={activating}
          >
            {activating ? "Activando..." : "Activar notificaciones"}
          </button>
        </div>
      )}

      {notifEnabled && (
        <div style={{
          background: "#f0fff4", border: "1px solid #b7e1be",
          borderRadius: 10, padding: "10px 16px", marginBottom: "1rem",
          fontSize: 13, color: "#1a7a31", fontWeight: 600
        }}>
          ✅ Notificaciones push activas en este dispositivo
        </div>
      )}

      {notifMsg && (
        <div className="toast" style={{ marginBottom: "1rem" }}>{notifMsg}</div>
      )}

      {/* Toast nuevo pedido */}
      {toast && (
        <div className="toast" style={{
          background: "#fff0f0", borderColor: "#f5c0c0", color: "#C0000A",
          fontSize: 14, fontWeight: 700, animation: "fadeIn 0.3s ease"
        }}>
          {toast}
        </div>
      )}

      {/* Tablero de cocina */}
      <div className="board">
        {COLUMNS.map(col => (
          <div key={col.id} className="board-col">
            <div className="col-hdr">
              {col.icon} {col.label}
              <span className="col-cnt">{grouped[col.id].length}</span>
            </div>

            {grouped[col.id].length === 0 && (
              <div className="empty-col">Sin pedidos</div>
            )}

            {grouped[col.id].map(order => (
              <div key={order.id} className={`order-card ${col.colorClass}`}>
                <div className="onum">
                  #{typeof order.id === "string" ? order.id.slice(-4).toUpperCase() : order.id}
                  {" · "}
                  {order.createdAt?.seconds
                    ? new Date(order.createdAt.seconds * 1000).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
                    : "Ahora"}
                </div>
                <div className="oprod">{order.producto}</div>
                <div className="oing">{order.ingredientes}</div>
                {order.nota && <div className="onote">📝 {order.nota}</div>}
                <div className="oaddr">📍 {order.direccion}</div>
                <div className="opay">
                  💳 {order.pago} · {fmt(order.total)} · {order.telefono}
                </div>
                <button
                  style={{
                    width: "100%", padding: "6px",
                    border: col.id === "listo" ? "1.5px solid #1a7a31" : "1.5px solid #C0000A",
                    borderRadius: 8, background: "transparent",
                    color: col.id === "listo" ? "#1a7a31" : "#C0000A",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    fontFamily: "inherit"
                  }}
                  onClick={() => advance(order)}
                >
                  {NEXT_LABEL[order.status]}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
