import { useState, useEffect } from 'react'
import { Navbar } from './Dashboard'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

export default function Reportes() {
  const { user, logout } = useAuth()
  const [seccion, setSeccion] = useState('resumen')
  const [datos, setDatos] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/dashboard/'), api.get('/activos/'), api.get('/ordenes/')])
      .then(([dash, act, ots]) => setDatos({ dashboard: dash.data, activos: act.data, ordenes: ots.data }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: "100vh", background: "var(--azul)" }}>
      <Navbar user={user} logout={logout} activo="reportes" />
      <div style={{ background: "#0a1530", borderBottom: "1px solid var(--azul-borde)", padding: "12px 24px" }}>
        <p style={{ color: "var(--rojo)", fontSize: "10px", letterSpacing: "3px", margin: "0 0 2px" }}>REPORTES Y ESTADISTICAS</p>
        <p style={{ color: "var(--texto)", fontSize: "18px", margin: 0, fontWeight: 500 }}>Panel de reportes</p>
      </div>
      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", gap: "4px", marginBottom: "20px", background: "var(--azul-medio)", border: "1px solid var(--azul-borde)", borderRadius: "6px", padding: "4px" }}>
          {[["resumen","Resumen general"],["activos","Activos"],["costos","Costos"]].map(([k,l]) => (
            <button key={k} onClick={() => setSeccion(k)} style={{ flex: 1, padding: "8px", border: "none", borderRadius: "4px", background: seccion === k ? "var(--rojo)" : "transparent", color: seccion === k ? "white" : "var(--texto-secundario)", fontWeight: seccion === k ? 600 : 400, fontSize: "13px" }}>{l}</button>
          ))}
        </div>
        {loading || !datos ? (
          <p style={{ textAlign: "center", padding: "3rem", color: "var(--texto-secundario)" }}>Cargando datos...</p>
        ) : (
          <>
            {seccion === "resumen" && <SeccionResumen datos={datos} />}
            {seccion === "activos" && <SeccionActivos datos={datos} />}
            {seccion === "costos"  && <SeccionCostos  datos={datos} />}
          </>
        )}
      </div>
    </div>
  )
}

function SeccionResumen({ datos }) {
  const d = datos.dashboard
  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {[
          { label: "TOTAL ACTIVOS",   valor: d.activos.total,    sub: d.activos.operativo + " operativos",    color: "var(--verde)" },
          { label: "ORDENES TOTALES", valor: datos.ordenes.total, sub: d.ots_mes.completada + " completadas", color: "var(--texto-secundario)" },
          { label: "ALERTAS ACTIVAS", valor: d.alertas_sin_leer,  sub: "pendientes",                          color: d.alertas_sin_leer > 0 ? "var(--naranja)" : "var(--verde)" },
          { label: "COSTO MES",       valor: "Bs " + d.costo_mes_bs.toLocaleString(), sub: "mano obra + repuestos", color: "var(--texto-secundario)" },
        ].map((c, i) => (
          <div key={i} style={{ background: "var(--azul-medio)", border: "1px solid var(--azul-borde)", borderRadius: "6px", padding: "16px" }}>
            <p style={{ margin: "0 0 8px", fontSize: "10px", letterSpacing: "2px", color: "var(--texto-secundario)" }}>{c.label}</p>
            <p style={{ margin: "0 0 4px", fontSize: "26px", color: "var(--texto)", fontWeight: 300 }}>{c.valor}</p>
            <p style={{ margin: 0, fontSize: "11px", color: c.color }}>{c.sub}</p>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <TarjetaEstados titulo="ACTIVOS POR ESTADO" color="var(--rojo)" items={[
          { label: "Operativos",        valor: d.activos.operativo,         color: "var(--verde)" },
          { label: "En mantenimiento",  valor: d.activos.en_mantenimiento,  color: "var(--naranja)" },
          { label: "Fuera de servicio", valor: d.activos.fuera_de_servicio, color: "#e74c3c" },
          { label: "Dados de baja",     valor: d.activos.dado_de_baja,      color: "var(--texto-tenue)" },
        ]} />
        <TarjetaEstados titulo="ORDENES POR ESTADO" color="#2980b9" items={[
          { label: "Pendientes",  valor: d.ots_mes.pendiente,  color: "var(--texto-secundario)" },
          { label: "En proceso",  valor: d.ots_mes.en_proceso, color: "var(--naranja)" },
          { label: "Completadas", valor: d.ots_mes.completada, color: "var(--verde)" },
          { label: "Canceladas",  valor: d.ots_mes.cancelada,  color: "var(--texto-tenue)" },
        ]} />
      </div>
    </div>
  )
}

function TarjetaEstados({ titulo, color, items }) {
  return (
    <div style={{ background: "var(--azul-medio)", border: "1px solid var(--azul-borde)", borderRadius: "6px", padding: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
        <div style={{ width: "3px", height: "14px", background: color, borderRadius: "2px" }}></div>
        <p style={{ margin: 0, fontSize: "10px", letterSpacing: "2px", color }}>{titulo}</p>
      </div>
      {items.map((e, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < items.length - 1 ? "1px solid var(--azul-borde)" : "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "8px", height: "8px", background: e.color, borderRadius: "50%" }}></div>
            <span style={{ fontSize: "13px", color: "var(--texto-secundario)" }}>{e.label}</span>
          </div>
          <span style={{ fontSize: "18px", color: e.color, fontWeight: 300 }}>{e.valor}</span>
        </div>
      ))}
    </div>
  )
}

function SeccionActivos({ datos }) {
  return (
    <div style={{ background: "var(--azul-medio)", border: "1px solid var(--azul-borde)", borderRadius: "6px", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ background: "#0a1530", borderBottom: "1px solid var(--azul-borde)" }}>
            {["Activo","Categoria","Estado","KM","Placa / IP","Empresa"].map(h => (
              <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 500, color: "var(--texto-secundario)", fontSize: "10px", letterSpacing: "1px" }}>{h.toUpperCase()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {datos.activos.data.map((a, i) => (
            <tr key={a.id} style={{ borderBottom: i < datos.activos.data.length - 1 ? "1px solid var(--azul-borde)" : "none" }}>
              <td style={{ padding: "10px 14px" }}>
                <p style={{ margin: 0, color: "var(--texto)", fontWeight: 500 }}>{a.nombre}</p>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--texto-secundario)" }}>{a.codigo_interno || "—"}</p>
              </td>
              <td style={{ padding: "10px 14px", color: "var(--texto-secundario)" }}>{a.categoria}</td>
              <td style={{ padding: "10px 14px" }}>
                <span style={{ fontSize: "11px", color: a.estado === "operativo" ? "var(--verde)" : "var(--naranja)", padding: "2px 8px", borderRadius: "3px", background: a.estado === "operativo" ? "#0d2010" : "#2a1f10" }}>{a.estado}</span>
              </td>
              <td style={{ padding: "10px 14px", color: "var(--texto-secundario)" }}>{a.km_actuales ? a.km_actuales.toLocaleString() : "—"}</td>
              <td style={{ padding: "10px 14px", color: "var(--texto-secundario)", fontFamily: "monospace", fontSize: "12px" }}>{a.placa || a.ip_address || "—"}</td>
              <td style={{ padding: "10px 14px", color: "var(--texto-secundario)" }}>{a.empresa}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SeccionCostos({ datos }) {
  const ordenesCosto = datos.ordenes.data.filter(o => o.costo_total > 0)
  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <div style={{ background: "var(--azul-medio)", border: "1px solid var(--azul-borde)", borderRadius: "6px", padding: "20px", textAlign: "center" }}>
        <p style={{ color: "var(--texto-secundario)", fontSize: "10px", letterSpacing: "2px", margin: "0 0 8px" }}>COSTO TOTAL DEL MES</p>
        <p style={{ color: "var(--texto)", fontSize: "48px", fontWeight: 200, margin: "0 0 4px" }}>Bs {datos.dashboard.costo_mes_bs.toLocaleString()}</p>
        <p style={{ color: "var(--texto-secundario)", fontSize: "12px", margin: 0 }}>Mano de obra + repuestos</p>
      </div>
      <div style={{ background: "var(--azul-medio)", border: "1px solid var(--azul-borde)", borderRadius: "6px", padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <div style={{ width: "3px", height: "14px", background: "var(--verde)", borderRadius: "2px" }}></div>
          <p style={{ margin: 0, fontSize: "10px", letterSpacing: "2px", color: "var(--verde)" }}>ORDENES CON COSTO REGISTRADO</p>
        </div>
        {ordenesCosto.length === 0 ? (
          <p style={{ color: "var(--texto-secundario)", fontSize: "13px" }}>Sin costos registrados aun</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--azul-borde)" }}>
                {["N OT","Activo","Tipo","Costo total"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "var(--texto-secundario)", fontSize: "10px", letterSpacing: "1px", fontWeight: 500 }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordenesCosto.map((o, i) => (
                <tr key={o.id} style={{ borderBottom: "1px solid var(--azul-borde)" }}>
                  <td style={{ padding: "10px 12px", color: "var(--rojo)", fontFamily: "monospace", fontSize: "12px" }}>{o.numero_ot}</td>
                  <td style={{ padding: "10px 12px", color: "var(--texto)" }}>{o.activo}</td>
                  <td style={{ padding: "10px 12px", color: "var(--texto-secundario)" }}>{o.tipo}</td>
                  <td style={{ padding: "10px 12px", color: "var(--verde)", fontWeight: 600 }}>Bs {o.costo_total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
