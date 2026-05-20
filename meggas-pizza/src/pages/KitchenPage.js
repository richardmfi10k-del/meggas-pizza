// src/pages/KitchenPage.js
import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";

function fmt(n) { return "$" + Math.round(n).toLocaleString("es-CO"); }

const COLUMNS = [
  { id: "nuevo",      label: "Nuevos",      icon: "🔔", colorClass: "nuevo" },
  { id: "preparando", label: "Preparando",  icon: "🔥", colorClass: "preparando" },
  { id: "listo",      label: "Listos",      icon: "✅", colorClass: "listo" },
];

const NEXT = { nuevo: "preparando", preparando: "listo", listo: "entregado" };
const NEXT_LABEL = { nuevo: "Iniciar preparación", preparando: "Marcar listo", listo: "Marcar entregado" };

export default function KitchenPage() {
  const { orders, updateOrderStatus, config } = useApp();
  const [toast, setToast] = useState(null);
  const prevCount = useRef(0);
  let toastTimer = useRef(null);

  useEffect(() => {
    const newOrders = orders.filter(o => o.status === "nuevo");
    if (newOrders.length > prevCount.current) {
      const last = newOrders[newOrders.length - 1];
      setToast(`🍕 Nuevo pedido — ${last?.producto || "Pedido"}`);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 5000);
    }
    prevCount.current = newOrders.length;
  }, [orders]);

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
      <div className="admin-nav">
        <span className="admin-nav-title">🍕 Megga's Pizza — Cocina</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="live-pill"><div className="live-dot"></div>En vivo</div>
          <a href="/" className="nav-link" style={{ fontSize: 12, opacity: 0.7 }}>← Menú</a>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}

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
                <div className="opay">💳 {order.pago} · {fmt(order.total)} · {order.telefono}</div>
                <button
                  className={col.id === "listo" ? "btn-success" : "btn-adv"}
                  style={{ width: "100%", padding: "6px" }}
                  onClick={() => advance(order)}
                >
                  {NEXT_LABEL[order.status]}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      <style>{`
        .btn-adv {
          border: 1.5px solid #C0000A; border-radius: 8px; background: transparent;
          color: #C0000A; font-size: 12px; font-weight: 700; cursor: pointer;
          font-family: 'Nunito', sans-serif;
        }
        .btn-adv:hover { background: #fff0f0; }
      `}</style>
    </div>
  );
}
