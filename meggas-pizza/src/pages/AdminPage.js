// src/pages/AdminPage.js — CON FIX #3 (sanitización teléfono) Y CONTRASEÑA COCINA
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import HistoryPage from "./HistoryPage";

function fmt(n) { return "$" + Math.round(n).toLocaleString("es-CO"); }

// ── FIX #3: Sanitiza número de teléfono ──
function sanitizePhone(raw) {
  // Elimina todo excepto dígitos
  return raw.replace(/\D/g, "").slice(0, 10);
}

function formatPhoneDisplay(digits) {
  // Formatea como "310 578 05 03"
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0,3)} ${digits.slice(3)}`;
  if (digits.length <= 8) return `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6)}`;
  return `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6,8)} ${digits.slice(8)}`;
}

export default function AdminPage() {
  const { isAdmin, logout, flavors, sizes, config, saveFlavor, deleteFlavor, saveSize, saveConfig } = useApp();
  const navigate = useNavigate();
  const [tab, setTab]         = useState("historial");
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState({});
  const [saving, setSaving]   = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => { if (!isAdmin) navigate("/admin/login"); }, [isAdmin, navigate]);

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
    setPhoneError("");
    setModal("config");
  }

  function handlePhoneChange(raw) {
    const digits = sanitizePhone(raw);
    setForm(f => ({ ...f, telefono: digits }));
    if (digits.length > 0 && digits.length < 10) {
      setPhoneError("El teléfono debe tener 10 dígitos");
    } else {
      setPhoneError("");
    }
  }

  async function save() {
    if (modal === "config") {
      const digits = sanitizePhone(form.telefono || "");
      if (digits.length !== 10) {
        setPhoneError("El teléfono debe tener exactamente 10 dígitos");
        return;
      }
      // Guarda el teléfono formateado legible
      setForm(f => ({ ...f, telefono: formatPhoneDisplay(digits) }));
    }
    setSaving(true);
    try {
      const dataToSave = { ...form };
      if (modal === "config") {
        dataToSave.telefono = formatPhoneDisplay(sanitizePhone(form.telefono || ""));
        dataToSave.domicilio = Number(form.domicilio);
      }
      if (modal === "flavor") await saveFlavor(dataToSave);
      if (modal === "size")   await saveSize({ ...dataToSave, price: Number(dataToSave.price) });
      if (modal === "config") await saveConfig(dataToSave);
      showSuccess("Guardado correctamente ✅");
      setModal(null);
    } catch (e) { alert("Error al guardar: " + e.message); }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!window.confirm("¿Eliminar este sabor?")) return;
    await deleteFlavor(id);
    showSuccess("Sabor eliminado");
  }

  async function handleToggleHalf(size) {
    await saveSize({ ...size, allowHalf: !size.allowHalf });
    showSuccess(`Mitad y mitad ${!size.allowHalf ? "activado" : "desactivado"} para ${size.label}`);
  }

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  if (!isAdmin) return null;

  const TABS = ["historial", "sabores", "tamaños", "configuración"];

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

      {successMsg && (
        <div className="toast" style={{ background: "#f0fff4", borderColor: "#b7e1be", color: "#1a7a31", marginBottom: "1rem" }}>
          {successMsg}
        </div>
      )}

      <div className="admin-tabs">
        {TABS.map(t => (
          <button key={t} className={`admin-tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
            {t === "historial" && "📊 "}{t === "sabores" && "🍕 "}{t === "tamaños" && "📏 "}{t === "configuración" && "⚙️ "}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "historial" && <HistoryPage />}

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

      {tab === "tamaños" && (
        <div>
          <div style={{ fontSize: 13, color: "#666", marginBottom: "0.75rem", background: "#f7f7f7", padding: "10px 14px", borderRadius: 10 }}>
            💡 Activa <strong>Mitad y mitad</strong> en los tamaños donde quieres que el cliente pueda elegir 2 sabores.
          </div>
          {sizes.map(s => (
            <div key={s.id} className="admin-list-item">
              <div className="item-info">
                <div className="item-name-big">{s.label}</div>
                <div className="item-ing-small">{s.porciones}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {/* Toggle mitad y mitad */}
                <div
                  onClick={() => handleToggleHalf(s)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                    background: s.allowHalf ? "#f0fff4" : "#f7f7f7",
                    border: `1px solid ${s.allowHalf ? "#b7e1be" : "#eee"}`,
                    borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700,
                    color: s.allowHalf ? "#1a7a31" : "#999"
                  }}
                >
                  <div style={{
                    width: 28, height: 16, borderRadius: 8,
                    background: s.allowHalf ? "#1a7a31" : "#ccc",
                    position: "relative", transition: "all 0.2s"
                  }}>
                    <div style={{
                      position: "absolute", top: 2, left: s.allowHalf ? 14 : 2,
                      width: 12, height: 12, borderRadius: "50%",
                      background: "#fff", transition: "all 0.2s"
                    }} />
                  </div>
                  Mitad y mitad
                </div>
                <div className="item-price-big">{fmt(s.price)}</div>
                <button className="btn-sec" onClick={() => openSize(s)}>Editar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "configuración" && (
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: "1rem" }}>Configuración general</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            {[
              { label: "Negocio", val: config.negocio },
              { label: "Teléfono", val: config.telefono },
              { label: "Domicilio", val: fmt(config.domicilio || 0) },
              { label: "Contraseña admin", val: "••••••••" },
              { label: "Contraseña cocina", val: config.kitchenPassword ? "••••••••" : "(usa la de admin)" },
            ].map(item => (
              <div key={item.label} style={{ background: "#f7f7f7", borderRadius: 8, padding: "8px 12px" }}>
                <div style={{ fontSize: 11, color: "#999" }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{item.val}</div>
              </div>
            ))}
          </div>
          <button className="btn-primary" style={{ width: "auto", padding: "9px 24px" }} onClick={openConfig}>
            ✏️ Editar configuración
          </button>
        </div>
      )}

      {/* ── MODAL SABOR ── */}
      {modal === "flavor" && (
        <div className="modal-overlay" style={{ marginTop: "1rem" }}>
          <div className="modal-box">
            <div className="modal-title">{form.name ? `Editar: ${form.name}` : "Nuevo sabor"}</div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Nombre *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej. Mexicana" />
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Ingredientes *</label>
              <textarea value={form.ing} onChange={e => setForm({ ...form, ing: e.target.value })}
                placeholder="Ej. Tocineta, maíz, jalapeño, tostacós" style={{ minHeight: 70, resize: "vertical" }} />
            </div>
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
              <div className="form-group">
                <label>Nombre *</label>
                <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Porciones</label>
                <input value={form.porciones} onChange={e => setForm({ ...form, porciones: e.target.value })} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Precio (sin puntos) *</label>
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: "0.75rem" }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
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
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Teléfono (10 dígitos) *</label>
              <input
                value={form.telefono}
                onChange={e => handlePhoneChange(e.target.value)}
                placeholder="3105780503"
                maxLength={13}
              />
              {phoneError && <span style={{ fontSize: 11, color: "#C0000A", marginTop: 3 }}>{phoneError}</span>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Costo domicilio ($)</label>
                <input type="number" value={form.domicilio} onChange={e => setForm({ ...form, domicilio: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Contraseña admin</label>
                <input value={form.adminPassword} onChange={e => setForm({ ...form, adminPassword: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Contraseña cocina</label>
                <input value={form.kitchenPassword || ""} onChange={e => setForm({ ...form, kitchenPassword: e.target.value })}
                  placeholder="Diferente a la de admin" />
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#999", marginBottom: 10 }}>
              💡 Si dejas la contraseña de cocina vacía, usará la misma del admin.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving || !!phoneError}>
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
