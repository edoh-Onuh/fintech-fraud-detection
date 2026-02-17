import { useState } from 'react'
import { authAPI } from '../services/api'
import { Shield, AlertCircle, Lock, User, ArrowRight, Sparkles, Zap } from 'lucide-react'

export default function Login({ onLogin, onDemoMode }) {
  const [username, setUsername] = useState('demo')
  const [password, setPassword] = useState('demo123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authAPI.login(username, password)
      const { access_token, user_id, username: user, roles } = response.data
      onLogin(access_token, { user_id, username: user, roles })
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#035351] via-[#13635d] to-[#035351] relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#51a97d]/30 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#92eca2]/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-[#51a97d]/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #92eca2 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <div className="relative w-full max-w-md">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-linear-to-r from-[#51a97d] via-[#92eca2] to-[#51a97d] rounded-3xl blur-lg opacity-30 animate-pulse"></div>

        <div className="relative backdrop-blur-xl bg-white/95 border-2 border-[#51a97d]/30 rounded-3xl p-8 sm:p-10 shadow-2xl">
          {/* Decorative corner elements */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-[#51a97d]/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-[#92eca2]/10 rounded-full blur-2xl"></div>

          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-linear-to-r from-[#51a97d] to-[#92eca2] rounded-2xl blur-md opacity-75 animate-pulse"></div>
              <div className="relative p-4 bg-linear-to-br from-[#13635d] to-[#035351] rounded-2xl shadow-xl">
                <Shield className="w-10 h-10 text-[#92eca2]" strokeWidth={2.5} />
              </div>
            </div>
            <h1 className="text-4xl font-black bg-linear-to-r from-[#13635d] to-[#51a97d] bg-clip-text text-transparent mb-2">JED 24</h1>
            <p className="text-[#51a97d] font-bold text-sm tracking-widest uppercase">Enterprise Fraud Intelligence</p>
            <div className="flex items-center justify-center mt-3 space-x-2">
              <div className="h-px w-12 bg-linear-to-r from-transparent to-[#51a97d]/50"></div>
              <Sparkles className="w-4 h-4 text-[#51a97d]" />
              <div className="h-px w-12 bg-linear-to-l from-transparent to-[#51a97d]/50"></div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-center space-x-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span className="text-red-700 font-semibold text-sm">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-bold text-[#13635d] mb-2">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-[#51a97d] group-focus-within:text-[#13635d] transition-colors" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3.5 bg-[#e9f1f1]/50 border-2 border-[#51a97d]/30 rounded-xl text-[#13635d] font-semibold placeholder-[#51a97d]/50 focus:outline-none focus:border-[#51a97d] focus:ring-4 focus:ring-[#51a97d]/20 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-[#13635d] mb-2">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-[#51a97d] group-focus-within:text-[#13635d] transition-colors" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3.5 bg-[#e9f1f1]/50 border-2 border-[#51a97d]/30 rounded-xl text-[#13635d] font-semibold placeholder-[#51a97d]/50 focus:outline-none focus:border-[#51a97d] focus:ring-4 focus:ring-[#51a97d]/20 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full group overflow-hidden py-4 bg-linear-to-r from-[#13635d] to-[#035351] text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-[#51a97d]/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
            >
              <div className="absolute inset-0 bg-linear-to-r from-[#51a97d] to-[#92eca2] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center justify-center space-x-2">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Sign In</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-linear-to-r from-[#e9f1f1] to-[#e9f1f1]/50 rounded-xl border-2 border-[#51a97d]/20">
            <p className="text-xs font-bold text-[#13635d] uppercase tracking-wider mb-2 flex items-center">
              <Sparkles className="w-3 h-3 mr-1.5 text-[#51a97d]" />
              Demo Credentials
            </p>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-[#51a97d] font-semibold">Username: <span className="text-[#13635d] font-bold">demo</span></span>
              <span className="text-[#51a97d]/30">|</span>
              <span className="text-[#51a97d] font-semibold">Password: <span className="text-[#13635d] font-bold">demo123</span></span>
            </div>
            <button
              type="button"
              onClick={onDemoMode}
              className="w-full py-2 rounded-lg bg-[#51a97d]/15 border border-[#51a97d]/30 text-[#13635d] text-sm font-bold hover:bg-[#51a97d]/25 transition-colors"
            >
              ⚡ Enter Demo Mode (No Backend Required)
            </button>
          </div>

          {/* Bottom gradient line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-[#13635d] via-[#51a97d] to-[#92eca2] rounded-b-3xl"></div>
        </div>
      </div>
    </div>
  )
}
