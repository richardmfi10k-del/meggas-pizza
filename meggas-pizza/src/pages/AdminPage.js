// src/pages/AdminPage.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

function fmt(n) { return "$" + Math.round(n).toLocaleString("es-CO"); }

export default function AdminPage() {
  const { isAdmin, logout, flavors, sizes, config, saveFlavor, deleteFlavor, saveSize, saveConfig } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState("sabores");
  const [modal, setModal] = useState(null); // { type: 'flavor'|'size'|'config', data }
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!isAdmin) navigate("/admin/login");
  }, [isAdmin, navigate]);

  function openFlavor(flavor) {
    setForm(flavor ? { ...flavor } : { id: "f" + Date.now(), name: "", ing: "", active: true });
    setModal("flavor");
  }

  function openSize(size) {
    setForm(size ? { ...size } : { id: "s" + Date.now(), label: "", porciones: "", price: "", order: sizes.length + 1 });
    setModal("size");
  }

  function openConfig() {
    setForm({ ...config });
    setModal("config");
  }

  async function save() {
    setSaving(true);
    try {
      if (modal === "flavor") await saveFlavor({ ...form, price: undefined });
      if (modal === "size") await saveSize({ ...form, price: Number(form.price) });
      if (modal === "config") await saveConfig({ ...form, domicilio: Number(form.domicilio) });
      showSuccess("Guardado correctamente ✅");
      setModal(null);
    } catch (e) {
      alert("Error al guardar: " + e.message);
    }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!window.confirm("¿Eliminar este sabor?")) return;
    await deleteFlavor(id);
    showSuccess("Sabor eliminado");
  }

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  if (!isAdmin) return null;

  return (
    <div className="page-wide">
      <div className="admin-nav">
        <span className="admin-nav-title">⚙️ Panel — Megga's Pizza</span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a href="/cocina" className="nav-link" style={{ fontSize: 12, opacity: 0.7 }}>Cocina</a>
          <a href="/" className="nav-link" style={{ fontSize: 12, opacity: 0.7 }}>Menú</a>
          <button className="nav-link" onClick={() => { logout(); navigate("/admin/login"); }}>
            Salir →
          </button>
        </div>
      </div>

      {successMsg && <div className="toast" style={{ background: "#f0fff4", borderColor: "#b7e1be", color: "#1a7a31" }}>{successMsg}</div>}

      <div className="admin-tabs">
        {["sabores", "tamaños", "configuración"].map(t => (
          <button key={t} className={`admin-tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── SABORES ── */}
      {tab === "sabores" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{flavors.length} sabores activos</div>
            <button className="btn-primary" style={{ width: "auto", padding: "8px 18px", fontSize: 13 }} onClick={() => openFlavor(null)}>
              + Nuevo sabor
            </button>
          </div>
          {flavors.map(f => (
            <div key={f.id} className="admin-list-item">
              <div className="item-info">
                <div className="item-name-big">{f.name}</div>
                <div className="item-ing-small">{f.ing}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn-sec" onClick={() => openFlavor(f)}>Editar</button>
                <button className="btn-danger" onClick={() => handleDelete(f.id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAMAÑOS ── */}
      {tab === "tamaños" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{sizes.length} tamaños</div>
            <button className="btn-primary" style={{ width: "auto", padding: "8px 18px", fontSize: 13 }} onClick={() => openSize(null)}>
              + Nuevo tamaño
            </button>
          </div>
          {sizes.map(s => (
            <div key={s.id} className="admin-list-item">
              <div className="item-info">
                <div className="item-name-big">{s.label}</div>
                <div className="item-ing-small">{s.porciones}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="item-price-big">{fmt(s.price)}</div>
                <button className="btn-sec" onClick={() => openSize(s)}>Editar precio</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CONFIGURACIÓN ── */}
      {tab === "configuración" && (
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: "1rem" }}>Configuración general</div>
          <div className="form-row full" style={{ marginBottom: 10 }}>
            <div className="form-group">
              <label>Nombre del negocio</label>
              <input value={config.negocio} readOnly style={{ opacity: 0.6, cursor: "not-allowed" }} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Teléfono WhatsApp</label>
              <input value={config.telefono} readOnly style={{ opacity: 0.6 }} />
            </div>
            <div className="form-group">
              <label>Costo domicilio ($)</label>
              <input value={config.domicilio} readOnly style={{ opacity: 0.6 }} />
            </div>
          </div>
          <div style={{ marginTop: "0.5rem" }}>
            <button className="btn-primary" style={{ width: "auto", padding: "9px 24px" }} onClick={openConfig}>
              ✏️ Editar configuración
            </button>
          </div>
          <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#f7f7f7", borderRadius: 10, fontSize: 13, color: "#666" }}>
            <strong>Contraseña actual:</strong> {config.adminPassword}<br />
            <span style={{ fontSize: 12, opacity: 0.7 }}>Puedes cambiarla en Editar configuración</span>
          </div>
        </div>
      )}

      {/* ── MODAL SABOR ── */}
      {modal === "flavor" && (
        <div className="modal-overlay" style={{ marginTop: "1rem" }}>
          <div className="modal-box">
            <div className="modal-title">{form.name ? `Editar: ${form.name}` : "Nuevo sabor"}</div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Nombre del sabor *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej. Mexicana" />
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Ingredientes *</label>
              <textarea
                value={form.ing}
                onChange={e => setForm({ ...form, ing: e.target.value })}
                placeholder="Ej. Tocineta, maíz, jalapeño, tostacós"
                style={{ minHeight: 70, resize: "vertical" }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: "0.75rem" }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
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
              <div className="form-group">
                <label>Nombre *</label>
                <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="Ej. Grande" />
              </div>
              <div className="form-group">
                <label>Porciones</label>
                <input value={form.porciones} onChange={e => setForm({ ...form, porciones: e.target.value })} placeholder="Ej. 12 porciones" />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Precio (sin puntos) *</label>
              <input
                type="number"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                placeholder="Ej. 55000"
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: "0.75rem" }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>
                {saving ? "Guardando..." : "Guardar precio"}
              </button>
              <button className="btn-sec" onClick={() => setModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CONFIGURACIÓN ── */}
      {modal === "config" && (
        <div className="modal-overlay" style={{ marginTop: "1rem" }}>
          <div className="modal-box">
            <div className="modal-title">Editar configuración</div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Nombre del negocio</label>
              <input value={form.negocio} onChange={e => setForm({ ...form, negocio: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Teléfono</label>
                <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Costo domicilio ($)</label>
                <input type="number" value={form.domicilio} onChange={e => setForm({ ...form, domicilio: e.target.value })} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Nueva contraseña del panel admin</label>
              <input value={form.adminPassword} onChange={e => setForm({ ...form, adminPassword: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: "0.75rem" }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>
                {saving ? "Guardando..." : "Guardar configuración"}
              </button>
              <button className="btn-sec" onClick={() => setModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
