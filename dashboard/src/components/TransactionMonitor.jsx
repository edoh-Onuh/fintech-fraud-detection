import { useState } from 'react'
import { fraudAPI } from '../services/api'
import { Send, CheckCircle, XCircle, AlertTriangle, Shield, Clock, DollarSign, CreditCard, Globe, Smartphone, TrendingUp } from 'lucide-react'

export default function TransactionMonitor({ systemHealth }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [transaction, setTransaction] = useState({
    transaction_id: `txn_${Date.now()}`,
    user_id: 'user_12345',
    merchant_id: 'merch_abc',
    amount: 150.00,
    currency: 'USD',
    transaction_type: 'purchase',
    channel: 'online',
    ip_address: '192.168.1.1',
    country: 'US',
    device_id: 'device_xyz',
  })

  const isDemoMode = localStorage.getItem('token') === 'demo_offline_token'

  const handleInputChange = (field, value) =>
    setTransaction(prev => ({ ...prev, [field]: value }))

  const handleTest = async () => {
    setLoading(true)
    setResult(null)
    if (isDemoMode) {
      await new Promise(r => setTimeout(r, 900))
      const amt = parseFloat(transaction.amount)
      setResult({
        transaction_id: transaction.transaction_id,
        decision: amt > 5000 ? 'review' : 'approve',
        fraud_score: amt > 5000 ? 0.71 : amt > 500 ? 0.18 : 0.042,
        risk_level: amt > 5000 ? 'high' : amt > 500 ? 'medium' : 'low',
        processing_time_ms: 38.5,
        top_risk_factors: [
          { feature: 'transaction_velocity', contribution: 0.021 },
          { feature: 'amount_deviation', contribution: amt > 5000 ? 0.35 : -0.015 },
          { feature: 'merchant_risk_score', contribution: 0.008 },
        ],
      })
      setLoading(false)
      return
    }
    try {
      const response = await fraudAPI.detectFraud(transaction)
      setResult(response.data)
    } catch (error) {
      setResult({ error: true, message: error.response?.data?.detail || 'No backend available. Use Demo Mode to test without a server.' })
    } finally {
      setLoading(false)
    }
  }

  const decisionConfig = {
    approve: { icon: <CheckCircle className="w-5 h-5 text-emerald-400" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    review:  { icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,   color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'   },
    decline: { icon: <XCircle className="w-5 h-5 text-red-400" />,          color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20'        },
  }
  const riskColor = { low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20', high: 'text-red-400 bg-red-500/10 border-red-500/20' }

  const dc = result ? (decisionConfig[result.decision] || decisionConfig.decline) : null

  const inputFields = [
    { field: 'transaction_id', label: 'Transaction ID', icon: CreditCard, type: 'text',   placeholder: 'txn_1234567890' },
    { field: 'user_id',        label: 'User ID',        icon: Shield,     type: 'text',   placeholder: 'user_12345'     },
    { field: 'amount',         label: 'Amount',         icon: DollarSign, type: 'number', placeholder: '150.00'         },
  ]
  const selectFields = [
    { field: 'currency',         label: 'Currency', icon: Globe,        options: [{ value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }, { value: 'GBP', label: 'GBP' }, { value: 'JPY', label: 'JPY' }] },
    { field: 'transaction_type', label: 'Type',     icon: TrendingUp,   options: [{ value: 'purchase', label: 'Purchase' }, { value: 'withdrawal', label: 'Withdrawal' }, { value: 'transfer', label: 'Transfer' }, { value: 'refund', label: 'Refund' }] },
    { field: 'channel',          label: 'Channel',  icon: Smartphone,   options: [{ value: 'online', label: 'Online' }, { value: 'mobile', label: 'Mobile' }, { value: 'atm', label: 'ATM' }, { value: 'pos', label: 'POS' }] },
  ]

  return (
    <div className="bg-[#0d1829] border border-white/6 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-5 pb-4 border-b border-white/5">
        <div className="p-2 bg-emerald-500/15 rounded-lg shrink-0">
          <Shield className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Test Fraud Detection</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Submit a transaction for AI analysis</p>
        </div>
        {isDemoMode && (
          <span className="ml-auto text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
            DEMO MODE
          </span>
        )}
      </div>

      {/* Form */}
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
          {inputFields.map(({ field, label, icon: Icon, type, placeholder }) => (
            <div key={field}>
              <label className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] mb-1.5 uppercase tracking-wide">
                <Icon className="w-3 h-3" /> {label}
              </label>
              <input
                type={type}
                step={type === 'number' ? '0.01' : undefined}
                value={transaction[field]}
                onChange={(e) => handleInputChange(field, type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/8 rounded-lg text-sm text-white placeholder-slate-600 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
                placeholder={placeholder}
              />
            </div>
          ))}
          {selectFields.map(({ field, label, icon: Icon, options }) => (
            <div key={field}>
              <label className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] mb-1.5 uppercase tracking-wide">
                <Icon className="w-3 h-3" /> {label}
              </label>
              <select
                value={transaction[field]}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/8 rounded-lg text-sm text-white focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer [&>option]:bg-[#0d1829] [&>option]:text-white"
              >
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          ))}
        </div>

        <button
          onClick={handleTest}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
            loading ? 'bg-white/5 text-slate-600 cursor-not-allowed' : 'bg-[#10b981] hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20'
          }`}
        >
          {loading ? (
            <><div className="w-4 h-4 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" /><span>Analyzing Transaction...</span></>
          ) : (
            <><Send className="w-4 h-4" /><span>Analyze Transaction</span></>
          )}
        </button>
      </div>

      {/* Results */}
      {result && !result.error && dc && (
        <div className="mx-5 mb-5 bg-white/4 border border-white/8 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              {dc.icon}
              <div>
                <span className={`text-base font-black uppercase ${dc.color}`}>{result.decision}</span>
                <p className="text-[10px] text-slate-600 mt-0.5 font-mono">{result.transaction_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <Clock className="w-3 h-3" />{result.processing_time_ms?.toFixed(1)}ms
            </div>
          </div>
          <div className="grid grid-cols-2 border-b border-white/5">
            <div className="p-4 border-r border-white/5">
              <p className="text-[10px] text-slate-600 uppercase font-semibold mb-1">Fraud Score</p>
              <p className="text-2xl font-black text-white">{(result.fraud_score * 100).toFixed(1)}%</p>
              <div className="mt-2 h-1.5 bg-white/8 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${result.fraud_score * 100}%`, background: result.fraud_score > 0.7 ? '#ef4444' : result.fraud_score > 0.4 ? '#f97316' : '#10b981' }} />
              </div>
            </div>
            <div className="p-4">
              <p className="text-[10px] text-slate-600 uppercase font-semibold mb-1">Risk Level</p>
              <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${riskColor[result.risk_level] || riskColor.high}`}>
                {result.risk_level?.toUpperCase()}
              </span>
            </div>
          </div>
          {result.top_risk_factors?.length > 0 && (
            <div className="p-4">
              <p className="text-[10px] text-slate-600 uppercase font-semibold mb-3">Top Risk Factors</p>
              <div className="space-y-2">
                {result.top_risk_factors.slice(0, 3).map((f, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 bg-white/8 rounded-full flex items-center justify-center text-[9px] font-bold text-slate-400 shrink-0">{i + 1}</span>
                      <span className="text-slate-300 text-xs truncate font-mono">{f.feature}</span>
                    </div>
                    <span className={`shrink-0 text-xs font-bold ${f.contribution > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {f.contribution > 0 ? '+' : ''}{(f.contribution * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {result?.error && (
        <div className="mx-5 mb-5 bg-red-500/8 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-bold text-sm">Analysis Failed</p>
            <p className="text-red-400/70 text-xs mt-0.5">{result.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
