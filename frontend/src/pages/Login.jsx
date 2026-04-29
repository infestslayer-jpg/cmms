import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      setError('Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--azul)' }}>

      <div style={{ width: '100%', maxWidth: '380px', padding: '0 20px' }}>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '10px', height: '10px', background: 'var(--rojo)', borderRadius: '50%' }}></div>
            <span style={{ color: 'var(--texto)', fontSize: '22px', fontWeight: 700, letterSpacing: '2px' }}>CMMS</span>
            <div style={{ width: '10px', height: '10px', background: 'var(--rojo)', borderRadius: '50%' }}></div>
          </div>
          <p style={{ color: 'var(--texto-secundario)', fontSize: '12px', letterSpacing: '2px', margin: 0 }}>IMCLA · VOLCÁN S.R.L.</p>
          <p style={{ color: 'var(--texto-tenue)', fontSize: '11px', margin: '6px 0 0' }}>Sistema de gestión de mantenimiento</p>
        </div>

        <div style={{ background: 'var(--azul-medio)', border: '1px solid var(--azul-borde)', borderTop: '3px solid var(--rojo)', borderRadius: '6px', padding: '28px' }}>

          <p style={{ color: 'var(--rojo)', fontSize: '10px', letterSpacing: '3px', margin: '0 0 20px' }}>ACCESO AL SISTEMA</p>

          {error && (
            <div style={{ background: '#2a1010', border: '1px solid #e74c3c', borderRadius: '4px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#e74c3c' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '10px', color: 'var(--texto-secundario)', letterSpacing: '1px', marginBottom: '6px' }}>CORREO ELECTRÓNICO</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ width: '100%' }}
                placeholder="usuario@empresa.bo"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '10px', color: 'var(--texto-secundario)', letterSpacing: '1px', marginBottom: '6px' }}>CONTRASEÑA</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '11px', background: 'var(--rojo)', color: 'white', border: 'none', fontWeight: 700, fontSize: '13px', letterSpacing: '1px' }}>
              {loading ? 'VERIFICANDO...' : 'INGRESAR AL SISTEMA'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--texto-tenue)', fontSize: '11px', marginTop: '20px' }}>
          Estación de Servicios Volcán S.R.L.
        </p>
      </div>
    </div>
  )
}