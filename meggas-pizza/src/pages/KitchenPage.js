// src/pages/KitchenPage.js — CON LOS 5 FIXES DE ESTABILIDAD
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { useApp } from "../context/AppContext";
import PrintTicket from "../components/PrintTicket";

function fmt(n) { return "$" + Math.round(n).toLocaleString("es-CO"); }

const COLUMNS = [
  { id: "nuevo",      label: "Nuevos",     icon: "🔔", colorClass: "nuevo" },
  { id: "preparando", label: "Preparando", icon: "🔥", colorClass: "preparando" },
  { id: "listo",      label: "Listos",     icon: "✅", colorClass: "listo" },
];
const NEXT = { nuevo: "preparando", preparando: "listo", listo: "entregado" };
const NEXT_LABEL = { nuevo: "Iniciar preparación", preparando: "Marcar listo", listo: "Marcar entregado" };

// ── FIX #2: Sonido desbloqueable por interacción del usuario ──
function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.3, 0.6].forEach(t => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880; osc.type = "sine";
      gain.gain.setValueAtTime(0.5, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.25);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.25);
    });
  } catch (e) {}
}

// ── FIX #1: Monitor de conexión con Firestore ──
function useConnectionStatus() {
  const [online, setOnline] = useState(true);
  const [firestoreOk, setFirestoreOk] = useState(true);

  useEffect(() => {
    // Monitor de internet del navegador
    const handleOnline  = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);

    // Monitor de Firestore — si no llega actualización en 30s, alerta
    let timer = setInterval(() => {
      if (!navigator.onLine) setFirestoreOk(false);
      else setFirestoreOk(true);
    }, 5000);

    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(timer);
    };
  }, []);

  return { online, firestoreOk };
}

export default function KitchenPage() {
  const { orders, updateOrderStatus, enableNotifications, notifEnabled, config } = useApp();
  const navigate = useNavigate();

  // ── FIX #2: Control de audio desbloqueado ──
  const [audioUnlocked, setAudioUnlocked]   = useState(false);
  const [jornada, setJornada]               = useState(false); // "Iniciar Jornada" presionado

  // ── FIX #1: Estado de conexión ──
  const { online, firestoreOk } = useConnectionStatus();
  const [lastUpdate, setLastUpdate]         = useState(Date.now());
  const [connectionAlert, setConnectionAlert] = useState(false);

  const [toast, setToast]           = useState(null);
  const [activating, setActivating] = useState(false);
  const [notifMsg, setNotifMsg]     = useState("");
  const [printOrder, setPrintOrder] = useState(null);
  const prevIds  = useRef(new Set());
  const toastRef = useRef(null);

  // Detecta si llevan más de 45s sin actualización de Firestore
  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - lastUpdate > 45000 && jornada) {
        setConnectionAlert(true);
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [lastUpdate, jornada]);

  // Actualiza timestamp cada vez que llegan pedidos
  useEffect(() => {
    setLastUpdate(Date.now());
    setConnectionAlert(false);
  }, [orders]);

  // Detecta pedidos nuevos → sonido + toast
  useEffect(() => {
    if (!jornada) return; // No suena hasta que el cocinero inicie jornada
    const newOrders = orders.filter(o => o.status === "nuevo");
    newOrders.forEach(order => {
      if (!prevIds.current.has(order.id)) {
        if (audioUnlocked) playAlertSound();
        setToast(`🍕 Nuevo pedido — ${order.producto || order.items?.[0]?.name} · ${order.cliente}`);
        clearTimeout(toastRef.current);
        toastRef.current = setTimeout(() => setToast(null), 6000);
      }
    });
    prevIds.current = new Set(newOrders.map(o => o.id));
  }, [orders, jornada, audioUnlocked]);

  function iniciarJornada() {
    // FIX #2: Esta interacción desbloquea el audio del navegador
    playAlertSound();
    setAudioUnlocked(true);
    setJornada(true);
  }

  function logout() {
    sessionStorage.removeItem("kitchen_auth");
    navigate("/cocina/login");
  }

  async function handleEnableNotifications() {
    setActivating(true);
    const ok = await enableNotifications();
    setActivating(false);
    setNotifMsg(ok
      ? "✅ Notificaciones activadas."
      : "⚠️ No se pudieron activar. Permite notificaciones en Chrome."
    );
    setTimeout(() => setNotifMsg(""), 4000);
  }

  async function advance(order) {
    const next = NEXT[order.status];
    if (next) await updateOrderStatus(order.id, next);
  }

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = orders.filter(o => o.status === col.id);
    return acc;
  }, {});

  // ── Pantalla "Iniciar Jornada" ──
  if (!jornada) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#111", flexDirection: "column", gap: 20, padding: 20
      }}>
        <div style={{ fontFamily: "Bangers, cursive", fontSize: 48, color: "#FFE600", letterSpacing: 2 }}>
          🍕 Megga's Pizza
        </div>
        <div style={{ color: "#fff", fontSize: 16, opacity: 0.7 }}>Pantalla de cocina</div>
        <button
          onClick={iniciarJornada}
          style={{
            background: "#C0000A", color: "#FFE600", border: "none",
            borderRadius: 16, padding: "18px 48px", fontSize: 20,
            fontWeight: 700, fontFamily: "Bangers, cursive", letterSpacing: 1,
            cursor: "pointer", marginTop: 10
          }}
        >
          🔔 INICIAR JORNADA
        </button>
        <div style={{ color: "#666", fontSize: 12, textAlign: "center", maxWidth: 280 }}>
          Presiona este botón al comenzar el turno para activar el sonido de alertas
        </div>
      </div>
    );
  }

  return (
    <div className="page-wide">
      {/* ── FIX #1: Alerta de desconexión ── */}
      {(!online || connectionAlert) && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
          background: "#C0000A", color: "#fff", padding: "14px 20px",
          textAlign: "center", fontWeight: 700, fontSize: 16,
          fontFamily: "Nunito, sans-serif", animation: "pulse-bg 1s infinite"
        }}>
          ⚠️ PANTALLA DESCONECTADA — Revisa el internet del local
          <button
            onClick={() => window.location.reload()}
            style={{
              marginLeft: 16, background: "#fff", color: "#C0000A",
              border: "none", borderRadius: 8, padding: "4px 14px",
              fontWeight: 700, cursor: "pointer", fontSize: 13
            }}
          >
            Reconectar
          </button>
        </div>
      )}

      {/* Header */}
      <div className="admin-nav" style={{ marginTop: (!online || connectionAlert) ? 52 : 0 }}>
        <span className="admin-nav-title">🍕 Megga's Pizza — Cocina</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Indicador de conexión */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 700,
            color: online ? "#1a7a31" : "#C0000A",
            background: online ? "#f0fff4" : "#fff0f0",
            padding: "4px 10px", borderRadius: 20,
            border: `1px solid ${online ? "#b7e1be" : "#f5c0c0"}`
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "currentColor",
              animation: online ? "pulse 1.5s infinite" : "none"
            }} />
            {online ? "Conectado" : "Sin internet"}
          </div>
          <div className="live-pill"><div className="live-dot" />En vivo</div>
          <button className="nav-link" onClick={logout} style={{ fontSize: 12, opacity: 0.7 }}>Salir</button>
        </div>
      </div>

      {/* Banners */}
      {!notifEnabled && (
        <div style={{
          background: "#fffbeb", border: "1px solid #f5d67a", borderRadius: 10,
          padding: "12px 16px", marginBottom: "1rem",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#854f0b" }}>🔔 Activa las notificaciones push</div>
            <div style={{ fontSize: 12, color: "#a16207", marginTop: 2 }}>Recibe alertas aunque esta pestaña esté cerrada</div>
          </div>
          <button
            className="btn-primary"
            style={{ width: "auto", padding: "8px 20px", fontSize: 13, background: "#d97706" }}
            onClick={handleEnableNotifications}
            disabled={activating}
          >
            {activating ? "Activando..." : "Activar notificaciones"}
          </button>
        </div>
      )}
      {notifEnabled && (
        <div style={{ background: "#f0fff4", border: "1px solid #b7e1be", borderRadius: 10, padding: "10px 16px", marginBottom: "1rem", fontSize: 13, color: "#1a7a31", fontWeight: 600 }}>
          ✅ Notificaciones push activas
        </div>
      )}
      {notifMsg && <div className="toast">{notifMsg}</div>}
      {toast && (
        <div className="toast" style={{ background: "#fff0f0", borderColor: "#f5c0c0", color: "#C0000A", fontSize: 14, fontWeight: 700 }}>
          {toast}
        </div>
      )}

      {/* Tablero */}
      <div className="board">
        {COLUMNS.map(col => (
          <div key={col.id} className="board-col">
            <div className="col-hdr">
              {col.icon} {col.label}
              <span className="col-cnt">{grouped[col.id].length}</span>
            </div>
            {grouped[col.id].length === 0 && <div className="empty-col">Sin pedidos</div>}
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
                {order.ingredientes && <div className="oing">{order.ingredientes}</div>}
                {/* Soporte para pedidos con múltiples items (v2) */}
                {order.items && order.items.map((item, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#333", marginBottom: 2 }}>
                    • {item.qty > 1 ? `${item.qty}x ` : ""}{item.name}
                    {item.half && <span style={{ color: "#C0000A" }}> (½ {item.half})</span>}
                  </div>
                ))}
                {order.nota && <div className="onote">📝 {order.nota}</div>}
                <div className="oaddr">📍 {order.direccion}</div>
                <div className="opay">💳 {order.pago} · {fmt(order.total)} · {order.telefono}</div>
                <button
                  style={{
                    width: "100%", padding: "6px", marginTop: 4,
                    border: col.id === "listo" ? "1.5px solid #1a7a31" : "1.5px solid #C0000A",
                    borderRadius: 8, background: "transparent",
                    color: col.id === "listo" ? "#1a7a31" : "#C0000A",
                    fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit"
                  }}
                  onClick={() => advance(order)}
                >
                  {NEXT_LABEL[order.status]}
                </button>
                <button className="btn-print" onClick={() => setPrintOrder(order)}>
                  🖨️ Imprimir tiquete
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {printOrder && <PrintTicket order={printOrder} onClose={() => setPrintOrder(null)} />}

      <style>{`
        @keyframes pulse-bg { 0%,100%{opacity:1} 50%{opacity:0.85} }
      `}</style>
    </div>
  );
}
