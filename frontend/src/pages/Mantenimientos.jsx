import { useEffect, useState } from 'react'
import { Navbar } from './Dashboard'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const ESTADOS_OT = {
  pendiente:   { label: 'Pendiente',    color: '#b8d4ee', bg: '#0f1f3a' },
  en_proceso:  { label: 'En proceso',   color: '#e67e22', bg: '#2a1f10' },
  completada:  { label: 'Completada',   color: '#2ecc71', bg: '#0d2010' },
  cancelada:   { label: 'Cancelada',    color: '#6a8aaa', bg: '#0d1b3e' },
}

const TIPOS = {
  preventivo:  { label: 'Preventivo',  color: '#2980b9' },
  correctivo:  { label: 'Correctivo',  color: '#e67e22' },
  predictivo:  { label: 'Predictivo',  color: '#8e44ad' },
  emergencia:  { label: 'Emergencia',  color: '#e74c3c' },
}

const PRIORIDADES = {
  baja:    { label: 'Baja',    color: '#6a8aaa' },
  media:   { label: 'Media',   color: '#b8d4ee' },
  alta:    { label: 'Alta',    color: '#e67e22' },
  critica: { label: 'Crítica', color: '#e74c3c' },
}

export default function Mantenimientos() {
  const { user, logout } = useAuth()
  const [ordenes, setOrdenes] = useState([])
  const [proximos, setProximos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [otDetalle, setOtDetalle] = useState(null)

  const cargarDatos = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtroEstado) params.append('estado', filtroEstado)
    if (filtroTipo) params.append('tipo', filtroTipo)
    Promise.all([
      api.get(`/ordenes/?${params}`),
      api.get('/dashboard/')
    ]).then(([ots, dash]) => {
      setOrdenes(ots.data.data)
      setProximos(dash.data.proximos_mantenimientos || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { cargarDatos() }, [filtroEstado, filtroTipo])

  const semaforo = {
    VENCIDO:    { color: '#e74c3c', borde: '#e74c3c' },
    URGENTE:    { color: '#e67e22', borde: '#e67e22' },
    PROXIMO:    { color: '#b8d4ee', borde: '#2a4a7f' },
    PROGRAMADO: { color: '#6a8aaa', borde: '#1e3560' },
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--azul)' }}>
      <Navbar user={user} logout={logout} activo="mantenimientos" />

      <div style={{ background: '#0a1530', borderBottom: '1px solid var(--azul-borde)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: 'var(--rojo)', fontSize: '10px', letterSpacing: '3px', margin: '0 0 2px' }}>GESTIÓN DE MANTENIMIENTO</p>
          <p style={{ color: 'var(--texto)', fontSize: '18px', margin: 0, fontWeight: 500 }}>Órdenes y programación</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          style={{ padding: '9px 20px', background: 'var(--rojo)', color: 'white', border: 'none', fontWeight: 600, letterSpacing: '0.5px' }}>
          + Nueva orden
        </button>
      </div>

      <div style={{ padding: '20px 24px' }}>

        {/* CALENDARIO PRÓXIMOS */}
        <div style={{ background: 'var(--azul-medio)', border: '1px solid var(--azul-borde)', borderRadius: '6px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <div style={{ width: '3px', height: '14px', background: 'var(--rojo)', borderRadius: '2px' }}></div>
            <p style={{ margin: 0, fontSize: '10px', letterSpacing: '2px', color: 'var(--rojo)' }}>CALENDARIO — PRÓXIMOS 60 DÍAS</p>
          </div>
          {proximos.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--texto-secundario)', margin: 0 }}>Sin mantenimientos programados próximos</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {proximos.map((m, i) => {
                const s = semaforo[m.semaforo] || semaforo.PROGRAMADO
                return (
                  <div key={i} style={{ padding: '12px', background: 'var(--azul)', borderRadius: '4px', borderLeft: `3px solid ${s.borde}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--texto)', fontWeight: 500 }}>{m.activo}</p>
                      <span style={{ fontSize: '10px', color: s.color, border: `1px solid ${s.borde}`, padding: '1px 6px', borderRadius: '3px', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{m.semaforo}</span>
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--texto-secundario)' }}>{m.mantenimiento}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: s.color }}>
                      {m.dias_restantes < 0 ? `Vencido hace ${Math.abs(m.dias_restantes)} días` : m.dias_restantes === 0 ? 'Hoy' : `En ${m.dias_restantes} días`}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ÓRDENES DE TRABAJO */}
        <div style={{ background: 'var(--azul-medio)', border: '1px solid var(--azul-borde)', borderRadius: '6px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '3px', height: '14px', background: '#2980b9', borderRadius: '2px' }}></div>
              <p style={{ margin: 0, fontSize: '10px', letterSpacing: '2px', color: '#2980b9' }}>ÓRDENES DE TRABAJO</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{ fontSize: '12px', padding: '5px 10px' }}>
                <option value="">Todos los tipos</option>
                {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ fontSize: '12px', padding: '5px 10px' }}>
                <option value="">Todos los estados</option>
                {Object.entries(ESTADOS_OT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--texto-secundario)' }}>Cargando...</p>
          ) : ordenes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--texto-secundario)', marginBottom: '16px' }}>No hay órdenes de trabajo</p>
              <button onClick={() => setModalOpen(true)}
                style={{ padding: '9px 20px', background: 'var(--rojo)', color: 'white', border: 'none', fontWeight: 600 }}>
                Crear primera orden
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#0a1530', borderBottom: '1px solid var(--azul-borde)' }}>
                  {['N° OT', 'Activo', 'Tipo', 'Prioridad', 'Estado', 'Fecha', 'Costo', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500, color: 'var(--texto-secundario)', fontSize: '10px', letterSpacing: '1px' }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordenes.map((o, i) => {
                  const est = ESTADOS_OT[o.estado] || ESTADOS_OT.pendiente
                  const tipo = TIPOS[o.tipo] || TIPOS.correctivo
                  const prio = PRIORIDADES[o.prioridad] || PRIORIDADES.media
                  return (
                    <tr key={o.id} style={{ borderBottom: i < ordenes.length - 1 ? '1px solid var(--azul-borde)' : 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#0f1f3a'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '11px 14px', color: 'var(--rojo)', fontWeight: 600, fontFamily: 'monospace', fontSize: '12px' }}>{o.numero_ot}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <p style={{ margin: 0, color: 'var(--texto)' }}>{o.activo}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--texto-secundario)' }}>{o.activo_placa || ''}</p>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: '11px', color: tipo.color, border: `1px solid ${tipo.color}`, padding: '2px 8px', borderRadius: '3px' }}>{tipo.label}</span>
                      </td>
                      <td style={{ padding: '11px 14px', color: prio.color, fontSize: '12px' }}>{prio.label}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: '11px', background: est.bg, color: est.color, padding: '3px 10px', borderRadius: '3px' }}>{est.label}</span>
                      </td>
                      <td style={{ padding: '11px 14px', color: 'var(--texto-secundario)', fontSize: '12px' }}>
                        {o.fecha_solicitud ? new Date(o.fecha_solicitud).toLocaleDateString('es-BO') : '—'}
                      </td>
                      <td style={{ padding: '11px 14px', color: 'var(--texto-secundario)', fontSize: '12px' }}>
                        {o.costo_total > 0 ? `Bs ${o.costo_total.toLocaleString()}` : '—'}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <button onClick={() => setOtDetalle(o)}
                          style={{ fontSize: '11px', padding: '4px 10px', border: '1px solid var(--azul-borde)', background: 'transparent', color: 'var(--texto-secundario)', marginRight: '6px' }}>
                          Ver
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalOpen && <ModalNuevaOT onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); cargarDatos() }} />}
      {otDetalle && <ModalDetalleOT ot={otDetalle} onClose={() => setOtDetalle(null)} onUpdated={() => { setOtDetalle(null); cargarDatos() }} />}
    </div>
  )
}

function ModalNuevaOT({ onClose, onSaved }) {
  const [activos, setActivos] = useState([])
  const [form, setForm] = useState({ activo_id: '', tipo: 'preventivo', prioridad: 'media', titulo: '', descripcion: '', fecha_programada: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/activos/').then(r => setActivos(r.data.data))
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const guardar = async () => {
    if (!form.activo_id || !form.titulo) { setError('Activo y título son obligatorios'); return }
    setSaving(true); setError('')
    try {
      const payload = { ...form, activo_id: parseInt(form.activo_id) }
      if (!payload.fecha_programada) delete payload.fecha_programada
      await api.post('/ordenes/', payload)
      onSaved()
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al crear la orden')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--azul-medio)', border: '1px solid var(--azul-borde)', borderTop: '3px solid var(--rojo)', borderRadius: '6px', padding: '24px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <p style={{ color: 'var(--rojo)', fontSize: '10px', letterSpacing: '2px', margin: '0 0 2px' }}>NUEVA ORDEN</p>
            <p style={{ color: 'var(--texto)', fontSize: '16px', margin: 0, fontWeight: 500 }}>Crear orden de trabajo</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', color: 'var(--texto-secundario)', padding: '4px 8px' }}>×</button>
        </div>

        {error && <div style={{ background: '#2a1010', border: '1px solid var(--rojo)', borderRadius: '4px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#e74c3c' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: '10px', color: 'var(--texto-secundario)', display: 'block', marginBottom: '5px', letterSpacing: '1px' }}>ACTIVO *</label>
            <select value={form.activo_id} onChange={e => set('activo_id', e.target.value)} style={{ width: '100%' }}>
              <option value="">Seleccionar activo...</option>
              {activos.map(a => <option key={a.id} value={a.id}>{a.nombre} {a.placa ? `· ${a.placa}` : ''}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: '10px', color: 'var(--texto-secundario)', display: 'block', marginBottom: '5px', letterSpacing: '1px' }}>TÍTULO *</label>
            <input value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Ej: Cambio de aceite y filtros" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: '10px', color: 'var(--texto-secundario)', display: 'block', marginBottom: '5px', letterSpacing: '1px' }}>TIPO</label>
            <select value={form.tipo} onChange={e => set('tipo', e.target.value)} style={{ width: '100%' }}>
              {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '10px', color: 'var(--texto-secundario)', display: 'block', marginBottom: '5px', letterSpacing: '1px' }}>PRIORIDAD</label>
            <select value={form.prioridad} onChange={e => set('prioridad', e.target.value)} style={{ width: '100%' }}>
              {Object.entries(PRIORIDADES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: '10px', color: 'var(--texto-secundario)', display: 'block', marginBottom: '5px', letterSpacing: '1px' }}>FECHA PROGRAMADA</label>
            <input type="datetime-local" value={form.fecha_programada} onChange={e => set('fecha_programada', e.target.value)} style={{ width: '100%' }} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: '10px', color: 'var(--texto-secundario)', display: 'block', marginBottom: '5px', letterSpacing: '1px' }}>DESCRIPCIÓN</label>
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={3} style={{ width: '100%', resize: 'vertical' }} placeholder="Detalle del trabajo a realizar..." />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', border: '1px solid var(--azul-borde)', background: 'transparent', color: 'var(--texto-secundario)' }}>Cancelar</button>
          <button onClick={guardar} disabled={saving} style={{ padding: '8px 20px', background: 'var(--rojo)', color: 'white', border: 'none', fontWeight: 600 }}>
            {saving ? 'Creando...' : 'Crear orden'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalDetalleOT({ ot, onClose, onUpdated }) {
  const [cerrando, setCerrando] = useState(false)
  const [formCierre, setFormCierre] = useState({ solucion_aplicada: '', costo_mano_obra: 0, costo_repuestos: 0 })
  const [saving, setSaving] = useState(false)

  const iniciar = async () => {
    setSaving(true)
    try { await api.patch(`/ordenes/${ot.id}/iniciar`); onUpdated() }
    catch (e) { alert(e.response?.data?.detail || 'Error') }
    finally { setSaving(false) }
  }

  const cerrar = async () => {
    if (!formCierre.solucion_aplicada) { alert('Ingresá la solución aplicada'); return }
    setSaving(true)
    try { await api.patch(`/ordenes/${ot.id}/cerrar`, formCierre); onUpdated() }
    catch (e) { alert(e.response?.data?.detail || 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--azul-medio)', border: '1px solid var(--azul-borde)', borderTop: '3px solid #2980b9', borderRadius: '6px', padding: '24px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <p style={{ color: '#2980b9', fontSize: '10px', letterSpacing: '2px', margin: '0 0 2px' }}>DETALLE DE ORDEN</p>
            <p style={{ color: 'var(--texto)', fontSize: '16px', margin: 0, fontWeight: 500 }}>{ot.numero_ot}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', color: 'var(--texto-secundario)', padding: '4px 8px' }}>×</button>
        </div>

        <div style={{ display: 'grid', gap: '8px', marginBottom: '20px' }}>
          {[
            ['Activo', ot.activo],
            ['Tipo', ot.tipo],
            ['Prioridad', ot.prioridad],
            ['Estado', ot.estado],
            ['Técnico', ot.tecnico || 'Sin asignar'],
            ['Fecha solicitud', ot.fecha_solicitud ? new Date(ot.fecha_solicitud).toLocaleDateString('es-BO') : '—'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--azul-borde)' }}>
              <span style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>{k}</span>
              <span style={{ fontSize: '12px', color: 'var(--texto)', fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>

        {ot.estado === 'pendiente' && (
          <button onClick={iniciar} disabled={saving} style={{ width: '100%', padding: '10px', background: '#2980b9', color: 'white', border: 'none', fontWeight: 600, marginBottom: '12px' }}>
            {saving ? 'Procesando...' : 'Iniciar orden de trabajo'}
          </button>
        )}

        {ot.estado === 'en_proceso' && (
          <div>
            {!cerrando ? (
              <button onClick={() => setCerrando(true)} style={{ width: '100%', padding: '10px', background: 'var(--verde)', color: '#0d2010', border: 'none', fontWeight: 600 }}>
                Cerrar orden — registrar solución
              </button>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--texto-secundario)', display: 'block', marginBottom: '5px', letterSpacing: '1px' }}>SOLUCIÓN APLICADA *</label>
                  <textarea value={formCierre.solucion_aplicada} onChange={e => setFormCierre(f => ({ ...f, solucion_aplicada: e.target.value }))} rows={3} style={{ width: '100%', resize: 'vertical' }} placeholder="Describí el trabajo realizado..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--texto-secundario)', display: 'block', marginBottom: '5px', letterSpacing: '1px' }}>COSTO MANO OBRA (Bs)</label>
                    <input type="number" value={formCierre.costo_mano_obra} onChange={e => setFormCierre(f => ({ ...f, costo_mano_obra: parseFloat(e.target.value) || 0 }))} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--texto-secundario)', display: 'block', marginBottom: '5px', letterSpacing: '1px' }}>COSTO REPUESTOS (Bs)</label>
                    <input type="number" value={formCierre.costo_repuestos} onChange={e => setFormCierre(f => ({ ...f, costo_repuestos: parseFloat(e.target.value) || 0 }))} style={{ width: '100%' }} />
                  </div>
                </div>
                <button onClick={cerrar} disabled={saving} style={{ padding: '10px', background: 'var(--verde)', color: '#0d2010', border: 'none', fontWeight: 600 }}>
                  {saving ? 'Guardando...' : 'Confirmar cierre'}
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', border: '1px solid var(--azul-borde)', background: 'transparent', color: 'var(--texto-secundario)' }}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}