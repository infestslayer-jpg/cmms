import { useEffect, useState } from 'react'
import { Navbar } from './Dashboard'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const TIPOS_ALERTA = {
  mantenimiento_proximo:       { label: 'Mantenimiento próximo',     color: '#2980b9' },
  mantenimiento_vencido:       { label: 'Mantenimiento vencido',     color: '#e74c3c' },
  soat_por_vencer:             { label: 'SOAT por vencer',           color: '#e67e22' },
  revision_tecnica_por_vencer: { label: 'Revisión técnica',          color: '#e67e22' },
  seguro_por_vencer:           { label: 'Seguro por vencer',         color: '#e67e22' },
  calibracion_por_vencer:      { label: 'Calibración por vencer',    color: '#8e44ad' },
  garantia_por_vencer:         { label: 'Garantía por vencer',       color: '#b8d4ee' },
  stock_minimo:                { label: 'Stock mínimo',              color: '#e67e22' },
  ot_sin_atender:              { label: 'OT sin atender',            color: '#e74c3c' },
}

const PRIORIDADES = {
  baja:    { color: '#6a8aaa' },
  media:   { color: '#b8d4ee' },
  alta:    { color: '#e67e22' },
  critica: { color: '#e74c3c' },
}

export default function Alertas() {
  const { user, logout } = useAuth()
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/')
      .then(r => setAlertas(r.data.alertas || []))
      .finally(() => setLoading(false))
  }, [])

  const totalAlertas = alertas.length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--azul)' }}>
      <Navbar user={user} logout={logout} activo="alertas" />

      <div style={{ background: '#0a1530', borderBottom: '1px solid var(--azul-borde)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: 'var(--rojo)', fontSize: '10px', letterSpacing: '3px', margin: '0 0 2px' }}>SISTEMA DE ALERTAS</p>
          <p style={{ color: 'var(--texto)', fontSize: '18px', margin: 0, fontWeight: 500 }}>Alertas y vencimientos</p>
        </div>
        {totalAlertas > 0 && (
          <div style={{ background: '#2a1010', border: '1px solid var(--rojo)', borderRadius: '4px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', background: 'var(--rojo)', borderRadius: '50%' }}></div>
            <span style={{ color: '#e74c3c', fontSize: '13px', fontWeight: 600 }}>{totalAlertas} alertas activas</span>
          </div>
        )}
      </div>

      <div style={{ padding: '20px 24px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--texto-secundario)' }}>Cargando...</p>
        ) : alertas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ width: '48px', height: '48px', background: '#0a2010', border: '2px solid var(--verde)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '20px' }}>✓</div>
            <p style={{ color: 'var(--verde)', fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Sin alertas activas</p>
            <p style={{ color: 'var(--texto-secundario)', fontSize: '13px' }}>Todos los activos y documentos están al día</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {alertas.map((a, i) => {
              const tipo = TIPOS_ALERTA[a.tipo] || { label: a.tipo, color: '#b8d4ee' }
              const prio = PRIORIDADES[a.prioridad] || PRIORIDADES.media
              return (
                <div key={i} style={{ background: 'var(--azul-medio)', border: '1px solid var(--azul-borde)', borderLeft: `4px solid ${tipo.color}`, borderRadius: '6px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: tipo.color, border: `1px solid ${tipo.color}`, padding: '1px 8px', borderRadius: '3px', letterSpacing: '1px' }}>{tipo.label.toUpperCase()}</span>
                      <span style={{ fontSize: '11px', color: prio.color }}>● {a.prioridad}</span>
                    </div>
                    <p style={{ margin: '0 0 2px', fontSize: '14px', color: 'var(--texto)', fontWeight: 500 }}>{a.titulo}</p>
                    {a.mensaje && <p style={{ margin: 0, fontSize: '12px', color: 'var(--texto-secundario)' }}>{a.mensaje}</p>}
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: '20px' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--texto-secundario)' }}>
                      {a.fecha_alerta ? new Date(a.fecha_alerta).toLocaleDateString('es-BO') : '—'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ background: 'var(--azul-medio)', border: '1px solid var(--azul-borde)', borderRadius: '6px', padding: '20px', marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '3px', height: '14px', background: 'var(--rojo)', borderRadius: '2px' }}></div>
            <p style={{ margin: 0, fontSize: '10px', letterSpacing: '2px', color: 'var(--rojo)' }}>GUÍA DE ALERTAS</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { color: '#e74c3c', label: 'Crítico', desc: 'Requiere atención inmediata' },
              { color: '#e67e22', label: 'Urgente', desc: 'Atender en los próximos días' },
              { color: '#2980b9', label: 'Informativo', desc: 'Próximo vencimiento' },
            ].map((g, i) => (
              <div key={i} style={{ padding: '10px', background: 'var(--azul)', borderRadius: '4px', borderLeft: `3px solid ${g.color}` }}>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: g.color, fontWeight: 600 }}>{g.label}</p>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--texto-secundario)' }}>{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}