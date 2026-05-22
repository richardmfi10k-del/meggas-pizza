// src/pages/MenuPage.js — VERSIÓN 3 — Categorías + Carrito + Mitad y Mitad
import React, { useState } from "react";
import { useApp } from "../context/AppContext";

function fmt(n) { return "$" + Math.round(n).toLocaleString("es-CO"); }

// ── Componente: Selector de pizza ────────────────────────────────────────────
function PizzaSelector({ sizes, flavors, onAdd }) {
  const [selSize, setSelSize]       = useState(sizes[0]?.id || null);
  const [selFlavor1, setSelFlavor1] = useState(null);
  const [selFlavor2, setSelFlavor2] = useState(null);
  const [isHalf, setIsHalf]         = useState(false);
  const [qty, setQty]               = useState(1);

  const size = sizes.find(s => s.id === selSize);
  const allowHalf = size?.allowHalf || false;

  function handleAddPizza() {
    if (!selSize || !selFlavor1) return;
    if (isHalf && !selFlavor2) return;
    const f1 = flavors.find(f => f.id === selFlavor1);
    const f2 = isHalf ? flavors.find(f => f.id === selFlavor2) : null;
    const name = isHalf
      ? `Pizza ${size.label} — ½ ${f1.name} / ½ ${f2.name}`
      : `Pizza ${f1.name} — ${size.label}`;
    const description = isHalf
      ? `Mitad: ${f1.description} | Mitad: ${f2.description}`
      : f1.description;
    onAdd({ id: `pizza-${Date.now()}`, name, description, price: size.price, qty, categoryId: "pizzas", sizeId: selSize });
    setSelFlavor1(null); setSelFlavor2(null); setIsHalf(false); setQty(1);
  }

  return (
    <div>
      {/* Tamaños */}
      <div className="section-label">Elige el tamaño</div>
      <div className="sizes-grid" style={{ marginBottom: "0.25rem" }}>
        {sizes.map(s => (
          <div key={s.id} className={`size-card${selSize === s.id ? " sel" : ""}`} onClick={() => { setSelSize(s.id); setIsHalf(false); setSelFlavor2(null); }}>
            <div className="sz-name">{s.label}</div>
            <div className="sz-price">{fmt(s.price)}</div>
            <div className="sz-pcs">{s.porciones}</div>
            {s.allowHalf && <div style={{ fontSize: 10, color: "#1a7a31", marginTop: 2 }}>½ y ½ disponible</div>}
          </div>
        ))}
      </div>

      {/* Toggle mitad y mitad */}
      {allowHalf && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0", padding: "10px 14px", background: "#f0fff4", borderRadius: 10, border: "1px solid #b7e1be" }}>
          <div
            onClick={() => { setIsHalf(!isHalf); setSelFlavor2(null); }}
            style={{ width: 36, height: 20, borderRadius: 10, background: isHalf ? "#1a7a31" : "#ccc", position: "relative", cursor: "pointer", flexShrink: 0, transition: "all 0.2s" }}
          >
            <div style={{ position: "absolute", top: 3, left: isHalf ? 18 : 3, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "all 0.2s" }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a7a31" }}>Mitad y mitad 🍕</div>
            <div style={{ fontSize: 11, color: "#2d6a4f" }}>Elige 2 sabores diferentes, mismo precio</div>
          </div>
        </div>
      )}

      {/* Sabores */}
      <div className="section-label">{isHalf ? "Sabor — Primera mitad" : "Elige el sabor"}</div>
      <div className="flavors-grid" style={{ marginBottom: "0.5rem" }}>
        {flavors.map(f => (
          <div key={f.id} className={`flavor-card${selFlavor1 === f.id ? " sel" : ""}`}
            onClick={() => setSelFlavor1(f.id)}>
            <div className="flavor-name">{f.name}</div>
            <div className="flavor-ing">{f.description}</div>
          </div>
        ))}
      </div>

      {/* Segunda mitad */}
      {isHalf && (
        <>
          <div className="section-label">Sabor — Segunda mitad</div>
          <div className="flavors-grid" style={{ marginBottom: "0.5rem" }}>
            {flavors.filter(f => f.id !== selFlavor1).map(f => (
              <div key={f.id} className={`flavor-card${selFlavor2 === f.id ? " sel" : ""}`}
                onClick={() => setSelFlavor2(f.id)}>
                <div className="flavor-name">{f.name}</div>
                <div className="flavor-ing">{f.description}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Cantidad + Agregar */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f7f7f7", borderRadius: 10, padding: "6px 12px" }}>
          <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ border: "none", background: "none", fontSize: 18, cursor: "pointer", color: "#C0000A", fontWeight: 700 }}>−</button>
          <span style={{ fontWeight: 700, fontSize: 15, minWidth: 20, textAlign: "center" }}>{qty}</span>
          <button onClick={() => setQty(q => q + 1)} style={{ border: "none", background: "none", fontSize: 18, cursor: "pointer", color: "#C0000A", fontWeight: 700 }}>+</button>
        </div>
        <button
          className="btn-primary"
          style={{ flex: 1 }}
          onClick={handleAddPizza}
          disabled={!selFlavor1 || (isHalf && !selFlavor2)}
        >
          + Agregar al pedido · {fmt((size?.price || 0) * qty)}
        </button>
      </div>
    </div>
  );
}

// ── Componente: Selector de producto simple ───────────────────────────────────
function SimpleProducts({ products, onAdd }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {products.map(p => (
        <div key={p.id} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{p.description}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ fontWeight: 700, color: "#C0000A", fontSize: 15 }}>{fmt(p.price)}</div>
            <button
              onClick={() => onAdd({ id: `${p.id}-${Date.now()}`, name: p.name, description: p.description, price: p.price, qty: 1, categoryId: p.categoryId })}
              style={{ background: "#C0000A", color: "#FFE600", border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}
            >+</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Componente: Carrito ───────────────────────────────────────────────────────
function Cart({ items, onRemove, onChangeQty, domicilio }) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  if (items.length === 0) return (
    <div style={{ textAlign: "center", padding: "1.5rem", color: "#aaa", fontSize: 13 }}>
      Tu carrito está vacío 🛒
    </div>
  );
  return (
    <div>
      {items.map(item => (
        <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{item.name}</div>
            <div style={{ fontSize: 11, color: "#999" }}>{item.description}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => onChangeQty(item.id, item.qty - 1)} style={{ border: "1px solid #eee", background: "#fff", borderRadius: 6, width: 24, height: 24, cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#C0000A" }}>−</button>
            <span style={{ fontWeight: 700, fontSize: 13, minWidth: 16, textAlign: "center" }}>{item.qty}</span>
            <button onClick={() => onChangeQty(item.id, item.qty + 1)} style={{ border: "1px solid #eee", background: "#fff", borderRadius: 6, width: 24, height: 24, cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#C0000A" }}>+</button>
          </div>
          <div style={{ fontWeight: 700, color: "#C0000A", fontSize: 13, minWidth: 60, textAlign: "right" }}>{fmt(item.price * item.qty)}</div>
          <button onClick={() => onRemove(item.id)} style={{ border: "none", background: "none", cursor: "pointer", color: "#ccc", fontSize: 16, padding: 0 }}>✕</button>
        </div>
      ))}
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #eee" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#666", marginBottom: 4 }}>
          <span>Subtotal</span><span>{fmt(subtotal)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#666", marginBottom: 4 }}>
          <span>Domicilio</span><span>{fmt(domicilio)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, color: "#C0000A", marginTop: 6 }}>
          <span>Total</span><span>{fmt(subtotal + domicilio)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function MenuPage() {
  const { sizes, categories, products, config, createOrder } = useApp();
  const [activeTab, setActiveTab]   = useState(null);
  const [cartItems, setCartItems]   = useState([]);
  const [showCart, setShowCart]     = useState(false);
  const [form, setForm]             = useState({ nombre: "", direccion: "", telefono: "", pago: "", nota: "" });
  const [submitted, setSubmitted]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const currentCat = activeTab || categories[0]?.id;
  const currentCategory = categories.find(c => c.id === currentCat);
  const catProducts = products.filter(p => p.categoryId === currentCat);
  const pizzaFlavors = products.filter(p => p.categoryId === "pizzas");

  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0) + (config.domicilio || 3000);
  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  function addToCart(item) {
    setCartItems(prev => {
      // Para productos simples: si ya existe, suma cantidad
      const existing = prev.find(i => i.name === item.name && item.categoryId !== "pizzas");
      if (existing) return prev.map(i => i.name === item.name ? { ...i, qty: i.qty + item.qty } : i);
      return [...prev, item];
    });
    setShowCart(true);
  }

  function removeFromCart(id) { setCartItems(prev => prev.filter(i => i.id !== id)); }

  function changeQty(id, qty) {
    if (qty <= 0) removeFromCart(id);
    else setCartItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  }

  async function handleSubmit() {
    if (cartItems.length === 0) { setError("Agrega al menos un producto"); return; }
    if (!form.nombre || !form.direccion || !form.telefono || !form.pago) { setError("Completa todos los campos"); return; }
    setError(""); setLoading(true);
    const resumen = cartItems.map(i => `${i.qty > 1 ? i.qty + "x " : ""}${i.name}`).join(", ");
    await createOrder({
      producto: resumen,
      items: cartItems,
      ingredientes: cartItems.map(i => i.description).join(" | "),
      nota: form.nota,
      cliente: form.nombre,
      direccion: form.direccion,
      telefono: form.telefono,
      pago: form.pago,
      total: cartTotal,
    });
    setLoading(false);
    setSubmitted(true);
  }

  function reset() {
    setCartItems([]); setShowCart(false);
    setForm({ nombre: "", direccion: "", telefono: "", pago: "", nota: "" });
    setSubmitted(false);
  }

  if (submitted) return (
    <div className="page">
      <div className="brand-bar">
        <span className="brand-logo">🍕</span>
        <div><div className="brand-name">Megga's Pizza</div><div className="brand-sub">Exquisita · Salsa 100% artesanal</div></div>
      </div>
      <div className="success-box">
        <div className="success-icon">🎉</div>
        <div className="success-title">¡Pedido recibido!</div>
        <div className="success-sub">Ya está en cocina. Te contactamos al <strong>{form.telefono}</strong> cuando esté listo.</div>
        <div style={{ background: "#f7f7f7", borderRadius: 10, padding: "10px 14px", marginBottom: "1rem", textAlign: "left" }}>
          {cartItems.map((i, idx) => (
            <div key={idx} style={{ fontSize: 13, marginBottom: 3 }}>• {i.qty > 1 ? `${i.qty}x ` : ""}{i.name}</div>
          ))}
          <div style={{ fontWeight: 700, color: "#C0000A", marginTop: 6, fontSize: 14 }}>Total: {fmt(cartTotal)}</div>
        </div>
        <button className="btn-primary" style={{ maxWidth: 220, display: "inline-block" }} onClick={reset}>Hacer otro pedido</button>
      </div>
    </div>
  );

  return (
    <div className="page">
      {/* Header */}
      <div className="brand-bar">
        <span className="brand-logo">🍕</span>
        <div style={{ flex: 1 }}>
          <div className="brand-name">Megga's Pizza</div>
          <div className="brand-sub">Exquisita · Salsa 100% artesanal</div>
        </div>
        {/* Botón carrito */}
        {cartCount > 0 && (
          <button onClick={() => setShowCart(!showCart)} style={{ background: "#FFE600", border: "none", borderRadius: 10, padding: "6px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#C0000A", display: "flex", alignItems: "center", gap: 6 }}>
            🛒 {cartCount} · {fmt(cartTotal)}
          </button>
        )}
      </div>

      {/* Carrito expandible */}
      {showCart && cartItems.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "14px", marginBottom: "1rem" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
            🛒 Tu pedido
            <button onClick={() => setShowCart(false)} style={{ border: "none", background: "none", cursor: "pointer", color: "#999", fontSize: 16 }}>✕</button>
          </div>
          <Cart items={cartItems} onRemove={removeFromCart} onChangeQty={changeQty} domicilio={config.domicilio || 3000} />
        </div>
      )}

      {/* Tabs de categorías */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: "1rem" }}>
        {categories.map(cat => (
          <button key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            style={{
              flexShrink: 0, padding: "8px 16px",
              border: `1.5px solid ${currentCat === cat.id ? "#C0000A" : "#eee"}`,
              borderRadius: 20, background: currentCat === cat.id ? "#C0000A" : "#fff",
              color: currentCat === cat.id ? "#FFE600" : "#666",
              fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              whiteSpace: "nowrap"
            }}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Contenido de la categoría */}
      {currentCategory?.type === "pizza" ? (
        <PizzaSelector sizes={sizes} flavors={pizzaFlavors} onAdd={addToCart} />
      ) : (
        <SimpleProducts products={catProducts} onAdd={addToCart} />
      )}

      {/* Formulario de datos */}
      {cartItems.length > 0 && (
        <>
          <div style={{ height: 1, background: "#eee", margin: "1.25rem 0" }} />
          <div className="section-label">Datos del domicilio</div>
          <div className="form-row full"><div className="form-group"><label>Nombre *</label><input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Tu nombre" /></div></div>
          <div className="form-row full"><div className="form-group"><label>Dirección *</label><input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Barrio, calle y número" /></div></div>
          <div className="form-row">
            <div className="form-group"><label>Teléfono *</label><input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="310 000 0000" /></div>
            <div className="form-group"><label>Pago *</label>
              <select value={form.pago} onChange={e => setForm({ ...form, pago: e.target.value })}>
                <option value="">Seleccionar</option>
                <option>Efectivo</option><option>Nequi</option><option>Daviplata</option><option>Tarjeta</option>
              </select>
            </div>
          </div>
          <div className="form-row full"><div className="form-group"><label>Nota (opcional)</label><input value={form.nota} onChange={e => setForm({ ...form, nota: e.target.value })} placeholder="Sin cebolla, extra queso..." /></div></div>
          {error && <div className="toast" style={{ marginBottom: "0.75rem" }}>⚠️ {error}</div>}
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Enviando..." : `🍕 Enviar pedido · ${fmt(cartTotal)}`}
          </button>
        </>
      )}

      <div style={{ textAlign: "center", marginTop: "1rem", fontSize: 12, color: "#999" }}>
        Domicilios al {config.telefono}
      </div>
    </div>
  );
}

