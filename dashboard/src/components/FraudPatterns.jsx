import { useState } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Network, Activity, Target, Zap, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'

const patterns = [
  {
    id: 1, name: 'Account Takeover Surge', severity: 'critical', confidence: 94, occurrences: 156,
    description: 'Unusual login attempts followed by rapid fund transfers from multiple compromised accounts.',
    impact: '£234,567 in attempted transfers', preventionRate: 92,
    indicators: ['Multiple failed login attempts from new IPs', 'Password reset followed by immediate high-value transfer', 'Session hijacking signatures detected', 'Geographic impossibility in login patterns'],
    data: { x: 94, y: 156, z: 234567 }
  },
  {
    id: 2, name: 'Card Testing Attack', severity: 'high', confidence: 87, occurrences: 298,
    description: 'Small transactions to verify stolen card details before larger fraud attempts.',
    impact: '£45,678 in small test transactions', preventionRate: 88,
    indicators: ['Rapid succession of small-value transactions', 'Different cards from same device/IP', 'Merchant category pattern anomalies', 'Bot-like transaction timing'],
    data: { x: 87, y: 298, z: 45678 }
  },
  {
    id: 3, name: 'Velocity Attack Pattern', severity: 'high', confidence: 91, occurrences: 89,
    description: 'Unusually high transaction frequency targeting specific merchant categories.',
    impact: '£189,234 across 89 transactions', preventionRate: 95,
    indicators: ['Transaction rate exceeding normal patterns', 'Targeting high-value merchant categories', 'Automated transaction signatures', 'Round-amount transaction clusters'],
    data: { x: 91, y: 89, z: 189234 }
  },
  {
    id: 4, name: 'Geographic Anomaly', severity: 'medium', confidence: 78, occurrences: 67,
    description: 'Transactions from locations inconsistent with customer history and travel patterns.',
    impact: '£67,890 from unusual locations', preventionRate: 85,
    indicators: ['Impossible travel speed between transactions', 'High-risk country transactions', 'VPN/Proxy usage detected', 'Timezone inconsistencies'],
    data: { x: 78, y: 67, z: 67890 }
  }
]

const severityColors = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#3b82f6' }
const severityBadge = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  low: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
}

export default function FraudPatterns() {
  const [selectedPattern, setSelectedPattern] = useState(null)
  const scatterData = patterns.map(p => p.data)

  const tooltipStyle = {
    background: 'rgba(10, 22, 40, 0.95)', border: '1px solid rgba(22, 32, 50, 0.8)',
    borderRadius: '12px', color: '#e2e8f0', padding: '10px 14px', fontSize: '12px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
          <Network className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Fraud Patterns</h1>
          <p className="text-xs text-slate-500 mt-0.5">ML-detected attack vectors & anomalies</p>
        </div>
      </div>

      {/* Scatter Chart Container */}
      <div className="bg-[#0a1628] border border-[#162032] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#162032] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Pattern Distribution</h3>
          <span className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">Confidence vs Occurrences</span>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="x" name="Confidence" unit="%" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="y" name="Occurrences" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [value, name === 'x' ? 'Confidence' : 'Occurrences']} />
              <Scatter data={scatterData} fill="#10b981">
                {scatterData.map((_, i) => (
                  <Cell key={i} fill={severityColors[patterns[i].severity]} fillOpacity={0.8} r={8} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pattern Cards */}
      <div className="space-y-3">
        {patterns.map((pattern) => {
          const isSelected = selectedPattern === pattern.id
          return (
            <div key={pattern.id} className="bg-[#0a1628] border border-[#162032] rounded-2xl overflow-hidden hover:border-[#1e3050] transition-all">
              {/* Card Header */}
              <button
                onClick={() => setSelectedPattern(isSelected ? null : pattern.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-8 rounded-full shrink-0" style={{ background: severityColors[pattern.severity] }} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-bold text-white truncate">{pattern.name}</h3>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border shrink-0 ${severityBadge[pattern.severity]}`}>{pattern.severity}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{pattern.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-14 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pattern.confidence}%` }} />
                    </div>
                    <span className="text-xs font-bold text-white w-10 text-right">{pattern.confidence}%</span>
                  </div>
                  {isSelected ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>
              </button>

              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-[#162032]">
                <div className="px-5 py-3 border-r border-b sm:border-b-0 border-[#162032]">
                  <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-0.5">Confidence</p>
                  <p className="text-lg font-bold text-white">{pattern.confidence}%</p>
                </div>
                <div className="px-5 py-3 border-b sm:border-b-0 sm:border-r border-[#162032]">
                  <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-0.5">Occurrences</p>
                  <p className="text-lg font-bold text-white">{pattern.occurrences}</p>
                </div>
                <div className="px-5 py-3 border-r border-[#162032]">
                  <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-0.5">Impact</p>
                  <p className="text-sm font-bold text-white truncate">{pattern.impact}</p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-0.5">Prevention</p>
                  <p className="text-lg font-bold text-emerald-400">{pattern.preventionRate}%</p>
                </div>
              </div>

              {/* Expanded Details */}
              {isSelected && (
                <div className="border-t border-[#162032] p-5 bg-white/[0.01]">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Detection Indicators
                  </h4>
                  <ul className="space-y-2 mb-4">
                    {pattern.indicators.map((ind, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 bg-[#04070d]/50 rounded-xl px-3.5 py-2.5 border border-[#162032]">
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                        <span>{ind}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    <button className="px-3.5 py-2 bg-linear-to-r from-[#10b981] to-[#059669] text-white rounded-xl text-xs font-bold hover:from-[#34d399] hover:to-[#10b981] transition-all shadow-lg shadow-emerald-500/10">Create Alert Rule</button>
                    <button className="px-3.5 py-2 bg-white/[0.03] border border-[#162032] text-white rounded-xl text-xs font-bold hover:bg-white/[0.06] transition-all">View Accounts</button>
                    <button className="px-3.5 py-2 bg-white/[0.03] border border-[#162032] text-slate-400 rounded-xl text-xs font-bold hover:bg-white/[0.06] transition-all">Export Data</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0a1628] border border-red-500/15 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Active Patterns</h3>
            <Network className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-3xl font-bold text-white">{patterns.length}</p>
          <p className="text-[10px] text-slate-600 mt-1">Detected in last 7 days</p>
        </div>
        <div className="bg-[#0a1628] border border-amber-500/15 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Total Occurrences</h3>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-white">{patterns.reduce((s, p) => s + p.occurrences, 0)}</p>
          <p className="text-[10px] text-slate-600 mt-1">Across all pattern types</p>
        </div>
        <div className="bg-[#0a1628] border border-emerald-500/15 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Avg Prevention</h3>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-emerald-400">{(patterns.reduce((s, p) => s + p.preventionRate, 0) / patterns.length).toFixed(1)}%</p>
          <p className="text-[10px] text-slate-600 mt-1">ML-powered detection</p>
        </div>
      </div>
    </div>
  )
}
