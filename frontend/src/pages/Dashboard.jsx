import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const semaforo = {
  VENCIDO:    { color: '#e74c3c', borde: '#e74c3c', label: 'VENCIDO' },
  URGENTE:    { color: '#e67e22', borde: '#e67e22', label: 'URGENTE' },
  PROXIMO:    { color: '#7a9bb5', borde: '#2a4a7f', label: 'PRÓXIMO' },
  PROGRAMADO: { color: '#3a5a7a', borde: '#1e3560', label: 'PROGRAMADO' },
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

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--texto-secundario)' }}>Cargando...</div>
  if (!data) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--rojo)' }}>Error al cargar datos</div>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--azul)' }}>
      <Navbar user={user} logout={logout} activo="inicio" />

      <div style={{ background: '#0a1530', borderBottom: '1px solid var(--azul-borde)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: 'var(--rojo)', fontSize: '10px', letterSpacing: '3px', margin: '0 0 2px' }}>PANEL DE CONTROL</p>
          <p style={{ color: 'var(--texto)', fontSize: '18px', margin: 0, fontWeight: 500 }}>Bienvenido, {user?.nombre}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '7px', height: '7px', background: 'var(--verde)', borderRadius: '50%' }}></div>
          <span style={{ color: '#4a9b6f', fontSize: '12px' }}>Sistema operativo</span>
          <span style={{ color: 'var(--texto-tenue)', fontSize: '12px' }}>· Volcán S.R.L.</span>
        </div>
      </div>

      <div style={{ padding: '20px 24px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          <MetricCard label="TOTAL ACTIVOS" valor={data.activos.total} sub={`${data.activos.operativo} operativos`} subColor="var(--verde)" acento="var(--rojo)" />
          <MetricCard label="ÓRDENES DE TRABAJO" valor={data.ots_mes.total} sub={`${data.ots_mes.completada} completadas este mes`} subColor="var(--texto-secundario)" acento="#2980b9" />
          <MetricCard label="ALERTAS ACTIVAS" valor={data.alertas_sin_leer} sub={`${data.ots_sin_asignar} OTs sin asignar`} subColor={data.alertas_sin_leer > 0 ? 'var(--naranja)' : 'var(--texto-secundario)'} acento="var(--naranja)" />
          <MetricCard label="COSTO DEL MES" valor={`${data.costo_mes_bs.toLocaleString()}`} sub="Bs · mano obra + repuestos" subColor="var(--texto-secundario)" acento="var(--verde)" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          <div style={{ background: 'var(--azul-medio)', border: '1px solid var(--azul-borde)', borderRadius: '6px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '3px', height: '14px', background: 'var(--rojo)', borderRadius: '2px' }}></div>
              <p style={{ margin: 0, fontSize: '10px', letterSpacing: '2px', color: 'var(--rojo)' }}>PRÓXIMOS MANTENIMIENTOS</p>
            </div>
            {data.proximos_mantenimientos.length === 0
              ? <p style={{ fontSize: '13px', color: 'var(--texto-secundario)' }}>Sin mantenimientos próximos</p>
              : data.proximos_mantenimientos.map((m, i) => {
                const s = semaforo[m.semaforo] || semaforo.PROGRAMADO
                return (
                  <div key={i} style={{ padding: '10px', background: 'var(--azul)', borderRadius: '4px', borderLeft: `3px solid ${s.borde}`, marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--texto)' }}>{m.codigo || m.activo} · {m.mantenimiento}</p>
                        <p style={{ margin: '3px 0 0', fontSize: '11px', color: s.color }}>{m.dias_restantes < 0 ? `Vencido hace ${Math.abs(m.dias_restantes)} días` : `En ${m.dias_restantes} días`}</p>
                      </div>
                      <span style={{ fontSize: '10px', color: s.color, border: `1px solid ${s.borde}`, padding: '2px 8px', borderRadius: '3px', letterSpacing: '1px' }}>{s.label}</span>
                    </div>
                  </div>
                )
              })
            }
          </div>

          <div style={{ background: 'var(--azul-medio)', border: '1px solid var(--azul-borde)', borderRadius: '6px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '3px', height: '14px', background: '#2980b9', borderRadius: '2px' }}></div>
              <p style={{ margin: 0, fontSize: '10px', letterSpacing: '2px', color: '#2980b9' }}>ÓRDENES RECIENTES</p>
            </div>
            {data.alertas.length === 0
              ? <p style={{ fontSize: '13px', color: 'var(--texto-secundario)' }}>Sin alertas activas</p>
              : data.alertas.map((a, i) => (
                <div key={i} style={{ borderBottom: i < data.alertas.length - 1 ? '1px solid var(--azul-borde)' : 'none', padding: '10px 0' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--texto)' }}>{a.titulo}</p>
                  <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'var(--texto-secundario)' }}>{a.tipo} · {a.prioridad}</p>
                </div>
              ))
            }
          </div>

        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, valor, sub, subColor, acento }) {
  return (
    <div style={{ background: 'var(--azul-medio)', border: '1px solid var(--azul-borde)', borderTop: `3px solid ${acento}`, borderRadius: '6px', padding: '16px' }}>
      <p style={{ margin: '0 0 8px', fontSize: '10px', letterSpacing: '2px', color: 'var(--texto-secundario)' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '30px', color: 'var(--texto)', fontWeight: 300 }}>{valor}</p>
      <p style={{ margin: '6px 0 0', fontSize: '11px', color: subColor }}>{sub}</p>
    </div>
  )
}

export function Navbar({ user, logout, activo }) {
  const links = [
    { href: '/cmms/', label: 'Inicio', key: 'inicio' },
    { href: '/cmms/activos', label: 'Activos', key: 'activos' },
    { href: '/cmms/mantenimientos', label: 'Mantenimientos', key: 'mantenimientos' },
    { href: '/cmms/alertas', label: 'Alertas', key: 'alertas' },
    { href: '/cmms/reportes', label: 'Reportes', key: 'reportes' },
  ]
  return (
    <div style={{ background: 'var(--azul)', borderBottom: '1px solid var(--azul-borde)', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', background: 'var(--rojo)', borderRadius: '50%' }}></div>
          <span style={{ color: 'var(--texto)', fontSize: '14px', fontWeight: 700, letterSpacing: '1px' }}>CMMS</span>
          <span style={{ color: 'var(--azul-borde)', fontSize: '14px' }}>|</span>
          <span style={{ color: 'var(--texto-secundario)', fontSize: '11px', letterSpacing: '1px' }}>IMCLA · VOLCÁN</span>
        </div>
        <div style={{ display: 'flex', gap: '2px', marginLeft: '12px' }}>
          {links.map(l => (
            <a key={l.key} href={l.href} style={{ color: activo === l.key ? 'var(--texto)' : 'var(--texto-secundario)', fontSize: '12px', padding: '6px 14px', borderRadius: '4px', background: activo === l.key ? 'var(--rojo)' : 'transparent', fontWeight: activo === l.key ? 600 : 400 }}>
              {l.label}
            </a>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '6px', height: '6px', background: 'var(--verde)', borderRadius: '50%' }}></div>
        <span style={{ color: 'var(--texto-secundario)', fontSize: '12px' }}>{user?.nombre}</span>
        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--rojo)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--texto)', fontWeight: 700 }}>
          {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0) || ''}
        </div>
        <button onClick={logout} style={{ fontSize: '11px', color: 'var(--texto-secundario)', background: 'none', border: '1px solid var(--azul-borde)', padding: '4px 10px' }}>Salir</button>
      </div>
    </div>
  )
}