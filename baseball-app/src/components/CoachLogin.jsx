import { useState } from 'react'
import { useAuth } from '../AuthContext'

export default function CoachLogin() {
  const { user, login, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const closeForm = () => {
    setOpen(false)
    setEmail('')
    setPassword('')
    setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      closeForm()
    } catch {
      setError('Login failed. Check email/password.')
    } finally {
      setSubmitting(false)
    }
  }

  if (user) {
    return (
      <div className="coach-login coach-login--signed-in">
        <span className="coach-login-status">Coach mode</span>
        <button className="btn-secondary coach-login-btn" onClick={logout}>Log out</button>
      </div>
    )
  }

  return (
    <div className="coach-login">
      {!open ? (
        <button className="btn-secondary coach-login-btn" onClick={() => setOpen(true)}>Coach Login</button>
      ) : (
        <form className="coach-login-form" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoFocus
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {error && <p className="coach-login-error">{error}</p>}
          <div className="coach-login-actions">
            <button type="submit" disabled={submitting}>{submitting ? 'Logging in…' : 'Log In'}</button>
            <button type="button" className="btn-secondary" onClick={closeForm}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}
