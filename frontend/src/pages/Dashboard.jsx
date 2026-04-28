import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const semaforo = {
  VENCIDO: { bg: '#fef2f2', color: '#dc2626', label: 'VENCIDO' },
  URGENTE: { bg: '#fffbeb', color: '#d97706', label: 'URGENTE' },
  PROXIMO: { bg: '#f0fdf4', color: '#16a34a', label: 'PRÓXIMO' },
  PROGRAMADO: { bg: '#f5f5f4', color: '#888', label: 'PROGRAMADO' },
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Cargando...</div>
  if (!data) return <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>Error al cargar datos</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f4', fontFamily: 'system-ui, sans-serif' }}>

      <div style={{ background: 'white', borderBottom: '0.5px solid #e5e5e5', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', background: '#dbeafe', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>⚙</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
  <span style={{ fontSize: '15px', fontWeight: '500' }}>CMMS IMCLA-Volcán</span>
  <a href="/cmms/activos" style={{ fontSize: '13px', color: '#1e40af', textDecoration: 'none' }}>Activos</a>
</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#888' }}>{user?.nombre}</span>
          <button onClick={logout} style={{ fontSize: '12px', color: '#888', background: 'none', border: '0.5px solid #e5e5e5', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>Salir</button>
        </div>
      </div>

      <div style={{ padding: '1.5rem' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
          <MetricCard label="Total activos" value={data.activos.total} sub={`${data.activos.operativo} operativos`} subColor="#16a34a" />
          <MetricCard label="OTs este mes" value={data.ots_mes.total} sub={`${data.ots_mes.completada} completadas`} subColor="#888" />
          <MetricCard label="Alertas activas" value={data.alertas_sin_leer} sub={`${data.ots_sin_asignar} OTs sin asignar`} subColor={data.alertas_sin_leer > 0 ? '#d97706' : '#888'} />
          <MetricCard label="Costo del mes" value={`Bs ${data.costo_mes_bs.toLocaleString()}`} sub="mano obra + repuestos" subColor="#888" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '1.5rem' }}>

          <div style={{ background: 'white', border: '0.5px solid #e5e5e5', borderRadius: '12px', padding: '1rem 1.25rem' }}>
            <p style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '500' }}>Próximos mantenimientos</p>
            {data.proximos_mantenimientos.length === 0
              ? <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>Sin mantenimientos próximos</p>
              : data.proximos_mantenimientos.map((m, i) => {
                const s = semaforo[m.semaforo] || semaforo.PROGRAMADO
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', borderRadius: '8px', background: s.bg, marginBottom: '6px' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '500', color: s.color }}>{m.codigo || m.activo} · {m.mantenimiento}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: s.color }}>{m.dias_restantes < 0 ? `Vencido hace ${Math.abs(m.dias_restantes)} días` : `En ${m.dias_restantes} días`}</p>
                    </div>
                    <span style={{ fontSize: '11px', color: s.color, border: `0.5px solid ${s.color}`, padding: '2px 8px', borderRadius: '6px' }}>{s.label}</span>
                  </div>
                )
              })
            }
          </div>

          <div style={{ background: 'white', border: '0.5px solid #e5e5e5', borderRadius: '12px', padding: '1rem 1.25rem' }}>
            <p style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '500' }}>Alertas recientes</p>
            {data.alertas.length === 0
              ? <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>Sin alertas activas</p>
              : data.alertas.map((a, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: i < data.alertas.length - 1 ? '0.5px solid #e5e5e5' : 'none' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#111' }}>{a.titulo}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#888' }}>{a.tipo} · {a.prioridad}</p>
                </div>
              ))
            }
          </div>

        </div>

        <div style={{ background: 'white', border: '0.5px solid #e5e5e5', borderRadius: '12px', padding: '1rem 1.25rem' }}>
          <p style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '500' }}>Estado de activos</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            <EstadoCard label="Operativos" value={data.activos.operativo} color="#16a34a" />
            <EstadoCard label="En mantenimiento" value={data.activos.en_mantenimiento} color="#d97706" />
            <EstadoCard label="Fuera de servicio" value={data.activos.fuera_de_servicio} color="#dc2626" />
            <EstadoCard label="Dados de baja" value={data.activos.dado_de_baja} color="#888" />
          </div>
        </div>

      </div>
    </div>
  )
}

function MetricCard({ label, value, sub, subColor }) {
  return (
    <div style={{ background: 'white', border: '0.5px solid #e5e5e5', borderRadius: '10px', padding: '1rem' }}>
      <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#888' }}>{label}</p>
      <p style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: '500', color: '#111' }}>{value}</p>
      <p style={{ margin: 0, fontSize: '11px', color: subColor }}>{sub}</p>
    </div>
  )
}

function EstadoCard({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px', background: '#f5f5f4', borderRadius: '8px' }}>
      <p style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '500', color }}>{value}</p>
      <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>{label}</p>
    </div>
  )
}