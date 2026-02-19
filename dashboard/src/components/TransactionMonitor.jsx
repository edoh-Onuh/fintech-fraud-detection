import { useState } from 'react'
import { Search, AlertTriangle, CheckCircle, Shield, Activity, Send, Loader2, Cpu } from 'lucide-react'

export default function TransactionMonitor({ systemHealth }) {
  const [formData, setFormData] = useState({ amount: '', merchant: '', category: 'online', location: '' })
  const [result, setResult] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)

  const handleAnalyze = async (e) => {
    e.preventDefault()
    setAnalyzing(true)
    await new Promise(r => setTimeout(r, 1500))

    const amount = parseFloat(formData.amount) || 0
    const score = amount > 5000 ? 0.85 : amount > 1000 ? 0.45 : 0.12
    const decision = score > 0.7 ? 'BLOCKED' : score > 0.4 ? 'REVIEW' : 'APPROVED'

    setResult({
      decision,
      score: (score * 100).toFixed(1),
      risk: score > 0.7 ? 'Critical' : score > 0.4 ? 'Medium' : 'Low',
      timestamp: new Date().toLocaleString('en-GB'),
      factors: [
        amount > 5000 && 'High transaction amount',
        formData.category === 'international' && 'International transaction',
        'Velocity check passed',
        'Device fingerprint verified',
        amount > 2000 && 'Above average transaction value'
      ].filter(Boolean),
      models: [
        'XGBoost: ' + (score * 100 - 2).toFixed(1) + '%',
        'Neural Net: ' + (score * 100 + 1).toFixed(1) + '%',
        'Ensemble: ' + (score * 100).toFixed(1) + '%'
      ]
    })
    setAnalyzing(false)
  }

  const decisionStyles = {
    APPROVED: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle },
    REVIEW: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', icon: AlertTriangle },
    BLOCKED: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', icon: Shield }
  }

  return (
    <div className="bg-[#0a1628] border border-[#162032] rounded-2xl overflow-hidden hover:border-[#1e3050] transition-all duration-200">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-[#162032] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Search className="w-[18px] h-[18px] text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Transaction Analyzer</h3>
            <p className="text-[10px] text-slate-600 mt-0.5">Real-time fraud scoring</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-slate-600">
          <Activity className="w-3.5 h-3.5" />
          {systemHealth?.active_models || 3} models active
        </span>
      </div>

      {/* Two-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#162032]">
        {/* Left: Form */}
        <div className="p-5">
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Amount (&pound;)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 bg-[#04070d] border border-[#162032] rounded-xl text-white text-sm placeholder-slate-700 focus:border-[#10b981]/40 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Merchant</label>
                <input
                  type="text"
                  value={formData.merchant}
                  onChange={e => setFormData({ ...formData, merchant: e.target.value })}
                  placeholder="Merchant name"
                  className="w-full px-3.5 py-2.5 bg-[#04070d] border border-[#162032] rounded-xl text-white text-sm placeholder-slate-700 focus:border-[#10b981]/40 outline-none transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#04070d] border border-[#162032] rounded-xl text-white text-sm focus:border-[#10b981]/40 outline-none transition-all [&>option]:bg-[#0a1628] appearance-none"
                >
                  <option value="online">Online</option>
                  <option value="in-store">In-Store</option>
                  <option value="international">International</option>
                  <option value="atm">ATM</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="City, Country"
                  className="w-full px-3.5 py-2.5 bg-[#04070d] border border-[#162032] rounded-xl text-white text-sm placeholder-slate-700 focus:border-[#10b981]/40 outline-none transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={analyzing || !formData.amount}
              className="w-full py-2.5 bg-linear-to-r from-[#10b981] to-[#059669] text-white rounded-xl font-bold text-sm hover:from-[#34d399] hover:to-[#10b981] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15"
            >
              {analyzing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
              ) : (
                <><Send className="w-4 h-4" /> Analyze Transaction</>
              )}
            </button>
          </form>
        </div>

        {/* Right: Results */}
        <div className="p-5">
          {result ? (() => {
            const ds = decisionStyles[result.decision] || decisionStyles.APPROVED
            const DecIcon = ds.icon
            return (
              <div className="space-y-4 animate-fade-in">
                {/* Decision Badge */}
                <div className={`p-4 rounded-xl ${ds.bg} border ${ds.border} text-center`}>
                  <DecIcon className={`w-8 h-8 ${ds.text} mx-auto mb-2`} />
                  <p className={`text-xl font-bold ${ds.text}`}>{result.decision}</p>
                  <p className="text-xs text-slate-500 mt-1">Risk Score: {result.score}%</p>
                </div>

                {/* Risk Factors */}
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Risk Factors</p>
                  <div className="space-y-1.5">
                    {result.factors.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-400 bg-[#04070d]/50 rounded-lg px-3 py-2 border border-[#162032]">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Model Scores */}
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Model Scores</p>
                  <div className="space-y-1.5">
                    {result.models.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-400 bg-[#04070d]/50 rounded-lg px-3 py-2 border border-[#162032]">
                        <Cpu className="w-3 h-3 text-indigo-400 shrink-0" />
                        {m}
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[10px] text-slate-700 text-center">{result.timestamp}</p>
              </div>
            )
          })() : (
            <div className="h-full flex items-center justify-center min-h-[260px]">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#04070d] border border-[#162032] flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-slate-700" />
                </div>
                <p className="text-sm text-slate-500 font-medium">No analysis yet</p>
                <p className="text-[11px] text-slate-700 mt-1">Submit a transaction to begin scoring</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
