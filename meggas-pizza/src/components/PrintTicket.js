// src/components/PrintTicket.js — MEJORA: Número de pedido en tiquete
import React, { useState } from "react";

function fmt(n) { return "$" + Math.round(n).toLocaleString("es-CO"); }
function padOrder(n) { return n ? String(n).padStart(4, "0") : "----"; }

function getTime(order) {
  if (order.createdAt?.seconds) {
    return new Date(order.createdAt.seconds * 1000).toLocaleString("es-CO", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  }
  return new Date().toLocaleString("es-CO", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

// ── Tirilla térmica 80mm ──────────────────────────────────────────────────────
function ThermalTicket({ order }) {
  return (
    <div className="ticket-thermal">
      <div className="t-center t-big">MEGGA'S PIZZA</div>
      <div className="t-center" style={{ fontSize: 10 }}>Salsa 100% artesanal</div>
      <div className="t-center" style={{ fontSize: 10 }}>Tel: 310 578 05 03</div>
      <div className="t-line" />

      {/* Número de pedido grande */}
      <div className="t-center" style={{ fontSize: 22, fontWeight: "bold", margin: "4px 0" }}>
        PEDIDO #{padOrder(order.orderNumber)}
      </div>
      <div className="t-center" style={{ fontSize: 10 }}>{getTime(order)}</div>
      <div className="t-line" />

      <div><span className="t-bold">Cliente:</span> {order.cliente}</div>
      <div><span className="t-bold">Tel:</span> {order.telefono}</div>
      <div><span className="t-bold">Dir:</span> {order.direccion}</div>
      <div className="t-line" />

      {/* Items del pedido */}
      {order.items ? (
        order.items.map((item, i) => (
          <div key={i}>
            <div className="t-bold" style={{ fontSize: 13 }}>
              {item.qty > 1 ? `${item.qty}x ` : ""}{item.name}
            </div>
            {item.description && <div style={{ fontSize: 10 }}>{item.description}</div>}
          </div>
        ))
      ) : (
        <div>
          <div className="t-bold" style={{ fontSize: 13 }}>{order.producto}</div>
          {order.ingredientes && <div style={{ fontSize: 11 }}>{order.ingredientes}</div>}
        </div>
      )}

      {order.nota && (
        <div style={{ marginTop: 4 }}>
          <span className="t-bold">Nota:</span> {order.nota}
        </div>
      )}
      <div className="t-line" />

      <div className="t-row"><span>Subtotal</span><span>{fmt(order.total - 3000)}</span></div>
      <div className="t-row"><span>Domicilio</span><span>{fmt(3000)}</span></div>
      <div className="t-line" />
      <div className="t-row t-bold" style={{ fontSize: 15 }}>
        <span>TOTAL</span><span>{fmt(order.total)}</span>
      </div>
      <div className="t-row"><span>Pago:</span><span>{order.pago}</span></div>
      <div className="t-line" />
      <div className="t-center" style={{ fontSize: 10 }}>¡Gracias por tu pedido!</div>
      <div className="t-center" style={{ fontSize: 10 }}>Vuelve pronto 🍕</div>
    </div>
  );
}

// ── Hoja carta ────────────────────────────────────────────────────────────────
function LetterTicket({ order }) {
  return (
    <div className="ticket-letter">
      <div className="tl-header">
        <span style={{ fontSize: 32 }}>🍕</span>
        <div>
          <div className="tl-title">Megga's Pizza</div>
          <div className="tl-sub">Exquisita · Salsa 100% artesanal · 310 578 05 03</div>
        </div>
      </div>

      {/* Número de pedido destacado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: "Bangers, cursive", fontSize: 26, color: "#C0000A", letterSpacing: 1.5 }}>
            Pedido #{padOrder(order.orderNumber)}
          </div>
          <div style={{ fontSize: 12, color: "#666" }}>{getTime(order)}</div>
        </div>
        <div style={{ background: "#fff0f0", border: "1px solid #f5c0c0", borderRadius: 8, padding: "6px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#666" }}>Pago</div>
          <div style={{ fontWeight: 700, color: "#C0000A" }}>{order.pago}</div>
        </div>
      </div>

      <div style={{ background: "#f7f7f7", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
        <div className="tl-section" style={{ margin: "0 0 6px" }}>Cliente</div>
        <div className="tl-row"><span>Nombre</span><span style={{ fontWeight: 700 }}>{order.cliente}</span></div>
        <div className="tl-row"><span>Teléfono</span><span>{order.telefono}</span></div>
        <div className="tl-row"><span>Dirección</span><span style={{ maxWidth: 280, textAlign: "right" }}>{order.direccion}</span></div>
      </div>

      <div style={{ background: "#f7f7f7", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
        <div className="tl-section" style={{ margin: "0 0 6px" }}>Pedido</div>
        {order.items ? (
          order.items.map((item, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {item.qty > 1 ? `${item.qty}x ` : ""}{item.name}
              </div>
              {item.description && <div style={{ fontSize: 12, color: "#666" }}>{item.description}</div>}
            </div>
          ))
        ) : (
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{order.producto}</div>
            <div style={{ fontSize: 12, color: "#666" }}>{order.ingredientes}</div>
          </div>
        )}
        {order.nota && (
          <div style={{ fontSize: 12, color: "#C0000A", fontWeight: 700, marginTop: 6 }}>
            📝 Nota: {order.nota}
          </div>
        )}
      </div>

      <div style={{ background: "#fff0f0", border: "1px solid #f5c0c0", borderRadius: 8, padding: "10px 14px" }}>
        <div className="tl-row"><span>Subtotal</span><span>{fmt(order.total - 3000)}</span></div>
        <div className="tl-row"><span>Domicilio</span><span>{fmt(3000)}</span></div>
        <div className="tl-row tl-total"><span>TOTAL A PAGAR</span><span>{fmt(order.total)}</span></div>
      </div>

      <div className="tl-footer">¡Gracias por elegir Megga's Pizza! 🍕 &nbsp;·&nbsp; Vuelve pronto</div>
    </div>
  );
}

// ── Modal de impresión ────────────────────────────────────────────────────────
export default function PrintTicket({ order, onClose }) {
  const [format, setFormat] = useState("thermal");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>🖨️ Imprimir tiquete</div>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#666" }}>✕</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
          {["thermal", "letter"].map(f => (
            <button key={f} onClick={() => setFormat(f)} style={{ flex: 1, padding: "8px", border: `2px solid ${format === f ? "#C0000A" : "#eee"}`, borderRadius: 8, background: format === f ? "#fff0f0" : "#fff", color: format === f ? "#C0000A" : "#666", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              {f === "thermal" ? "🧾 Tirilla térmica" : "📄 Hoja carta"}
            </button>
          ))}
        </div>

        <div style={{ border: "1px dashed #ccc", borderRadius: 8, padding: "1rem", background: "#fafafa", marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
          <div id="ticket-print">
            {format === "thermal" ? <ThermalTicket order={order} /> : <LetterTicket order={order} />}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" onClick={() => window.print()}>🖨️ Imprimir</button>
          <button className="btn-sec" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
