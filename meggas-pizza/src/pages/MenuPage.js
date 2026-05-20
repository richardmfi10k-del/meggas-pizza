// src/pages/MenuPage.js
import React, { useState } from "react";
import { useApp } from "../context/AppContext";

function fmt(n) { return "$" + Math.round(n).toLocaleString("es-CO"); }

export default function MenuPage() {
  const { sizes, flavors, config, createOrder } = useApp();
  const [selSize, setSelSize] = useState(null);
  const [selFlavor, setSelFlavor] = useState(null);
  const [form, setForm] = useState({ nombre: "", direccion: "", telefono: "", pago: "", nota: "" });
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedSize = sizes.find(s => s.id === selSize) || sizes[0];
  const selectedFlavor = flavors.find(f => f.id === selFlavor);

  const total = selectedSize
    ? selectedSize.price + (config.domicilio || 3000)
    : 0;

  async function handleSubmit() {
    if (!selFlavor) { setError("Selecciona un sabor"); return; }
    if (!form.nombre || !form.direccion || !form.telefono || !form.pago) {
      setError("Completa todos los campos obligatorios"); return;
    }
    setError("");
    setLoading(true);
    const id = await createOrder({
      producto: `${selectedFlavor.name} — ${selectedSize.label}`,
      ingredientes: selectedFlavor.ing,
      tamano: selectedSize.label,
      sabor: selectedFlavor.name,
      nota: form.nota,
      cliente: form.nombre,
      direccion: form.direccion,
      telefono: form.telefono,
      pago: form.pago,
      total,
    });
    setOrderId(id);
    setLoading(false);
    setSubmitted(true);
  }

  function reset() {
    setSelSize(null); setSelFlavor(null);
    setForm({ nombre: "", direccion: "", telefono: "", pago: "", nota: "" });
    setSubmitted(false); setOrderId(null);
  }

  if (submitted) {
    return (
      <div className="page">
        <div className="brand-bar">
          <span className="brand-logo">🍕</span>
          <div>
            <div className="brand-name">Megga's Pizza</div>
            <div className="brand-sub">Exquisita · Salsa 100% artesanal</div>
          </div>
        </div>
        <div className="success-box">
          <div className="success-icon">🍕</div>
          <div className="success-title">¡Pedido recibido!</div>
          <div className="success-sub">
            Tu pedido ya está en cocina.<br />
            Te contactamos al <strong>{form.telefono}</strong> cuando esté listo.
          </div>
          <p style={{ fontSize: 12, color: "#666", marginBottom: "1.25rem" }}>
            {selectedFlavor?.name} — {selectedSize?.label} · {fmt(total)}
          </p>
          <button className="btn-primary" style={{ maxWidth: 220, display: "inline-block" }} onClick={reset}>
            Hacer otro pedido
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: 13, color: "#999" }}>
          ¿Preguntas? Llama al {config.telefono}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="brand-bar">
        <span className="brand-logo">🍕</span>
        <div>
          <div className="brand-name">Megga's Pizza</div>
          <div className="brand-sub">Exquisita · Salsa 100% artesanal</div>
        </div>
      </div>

      <div className="section-label">Elige el tamaño</div>
      <div className="sizes-grid" style={{ marginBottom: "0.25rem" }}>
        {sizes.map(s => (
          <div
            key={s.id}
            className={`size-card${(!selSize && s === sizes[0]) || selSize === s.id ? " sel" : ""}`}
            onClick={() => setSelSize(s.id)}
          >
            <div className="sz-name">{s.label}</div>
            <div className="sz-price">{fmt(s.price)}</div>
            <div className="sz-pcs">{s.porciones}</div>
          </div>
        ))}
      </div>

      <div className="section-label">Elige el sabor</div>
      <div className="flavors-grid" style={{ marginBottom: "0.25rem" }}>
        {flavors.map(f => (
          <div
            key={f.id}
            className={`flavor-card${selFlavor === f.id ? " sel" : ""}`}
            onClick={() => setSelFlavor(f.id)}
          >
            <div className="flavor-name">{f.name}</div>
            <div className="flavor-ing">{f.ing}</div>
          </div>
        ))}
      </div>

      <div className="section-label">Datos del domicilio</div>
      <div className="form-row full">
        <div className="form-group">
          <label>Nombre completo *</label>
          <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Tu nombre" />
        </div>
      </div>
      <div className="form-row full">
        <div className="form-group">
          <label>Dirección de entrega *</label>
          <input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Barrio, calle y número" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Teléfono *</label>
          <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="310 000 0000" />
        </div>
        <div className="form-group">
          <label>Método de pago *</label>
          <select value={form.pago} onChange={e => setForm({ ...form, pago: e.target.value })}>
            <option value="">Seleccionar</option>
            <option>Efectivo</option>
            <option>Nequi</option>
            <option>Daviplata</option>
            <option>Tarjeta</option>
          </select>
        </div>
      </div>
      <div className="form-row full">
        <div className="form-group">
          <label>Nota especial (opcional)</label>
          <input value={form.nota} onChange={e => setForm({ ...form, nota: e.target.value })} placeholder="Sin cebolla, extra queso..." />
        </div>
      </div>

      {selectedFlavor && (
        <div className="cart-box">
          <div className="cart-row"><span>{selectedFlavor.name} ({selectedSize?.label})</span><span>{fmt(selectedSize?.price || 0)}</span></div>
          <div className="cart-row"><span>Domicilio</span><span>+{fmt(config.domicilio || 3000)}</span></div>
          <div className="cart-row total"><span>Total a pagar</span><span>{fmt(total)}</span></div>
        </div>
      )}

      {error && <div className="toast" style={{ marginBottom: "0.75rem" }}>⚠️ {error}</div>}

      <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
        {loading ? "Enviando..." : "🍕 Enviar pedido a cocina"}
      </button>

      <div style={{ textAlign: "center", marginTop: "1rem", fontSize: 12, color: "#999" }}>
        Domicilios al {config.telefono}
      </div>
    </div>
  );
}
