import { useState } from 'react'
import { Shield, Eye, EyeOff, Zap, Lock, User, AlertCircle, ArrowRight, Activity } from 'lucide-react'

export default function Login({ onLogin, onDemoMode }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) { setError('Please enter both username and password'); return }
    setError('')
    setLoading(true)
    try {
      const API = import.meta.env.VITE_API_URL || 'https://jed24-api.onrender.com'
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: username.trim(), password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Invalid credentials')
      onLogin(data.access_token, data.user || { username: username.trim() })
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Server unavailable — use Demo Mode' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#04070d] flex">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-linear-to-br from-[#10b981]/8 via-[#04070d] to-[#6366f1]/8" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(16,185,129,0.06),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative z-10 px-12 max-w-lg">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-[#10b981] to-[#059669] flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">JED 24</h1>
              <p className="text-[10px] text-emerald-400/80 font-semibold tracking-[0.2em] uppercase">Fraud Intelligence</p>
            </div>
          </div>

          {/* Tagline */}
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Intelligent Fraud<br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#10b981] to-[#6366f1]">Detection Platform</span>
          </h2>
          <p className="text-slate-400 text-base leading-relaxed mb-10">
            Real-time transaction monitoring powered by advanced ML models.
            Protect your business with enterprise-grade fraud detection.
          </p>

          {/* Feature list */}
          <div className="space-y-3">
            {[
              { icon: Zap, label: 'Real-Time Analysis', desc: 'Sub-second fraud scoring on every transaction' },
              { icon: Activity, label: '99.2% Accuracy', desc: 'Ensemble ML models with continuous learning' },
              { icon: Lock, label: 'Bank-Grade Security', desc: 'End-to-end encryption & compliance ready' }
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-10 h-10 rounded-xl bg-[#10b981]/10 flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.label}</p>
                  <p className="text-xs text-slate-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#10b981] to-[#059669] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">JED 24</h1>
          </div>

          {/* Form Container */}
          <div className="bg-[#0a1628] border border-[#162032] rounded-2xl p-8 shadow-2xl shadow-black/30">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
              <p className="text-sm text-slate-500">Sign in to your command center</p>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full pl-11 pr-4 py-3 bg-[#04070d] border border-[#162032] rounded-xl text-white placeholder-slate-700 focus:border-[#10b981]/50 focus:ring-1 focus:ring-[#10b981]/20 outline-none transition-all text-sm"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-11 pr-11 py-3 bg-[#04070d] border border-[#162032] rounded-xl text-white placeholder-slate-700 focus:border-[#10b981]/50 focus:ring-1 focus:ring-[#10b981]/20 outline-none transition-all text-sm"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-linear-to-r from-[#10b981] to-[#059669] text-white rounded-xl font-bold text-sm hover:from-[#34d399] hover:to-[#10b981] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 mt-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Authenticating...</>
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#162032]" /></div>
              <div className="relative flex justify-center"><span className="px-3 bg-[#0a1628] text-xs text-slate-600">or continue with</span></div>
            </div>

            {/* Demo Mode */}
            <button
              onClick={onDemoMode}
              className="w-full py-3 bg-white/[0.03] border border-[#162032] text-white rounded-xl font-semibold text-sm hover:bg-white/[0.06] hover:border-[#1e3050] transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              Launch Demo Mode
            </button>

            <p className="text-center text-xs text-slate-600 mt-4">
              Demo credentials: <span className="text-slate-400 font-medium">admin</span> / <span className="text-slate-400 font-medium">admin123</span>
            </p>
          </div>

          <p className="text-center text-[10px] text-slate-700 mt-6">
            &copy; {new Date().getFullYear()} JED 24 — Fraud Intelligence Platform
          </p>
        </div>
      </div>
    </div>
  )
}
