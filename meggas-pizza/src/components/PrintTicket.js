// src/components/PrintTicket.js — al día con config dinámico, tipoPedido, y con formato 58mm real
import React, { useState } from "react";
import { useApp } from "../context/AppContext";

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

// ── Tirilla térmica — sirve para 58mm y 80mm, con tamaños de letra propios
// para cada ancho (por eso NO alcanza con solo escalar el CSS: si el ancho
// físico del papel es menor, el texto también tiene que ser más pequeño de
// verdad, no solo "encogido" al imprimir — eso es justo lo que causaba que
// saliera clara).
function ThermalTicket({ order, config, width }) {
  const S = width === 58
    ? { big: 13, small: 9, item: 11, total: 13, orderNum: 17, sub: 9 }
    : { big: 16, small: 10, item: 13, total: 15, orderNum: 22, sub: 10 };

  const esDomicilio = order.tipoPedido === "domicilio" || !order.tipoPedido; // pedidos viejos sin tipoPedido = domicilio

  return (
    <div className={`ticket-thermal${width === 58 ? " ticket-thermal-58" : ""}`}>
      <div className="t-center" style={{ fontSize: S.big, fontWeight: "bold" }}>{(config.negocio || "").toUpperCase()}</div>
      <div className="t-center" style={{ fontSize: S.small }}>Tel: {config.telefono}</div>
      <div className="t-line" />

      {/* Número de pedido grande */}
      <div className="t-center" style={{ fontSize: S.orderNum, fontWeight: "bold", margin: "4px 0" }}>
        PEDIDO #{padOrder(order.orderNumber)}
      </div>
      <div className="t-center" style={{ fontSize: S.small }}>{getTime(order)}</div>
      <div className="t-line" />

      <div style={{ fontSize: S.sub }}><span className="t-bold">Cliente:</span> {order.cliente}</div>
      <div style={{ fontSize: S.sub }}><span className="t-bold">Tel:</span> {order.telefono}</div>
      {order.tipoPedido === "mesa" ? (
        <div style={{ fontSize: S.sub }}><span className="t-bold">🍽️ Mesa:</span> {order.mesa}</div>
      ) : order.tipoPedido === "llevar" ? (
        <div style={{ fontSize: S.sub }}><span className="t-bold">🥡</span> Para llevar</div>
      ) : (
        <div style={{ fontSize: S.sub }}><span className="t-bold">Dir:</span> {order.direccion}</div>
      )}
      <div className="t-line" />

      {/* Items del pedido */}
      {order.items ? (
        order.items.map((item, i) => (
          <div key={i}>
            <div className="t-bold" style={{ fontSize: S.item }}>
              {item.qty > 1 ? `${item.qty}x ` : ""}{item.name}
            </div>
            {item.description && <div style={{ fontSize: S.small }}>{item.description}</div>}
          </div>
        ))
      ) : (
        <div>
          <div className="t-bold" style={{ fontSize: S.item }}>{order.producto}</div>
          {order.ingredientes && <div style={{ fontSize: S.small }}>{order.ingredientes}</div>}
        </div>
      )}

      {order.nota && (
        <div style={{ marginTop: 4, fontSize: S.sub }}>
          <span className="t-bold">Nota:</span> {order.nota}
        </div>
      )}
      <div className="t-line" />

      <div className="t-row" style={{ fontSize: S.sub }}><span>Subtotal</span><span>{fmt(order.total - (order.domicilio ?? 0))}</span></div>
      {esDomicilio && <div className="t-row" style={{ fontSize: S.sub }}><span>Domicilio</span><span>{fmt(order.domicilio ?? 0)}</span></div>}
      <div className="t-line" />
      <div className="t-row t-bold" style={{ fontSize: S.total }}>
        <span>TOTAL</span><span>{fmt(order.total)}</span>
      </div>
      <div className="t-row" style={{ fontSize: S.sub }}><span>Pago:</span><span>{order.pago}</span></div>
      <div className="t-line" />
      <div className="t-center" style={{ fontSize: S.small }}>¡Gracias por tu pedido!</div>
      <div className="t-center" style={{ fontSize: S.small }}>Vuelve pronto 🍕</div>
    </div>
  );
}

// ── Hoja carta ────────────────────────────────────────────────────────────────
function LetterTicket({ order, config }) {
  const esDomicilio = order.tipoPedido === "domicilio" || !order.tipoPedido;

  return (
    <div className="ticket-letter">
      <div className="tl-header">
        <span style={{ fontSize: 32 }}>🍕</span>
        <div>
          <div className="tl-title">{config.negocio}</div>
          <div className="tl-sub">{config.telefono}</div>
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
        {order.tipoPedido === "mesa" ? (
          <div className="tl-row"><span>🍽️ Mesa</span><span style={{ fontWeight: 700 }}>{order.mesa}</span></div>
        ) : order.tipoPedido === "llevar" ? (
          <div className="tl-row"><span>🥡</span><span style={{ fontWeight: 700 }}>Para llevar</span></div>
        ) : (
          <div className="tl-row"><span>Dirección</span><span style={{ maxWidth: 280, textAlign: "right" }}>{order.direccion}</span></div>
        )}
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
        <div className="tl-row"><span>Subtotal</span><span>{fmt(order.total - (order.domicilio ?? 0))}</span></div>
        {esDomicilio && <div className="tl-row"><span>Domicilio</span><span>{fmt(order.domicilio ?? 0)}</span></div>}
        <div className="tl-row tl-total"><span>TOTAL A PAGAR</span><span>{fmt(order.total)}</span></div>
      </div>

      <div className="tl-footer">¡Gracias por elegir {config.negocio}! 🍕 &nbsp;·&nbsp; Vuelve pronto</div>
    </div>
  );
}

// ── Modal de impresión ────────────────────────────────────────────────────────
export default function PrintTicket({ order, onClose }) {
  const { config } = useApp();
  // "thermal58" | "thermal80" | "letter"
  const [format, setFormat] = useState("thermal80");

  const FORMATS = [
    { id: "thermal58", label: "🧾 58mm" },
    { id: "thermal80", label: "🧾 80mm" },
    { id: "letter",    label: "📄 Hoja carta" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>🖨️ Imprimir tiquete</div>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#666" }}>✕</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
          {FORMATS.map(f => (
            <button
              key={f.id}
              onClick={() => setFormat(f.id)}
              style={{
                flex: 1, padding: "8px", border: `2px solid ${format === f.id ? "#C0000A" : "#eee"}`, borderRadius: 8,
                background: format === f.id ? "#fff0f0" : "#fff", color: format === f.id ? "#C0000A" : "#666",
                fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit"
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ border: "1px dashed #ccc", borderRadius: 8, padding: "1rem", background: "#fafafa", marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
          <div id="ticket-print">
            {format === "letter"
              ? <LetterTicket order={order} config={config} />
              : <ThermalTicket order={order} config={config} width={format === "thermal58" ? 58 : 80} />}
          </div>
        </div>

        <div style={{ fontSize: 11, color: "#999", marginBottom: 10, textAlign: "center" }}>
          Al imprimir, revisa que en el diálogo de impresión la <strong>escala esté en 100%</strong> ("Ajustar a la página" desactivado) —
          si el navegador la reduce para que quepa, el tiquete sale más claro de lo normal.
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" onClick={() => window.print()}>🖨️ Imprimir</button>
          <button className="btn-sec" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
