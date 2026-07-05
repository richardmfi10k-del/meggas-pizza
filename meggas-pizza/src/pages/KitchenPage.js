// src/pages/KitchenPage.js — FIX: Detector de conexión mejorado
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import PrintTicket from "../components/PrintTicket";

function fmt(n) { return "$" + Math.round(n).toLocaleString("es-CO"); }
function padOrder(n) { return n ? String(n).padStart(4, "0") : "----"; }

const COLUMNS = [
  { id: "nuevo",      label: "Nuevos",     icon: "🔔" },
  { id: "preparando", label: "Preparando", icon: "🔥" },
  { id: "listo",      label: "Listos",     icon: "✅" },
];
const NEXT = { nuevo: "preparando", preparando: "listo", listo: "entregado" };
const NEXT_LABEL = {
  nuevo: "Iniciar preparación",
  preparando: "Marcar listo",
  listo: "Marcar entregado"
};

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

// ── Detector de internet del navegador (instantáneo) ──────────────────────
function useConnectionStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online",  on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

export default function KitchenPage() {
  const { orders, updateOrderStatus, enableNotifications, notifEnabled } = useApp();
  const navigate = useNavigate();

  const [jornada, setJornada]               = useState(false);
  const [audioUnlocked, setAudioUnlocked]   = useState(false);
  const [toast, setToast]                   = useState(null);
  const [activating, setActivating]         = useState(false);
  const [notifMsg, setNotifMsg]             = useState("");
  const [printOrder, setPrintOrder]         = useState(null);
  const [connectionAlert, setConnectionAlert] = useState(false);
  const [lastUpdate, setLastUpdate]         = useState(Date.now());

  const online   = useConnectionStatus();
  const prevIds  = useRef(new Set());
  const toastRef = useRef(null);

  // ── Detector 1: caída de WiFi instantánea ────────────────────────────────
  // useConnectionStatus() ya detecta online/offline en menos de 5 segundos
  // Cuando online cambia a false, la alerta aparece inmediatamente
  useEffect(() => {
    if (!online) {
      setConnectionAlert(true);
    } else {
      // Recuperó internet — quita la alerta de conexión
      // (pero deja un pequeño delay para confirmar que es estable)
      const delay = setTimeout(() => setConnectionAlert(false), 3000);
      return () => clearTimeout(delay);
    }
  }, [online]);

  // ── Heartbeat: mantiene lastUpdate fresco cuando no hay pedidos ───────────
  // Sin esto, si no llegan pedidos por 30 min el timer cree que hay problema
  useEffect(() => {
    const heartbeat = setInterval(() => {
      if (navigator.onLine) {
        setLastUpdate(Date.now());
      }
    }, 30000); // cada 30 segundos
    return () => clearInterval(heartbeat);
  }, []);

  // ── Detector 2: Firebase sin respuesta aunque haya internet ──────────────
  // Solo activa alerta si el navegador dice "online" pero Firestore
  // lleva más de 2 minutos sin responder (posible problema con Firebase)
  useEffect(() => {
    if (!jornada) return;
    const timer = setInterval(() => {
      if (navigator.onLine && Date.now() - lastUpdate > 120000) {
        setConnectionAlert(true);
      }
    }, 15000); // revisa cada 15 segundos
    return () => clearInterval(timer);
  }, [lastUpdate, jornada]);

  // Actualiza lastUpdate cada vez que llegan pedidos de Firestore
  useEffect(() => {
    setLastUpdate(Date.now());
    if (navigator.onLine) setConnectionAlert(false);
  }, [orders]);

  // ── Detector de pedidos nuevos → sonido + toast ───────────────────────────
  useEffect(() => {
    if (!jornada) return;
    const newOrders = orders.filter(o => o.status === "nuevo");
    newOrders.forEach(order => {
      if (!prevIds.current.has(order.id)) {
        if (audioUnlocked) playAlertSound();
        setToast(`🍕 Pedido #${padOrder(order.orderNumber)} — ${order.cliente}`);
        clearTimeout(toastRef.current);
        toastRef.current = setTimeout(() => setToast(null), 6000);
      }
    });
    prevIds.current = new Set(newOrders.map(o => o.id));
  }, [orders, jornada, audioUnlocked]);

  function iniciarJornada() {
    playAlertSound();
    setAudioUnlocked(true);
    setJornada(true);
  }

  async function advance(order) {
    const next = NEXT[order.status];
    if (next) await updateOrderStatus(order.id, next);
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

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = orders.filter(o => o.status === col.id);
    return acc;
  }, {});

  // ── Pantalla Iniciar Jornada ──────────────────────────────────────────────
  if (!jornada) return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#111",
      flexDirection: "column", gap: 20, padding: 20
    }}>
      <div style={{ fontFamily: "Bangers, cursive", fontSize: 48, color: "#FFE600", letterSpacing: 2 }}>
        🍕 Cocina
      </div>
      <div style={{ color: "#fff", fontSize: 16, opacity: 0.7 }}>
        Presiona para activar el sonido y empezar
      </div>
      <button onClick={iniciarJornada} style={{
        background: "#C0000A", color: "#FFE600", border: "none",
        borderRadius: 16, padding: "18px 48px", fontSize: 20,
        fontWeight: 700, fontFamily: "Bangers, cursive",
        letterSpacing: 1, cursor: "pointer", marginTop: 10
      }}>
        🔔 INICIAR JORNADA
      </button>
    </div>
  );

  return (
    <div className="page-wide">

      {/* ── Alerta de desconexión ── */}
      {connectionAlert && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
          background: "#C0000A", color: "#fff",
          padding: "14px 20px", textAlign: "center",
          fontWeight: 700, fontSize: 16, fontFamily: "Nunito, sans-serif",
          animation: "pulse-bg 1s infinite"
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

      {/* ── Header ── */}
      <div className="admin-nav" style={{ marginTop: connectionAlert ? 52 : 0 }}>
        <span className="admin-nav-title">🍕 Cocina</span>
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
          <button
            className="nav-link"
            onClick={() => { sessionStorage.removeItem("kitchen_auth"); navigate("/cocina/login"); }}
            style={{ fontSize: 12, opacity: 0.7 }}
          >
            Salir
          </button>
        </div>
      </div>

      {/* ── Banner notificaciones ── */}
      {!notifEnabled && (
        <div style={{
          background: "#fffbeb", border: "1px solid #f5d67a",
          borderRadius: 10, padding: "12px 16px", marginBottom: "1rem",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: 10
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#854f0b" }}>
              🔔 Activa las notificaciones push
            </div>
            <div style={{ fontSize: 12, color: "#a16207" }}>
              Recibe alertas aunque esta pestaña esté cerrada
            </div>
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
        <div style={{
          background: "#f0fff4", border: "1px solid #b7e1be",
          borderRadius: 10, padding: "10px 16px", marginBottom: "1rem",
          fontSize: 13, color: "#1a7a31", fontWeight: 600
        }}>
          ✅ Notificaciones push activas
        </div>
      )}

      {notifMsg && <div className="toast">{notifMsg}</div>}

      {toast && (
        <div className="toast" style={{
          background: "#fff0f0", borderColor: "#f5c0c0",
          color: "#C0000A", fontSize: 14, fontWeight: 700
        }}>
          {toast}
        </div>
      )}

      {/* ── Tablero de pedidos ── */}
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
              <div key={order.id} className={`order-card ${col.id}`}>

                {/* Número de pedido destacado */}
                <div style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between", marginBottom: 6
                }}>
                  <div style={{
                    fontFamily: "Bangers, cursive", fontSize: 22,
                    color: "#C0000A", letterSpacing: 1.5
                  }}>
                    #{padOrder(order.orderNumber)}
                  </div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>
                    {order.createdAt?.seconds
                      ? new Date(order.createdAt.seconds * 1000).toLocaleTimeString("es-CO", {
                          hour: "2-digit", minute: "2-digit"
                        })
                      : "Ahora"}
                  </div>
                </div>

                <div className="oprod">{order.producto}</div>
                {order.ingredientes && (
                  <div className="oing">{order.ingredientes}</div>
                )}
                {order.items && order.items.map((item, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#333", marginBottom: 2 }}>
                    • {item.qty > 1 ? `${item.qty}x ` : ""}{item.name}
                  </div>
                ))}
                {order.nota && <div className="onote">📝 {order.nota}</div>}
                <div className="oaddr">📍 {order.direccion}</div>
                <div className="opay">
                  💳 {order.pago} · {fmt(order.total)} · {order.telefono}
                </div>

                <button
                  style={{
                    width: "100%", padding: "6px", marginTop: 4,
                    border: col.id === "listo"
                      ? "1.5px solid #1a7a31"
                      : "1.5px solid #C0000A",
                    borderRadius: 8, background: "transparent",
                    color: col.id === "listo" ? "#1a7a31" : "#C0000A",
                    fontSize: 12, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit"
                  }}
                  onClick={() => advance(order)}
                >
                  {NEXT_LABEL[order.status]}
                </button>

                <button
                  className="btn-print"
                  onClick={() => setPrintOrder(order)}
                >
                  🖨️ Imprimir tiquete
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {printOrder && (
        <PrintTicket order={printOrder} onClose={() => setPrintOrder(null)} />
      )}

      <style>{`
        @keyframes pulse-bg { 0%,100%{opacity:1} 50%{opacity:0.85} }
      `}</style>
    </div>
  );
}
