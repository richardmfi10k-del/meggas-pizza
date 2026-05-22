// src/pages/AdminPage.js — VERSIÓN 3 — Gestión de categorías y productos
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import HistoryPage from "./HistoryPage";

function fmt(n) { return "$" + Math.round(n).toLocaleString("es-CO"); }

function sanitizePhone(raw) { return raw.replace(/\D/g, "").slice(0, 10); }
function formatPhoneDisplay(d) {
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)} ${d.slice(3)}`;
  if (d.length <= 8) return `${d.slice(0,3)} ${d.slice(3,6)} ${d.slice(6)}`;
  return `${d.slice(0,3)} ${d.slice(3,6)} ${d.slice(6,8)} ${d.slice(8)}`;
}

const CATEGORY_ICONS = ["🍕","🍔","🌮","🍗","🌭","🥪","🍟","🥗","🍜","🍣","🥩","🧆","🫔","🧇","🥞","🧃","🥤","🍺","☕","🧋"];

export default function AdminPage() {
  const {
    isAdmin, logout, products, categories, sizes, config,
    saveProduct, deleteProduct, saveCategory, deleteCategory,
    saveSize, saveConfig
  } = useApp();
  const navigate = useNavigate();

  const [tab, setTab]         = useState("menu");
  const [subTab, setSubTab]   = useState(null); // categoryId seleccionado en menú
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState({});
  const [saving, setSaving]   = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => { if (!isAdmin) navigate("/admin/login"); }, [isAdmin, navigate]);
  useEffect(() => { if (categories.length && !subTab) setSubTab(categories[0]?.id); }, [categories]);

  // ── Modales ──
  function openCategory(cat) {
    setForm(cat ? { ...cat } : { id: "cat" + Date.now(), name: "", icon: "🍕", type: "simple", order: categories.length + 1, active: true });
    setModal("category");
  }
  function openProduct(prod, categoryId) {
    setForm(prod ? { ...prod } : { id: "prod" + Date.now(), categoryId: categoryId || subTab, name: "", description: "", price: "", active: true, order: products.filter(p => p.categoryId === (categoryId || subTab)).length + 1 });
    setModal("product");
  }
  function openSize(size) {
    setForm(size ? { ...size } : { id: "s" + Date.now(), label: "", porciones: "", price: "", allowHalf: false, order: sizes.length + 1 });
    setModal("size");
  }
  function openConfig() { setForm({ ...config }); setPhoneError(""); setModal("config"); }

  function handlePhoneChange(raw) {
    const digits = sanitizePhone(raw);
    setForm(f => ({ ...f, telefono: digits }));
    setPhoneError(digits.length > 0 && digits.length < 10 ? "El teléfono debe tener 10 dígitos" : "");
  }

  async function save() {
    setSaving(true);
    try {
      if (modal === "category") await saveCategory({ ...form });
      if (modal === "product")  await saveProduct({ ...form, price: form.categoryId === "pizzas" ? 0 : Number(form.price) });
      if (modal === "size")     await saveSize({ ...form, price: Number(form.price), allowHalf: !!form.allowHalf });
      if (modal === "config") {
        const digits = sanitizePhone(form.telefono || "");
        if (digits.length !== 10) { setPhoneError("Teléfono debe tener 10 dígitos"); setSaving(false); return; }
        await saveConfig({ ...form, telefono: formatPhoneDisplay(digits), domicilio: Number(form.domicilio) });
      }
      showSuccess("Guardado ✅");
      setModal(null);
    } catch (e) { alert("Error: " + e.message); }
    setSaving(false);
  }

  async function handleToggleHalf(size) {
    await saveSize({ ...size, allowHalf: !size.allowHalf });
    showSuccess(`Mitad y mitad ${!size.allowHalf ? "activado" : "desactivado"} para ${size.label}`);
  }

  function showSuccess(msg) { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3000); }
  if (!isAdmin) return null;

  const TABS = ["menu", "tamaños", "configuración", "historial"];
  const currentCatProducts = products.filter(p => p.categoryId === subTab);
  const currentCat = categories.find(c => c.id === subTab);

  return (
    <div className="page-wide">
      <div className="admin-nav">
        <span className="admin-nav-title">⚙️ Panel — Megga's Pizza</span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a href="/cocina/login" className="nav-link" style={{ fontSize: 12, opacity: 0.7 }}>Cocina</a>
          <a href="/" className="nav-link" style={{ fontSize: 12, opacity: 0.7 }}>Menú</a>
          <button className="nav-link" onClick={() => { logout(); navigate("/admin/login"); }}>Salir →</button>
        </div>
      </div>

      {successMsg && <div className="toast" style={{ background: "#f0fff4", borderColor: "#b7e1be", color: "#1a7a31", marginBottom: "1rem" }}>{successMsg}</div>}

      <div className="admin-tabs">
        {TABS.map(t => (
          <button key={t} className={`admin-tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
            {t === "menu" && "🍽️ "}{t === "tamaños" && "📏 "}{t === "configuración" && "⚙️ "}{t === "historial" && "📊 "}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── MENÚ ── */}
      {tab === "menu" && (
        <div>
          {/* Categorías */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#666" }}>CATEGORÍAS</div>
            <button className="btn-primary" style={{ width: "auto", padding: "7px 14px", fontSize: 12 }} onClick={() => openCategory(null)}>+ Nueva categoría</button>
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: "1.25rem" }}>
            {categories.map(cat => (
              <div key={cat.id} style={{ flexShrink: 0, display: "flex", gap: 4, alignItems: "center" }}>
                <button
                  onClick={() => setSubTab(cat.id)}
                  style={{
                    padding: "7px 14px", border: `1.5px solid ${subTab === cat.id ? "#C0000A" : "#eee"}`,
                    borderRadius: 20, background: subTab === cat.id ? "#C0000A" : "#fff",
                    color: subTab === cat.id ? "#FFE600" : "#666",
                    fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit"
                  }}
                >
                  {cat.icon} {cat.name}
                </button>
                <button onClick={() => openCategory(cat)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 14, opacity: 0.5 }} title="Editar">✏️</button>
                <button onClick={async () => { if (window.confirm(`¿Eliminar categoría ${cat.name}?`)) { await deleteCategory(cat.id); showSuccess("Categoría eliminada"); }}} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 14, opacity: 0.5 }} title="Eliminar">🗑️</button>
              </div>
            ))}
          </div>

          {/* Productos de la categoría seleccionada */}
          {currentCat && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#666" }}>
                  {currentCat.icon} {currentCat.name.toUpperCase()} — {currentCatProducts.length} productos
                  {currentCat.type === "pizza" && <span style={{ fontSize: 11, color: "#999", fontWeight: 400, marginLeft: 6 }}>(los precios se toman de los tamaños)</span>}
                </div>
                <button className="btn-primary" style={{ width: "auto", padding: "7px 14px", fontSize: 12 }} onClick={() => openProduct(null, subTab)}>
                  + Nuevo {currentCat.type === "pizza" ? "sabor" : "producto"}
                </button>
              </div>
              {currentCatProducts.length === 0 && (
                <div style={{ textAlign: "center", padding: "2rem", color: "#aaa", fontSize: 13 }}>Sin productos en esta categoría</div>
              )}
              {currentCatProducts.map(p => (
                <div key={p.id} className="admin-list-item">
                  <div className="item-info">
                    <div className="item-name-big">{p.name}</div>
                    <div className="item-ing-small">{p.description}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {currentCat.type !== "pizza" && <div className="item-price-big">{fmt(p.price)}</div>}
                    <button className="btn-sec" onClick={() => openProduct(p, subTab)}>Editar</button>
                    <button className="btn-danger" onClick={async () => { if (window.confirm(`¿Eliminar ${p.name}?`)) { await deleteProduct(p.id); showSuccess("Eliminado"); }}}>Eliminar</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── TAMAÑOS ── */}
      {tab === "tamaños" && (
        <div>
          <div style={{ fontSize: 13, color: "#666", marginBottom: "0.75rem", background: "#f7f7f7", padding: "10px 14px", borderRadius: 10 }}>
            💡 Los tamaños aplican solo para pizzas. Activa <strong>Mitad y mitad</strong> en los que quieras permitirlo.
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
            <button className="btn-primary" style={{ width: "auto", padding: "7px 14px", fontSize: 12 }} onClick={() => openSize(null)}>+ Nuevo tamaño</button>
          </div>
          {sizes.map(s => (
            <div key={s.id} className="admin-list-item">
              <div className="item-info">
                <div className="item-name-big">{s.label}</div>
                <div className="item-ing-small">{s.porciones}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div onClick={() => handleToggleHalf(s)} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", background: s.allowHalf ? "#f0fff4" : "#f7f7f7", border: `1px solid ${s.allowHalf ? "#b7e1be" : "#eee"}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, color: s.allowHalf ? "#1a7a31" : "#999" }}>
                  <div style={{ width: 28, height: 16, borderRadius: 8, background: s.allowHalf ? "#1a7a31" : "#ccc", position: "relative", transition: "all 0.2s" }}>
                    <div style={{ position: "absolute", top: 2, left: s.allowHalf ? 14 : 2, width: 12, height: 12, borderRadius: "50%", background: "#fff", transition: "all 0.2s" }} />
                  </div>
                  ½ y ½
                </div>
                <div className="item-price-big">{fmt(s.price)}</div>
                <button className="btn-sec" onClick={() => openSize(s)}>Editar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CONFIGURACIÓN ── */}
      {tab === "configuración" && (
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: "1rem" }}>Configuración general</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            {[["Negocio", config.negocio], ["Teléfono", config.telefono], ["Domicilio", fmt(config.domicilio || 0)], ["Contraseña admin", "••••••••"], ["Contraseña cocina", config.kitchenPassword ? "••••••••" : "(usa la de admin)"]].map(([label, val]) => (
              <div key={label} style={{ background: "#f7f7f7", borderRadius: 8, padding: "8px 12px" }}>
                <div style={{ fontSize: 11, color: "#999" }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{val}</div>
              </div>
            ))}
          </div>
          <button className="btn-primary" style={{ width: "auto", padding: "9px 24px" }} onClick={openConfig}>✏️ Editar configuración</button>
        </div>
      )}

      {/* ── HISTORIAL ── */}
      {tab === "historial" && <HistoryPage />}

      {/* ── MODAL CATEGORÍA ── */}
      {modal === "category" && (
        <div className="modal-overlay" style={{ marginTop: "1rem" }}>
          <div className="modal-box">
            <div className="modal-title">{form.name ? `Editar: ${form.name}` : "Nueva categoría"}</div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Nombre *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej. Hamburguesas" />
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Ícono</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {CATEGORY_ICONS.map(icon => (
                  <button key={icon} onClick={() => setForm({ ...form, icon })}
                    style={{ width: 36, height: 36, border: `2px solid ${form.icon === icon ? "#C0000A" : "#eee"}`, borderRadius: 8, background: form.icon === icon ? "#fff0f0" : "#fff", fontSize: 18, cursor: "pointer" }}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Tipo</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="simple">Producto simple (precio fijo)</option>
                <option value="pizza">Pizza (usa tamaños y sabores)</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: "0.75rem" }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
              <button className="btn-sec" onClick={() => setModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL PRODUCTO ── */}
      {modal === "product" && (
        <div className="modal-overlay" style={{ marginTop: "1rem" }}>
          <div className="modal-box">
            <div className="modal-title">{form.name ? `Editar: ${form.name}` : "Nuevo producto"}</div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Nombre *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej. Hamburguesa Especial" />
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>{form.categoryId === "pizzas" ? "Ingredientes" : "Descripción"}</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Ej. Doble carne, tocineta, queso, papas chips" style={{ minHeight: 60, resize: "vertical" }} />
            </div>
            {form.categoryId !== "pizzas" && (
              <div className="form-group" style={{ marginBottom: 10 }}>
                <label>Precio *</label>
                <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Ej. 18000" />
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: "0.75rem" }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
              <button className="btn-sec" onClick={() => setModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL TAMAÑO ── */}
      {modal === "size" && (
        <div className="modal-overlay" style={{ marginTop: "1rem" }}>
          <div className="modal-box">
            <div className="modal-title">{form.label ? `Editar: ${form.label}` : "Nuevo tamaño"}</div>
            <div className="form-row">
              <div className="form-group"><label>Nombre *</label><input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} /></div>
              <div className="form-group"><label>Porciones</label><input value={form.porciones} onChange={e => setForm({ ...form, porciones: e.target.value })} /></div>
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Precio *</label>
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, cursor: "pointer" }} onClick={() => setForm(f => ({ ...f, allowHalf: !f.allowHalf }))}>
              <div style={{ width: 36, height: 20, borderRadius: 10, background: form.allowHalf ? "#1a7a31" : "#ccc", position: "relative" }}>
                <div style={{ position: "absolute", top: 3, left: form.allowHalf ? 18 : 3, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "all 0.2s" }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: form.allowHalf ? "#1a7a31" : "#999" }}>Permitir mitad y mitad</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
              <button className="btn-sec" onClick={() => setModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CONFIG ── */}
      {modal === "config" && (
        <div className="modal-overlay" style={{ marginTop: "1rem" }}>
          <div className="modal-box">
            <div className="modal-title">Editar configuración</div>
            <div className="form-group" style={{ marginBottom: 10 }}><label>Nombre del negocio</label><input value={form.negocio} onChange={e => setForm({ ...form, negocio: e.target.value })} /></div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Teléfono (10 dígitos) *</label>
              <input value={form.telefono} onChange={e => handlePhoneChange(e.target.value)} placeholder="3105780503" maxLength={13} />
              {phoneError && <span style={{ fontSize: 11, color: "#C0000A" }}>{phoneError}</span>}
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}><label>Costo domicilio ($)</label><input type="number" value={form.domicilio} onChange={e => setForm({ ...form, domicilio: e.target.value })} /></div>
            <div className="form-row">
              <div className="form-group"><label>Contraseña admin</label><input value={form.adminPassword} onChange={e => setForm({ ...form, adminPassword: e.target.value })} /></div>
              <div className="form-group"><label>Contraseña cocina</label><input value={form.kitchenPassword || ""} onChange={e => setForm({ ...form, kitchenPassword: e.target.value })} placeholder="Diferente a admin" /></div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: "0.75rem" }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving || !!phoneError}>{saving ? "Guardando..." : "Guardar"}</button>
              <button className="btn-sec" onClick={() => setModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
