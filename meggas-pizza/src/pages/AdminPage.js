// src/pages/AdminPage.js — con Firebase Storage para subida de imágenes
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import HistoryPage from "./HistoryPage";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

function fmt(n) { return "$" + Math.round(n).toLocaleString("es-CO"); }
function sanitizePhone(raw) { return raw.replace(/\D/g, "").slice(0, 10); }
function formatPhoneDisplay(d) {
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)} ${d.slice(3)}`;
  if (d.length <= 8) return `${d.slice(0,3)} ${d.slice(3,6)} ${d.slice(6)}`;
  return `${d.slice(0,3)} ${d.slice(3,6)} ${d.slice(6,8)} ${d.slice(8)}`;
}

async function uploadImage(file, path) {
  const storage = getStorage();
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

// Componente reutilizable para subir imagen
function ImageUploader({ currentUrl, storagePath, onUploaded, shape = "square" }) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, storagePath);
      onUploaded(url);
    } catch (err) {
      alert("Error subiendo imagen: " + err.message);
    }
    setUploading(false);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
      {currentUrl && (
        <img src={currentUrl} alt="" style={{
          width: shape === "circle" ? 50 : 60,
          height: shape === "circle" ? 50 : 60,
          borderRadius: shape === "circle" ? "50%" : 8,
          objectFit: "cover",
          border: "1px solid #eee"
        }} />
      )}
      <label style={{
        display: "inline-block", padding: "7px 14px",
        border: "1.5px solid #ddd", borderRadius: 8,
        fontSize: 12, fontWeight: 700, cursor: "pointer",
        background: uploading ? "#f7f7f7" : "#fff",
        color: uploading ? "#aaa" : "#555"
      }}>
        {uploading ? "Subiendo..." : currentUrl ? "Cambiar foto" : "📷 Subir foto"}
        <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} disabled={uploading} />
      </label>
      {currentUrl && !uploading && (
        <button onClick={() => onUploaded("")} style={{ border: "none", background: "none", color: "#ccc", cursor: "pointer", fontSize: 18 }}>✕</button>
      )}
    </div>
  );
}

const CATEGORY_ICONS = ["🍕","🍔","🌮","🍗","🌭","🥪","🍟","🥗","🍜","🍣","🥩","🧆","🫔","🧇","🥞","🧃","🥤","🍺","☕","🧋"];

export default function AdminPage() {
  const {
    isAdmin, logout, products, categories, sizes, config, variants,
    saveProduct, deleteProduct, saveCategory, deleteCategory,
    saveSize, saveConfig, saveVariant, deleteVariant
  } = useApp();
  const navigate = useNavigate();

  const [tab, setTab]         = useState("menu");
  const [subTab, setSubTab]   = useState(null);
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState({});
  const [saving, setSaving]   = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const [variantForm, setVariantForm]       = useState(null);
  const [newOptionLabel, setNewOptionLabel] = useState("");

  useEffect(() => { if (!isAdmin) navigate("/admin/login"); }, [isAdmin, navigate]);
  useEffect(() => { if (categories.length && !subTab) setSubTab(categories[0]?.id); }, [categories]);

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

  function openNewVariant(categoryId) {
    setVariantForm({ id: "var-" + Date.now(), categoryId, productId: null, label: "", required: false, active: true, options: [] });
    setNewOptionLabel("");
  }
  function openEditVariant(variant) {
    setVariantForm({ ...variant, options: variant.options ? [...variant.options] : [] });
    setNewOptionLabel("");
  }
  function addOption() {
    const label = newOptionLabel.trim();
    if (!label) return;
    setVariantForm(prev => ({ ...prev, options: [...prev.options, { id: "opt-" + Date.now(), label, active: true }] }));
    setNewOptionLabel("");
  }
  function removeOption(optId) {
    setVariantForm(prev => ({ ...prev, options: prev.options.filter(o => o.id !== optId) }));
  }
  async function saveVariantForm() {
    if (!variantForm.label.trim()) { alert("El nombre de la variante es obligatorio"); return; }
    if (variantForm.options.length === 0) { alert("Agrega al menos una opción"); return; }
    setSaving(true);
    await saveVariant(variantForm);
    setVariantForm(null);
    showSuccess("Variante guardada ✅");
    setSaving(false);
  }

  const TABS = ["menu", "tamaños", "variantes", "configuración", "historial"];
  const currentCatProducts = products.filter(p => p.categoryId === subTab);
  const currentCat = categories.find(c => c.id === subTab);
  const variantsByCat = categories.reduce((acc, cat) => {
    acc[cat.id] = variants.filter(v => v.categoryId === cat.id);
    return acc;
  }, {});

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
            {t === "menu" && "🍽️ "}{t === "tamaños" && "📏 "}{t === "variantes" && "🔀 "}{t === "configuración" && "⚙️ "}{t === "historial" && "📊 "}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── MENÚ ── */}
      {tab === "menu" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#666" }}>CATEGORÍAS</div>
            <button className="btn-primary" style={{ width: "auto", padding: "7px 14px", fontSize: 12 }} onClick={() => openCategory(null)}>+ Nueva categoría</button>
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: "1.25rem" }}>
            {categories.map(cat => (
              <div key={cat.id} style={{ flexShrink: 0, display: "flex", gap: 4, alignItems: "center" }}>
                <button onClick={() => setSubTab(cat.id)} style={{
                  padding: "7px 14px", border: `1.5px solid ${subTab === cat.id ? "#C0000A" : "#eee"}`,
                  borderRadius: 20, background: subTab === cat.id ? "#C0000A" : "#fff",
                  color: subTab === cat.id ? "#FFE600" : "#666",
                  fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit"
                }}>
                  {cat.icon} {cat.name}
                </button>
                <button onClick={() => openCategory(cat)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 14, opacity: 0.5 }}>✏️</button>
                <button onClick={async () => { if (window.confirm(`¿Eliminar categoría ${cat.name}?`)) { await deleteCategory(cat.id); showSuccess("Categoría eliminada"); }}} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 14, opacity: 0.5 }}>🗑️</button>
              </div>
            ))}
          </div>

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
              {currentCatProducts.length === 0 && <div style={{ textAlign: "center", padding: "2rem", color: "#aaa", fontSize: 13 }}>Sin productos en esta categoría</div>}
              {currentCatProducts.map(p => (
                <div key={p.id} className="admin-list-item">
                  <div className="item-info" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                      : <div style={{ width: 44, height: 44, borderRadius: 8, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{currentCat.icon}</div>
                    }
                    <div>
                      <div className="item-name-big">{p.name}</div>
                      <div className="item-ing-small">{p.description}</div>
                    </div>
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

      {/* ── VARIANTES ── */}
      {tab === "variantes" && (
        <div>
          <div style={{ fontSize: 13, color: "#666", marginBottom: "1rem", background: "#f7f7f7", padding: "10px 14px", borderRadius: 10 }}>
            🔀 Las variantes aparecen como un modal al cliente cuando agrega un producto.<br />
            <span style={{ fontSize: 12 }}>Ejemplos: sabor de gaseosa, término de la carne, salsas para salchipapas.</span>
          </div>
          {categories.filter(c => c.type !== "pizza").map(cat => (
            <div key={cat.id} style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#444" }}>{cat.icon} {cat.name}</div>
                <button className="btn-primary" style={{ width: "auto", padding: "6px 12px", fontSize: 12 }} onClick={() => openNewVariant(cat.id)}>
                  + Nueva variante
                </button>
              </div>
              {variantsByCat[cat.id]?.length === 0 && (
                <div style={{ fontSize: 12, color: "#bbb", padding: "8px 0" }}>Sin variantes para esta categoría</div>
              )}
              {variantsByCat[cat.id]?.map(v => {
                const prod = v.productId ? products.find(p => p.id === v.productId) : null;
                return (
                  <div key={v.id} className="admin-list-item" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{v.label}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>
                          {prod ? `Solo: ${prod.name}` : "Toda la categoría"}
                          {" · "}
                          {v.required ? <span style={{ color: "#C0000A" }}>Obligatoria</span> : <span style={{ color: "#aaa" }}>Opcional</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn-sec" onClick={() => openEditVariant(v)}>Editar</button>
                        <button className="btn-danger" onClick={async () => {
                          if (window.confirm(`¿Eliminar variante "${v.label}"?`)) { await deleteVariant(v.id); showSuccess("Variante eliminada"); }
                        }}>Eliminar</button>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {v.options?.map(o => (
                        <span key={o.id} style={{ background: "#f0f0f0", borderRadius: 20, padding: "3px 10px", fontSize: 12, color: "#555" }}>{o.label}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* ── CONFIGURACIÓN ── */}
      {tab === "configuración" && (
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: "1rem" }}>Configuración general</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            {config.logoUrl
              ? <img src={config.logoUrl} alt="logo" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid #eee" }} />
              : <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🍕</div>
            }
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{config.negocio}</div>
              <div style={{ fontSize: 12, color: "#888" }}>{config.telefono}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            {[["Domicilio", fmt(config.domicilio || 0)], ["Contraseña admin", "••••••••"], ["Contraseña cocina", config.kitchenPassword ? "••••••••" : "(usa la de admin)"]].map(([label, val]) => (
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

      {/* ── MODAL VARIANTE ── */}
      {variantForm && (
        <div className="modal-overlay" style={{ marginTop: "1rem" }}>
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div className="modal-title">{variantForm.label ? `Editar: ${variantForm.label}` : "Nueva variante"}</div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Nombre de la variante *</label>
              <input value={variantForm.label} onChange={e => setVariantForm(f => ({ ...f, label: e.target.value }))} placeholder="Ej. Sabor, Término de la carne, Salsas" />
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Aplica a</label>
              <select value={variantForm.productId || ""} onChange={e => setVariantForm(f => ({ ...f, productId: e.target.value || null }))}>
                <option value="">Todos los productos de la categoría</option>
                {products.filter(p => p.categoryId === variantForm.categoryId && p.active).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, cursor: "pointer" }}
              onClick={() => setVariantForm(f => ({ ...f, required: !f.required }))}>
              <div style={{ width: 36, height: 20, borderRadius: 10, background: variantForm.required ? "#C0000A" : "#ccc", position: "relative" }}>
                <div style={{ position: "absolute", top: 3, left: variantForm.required ? 18 : 3, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "all 0.2s" }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: variantForm.required ? "#C0000A" : "#999" }}>
                {variantForm.required ? "Obligatoria" : "Opcional"}
              </span>
            </div>
            <div className="form-group" style={{ marginBottom: 6 }}>
              <label>Opciones</label>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <input value={newOptionLabel} onChange={e => setNewOptionLabel(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addOption(); }}}
                  placeholder="Ej. Coca-Cola" style={{ flex: 1 }} />
                <button className="btn-primary" style={{ width: "auto", padding: "0 14px", fontSize: 18 }} onClick={addOption}>+</button>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, minHeight: 32, marginBottom: 12 }}>
              {variantForm.options.map(o => (
                <span key={o.id} style={{ background: "#fff0f0", border: "1px solid #f5c0c0", borderRadius: 20, padding: "4px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  {o.label}
                  <button onClick={() => removeOption(o.id)} style={{ border: "none", background: "none", cursor: "pointer", color: "#C0000A", fontSize: 14, padding: 0, lineHeight: 1 }}>✕</button>
                </span>
              ))}
              {variantForm.options.length === 0 && <span style={{ fontSize: 12, color: "#ccc" }}>Aún no hay opciones</span>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={saveVariantForm} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
              <button className="btn-sec" onClick={() => setVariantForm(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

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
              <label>Foto de categoría (círculo del menú)</label>
              <ImageUploader
                currentUrl={form.imageUrl}
                storagePath={`categorias/${form.id}.jpg`}
                onUploaded={url => setForm(f => ({ ...f, imageUrl: url }))}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Ícono (fallback si no hay foto)</label>
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
              <label>Foto del producto</label>
              <ImageUploader
                currentUrl={form.imageUrl}
                storagePath={`productos/${form.id}.jpg`}
                onUploaded={url => setForm(f => ({ ...f, imageUrl: url }))}
              />
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
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Nombre del negocio</label>
              <input value={form.negocio} onChange={e => setForm({ ...form, negocio: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Logo del negocio (círculo del header)</label>
              <ImageUploader
                currentUrl={form.logoUrl}
                storagePath="config/logo.jpg"
                onUploaded={url => setForm(f => ({ ...f, logoUrl: url }))}
                shape="circle"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Teléfono (10 dígitos) *</label>
              <input value={form.telefono} onChange={e => handlePhoneChange(e.target.value)} placeholder="3105780503" maxLength={13} />
              {phoneError && <span style={{ fontSize: 11, color: "#C0000A" }}>{phoneError}</span>}
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Costo domicilio ($)</label>
              <input type="number" value={form.domicilio} onChange={e => setForm({ ...form, domicilio: e.target.value })} />
            </div>
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
