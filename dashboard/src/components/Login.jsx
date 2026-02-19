import { useState } from 'react'
import { authAPI } from '../services/api'
import { Shield, AlertCircle, Lock, User, ArrowRight, Zap, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function Login({ onLogin, onDemoMode }) {
  const [username, setUsername] = useState('demo')
  const [password, setPassword] = useState('demo123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await authAPI.login(username, password)
      const { access_token, user_id, username: user, roles } = response.data
      onLogin(access_token, { user_id, username: user, roles })
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    'Real-time ML fraud detection',
    'XGBoost + Ensemble AI models',
    'GDPR-compliant audit logging',
    '99.94% detection accuracy',
  ]

  return (
    <div className="min-h-screen flex bg-[#070d1a]">
      {/* Left panel — branding (desktop only) */}
      <div className="hidden lg:flex flex-col w-[52%] relative overflow-hidden bg-[#060c17] border-r border-white/5">
        {/* Background mesh */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-120px] left-[-120px] w-[520px] h-[520px] bg-[#10b981]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-100px] right-[-80px] w-[420px] h-[420px] bg-[#3b82f6]/8 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] bg-[#10b981]/5 rounded-full blur-2xl" />
        </div>
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="relative flex flex-col h-full px-14 py-14">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="p-2.5 bg-[#10b981] rounded-xl shadow-lg shadow-emerald-500/30">
              <Shield className="w-6 h-6 text-[#060c17]" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-2xl font-black text-white tracking-tight">JED 24</span>
              <p className="text-[11px] text-emerald-400/70 font-medium tracking-widest uppercase">Fraud Intelligence</p>
            </div>
          </div>

          {/* Hero copy */}
          <div className="mt-16 mb-12">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-xs font-semibold">Live Threat Detection</span>
            </div>
            <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.07] mb-5">
              Stop Fraud<br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-teal-400">Before It Starts</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-md">
              Enterprise-grade AI that detects and blocks financial fraud in real time — protecting revenue and customers simultaneously.
            </p>
          </div>

          {/* Feature checklist */}
          <div className="space-y-3 mb-auto">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                </div>
                <span className="text-slate-300 text-sm">{f}</span>
              </div>
            ))}
          </div>

          {/* Bottom stats bar */}
          <div className="mt-10 pt-8 border-t border-white/5 grid grid-cols-3 gap-4">
            {[
              { val: '99.94%', label: 'Accuracy' },
              { val: '<42ms', label: 'Response' },
              { val: '48K+', label: 'Transactions/day' },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-xl font-black text-emerald-400">{s.val}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10 py-12 relative">
        {/* Mobile background */}
        <div className="absolute inset-0 lg:hidden pointer-events-none">
          <div className="absolute top-[-80px] right-[-80px] w-[320px] h-[320px] bg-[#10b981]/8 rounded-full blur-3xl" />
          <div className="absolute bottom-[-60px] left-[-60px] w-[280px] h-[280px] bg-[#3b82f6]/6 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="p-2.5 bg-[#10b981] rounded-xl shadow-lg shadow-emerald-500/30">
              <Shield className="w-6 h-6 text-[#060c17]" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-2xl font-black text-white">JED 24</span>
              <p className="text-[10px] text-emerald-400/70 font-semibold tracking-widest uppercase block">Fraud Intelligence</p>
            </div>
          </div>

          <h2 className="text-3xl font-black text-white mb-1.5">Welcome back</h2>
          <p className="text-slate-400 text-sm mb-8">Sign in to your fraud intelligence dashboard</p>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <span className="text-red-300 text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm font-medium focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  disabled={loading}
                  className="w-full pl-11 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm font-medium focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full group py-3.5 bg-[#10b981] hover:bg-[#0ea371] text-[#060c17] rounded-xl font-bold text-sm transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#060c17]/30 border-t-[#060c17] rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Sign In
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-slate-600 font-medium">OR</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Demo mode */}
          <div className="bg-[#10b981]/6 border border-[#10b981]/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-0.5">Demo Mode</p>
                <p className="text-[11px] text-slate-500">No account required</p>
              </div>
              <div className="flex gap-3 text-xs text-slate-400">
                <span>demo / demo123</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onDemoMode}
              className="w-full py-2.5 bg-[#10b981]/15 hover:bg-[#10b981]/25 border border-[#10b981]/30 text-emerald-400 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Enter Demo Mode
            </button>
          </div>

          <p className="text-center text-[11px] text-slate-600 mt-6">
            Protected by 256-bit AES encryption & GDPR compliant
          </p>
        </div>
      </div>
    </div>
  )
}
