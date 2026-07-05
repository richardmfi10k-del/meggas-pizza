// src/pages/HistoryPage.js — MEJORA: Número de pedido en historial
import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

function fmt(n) { return "$" + Math.round(n).toLocaleString("es-CO"); }
function padOrder(n) { return n ? String(n).padStart(4, "0") : "—"; }

function getDate(order) {
  if (order.createdAt?.seconds) return new Date(order.createdAt.seconds * 1000);
  return new Date();
}
function todayStr() { return new Date().toISOString().split("T")[0]; }

const STATUS = {
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
      setAllOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const filtered = allOrders.filter(o => {
    const d = getDate(o).toISOString().split("T")[0];
    return d >= dateFrom && d <= dateTo;
  });

  const totalVentas = filtered.reduce((sum, o) => sum + (o.total || 0), 0);
  const flavorCount = {};
  filtered.forEach(o => {
    const name = o.sabor || o.producto?.split("—")[0]?.trim() || "N/A";
    flavorCount[name] = (flavorCount[name] || 0) + 1;
  });
  const topFlavor = Object.entries(flavorCount).sort((a, b) => b[1] - a[1])[0];

  const setToday     = () => { const t = todayStr(); setDateFrom(t); setDateTo(t); };
  const setThisWeek  = () => { const now = new Date(); const day = now.getDay() || 7; const mon = new Date(now); mon.setDate(now.getDate() - day + 1); setDateFrom(mon.toISOString().split("T")[0]); setDateTo(todayStr()); };
  const setThisMonth = () => { const now = new Date(); setDateFrom(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`); setDateTo(todayStr()); };

  return (
    <div>
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

      <div className="history-stats">
        <div className="stat-card">
          <div className="stat-value">{filtered.length}</div>
          <div className="stat-label">Pedidos totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{fmt(totalVentas)}</div>
          <div className="stat-label">Total vendido</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{topFlavor ? topFlavor[0].split(" ")[0] : "—"}</div>
          <div className="stat-label">Más pedido</div>
        </div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: "2rem", color: "#999", fontSize: 13 }}>Cargando...</div>}
      {!loading && filtered.length === 0 && <div style={{ textAlign: "center", padding: "2rem", color: "#999", fontSize: 13 }}>Sin pedidos en este período</div>}

      {!loading && filtered.length > 0 && (
        <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #eee" }}>
          <table className="history-table">
            <thead>
              <tr>
                <th style={{ width: 80 }}># Pedido</th>
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
                const st = STATUS[order.status] || { label: order.status, css: "status-nuevo" };
                return (
                  <tr key={order.id}>
                    {/* Número de pedido destacado */}
                    <td>
                      <span style={{
                        fontFamily: "Bangers, cursive", fontSize: 17,
                        color: "#C0000A", letterSpacing: 1
                      }}>
                        #{padOrder(order.orderNumber)}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>
                        {d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div style={{ fontSize: 11, color: "#999" }}>
                        {d.toLocaleDateString("es-CO")}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.cliente}</div>
                      <div style={{ fontSize: 11, color: "#999" }}>{order.telefono}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{order.producto}</div>
                      {order.nota && <div style={{ fontSize: 11, color: "#C0000A" }}>📝 {order.nota}</div>}
                    </td>
                    <td>{order.pago}</td>
                    <td style={{ fontWeight: 700, color: "#C0000A" }}>{fmt(order.total)}</td>
                    <td><span className={`status-badge ${st.css}`}>{st.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} style={{ padding: "10px", fontWeight: 700, fontSize: 13 }}>
                  Total del período ({filtered.length} pedidos)
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
