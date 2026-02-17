import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import { api } from './services/api'
import './App.css'

// Demo mode: bypass login when no backend is available
const DEMO_TOKEN = 'demo_offline_token'
const DEMO_USER = { user_id: 'demo_user', username: 'demo', roles: ['analyst'] }

class ErrorBoundary extends Error {}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
  })

  // Listen for auth:logout events from the API interceptor
  useEffect(() => {
    const handleAuthLogout = () => {
      setToken(null)
      setUser(null)
      delete api.defaults.headers.common['Authorization']
    }
    window.addEventListener('auth:logout', handleAuthLogout)
    return () => window.removeEventListener('auth:logout', handleAuthLogout)
  }, [])

  const handleLogin = (authToken, userData) => {
    setToken(authToken)
    setUser(userData)
    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
  }

  const handleDemoMode = () => {
    localStorage.setItem('token', DEMO_TOKEN)
    localStorage.setItem('user', JSON.stringify(DEMO_USER))
    handleLogin(DEMO_TOKEN, DEMO_USER)
  }

  // Set token in API headers if exists
  if (token && !api.defaults.headers.common['Authorization']) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  if (!token) {
    return <Login onLogin={handleLogin} onDemoMode={handleDemoMode} />
  }

  return <Dashboard user={user} onLogout={handleLogout} />
}

export default App
