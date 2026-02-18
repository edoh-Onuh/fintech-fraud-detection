import { useState } from 'react'
import { fraudAPI } from '../services/api'
import { Send, CheckCircle, XCircle, AlertTriangle, Shield, Clock, TrendingUp, DollarSign, CreditCard, Globe, Smartphone } from 'lucide-react'

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
    device_id: 'device_xyz'
  })

  const isDemoMode = localStorage.getItem('token') === 'demo_offline_token'

  const handleInputChange = (field, value) => {
    setTransaction(prev => ({ ...prev, [field]: value }))
  }

  const handleTest = async () => {
    setLoading(true)
    setResult(null)

    if (isDemoMode) {
      await new Promise(r => setTimeout(r, 900))
      const amt = parseFloat(transaction.amount)
      setResult({
        transaction_id: transaction.transaction_id,
        decision: amt > 5000 ? 'review' : amt > 500 ? 'approve' : 'approve',
        fraud_score: amt > 5000 ? 0.71 : amt > 500 ? 0.18 : 0.042,
        risk_level: amt > 5000 ? 'high' : amt > 500 ? 'medium' : 'low',
        processing_time_ms: 38.5,
        top_risk_factors: [
          { feature: 'transaction_velocity', contribution: 0.021 },
          { feature: 'amount_deviation', contribution: amt > 5000 ? 0.35 : -0.015 },
          { feature: 'merchant_risk_score', contribution: 0.008 },
        ]
      })
      setLoading(false)
      return
    }

    try {
      const response = await fraudAPI.detectFraud(transaction)
      setResult(response.data)
    } catch (error) {
      setResult({
        error: true,
        message: error.response?.data?.detail || 'No backend available. Use Demo Mode to test without a server.'
      })
    } finally {
      setLoading(false)
    }
  }

  const getDecisionIcon = (decision) => {
    switch (decision) {
      case 'approve': return <CheckCircle className="w-5 h-5 text-[#92eca2]" />
      case 'review': return <AlertTriangle className="w-5 h-5 text-orange-400" />
      case 'decline': return <XCircle className="w-5 h-5 text-red-400" />
      default: return null
    }
  }

  const decisionStyles = {
    approve: { text: 'text-[#92eca2]' },
    review: { text: 'text-orange-400' },
    decline: { text: 'text-red-400' }
  }

  const riskStyles = {
    low: 'bg-[#51a97d] text-white',
    medium: 'bg-orange-500 text-white',
    high: 'bg-red-500 text-white'
  }

  const ds = result ? (decisionStyles[result.decision] || decisionStyles.decline) : null

  const inputFields = [
    { field: 'transaction_id', label: 'Transaction ID', icon: CreditCard, type: 'text', placeholder: 'txn_1234567890' },
    { field: 'user_id', label: 'User ID', icon: Shield, type: 'text', placeholder: 'user_12345' },
    { field: 'amount', label: 'Amount', icon: DollarSign, type: 'number', placeholder: '150.00' },
  ]

  const selectFields = [
    { field: 'currency', label: 'Currency', icon: Globe, options: [
      { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' },
      { value: 'GBP', label: 'GBP' }, { value: 'JPY', label: 'JPY' }
    ]},
    { field: 'transaction_type', label: 'Type', icon: TrendingUp, options: [
      { value: 'purchase', label: 'Purchase' }, { value: 'withdrawal', label: 'Withdrawal' },
      { value: 'transfer', label: 'Transfer' }, { value: 'refund', label: 'Refund' }
    ]},
    { field: 'channel', label: 'Channel', icon: Smartphone, options: [
      { value: 'online', label: 'Online' }, { value: 'mobile', label: 'Mobile' },
      { value: 'atm', label: 'ATM' }, { value: 'pos', label: 'POS' }
    ]},
  ]

  return (
    <div className="bg-white border border-[#51a97d]/20 rounded-xl overflow-hidden shadow-sm min-w-0">
      {/* Header */}
      <div className="flex items-center gap-2.5 p-4 pb-3">
        <div className="p-1.5 bg-[#13635d] rounded-md shrink-0">
          <Shield className="w-4 h-4 text-[#92eca2]" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#13635d] truncate">Test Fraud Detection</h3>
          <p className="text-[11px] text-[#51a97d]">Submit a transaction for AI analysis</p>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 pb-4">
        <div className="bg-[#e9f1f1]/40 rounded-lg p-3 border border-[#51a97d]/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {inputFields.map(({ field, label, icon: Icon, type, placeholder }) => (
              <div key={field}>
                <label className="flex items-center gap-1 text-[#13635d] font-semibold text-[10px] mb-1 uppercase tracking-wide">
                  <Icon className="w-3 h-3 text-[#51a97d]" />
                  {label}
                </label>
                <input
                  type={type}
                  step={type === 'number' ? '0.01' : undefined}
                  value={transaction[field]}
                  onChange={(e) => handleInputChange(field, type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-[#51a97d]/25 rounded-md text-sm text-[#13635d] focus:border-[#51a97d] focus:ring-1 focus:ring-[#51a97d]/20 outline-none transition-colors placeholder-[#51a97d]/30"
                  placeholder={placeholder}
                />
              </div>
            ))}

            {selectFields.map(({ field, label, icon: Icon, options }) => (
              <div key={field}>
                <label className="flex items-center gap-1 text-[#13635d] font-semibold text-[10px] mb-1 uppercase tracking-wide">
                  <Icon className="w-3 h-3 text-[#51a97d]" />
                  {label}
                </label>
                <select
                  value={transaction[field]}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-[#51a97d]/25 rounded-md text-sm text-[#13635d] focus:border-[#51a97d] focus:ring-1 focus:ring-[#51a97d]/20 outline-none transition-colors cursor-pointer"
                >
                  {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            ))}
          </div>

          <button
            className={`w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-bold transition-colors ${
              loading
                ? 'bg-[#51a97d]/40 text-white/50 cursor-not-allowed'
                : 'bg-[#13635d] text-white hover:bg-[#035351]'
            }`}
            onClick={handleTest}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Test Transaction</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && !result.error && (
        <div className="mx-4 mb-4 bg-[#13635d] rounded-lg overflow-hidden">
          {/* Decision header */}
          <div className="flex items-center justify-between p-3 border-b border-[#51a97d]/20">
            <div className="flex items-center gap-2 min-w-0">
              {getDecisionIcon(result.decision)}
              <div className="min-w-0">
                <span className={`text-base font-bold uppercase ${ds.text}`}>{result.decision}</span>
                <p className="text-[10px] text-[#92eca2]/50 truncate">{result.transaction_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[#92eca2]/70 text-xs shrink-0">
              <Clock className="w-3 h-3" />
              {result.processing_time_ms?.toFixed(1)}ms
            </div>
          </div>

          {/* Score + Risk */}
          <div className="grid grid-cols-2 border-b border-[#51a97d]/20">
            <div className="p-3 border-r border-[#51a97d]/20">
              <p className="text-[10px] text-[#92eca2]/60 uppercase font-semibold mb-1">Fraud Score</p>
              <p className="text-xl font-bold text-white">{(result.fraud_score * 100).toFixed(1)}%</p>
              <div className="mt-1.5 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${result.fraud_score * 100}%`,
                    background: result.fraud_score > 0.7 ? '#ef4444' : result.fraud_score > 0.4 ? '#fb923c' : '#51a97d'
                  }}
                />
              </div>
            </div>
            <div className="p-3">
              <p className="text-[10px] text-[#92eca2]/60 uppercase font-semibold mb-1">Risk Level</p>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${riskStyles[result.risk_level] || 'bg-gray-500 text-white'}`}>
                {result.risk_level?.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Risk Factors */}
          {result.top_risk_factors?.length > 0 && (
            <div className="p-3">
              <p className="text-[10px] text-[#92eca2]/60 uppercase font-semibold mb-2">Top Risk Factors</p>
              <div className="space-y-2">
                {result.top_risk_factors.slice(0, 3).map((factor, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="shrink-0 w-4 h-4 bg-[#51a97d] rounded-full flex items-center justify-center text-[9px] font-bold text-[#13635d]">{i + 1}</span>
                      <span className="text-white text-xs truncate">{factor.feature}</span>
                    </div>
                    <span className={`shrink-0 text-xs font-bold ${factor.contribution > 0 ? 'text-red-400' : 'text-[#92eca2]'}`}>
                      {factor.contribution > 0 ? '+' : ''}{(factor.contribution * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {result?.error && (
        <div className="mx-4 mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-red-700 font-semibold text-sm">Failed</p>
            <p className="text-red-600 text-xs truncate">{result.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
