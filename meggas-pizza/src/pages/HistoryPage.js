// src/pages/HistoryPage.js
// Historial de pedidos — va dentro del panel admin

import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

function fmt(n) { return "$" + Math.round(n).toLocaleString("es-CO"); }

function getDate(order) {
  if (order.createdAt?.seconds) {
    return new Date(order.createdAt.seconds * 1000);
  }
  return new Date();
}

function formatDate(date) {
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTime(date) {
  return date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

function todayStr() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

const STATUS_LABELS = {
  nuevo:      { label: "Nuevo",      css: "status-nuevo" },
  preparando: { label: "Preparando", css: "status-preparando" },
  listo:      { label: "Listo",      css: "status-listo" },
  entregado:  { label: "Entregado",  css: "status-entregado" },
};

export default function HistoryPage() {
  const [allOrders, setAllOrders] = useState([]);
  const [dateFrom, setDateFrom]   = useState(todayStr());
  const [dateTo, setDateTo]       = useState(todayStr());
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllOrders(data);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  // Filtrar por rango de fechas
  const filtered = allOrders.filter(order => {
    const d = getDate(order);
    const dateStr = d.toISOString().split("T")[0];
    return dateStr >= dateFrom && dateStr <= dateTo;
  });

  // Estadísticas del período
  const totalVentas    = filtered.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalPedidos   = filtered.length;
  const entregados     = filtered.filter(o => o.status === "entregado").length;

  // Sabor más pedido
  const flavorCount = {};
  filtered.forEach(o => {
    const name = o.sabor || o.producto?.split("—")[0]?.trim() || "N/A";
    flavorCount[name] = (flavorCount[name] || 0) + 1;
  });
  const topFlavor = Object.entries(flavorCount).sort((a, b) => b[1] - a[1])[0];

  function setToday() {
    const t = todayStr();
    setDateFrom(t); setDateTo(t);
  }
  function setThisWeek() {
    const now = new Date();
    const day = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + 1);
    setDateFrom(monday.toISOString().split("T")[0]);
    setDateTo(todayStr());
  }
  function setThisMonth() {
    const now = new Date();
    setDateFrom(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`);
    setDateTo(todayStr());
  }

  return (
    <div>
      {/* Filtros de fecha */}
      <div className="date-filter">
        <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <label style={{ whiteSpace: "nowrap", margin: 0 }}>Desde</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <label style={{ whiteSpace: "nowrap", margin: 0 }}>Hasta</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <button className="btn-sec" onClick={setToday}>Hoy</button>
        <button className="btn-sec" onClick={setThisWeek}>Esta semana</button>
        <button className="btn-sec" onClick={setThisMonth}>Este mes</button>
      </div>

      {/* Estadísticas */}
      <div className="history-stats">
        <div className="stat-card">
          <div className="stat-value">{totalPedidos}</div>
          <div className="stat-label">Pedidos totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{fmt(totalVentas)}</div>
          <div className="stat-label">Total vendido</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{topFlavor ? topFlavor[0].split(" ")[0] : "—"}</div>
          <div className="stat-label">Sabor más pedido</div>
        </div>
      </div>

      {/* Tabla de pedidos */}
      {loading && (
        <div style={{ textAlign: "center", padding: "2rem", color: "#999", fontSize: 13 }}>
          Cargando pedidos...
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "2rem", color: "#999", fontSize: 13 }}>
          Sin pedidos en este período
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #eee" }}>
          <table className="history-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Hora</th>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Pago</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => {
                const d = getDate(order);
                const num = typeof order.id === "string" ? order.id.slice(-4).toUpperCase() : order.id;
                const st = STATUS_LABELS[order.status] || { label: order.status, css: "status-nuevo" };
                return (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 700, color: "#C0000A" }}>#{num}</td>
                    <td>
                      <div style={{ fontSize: 13 }}>{formatTime(d)}</div>
                      <div style={{ fontSize: 11, color: "#999" }}>{formatDate(d)}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.cliente}</div>
                      <div style={{ fontSize: 11, color: "#999" }}>{order.telefono}</div>
                    </td>
                    <td>
                      <div>{order.producto}</div>
                      {order.nota && <div style={{ fontSize: 11, color: "#C0000A" }}>📝 {order.nota}</div>}
                    </td>
                    <td>{order.pago}</td>
                    <td style={{ fontWeight: 700, color: "#C0000A" }}>{fmt(order.total)}</td>
                    <td>
                      <span className={`status-badge ${st.css}`}>{st.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} style={{ padding: "10px", fontWeight: 700, fontSize: 13 }}>
                  Total del período ({totalPedidos} pedidos)
                </td>
                <td style={{ fontWeight: 700, color: "#C0000A", fontSize: 15 }}>{fmt(totalVentas)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
