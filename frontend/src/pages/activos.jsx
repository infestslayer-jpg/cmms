import { useEffect, useState } from 'react'
import { Navbar } from './Dashboard'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const ESTADOS = {
  operativo:         { label: 'Operativo',        color: '#2ecc71', bg: '#0d2010' },
  en_mantenimiento:  { label: 'En mantenimiento', color: '#e67e22', bg: '#2a1f10' },
  fuera_de_servicio: { label: 'Fuera de servicio',color: '#e74c3c', bg: '#2a1010' },
  dado_de_baja:      { label: 'Dado de baja',     color: '#3a5a7a', bg: '#0d1b3e' },
}

const CATEGORIAS = [
  { id: 1,  nombre: 'Vehículo / Camión' },
  { id: 2,  nombre: 'Cisterna de combustible' },
  { id: 3,  nombre: 'Dispensadora' },
  { id: 4,  nombre: 'Sistema eléctrico' },
  { id: 5,  nombre: 'Cámara / CCTV' },
  { id: 6,  nombre: 'DVR / NVR' },
  { id: 7,  nombre: 'PC / Laptop' },
  { id: 8,  nombre: 'Impresora / Escáner' },
  { id: 9,  nombre: 'Switch / Router' },
  { id: 10, nombre: 'Access Point' },
  { id: 11, nombre: 'UPS / Regulador' },
  { id: 12, nombre: 'Otro equipo' },
]

export default function Activos() {
  const { user, logout } = useAuth()
  const [activos, setActivos] = useState([])
  const [loading, setLoading] = useState(true)
  const [buscar, setBuscar] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [activoEdit, setActivoEdit] = useState(null)

  const cargarDatos = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (buscar) params.append('buscar', buscar)
    if (filtroEstado) params.append('estado', filtroEstado)
    api.get(`/activos/?${params}`).then(r => setActivos(r.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { cargarDatos() }, [buscar, filtroEstado])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--azul)' }}>
      <Navbar user={user} logout={logout} activo="activos" />

      <div style={{ background: '#0a1530', borderBottom: '1px solid var(--azul-borde)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: 'var(--rojo)', fontSize: '10px', letterSpacing: '3px', margin: '0 0 2px' }}>GESTIÓN DE ACTIVOS</p>
          <p style={{ color: 'var(--texto)', fontSize: '18px', margin: 0, fontWeight: 500 }}>Registro de equipos</p>
        </div>
        <button onClick={() => { setActivoEdit(null); setModalOpen(true) }}
          style={{ padding: '9px 20px', background: 'var(--rojo)', color: 'white', border: 'none', fontWeight: 600, letterSpacing: '0.5px' }}>
          + Nuevo activo
        </button>
      </div>

      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <input placeholder="Buscar por nombre, placa, IP, código..." value={buscar} onChange={e => setBuscar(e.target.value)} style={{ flex: 1 }} />
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--texto-secundario)' }}>Cargando...</div>
        ) : activos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--texto-secundario)' }}>
            <p style={{ fontSize: '16px', marginBottom: '16px' }}>No hay activos registrados</p>
            <button onClick={() => { setActivoEdit(null); setModalOpen(true) }}
              style={{ padding: '9px 20px', background: 'var(--rojo)', color: 'white', border: 'none', fontWeight: 600 }}>
              Registrar primer activo
            </button>
          </div>
        ) : (
          <div style={{ background: 'var(--azul-medio)', border: '1px solid var(--azul-borde)', borderRadius: '6px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#0a1530', borderBottom: '1px solid var(--azul-borde)' }}>
                  {['Activo', 'Categoría', 'Empresa', 'Placa / IP', 'Estado', 'KM', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--texto-secundario)', fontSize: '10px', letterSpacing: '1px' }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activos.map((a, i) => {
                  const est = ESTADOS[a.estado] || ESTADOS.operativo
                  return (
                    <tr key={a.id} style={{ borderBottom: i < activos.length - 1 ? '1px solid var(--azul-borde)' : 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#0f1f3a'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 16px' }}>
                        <p style={{ margin: 0, fontWeight: 500, color: 'var(--texto)' }}>{a.nombre}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--texto-secundario)' }}>{a.codigo_interno || '—'}</p>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--texto-secundario)' }}>{a.categoria}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--texto-secundario)' }}>{a.empresa}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--texto-secundario)', fontFamily: 'monospace', fontSize: '12px' }}>{a.placa || a.ip_address || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '11px', background: est.bg, color: est.color, padding: '3px 10px', borderRadius: '3px', letterSpacing: '0.5px' }}>{est.label}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--texto-secundario)' }}>{a.km_actuales != null ? a.km_actuales.toLocaleString() : '—'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button onClick={() => { setActivoEdit(a); setModalOpen(true) }}
                          style={{ fontSize: '11px', padding: '5px 12px', border: '1px solid var(--azul-borde)', background: 'transparent', color: 'var(--texto-secundario)' }}>
                          Editar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <ModalActivo activo={activoEdit} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); cargarDatos() }} />
      )}
    </div>
  )
}

function ModalActivo({ activo, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre: activo?.nombre || '',
    categoria_id: activo?.categoria_id || '',
    codigo_interno: activo?.codigo_interno || '',
    marca: activo?.marca || '',
    modelo: activo?.modelo || '',
    placa: activo?.placa || '',
    km_actuales: activo?.km_actuales || 0,
    ip_address: activo?.ip_address || '',
    ubicacion: activo?.ubicacion || '',
    descripcion: activo?.descripcion || '',
    estado: activo?.estado || 'operativo',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const guardar = async () => {
    if (!form.nombre || !form.categoria_id) { setError('Nombre y categoría son obligatorios'); return }
    setSaving(true); setError('')
    try {
      if (activo) await api.patch(`/activos/${activo.id}`, form)
      else await api.post('/activos/', form)
      onSaved()
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al guardar')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--azul-medio)', border: '1px solid var(--azul-borde)', borderTop: '3px solid var(--rojo)', borderRadius: '6px', padding: '24px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <p style={{ color: 'var(--rojo)', fontSize: '10px', letterSpacing: '2px', margin: '0 0 2px' }}>REGISTRO DE ACTIVO</p>
            <p style={{ color: 'var(--texto)', fontSize: '16px', margin: 0, fontWeight: 500 }}>{activo ? 'Editar activo' : 'Nuevo activo'}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', color: 'var(--texto-secundario)', padding: '4px 8px' }}>×</button>
        </div>

        {error && <div style={{ background: '#2a1010', border: '1px solid var(--rojo)', borderRadius: '4px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#e74c3c' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { label: 'Nombre *', key: 'nombre', full: true, placeholder: 'Ej: Cisterna N°1' },
            { label: 'Código interno', key: 'codigo_interno', placeholder: 'Ej: CIS-001' },
            { label: 'Marca', key: 'marca', placeholder: '' },
            { label: 'Modelo', key: 'modelo', placeholder: '' },
            { label: 'Placa', key: 'placa', placeholder: 'Ej: 2345-ABC' },
            { label: 'IP / hostname', key: 'ip_address', placeholder: 'Ej: 192.168.1.10' },
            { label: 'Ubicación', key: 'ubicacion', full: true, placeholder: 'Ej: Planta baja' },
          ].map(f => (
            <div key={f.key} style={{ gridColumn: f.full ? '1/-1' : 'auto' }}>
              <label style={{ fontSize: '10px', color: 'var(--texto-secundario)', display: 'block', marginBottom: '5px', letterSpacing: '1px' }}>{f.label.toUpperCase()}</label>
              <input value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} style={{ width: '100%' }} />
            </div>
          ))}

          <div>
            <label style={{ fontSize: '10px', color: 'var(--texto-secundario)', display: 'block', marginBottom: '5px', letterSpacing: '1px' }}>CATEGORÍA *</label>
            <select value={form.categoria_id} onChange={e => set('categoria_id', e.target.value)} style={{ width: '100%' }}>
              <option value="">Seleccionar...</option>
              {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '10px', color: 'var(--texto-secundario)', display: 'block', marginBottom: '5px', letterSpacing: '1px' }}>ESTADO</label>
            <select value={form.estado} onChange={e => set('estado', e.target.value)} style={{ width: '100%' }}>
              {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '10px', color: 'var(--texto-secundario)', display: 'block', marginBottom: '5px', letterSpacing: '1px' }}>KILOMETRAJE</label>
            <input type="number" value={form.km_actuales} onChange={e => set('km_actuales', parseInt(e.target.value) || 0)} style={{ width: '100%' }} />
          </div>

          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: '10px', color: 'var(--texto-secundario)', display: 'block', marginBottom: '5px', letterSpacing: '1px' }}>DESCRIPCIÓN</label>
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={3} style={{ width: '100%', resize: 'vertical' }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', border: '1px solid var(--azul-borde)', background: 'transparent', color: 'var(--texto-secundario)' }}>Cancelar</button>
          <button onClick={guardar} disabled={saving} style={{ padding: '8px 20px', background: 'var(--rojo)', color: 'white', border: 'none', fontWeight: 600 }}>
            {saving ? 'Guardando...' : 'Guardar activo'}
          </button>
        </div>
      </div>
    </div>
  )
}