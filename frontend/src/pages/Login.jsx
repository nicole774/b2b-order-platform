import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../AuthContext.jsx'
import { api } from '../api.js'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'register') {
        await api('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        })
      }
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card form-card">
      <h1>{mode === 'login' ? 'Connexion' : 'Créer un compte'}</h1>

      <form onSubmit={handleSubmit}>
        {mode === 'register' && (
          <label>
            Nom de l'entreprise
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        )}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Mot de passe
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        {error && <p className="error" role="alert">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Patientez…' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
        </button>
      </form>

      <button
        type="button"
        className="link-button"
        onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
      >
        {mode === 'login' ? 'Pas encore de compte ? Inscrivez-vous' : 'Déjà un compte ? Connectez-vous'}
      </button>
    </div>
  )
}

export default Login
