import { useState, useEffect } from 'react'
import { Network, AlertTriangle, Zap, Target, TrendingUp, Activity} from 'lucide-react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts'

export default function FraudPatterns() {
  const [patterns, setPatterns] = useState([])
  const [selectedPattern, setSelectedPattern] = useState(null)
  const [anomalyData, setAnomalyData] = useState([])

  useEffect(() => {
    fetchPatterns()
    fetchAnomalyData()
  }, [])

  const fetchPatterns = () => {
    const mockPatterns = [
      { id: 1, name: 'Velocity Spike Attack', severity: 'critical', confidence: 94, occurrences: 23, description: 'Rapid succession of small transactions followed by large withdrawal', indicators: ['5+ transactions within 2 minutes', 'Average amount < £50', 'Final transaction > £5000', 'Multiple card declines before success'], impact: '£125,000 at risk', trend: 'increasing', affectedAccounts: 23, preventionRate: 87 },
      { id: 2, name: 'Account Takeover Chain', severity: 'high', confidence: 91, occurrences: 17, description: 'Credential stuffing attack followed by profile changes and fund transfer', indicators: ['Multiple failed login attempts', 'Login from new device/location', 'Immediate email/phone change', 'Large transfer within 30 minutes'], impact: '£89,000 at risk', trend: 'stable', affectedAccounts: 17, preventionRate: 92 },
      { id: 3, name: 'Geographic Impossible Travel', severity: 'high', confidence: 96, occurrences: 12, description: 'Transactions in geographically distant locations within impossible timeframe', indicators: ['Transaction in Location A at T0', 'Transaction in Location B at T0 + 30min', 'Distance > 500km between locations', 'No flight/transport correlation'], impact: '£67,000 at risk', trend: 'decreasing', affectedAccounts: 12, preventionRate: 98 },
      { id: 4, name: 'Merchant Collusion Pattern', severity: 'medium', confidence: 78, occurrences: 8, description: 'Fraudulent merchant processing suspicious refunds and chargebacks', indicators: ['High refund rate (>15%)', 'Same customers, multiple refunds', 'Unusual merchant category code', 'Off-hours processing'], impact: '£45,000 at risk', trend: 'increasing', affectedAccounts: 8, preventionRate: 73 },
      { id: 5, name: 'Synthetic Identity Buildup', severity: 'medium', confidence: 82, occurrences: 15, description: 'Gradual credit building with fabricated identity before bust-out', indicators: ['New account with limited history', 'Consistent small payments for 3-6 months', 'Sudden maxing out of credit', 'Unable to contact customer'], impact: '£112,000 at risk', trend: 'stable', affectedAccounts: 15, preventionRate: 68 },
    ]
    setPatterns(mockPatterns)
  }

  const fetchAnomalyData = () => {
    const data = []
    for (let i = 0; i < 200; i++) {
      const isAnomaly = Math.random() > 0.9
      data.push({ amount: Math.random() * 10000, velocity: Math.random() * 100, risk: isAnomaly ? Math.random() * 30 + 70 : Math.random() * 50, type: isAnomaly ? 'anomaly' : 'normal' })
    }
    setAnomalyData(data)
  }

  const severityConfig = {
    critical: { badge: 'bg-red-500/15 text-red-400 border-red-500/30', icon: 'bg-red-500/15 text-red-400 border-red-500/30' },
    high: { badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30', icon: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
    medium: { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    low: { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  }
  const trendIcons = { increasing: <TrendingUp className="w-3.5 h-3.5 text-red-400" />, decreasing: <TrendingUp className="w-3.5 h-3.5 text-emerald-400 rotate-180" />, stable: <Activity className="w-3.5 h-3.5 text-slate-500" /> }
  const anomalies = anomalyData.filter(d => d.type === 'anomaly').length
  const normals = anomalyData.filter(d => d.type === 'normal').length
  const tooltipStyle = { background: '#0d1829', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e2e8f0', padding: '8px 12px', fontSize: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-500/15 rounded-lg shrink-0"><Network className="w-5 h-5 text-purple-400" /></div>
        <div>
          <h1 className="text-xl font-bold text-white">Pattern Intelligence</h1>
          <p className="text-sm text-slate-500 mt-0.5">Advanced fraud pattern detection</p>
        </div>
      </div>

      {/* Anomaly Scatter */}
      <div className="bg-[#0d1829] border border-white/6 rounded-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 pb-3">
          <h2 className="text-sm font-bold text-white">Anomaly Detection Map</h2>
          <div className="flex gap-2 text-xs">
            <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg font-semibold">{anomalies} Anomalies</span>
            <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg font-semibold">{normals} Normal</span>
          </div>
        </div>
        <div className="px-2 pb-3">
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 35, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" dataKey="amount" name="Amount" tick={{ fontSize: 11, fill: '#64748b' }} label={{ value: 'Amount (£)', position: 'bottom', offset: 20, style: { fontSize: 11, fill: '#64748b' } }} />
              <YAxis type="number" dataKey="velocity" name="Velocity" tick={{ fontSize: 11, fill: '#64748b' }} label={{ value: 'Velocity', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#64748b' } }} />
              <ZAxis type="number" dataKey="risk" range={[30, 300]} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ fontWeight: 700, color: '#10b981' }} />
              <Scatter name="Normal" data={anomalyData.filter(d => d.type === 'normal')} fill="#10b981" fillOpacity={0.5} />
              <Scatter name="Anomaly" data={anomalyData.filter(d => d.type === 'anomaly')} fill="#ef4444" fillOpacity={0.8} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pattern Cards */}
      <div className="space-y-3">
        {patterns.map(pattern => {
          const sc = severityConfig[pattern.severity] || severityConfig.low
          const isSelected = selectedPattern?.id === pattern.id
          return (
            <div key={pattern.id} className={`bg-[#0d1829] border rounded-xl overflow-hidden cursor-pointer transition-all ${isSelected ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'border-white/6 hover:border-white/12'}`} onClick={() => setSelectedPattern(isSelected ? null : pattern)}>
              <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className={`p-2.5 rounded-lg shrink-0 border ${sc.icon}`}><AlertTriangle className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-bold text-white truncate">{pattern.name}</h3>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${sc.badge}`}>{pattern.severity}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">{trendIcons[pattern.trend]} {pattern.trend}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">{pattern.description}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-white/5">
                <div className="px-4 py-3 border-r border-b sm:border-b-0 border-white/5"><p className="text-[10px] text-slate-600 font-semibold uppercase mb-0.5">Confidence</p><p className="text-lg font-bold text-white">{pattern.confidence}%</p></div>
                <div className="px-4 py-3 border-b sm:border-b-0 sm:border-r border-white/5"><p className="text-[10px] text-slate-600 font-semibold uppercase mb-0.5">Occurrences</p><p className="text-lg font-bold text-white">{pattern.occurrences}</p></div>
                <div className="px-4 py-3 border-r border-white/5"><p className="text-[10px] text-slate-600 font-semibold uppercase mb-0.5">Impact</p><p className="text-sm font-bold text-white truncate">{pattern.impact}</p></div>
                <div className="px-4 py-3"><p className="text-[10px] text-slate-600 font-semibold uppercase mb-0.5">Prevention</p><p className="text-lg font-bold text-emerald-400">{pattern.preventionRate}%</p></div>
              </div>

              {/* Expanded */}
              {isSelected && (
                <div className="border-t border-white/5 p-4 bg-white/4">
                  <h4 className="text-xs font-bold text-white uppercase mb-3 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-400" /> Detection Indicators</h4>
                  <ul className="space-y-2 mb-4">
                    {pattern.indicators.map((ind, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 bg-white/5 rounded-lg px-3 py-2.5 border border-white/5">
                        <Zap className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                        <span>{ind}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    <button className="px-3 py-2 bg-[#10b981] text-white rounded-lg text-xs font-bold hover:bg-emerald-400 transition-all">Create Alert Rule</button>
                    <button className="px-3 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-xs font-bold hover:bg-white/8 transition-all">View Accounts</button>
                    <button className="px-3 py-2 bg-white/5 border border-white/10 text-slate-400 rounded-lg text-xs font-bold hover:bg-white/8 transition-all">Export Data</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#0d1829] border border-red-500/20 rounded-xl p-4"><div className="flex items-center justify-between mb-1.5"><h3 className="text-xs font-bold text-red-400 uppercase">Active Patterns</h3><Network className="w-4 h-4 text-red-400" /></div><p className="text-2xl font-bold text-white">{patterns.length}</p><p className="text-xs text-slate-600">Detected in last 7 days</p></div>
        <div className="bg-[#0d1829] border border-amber-500/20 rounded-xl p-4"><div className="flex items-center justify-between mb-1.5"><h3 className="text-xs font-bold text-amber-400 uppercase">Total Occurrences</h3><Activity className="w-4 h-4 text-amber-400" /></div><p className="text-2xl font-bold text-white">{patterns.reduce((s, p) => s + p.occurrences, 0)}</p><p className="text-xs text-slate-600">Across all pattern types</p></div>
        <div className="bg-[#0d1829] border border-emerald-500/20 rounded-xl p-4"><div className="flex items-center justify-between mb-1.5"><h3 className="text-xs font-bold text-emerald-400 uppercase">Avg Prevention Rate</h3><Target className="w-4 h-4 text-emerald-400" /></div><p className="text-2xl font-bold text-emerald-400">{patterns.length ? (patterns.reduce((s, p) => s + p.preventionRate, 0) / patterns.length).toFixed(1) : 0}%</p><p className="text-xs text-slate-600">ML-powered detection</p></div>
      </div>
    </div>
  )
}
