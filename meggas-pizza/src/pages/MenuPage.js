// src/pages/MenuPage.js — MEJORA 3: Rediseño visual estilo Rappi/iFood
import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";

function fmt(n) { return "$" + Math.round(n).toLocaleString("es-CO"); }
function padOrder(n) { return String(n).padStart(4, "0"); }

// ── Imagen con fallback ────────────────────────────────────────────────────────
function ImgWithFallback({ src, alt, fallbackEmoji, className, style }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className={className} style={{ ...style, display: "flex", alignItems: "center", justifyContent: "center", background: "#e8e8e8", fontSize: 28 }}>
        {fallbackEmoji || "🍽️"}
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} style={style} onError={() => setErr(true)} />;
}

// ── Modal de variantes (idéntico al actual) ────────────────────────────────────
function VariantModal({ product, variants, onConfirm, onClose }) {
  const applicable = variants.filter(v =>
    v.active !== false &&
    v.categoryId === product.categoryId &&
    (v.productId === product.id || v.productId === null)
  );

  const [selections, setSelections] = useState(() => {
    const init = {};
    applicable.forEach(v => { init[v.id] = null; });
    return init;
  });

  // Si no hay variantes, agrega directo
  useEffect(() => {
    if (applicable.length === 0) {
      onConfirm({
        id: `${product.id}-${Date.now()}`,
        name: product.name,
        description: product.description,
        price: product.price,
        qty: 1,
        categoryId: product.categoryId,
      });
    }
  }, []); // eslint-disable-line

  if (applicable.length === 0) return null;

  function select(variantId, optionLabel) {
    setSelections(prev => ({ ...prev, [variantId]: optionLabel }));
  }

  function handleConfirm() {
    for (const v of applicable) {
      if (v.required && !selections[v.id]) {
        alert(`Por favor elige: ${v.label}`);
        return;
      }
    }
    const chosen = applicable.map(v => selections[v.id]).filter(Boolean);
    const fullName = chosen.length ? `${product.name} — ${chosen.join(", ")}` : product.name;
    onConfirm({
      id: `${product.id}-${Date.now()}`,
      name: fullName,
      description: product.description,
      price: product.price,
      qty: 1,
      categoryId: product.categoryId,
      variants: selections,
    });
  }

  return (
    <div className="vm-overlay" onClick={onClose}>
      <div className="vm-sheet" onClick={e => e.stopPropagation()}>
        <div className="vm-handle" />
        <div className="vm-header">
          <div>
            <div className="vm-product-name">{product.name}</div>
            {product.description && <div className="vm-product-desc">{product.description}</div>}
            <div className="vm-product-price">{fmt(product.price)}</div>
          </div>
          <button className="vm-close" onClick={onClose}>✕</button>
        </div>

        {applicable.map(v => (
          <div key={v.id} className="vm-group">
            <div className="vm-group-label">
              {v.label}
              {v.required
                ? <span className="vm-required">* obligatorio</span>
                : <span className="vm-optional">opcional</span>}
            </div>
            <div className="vm-options">
              {v.options.filter(o => o.active !== false).map(opt => {
                const sel = selections[v.id] === opt.label;
                return (
                  <button key={opt.id} className={`vm-option${sel ? " sel" : ""}`} onClick={() => select(v.id, opt.label)}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <button className="vm-confirm" onClick={handleConfirm}>
          + Agregar · {fmt(product.price)}
        </button>
      </div>
    </div>
  );
}

// ── Selector de pizza ─────────────────────────────────────────────────────────
function PizzaModal({ sizes, flavors, onAdd, onClose }) {
  const [selSize, setSelSize]       = useState(sizes[0]?.id || null);
  const [selFlavor1, setSelFlavor1] = useState(null);
  const [selFlavor2, setSelFlavor2] = useState(null);
  const [isHalf, setIsHalf]         = useState(false);
  const [qty, setQty]               = useState(1);
  const size = sizes.find(s => s.id === selSize);

  function handleAdd() {
    if (!selFlavor1) return;
    if (isHalf && !selFlavor2) return;
    const f1 = flavors.find(f => f.id === selFlavor1);
    const f2 = isHalf ? flavors.find(f => f.id === selFlavor2) : null;
    const name = isHalf
      ? `Pizza ${size.label} — ½ ${f1.name} / ½ ${f2.name}`
      : `Pizza ${f1.name} — ${size.label}`;
    const description = isHalf
      ? `Mitad: ${f1.description} | Mitad: ${f2.description}`
      : f1.description;
    onAdd({ id: `pizza-${Date.now()}`, name, description, price: size.price, qty, categoryId: "pizzas" });
    onClose();
  }

  return (
    <div className="vm-overlay" onClick={onClose}>
      <div className="vm-sheet pizza-sheet" onClick={e => e.stopPropagation()}>
        <div className="vm-handle" />
        <div className="pizza-modal-header">
          <span>🍕 Personaliza tu pizza</span>
          <button className="vm-close" onClick={onClose}>✕</button>
        </div>

        {/* Tamaños */}
        <div className="vm-group">
          <div className="vm-group-label">Tamaño <span className="vm-required">* obligatorio</span></div>
          <div className="sizes-grid">
            {sizes.map(s => (
              <div key={s.id} className={`size-card${selSize === s.id ? " sel" : ""}`}
                onClick={() => { setSelSize(s.id); setIsHalf(false); setSelFlavor2(null); }}>
                <div className="sz-name">{s.label}</div>
                <div className="sz-price">{fmt(s.price)}</div>
                <div className="sz-pcs">{s.porciones}</div>
                {s.allowHalf && <div style={{ fontSize: 10, color: "#1a7a31", marginTop: 2 }}>½ y ½</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Toggle mitad y mitad */}
        {size?.allowHalf && (
          <div className="half-toggle" onClick={() => { setIsHalf(!isHalf); setSelFlavor2(null); }}>
            <div className={`toggle-track${isHalf ? " on" : ""}`}>
              <div className="toggle-thumb" />
            </div>
            <div>
              <div className="half-toggle-title">Mitad y mitad 🍕</div>
              <div className="half-toggle-sub">2 sabores diferentes, mismo precio</div>
            </div>
          </div>
        )}

        {/* Sabores */}
        <div className="vm-group">
          <div className="vm-group-label">
            {isHalf ? "Primera mitad" : "Sabor"}
            <span className="vm-required">* obligatorio</span>
          </div>
          <div className="flavors-grid">
            {flavors.map(f => (
              <div key={f.id} className={`flavor-card${selFlavor1 === f.id ? " sel" : ""}`} onClick={() => setSelFlavor1(f.id)}>
                <div className="flavor-name">{f.name}</div>
                <div className="flavor-ing">{f.description}</div>
              </div>
            ))}
          </div>
        </div>

        {isHalf && (
          <div className="vm-group">
            <div className="vm-group-label">Segunda mitad <span className="vm-required">* obligatorio</span></div>
            <div className="flavors-grid">
              {flavors.filter(f => f.id !== selFlavor1).map(f => (
                <div key={f.id} className={`flavor-card${selFlavor2 === f.id ? " sel" : ""}`} onClick={() => setSelFlavor2(f.id)}>
                  <div className="flavor-name">{f.name}</div>
                  <div className="flavor-ing">{f.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cantidad + botón */}
        <div className="pizza-footer">
          <div className="qty-control">
            <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
            <span>{qty}</span>
            <button onClick={() => setQty(q => q + 1)}>+</button>
          </div>
          <button className="vm-confirm" style={{ flex: 1 }} onClick={handleAdd}
            disabled={!selFlavor1 || (isHalf && !selFlavor2)}>
            + Agregar · {fmt((size?.price || 0) * qty)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bottom sheet del carrito ───────────────────────────────────────────────────
function CartSheet({ items, onRemove, onChangeQty, domicilio, config, onSubmit, loading, onClose }) {
  const [form, setForm] = useState({ nombre: "", direccion: "", telefono: "", pago: "", nota: "" });
  const [error, setError] = useState("");
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const total    = subtotal + (domicilio || 0);

  async function handleSubmit() {
    if (!form.nombre || !form.direccion || !form.telefono || !form.pago) {
      setError("Completa todos los campos"); return;
    }
    setError("");
    await onSubmit(form, total);
  }

  return (
    <div className="cs-overlay" onClick={onClose}>
      <div className="cs-sheet" onClick={e => e.stopPropagation()}>
        <div className="vm-handle" />
        <div className="cs-header">
          <span className="cs-title">Tu pedido</span>
          <button className="vm-close" onClick={onClose}>✕</button>
        </div>

        <div className="cs-items">
          {items.map(item => (
            <div key={item.id} className="cs-item">
              <div className="cs-item-info">
                <span className="cs-item-name">{item.name}</span>
              </div>
              <div className="cs-item-controls">
                <button onClick={() => onChangeQty(item.id, item.qty - 1)}>−</button>
                <span>{item.qty}</span>
                <button onClick={() => onChangeQty(item.id, item.qty + 1)}>+</button>
              </div>
              <span className="cs-item-price">{fmt(item.price * item.qty)}</span>
              <button className="cs-item-remove" onClick={() => onRemove(item.id)}>✕</button>
            </div>
          ))}
        </div>

        <div className="cs-totals">
          <div className="cs-total-row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
          <div className="cs-total-row"><span>Domicilio</span><span>{fmt(domicilio || 0)}</span></div>
          <div className="cs-total-row grand"><span>Total</span><span>{fmt(total)}</span></div>
        </div>

        <div className="cs-form">
          <div className="cs-form-title">Datos del domicilio</div>
          <input className="cs-input" placeholder="Tu nombre *" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
          <input className="cs-input" placeholder="Dirección (barrio, calle y número) *" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input className="cs-input" placeholder="Teléfono *" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
            <select className="cs-input" value={form.pago} onChange={e => setForm({ ...form, pago: e.target.value })}>
              <option value="">Pago *</option>
              <option>Efectivo</option><option>Nequi</option><option>Daviplata</option><option>Tarjeta</option>
            </select>
          </div>
          <input className="cs-input" placeholder="Nota (opcional)" value={form.nota} onChange={e => setForm({ ...form, nota: e.target.value })} />
          {error && <div className="toast" style={{ marginBottom: 0 }}>⚠️ {error}</div>}
          <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ marginTop: 4 }}>
            {loading ? "Enviando..." : `🍕 Enviar pedido · ${fmt(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pantalla de confirmación ───────────────────────────────────────────────────
function ConfirmScreen({ orderResult, cartItems, cartTotal, form, config, onReset }) {
  return (
    <div className="menu-bg" style={{ minHeight: "100vh" }}>
      <div className="menu-page">
        {/* Header simple */}
        <div className="menu-header">
          <div className="menu-header-logo">
            <ImgWithFallback src={config.logoUrl} alt="logo" fallbackEmoji="🍕"
              style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }} />
          </div>
          <div className="menu-header-info">
            <div className="menu-header-name">{config.negocio}</div>
          </div>
        </div>

        <div className="confirm-box">
          <div className="confirm-emoji">🎉</div>
          <div className="confirm-title">¡Pedido recibido!</div>
          <div className="confirm-num-label">Tu número de pedido</div>
          <div className="confirm-num">#{padOrder(orderResult.orderNumber)}</div>
          <div className="confirm-sub">
            Te contactamos al <strong>{form.telefono}</strong> cuando esté listo.
          </div>
          <div className="confirm-items">
            {cartItems.map((i, idx) => (
              <div key={idx} className="confirm-item">
                <span>• {i.qty > 1 ? `${i.qty}x ` : ""}{i.name}</span>
                <span>{fmt(i.price * i.qty)}</span>
              </div>
            ))}
            <div className="confirm-total">
              <span>Total pagado</span>
              <span>{fmt(cartTotal)}</span>
            </div>
          </div>
          <button className="btn-primary" onClick={onReset}>Hacer otro pedido</button>
        </div>
      </div>
    </div>
  );
}

// ── MenuPage principal ────────────────────────────────────────────────────────
export default function MenuPage() {
  const { sizes, categories, products, variants, config, createOrder } = useApp();

  const [activeTab, setActiveTab]       = useState(null);
  const [cartItems, setCartItems]       = useState([]);
  const [showCart, setShowCart]         = useState(false);
  const [showPizzaModal, setShowPizzaModal] = useState(false);
  const [variantModal, setVariantModal] = useState(null);
  const [submitted, setSubmitted]       = useState(false);
  const [orderResult, setOrderResult]   = useState(null);
  const [lastForm, setLastForm]         = useState({});
  const [loading, setLoading]           = useState(false);

  const currentCat      = activeTab || categories[0]?.id;
  const currentCategory = categories.find(c => c.id === currentCat);
  const catProducts     = products.filter(p => p.categoryId === currentCat && p.active !== false);
  const pizzaFlavors    = products.filter(p => p.categoryId === "pizzas" && p.active !== false);
  const cartCount       = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const cartSubtotal    = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartTotal       = cartSubtotal + (config.domicilio || 0);

  // Emoji de la categoría activa como fallback
  const catEmoji = currentCategory?.icon || "🍽️";

  function addToCart(item) {
    setCartItems(prev => {
      const existing = prev.find(i => i.name === item.name && item.categoryId !== "pizzas");
      if (existing) return prev.map(i => i.name === item.name ? { ...i, qty: i.qty + item.qty } : i);
      return [...prev, item];
    });
    setVariantModal(null);
    setShowPizzaModal(false);
  }

  function removeFromCart(id) { setCartItems(prev => prev.filter(i => i.id !== id)); }
  function changeQty(id, qty) {
    if (qty <= 0) removeFromCart(id);
    else setCartItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  }

  function handleProductClick(product) {
    const applicable = variants.filter(v =>
      v.active !== false &&
      v.categoryId === product.categoryId &&
      (v.productId === product.id || v.productId === null)
    );
    if (applicable.length > 0) {
      setVariantModal(product);
    } else {
      addToCart({
        id: `${product.id}-${Date.now()}`,
        name: product.name,
        description: product.description,
        price: product.price,
        qty: 1,
        categoryId: product.categoryId,
      });
    }
  }

  async function handleSubmitOrder(form, total) {
    setLoading(true);
    const resumen = cartItems.map(i => `${i.qty > 1 ? i.qty + "x " : ""}${i.name}`).join(", ");
    const result = await createOrder({
      producto: resumen,
      items: cartItems,
      ingredientes: cartItems.map(i => i.description).filter(Boolean).join(" | "),
      nota: form.nota,
      cliente: form.nombre,
      direccion: form.direccion,
      telefono: form.telefono,
      pago: form.pago,
      total,
    });
    setLastForm(form);
    setOrderResult(result);
    setLoading(false);
    setShowCart(false);
    setSubmitted(true);
  }

  function reset() {
    setCartItems([]); setShowCart(false);
    setSubmitted(false); setOrderResult(null);
    setLastForm({});
  }

  // ── Confirmación ──────────────────────────────────────────────────────────
  if (submitted && orderResult) {
    return (
      <ConfirmScreen
        orderResult={orderResult}
        cartItems={cartItems}
        cartTotal={cartTotal}
        form={lastForm}
        config={config}
        onReset={reset}
      />
    );
  }

  return (
    <div className="menu-bg">
      <div className="menu-page">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="menu-header">
          <div className="menu-header-logo">
            <ImgWithFallback
              src={config.logoUrl}
              alt="logo"
              fallbackEmoji="🍕"
              style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }}
            />
          </div>
          <div className="menu-header-info">
            <div className="menu-header-name">{config.negocio}</div>
            <div className="menu-header-sub">Exquisita · Salsa 100% artesanal</div>
          </div>
          <div className="menu-header-actions">
            {cartCount > 0 && (
              <button className="header-cart-btn" onClick={() => setShowCart(true)}>
                🛒
                <span className="header-cart-badge">{cartCount}</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Categorías (círculos) ──────────────────────────────────── */}
        <div className="cat-strip">
          {categories.map(cat => (
            <button key={cat.id} className={`cat-item${currentCat === cat.id ? " active" : ""}`}
              onClick={() => setActiveTab(cat.id)}>
              <div className="cat-circle">
                <ImgWithFallback
                  src={cat.imageUrl}
                  alt={cat.name}
                  fallbackEmoji={cat.icon}
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                />
              </div>
              <span className="cat-label">{cat.name}</span>
            </button>
          ))}
        </div>

        <div className="menu-divider" />

        {/* ── Lista de productos ────────────────────────────────────── */}
        <div className="products-list">
          {currentCategory?.type === "pizza" ? (
            /* Para pizzas: un solo botón que abre el modal */
            <div className="pizza-entry-card" onClick={() => setShowPizzaModal(true)}>
              <div className="pizza-entry-info">
                <div className="prod-name">Elige tu Pizza 🍕</div>
                <div className="prod-desc">Selecciona tamaño, sabor y personaliza a tu gusto</div>
                <div className="prod-price">Desde {fmt(Math.min(...sizes.map(s => s.price)))}</div>
              </div>
              <div className="prod-img-wrap">
                <ImgWithFallback
                  src={currentCategory?.imageUrl}
                  alt="Pizza"
                  fallbackEmoji="🍕"
                  className="prod-img"
                />
                <button className="prod-add-btn" onClick={e => { e.stopPropagation(); setShowPizzaModal(true); }}>+</button>
              </div>
            </div>
          ) : (
            catProducts.map(p => (
              <div key={p.id} className="prod-card">
                <div className="prod-info">
                  <div className="prod-name">{p.name}</div>
                  <div className="prod-desc">{p.description}</div>
                  <div className="prod-price">{fmt(p.price)}</div>
                </div>
                <div className="prod-img-wrap">
                  <ImgWithFallback
                    src={p.imageUrl}
                    alt={p.name}
                    fallbackEmoji={catEmoji}
                    className="prod-img"
                  />
                  <button className="prod-add-btn" onClick={() => handleProductClick(p)}>+</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Espaciado para el FAB */}
        <div style={{ height: 90 }} />
      </div>

      {/* ── FAB carrito flotante ───────────────────────────────────── */}
      {cartCount > 0 && (
        <div className="cart-fab" onClick={() => setShowCart(true)}>
          <span className="cart-fab-count">{cartCount} {cartCount === 1 ? "producto" : "productos"} seleccionado{cartCount > 1 ? "s" : ""}</span>
          <span className="cart-fab-right">
            Ver Carrito 🛒 &nbsp; {fmt(cartSubtotal)}
          </span>
        </div>
      )}

      {/* ── Modales ───────────────────────────────────────────────── */}
      {showPizzaModal && (
        <PizzaModal
          sizes={sizes}
          flavors={pizzaFlavors}
          onAdd={addToCart}
          onClose={() => setShowPizzaModal(false)}
        />
      )}

      {variantModal && (
        <VariantModal
          product={variantModal}
          variants={variants}
          onConfirm={item => { addToCart(item); setVariantModal(null); }}
          onClose={() => setVariantModal(null)}
        />
      )}

      {showCart && cartItems.length > 0 && (
        <CartSheet
          items={cartItems}
          onRemove={removeFromCart}
          onChangeQty={changeQty}
          domicilio={config.domicilio || 0}
          config={config}
          onSubmit={handleSubmitOrder}
          loading={loading}
          onClose={() => setShowCart(false)}
        />
      )}
    </div>
  );
}
