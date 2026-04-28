import { useEffect, useState } from 'react'
import api from '../api/client'

const ESTADOS = {
  operativo: { label: 'Operativo', color: '#16a34a', bg: '#f0fdf4' },
  en_mantenimiento: { label: 'En mantenimiento', color: '#d97706', bg: '#fffbeb' },
  fuera_de_servicio: { label: 'Fuera de servicio', color: '#dc2626', bg: '#fef2f2' },
  dado_de_baja: { label: 'Dado de baja', color: '#888', bg: '#f5f5f4' },
}

export default function Activos() {
  const [activos, setActivos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [buscar, setBuscar] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [activoEdit, setActivoEdit] = useState(null)

  useEffect(() => {
    cargarDatos()
    api.get('/activos/').then(r => setCategorias([...new Set(r.data.data.map(a => a.categoria))].filter(Boolean)))
  }, [])

  const cargarDatos = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (buscar) params.append('buscar', buscar)
    if (filtroCategoria) params.append('categoria_id', filtroCategoria)
    if (filtroEstado) params.append('estado', filtroEstado)
    api.get(`/activos/?${params}`).then(r => setActivos(r.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { cargarDatos() }, [buscar, filtroCategoria, filtroEstado])

  const abrirNuevo = () => { setActivoEdit(null); setModalOpen(true) }
  const abrirEditar = (a) => { setActivoEdit(a); setModalOpen(true) }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f4', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: 'white', borderBottom: '0.5px solid #e5e5e5', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="/cmms/" style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}>← Dashboard</a>
          <span style={{ fontSize: '15px', fontWeight: '500' }}>Activos</span>
        </div>
        <button onClick={abrirNuevo} style={{ padding: '8px 16px', background: '#1e40af', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
          + Nuevo activo
        </button>
      </div>

      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
          <input
            placeholder="Buscar por nombre, placa, IP..."
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            style={{ flex: 1 }}
          />
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Cargando...</div>
        ) : activos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>No hay activos registrados</p>
            <button onClick={abrirNuevo} style={{ padding: '8px 16px', background: '#1e40af', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>Crear primer activo</button>
          </div>
        ) : (
          <div style={{ background: 'white', border: '0.5px solid #e5e5e5', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f5f5f4', borderBottom: '0.5px solid #e5e5e5' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '500', color: '#555' }}>Activo</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '500', color: '#555' }}>Categoría</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '500', color: '#555' }}>Empresa</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '500', color: '#555' }}>Placa / IP</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '500', color: '#555' }}>Estado</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '500', color: '#555' }}>KM</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: '500', color: '#555' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {activos.map((a, i) => {
                  const est = ESTADOS[a.estado] || ESTADOS.operativo
                  return (
                    <tr key={a.id} style={{ borderBottom: i < activos.length - 1 ? '0.5px solid #f0f0f0' : 'none' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <p style={{ margin: 0, fontWeight: '500', color: '#111' }}>{a.nombre}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#888' }}>{a.codigo_interno || '—'}</p>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#555' }}>{a.categoria}</td>
                      <td style={{ padding: '12px 16px', color: '#555' }}>{a.empresa}</td>
                      <td style={{ padding: '12px 16px', color: '#555', fontFamily: 'monospace' }}>{a.placa || a.ip_address || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '11px', background: est.bg, color: est.color, padding: '3px 8px', borderRadius: '6px' }}>{est.label}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#555' }}>{a.km_actuales != null ? a.km_actuales.toLocaleString() : '—'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button onClick={() => abrirEditar(a)} style={{ fontSize: '12px', padding: '4px 10px', border: '0.5px solid #e5e5e5', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#555' }}>
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
        <ModalActivo
          activo={activoEdit}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); cargarDatos() }}
        />
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
  const [categorias, setCategorias] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setCategorias([
      { id: 1, nombre: 'Vehículo / Camión' },
      { id: 2, nombre: 'Cisterna de combustible' },
      { id: 3, nombre: 'Dispensadora' },
      { id: 4, nombre: 'Sistema eléctrico' },
      { id: 5, nombre: 'Cámara / CCTV' },
      { id: 6, nombre: 'DVR / NVR' },
      { id: 7, nombre: 'PC / Laptop' },
      { id: 8, nombre: 'Impresora / Escáner' },
      { id: 9, nombre: 'Switch / Router' },
      { id: 10, nombre: 'Access Point' },
      { id: 11, nombre: 'UPS / Regulador' },
      { id: 12, nombre: 'Otro equipo' },
    ])
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const guardar = async () => {
    if (!form.nombre || !form.categoria_id) { setError('Nombre y categoría son obligatorios'); return }
    setSaving(true)
    setError('')
    try {
      if (activo) {
        await api.patch(`/activos/${activo.id}`, form)
      } else {
        await api.post('/activos/', form)
      }
      onSaved()
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>{activo ? 'Editar activo' : 'Nuevo activo'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>×</button>
        </div>

        {error && <div style={{ background: '#fef2f2', border: '0.5px solid #fca5a5', borderRadius: '8px', padding: '10px', marginBottom: '1rem', fontSize: '13px', color: '#dc2626' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '4px' }}>Nombre *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Cisterna N°1" style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '4px' }}>Categoría *</label>
            <select value={form.categoria_id} onChange={e => set('categoria_id', e.target.value)} style={{ width: '100%' }}>
              <option value="">Seleccionar...</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '4px' }}>Código interno</label>
            <input value={form.codigo_interno} onChange={e => set('codigo_interno', e.target.value)} placeholder="Ej: CIS-001" style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '4px' }}>Marca</label>
            <input value={form.marca} onChange={e => set('marca', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '4px' }}>Modelo</label>
            <input value={form.modelo} onChange={e => set('modelo', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '4px' }}>Placa</label>
            <input value={form.placa} onChange={e => set('placa', e.target.value)} placeholder="Ej: 1234-ABC" style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '4px' }}>KM actuales</label>
            <input type="number" value={form.km_actuales} onChange={e => set('km_actuales', parseInt(e.target.value))} style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '4px' }}>IP / hostname</label>
            <input value={form.ip_address} onChange={e => set('ip_address', e.target.value)} placeholder="Ej: 192.168.1.10" style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '4px' }}>Estado</label>
            <select value={form.estado} onChange={e => set('estado', e.target.value)} style={{ width: '100%' }}>
              {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '4px' }}>Ubicación</label>
            <input value={form.ubicacion} onChange={e => set('ubicacion', e.target.value)} placeholder="Ej: Planta baja, oficina principal" style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '4px' }}>Descripción</label>
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={3} style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.5rem' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: '0.5px solid #e5e5e5', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
          <button onClick={guardar} disabled={saving} style={{ padding: '8px 16px', background: '#1e40af', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}