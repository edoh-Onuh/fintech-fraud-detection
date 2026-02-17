import { useState, useEffect } from 'react'
import { Activity, AlertTriangle, Zap, Target, TrendingUp, Network } from 'lucide-react'
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
      {
        id: 1, name: 'Velocity Spike Attack', severity: 'critical', confidence: 94,
        occurrences: 23, description: 'Rapid succession of small transactions followed by large withdrawal',
        indicators: ['5+ transactions within 2 minutes', 'Average amount < £50', 'Final transaction > £5000', 'Multiple card declines before success'],
        impact: '£125,000 at risk', trend: 'increasing', affectedAccounts: 23, preventionRate: 87
      },
      {
        id: 2, name: 'Account Takeover Chain', severity: 'high', confidence: 91,
        occurrences: 17, description: 'Credential stuffing attack followed by profile changes and fund transfer',
        indicators: ['Multiple failed login attempts', 'Login from new device/location', 'Immediate email/phone change', 'Large transfer within 30 minutes'],
        impact: '£89,000 at risk', trend: 'stable', affectedAccounts: 17, preventionRate: 92
      },
      {
        id: 3, name: 'Geographic Impossible Travel', severity: 'high', confidence: 96,
        occurrences: 12, description: 'Transactions in geographically distant locations within impossible timeframe',
        indicators: ['Transaction in Location A at T0', 'Transaction in Location B at T0 + 30min', 'Distance > 500km between locations', 'No flight/transport correlation'],
        impact: '£67,000 at risk', trend: 'decreasing', affectedAccounts: 12, preventionRate: 98
      },
      {
        id: 4, name: 'Merchant Collusion Pattern', severity: 'medium', confidence: 78,
        occurrences: 8, description: 'Fraudulent merchant processing suspicious refunds and chargebacks',
        indicators: ['High refund rate (>15%)', 'Same customers, multiple refunds', 'Unusual merchant category code', 'Off-hours processing'],
        impact: '£45,000 at risk', trend: 'increasing', affectedAccounts: 8, preventionRate: 73
      },
      {
        id: 5, name: 'Synthetic Identity Buildup', severity: 'medium', confidence: 82,
        occurrences: 15, description: 'Gradual credit building with fabricated identity before bust-out',
        indicators: ['New account with limited history', 'Consistent small payments for 3-6 months', 'Sudden maxing out of credit', 'Unable to contact customer'],
        impact: '£112,000 at risk', trend: 'stable', affectedAccounts: 15, preventionRate: 68
      }
    ]
    setPatterns(mockPatterns)
  }

  const fetchAnomalyData = () => {
    const data = []
    for (let i = 0; i < 200; i++) {
      const isAnomaly = Math.random() > 0.9
      data.push({
        amount: Math.random() * 10000,
        velocity: Math.random() * 100,
        risk: isAnomaly ? Math.random() * 30 + 70 : Math.random() * 50,
        type: isAnomaly ? 'anomaly' : 'normal'
      })
    }
    setAnomalyData(data)
  }

  const severityStyles = {
    critical: { badge: 'bg-red-100 text-red-700 border-red-200', icon: 'bg-red-50 text-red-600' },
    high: { badge: 'bg-orange-100 text-orange-700 border-orange-200', icon: 'bg-orange-50 text-orange-600' },
    medium: { badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: 'bg-yellow-50 text-yellow-600' },
    low: { badge: 'bg-blue-100 text-blue-700 border-blue-200', icon: 'bg-blue-50 text-blue-600' }
  }

  const trendIcons = {
    increasing: <TrendingUp className="w-3.5 h-3.5 text-red-500" />,
    decreasing: <TrendingUp className="w-3.5 h-3.5 text-green-500 rotate-180" />,
    stable: <Activity className="w-3.5 h-3.5 text-gray-500" />
  }

  const anomalies = anomalyData.filter(d => d.type === 'anomaly').length
  const normals = anomalyData.filter(d => d.type === 'normal').length

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#13635d] rounded-lg shrink-0">
          <Network className="w-5 h-5 text-[#92eca2]" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[#13635d] truncate">Pattern Intelligence</h1>
          <p className="text-sm text-[#51a97d]">Advanced fraud pattern detection</p>
        </div>
      </div>

      {/* Anomaly Scatter Chart */}
      <div className="bg-white border border-[#51a97d]/20 rounded-xl overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 pb-2 gap-2">
          <h2 className="text-sm font-bold text-[#13635d]">Anomaly Detection Map</h2>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 bg-red-50 text-red-600 rounded-md font-semibold">{anomalies} Anomalies</span>
            <span className="px-2 py-1 bg-green-50 text-green-600 rounded-md font-semibold">{normals} Normal</span>
          </div>
        </div>
        <div className="px-2 pb-3">
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9f1f1" />
              <XAxis type="number" dataKey="amount" name="Amount" tick={{ fontSize: 11 }}
                label={{ value: 'Amount (£)', position: 'bottom', offset: 15, style: { fontSize: 11, fill: '#51a97d' } }} />
              <YAxis type="number" dataKey="velocity" name="Velocity" tick={{ fontSize: 11 }}
                label={{ value: 'Velocity', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#51a97d' } }} />
              <ZAxis type="number" dataKey="risk" range={[30, 300]} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #51a97d', borderRadius: 8, fontSize: 12 }} />
              <Scatter name="Normal" data={anomalyData.filter(d => d.type === 'normal')} fill="#51a97d" fillOpacity={0.5} />
              <Scatter name="Anomaly" data={anomalyData.filter(d => d.type === 'anomaly')} fill="#ef4444" fillOpacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pattern Cards */}
      <div className="space-y-3">
        {patterns.map(pattern => {
          const ss = severityStyles[pattern.severity] || severityStyles.low
          const isSelected = selectedPattern?.id === pattern.id
          return (
            <div
              key={pattern.id}
              className={`bg-white border rounded-xl overflow-hidden shadow-sm cursor-pointer transition-colors ${
                isSelected ? 'border-[#13635d] ring-1 ring-[#13635d]/20' : 'border-[#51a97d]/20 hover:border-[#51a97d]/40'
              }`}
              onClick={() => setSelectedPattern(isSelected ? null : pattern)}
            >
              {/* Card header row */}
              <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${ss.icon}`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-[#13635d] truncate">{pattern.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${ss.badge}`}>{pattern.severity}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      {trendIcons[pattern.trend]} {pattern.trend}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">{pattern.description}</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-[#51a97d]/10">
                <div className="px-4 py-2.5 border-b sm:border-b-0 sm:border-r border-[#51a97d]/10">
                  <p className="text-[10px] text-[#51a97d] font-semibold uppercase">Confidence</p>
                  <p className="text-lg font-bold text-[#13635d]">{pattern.confidence}%</p>
                </div>
                <div className="px-4 py-2.5 border-b sm:border-b-0 sm:border-r border-[#51a97d]/10">
                  <p className="text-[10px] text-[#51a97d] font-semibold uppercase">Occurrences</p>
                  <p className="text-lg font-bold text-[#13635d]">{pattern.occurrences}</p>
                </div>
                <div className="px-4 py-2.5 sm:border-r border-[#51a97d]/10">
                  <p className="text-[10px] text-[#51a97d] font-semibold uppercase">Impact</p>
                  <p className="text-sm font-bold text-[#13635d] truncate">{pattern.impact}</p>
                </div>
                <div className="px-4 py-2.5">
                  <p className="text-[10px] text-[#51a97d] font-semibold uppercase">Prevention</p>
                  <p className="text-lg font-bold text-[#13635d]">{pattern.preventionRate}%</p>
                </div>
              </div>

              {/* Expanded details */}
              {isSelected && (
                <div className="border-t border-[#51a97d]/10 p-4 bg-[#e9f1f1]/30">
                  <h4 className="text-xs font-bold text-[#13635d] uppercase mb-2 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-orange-500" /> Detection Indicators
                  </h4>
                  <ul className="space-y-1.5 mb-3">
                    {pattern.indicators.map((ind, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-gray-600 bg-white rounded-md px-3 py-2 border border-[#51a97d]/10">
                        <Zap className="w-3 h-3 text-orange-400 shrink-0 mt-0.5" />
                        <span>{ind}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    <button className="px-3 py-1.5 bg-[#13635d] text-white rounded-md text-xs font-bold hover:bg-[#035351] transition-colors">
                      Create Alert Rule
                    </button>
                    <button className="px-3 py-1.5 border border-[#51a97d] text-[#13635d] rounded-md text-xs font-bold hover:bg-[#e9f1f1] transition-colors">
                      View Accounts
                    </button>
                    <button className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-md text-xs font-bold hover:bg-gray-50 transition-colors">
                      Export Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-red-200 rounded-xl p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-bold text-red-600 uppercase">Active Patterns</h3>
            <Network className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-[#13635d]">{patterns.length}</p>
          <p className="text-xs text-gray-500">Detected in last 7 days</p>
        </div>
        <div className="bg-white border border-orange-200 rounded-xl p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-bold text-orange-600 uppercase">Total Occurrences</h3>
            <Activity className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-[#13635d]">{patterns.reduce((s, p) => s + p.occurrences, 0)}</p>
          <p className="text-xs text-gray-500">Across all pattern types</p>
        </div>
        <div className="bg-white border border-green-200 rounded-xl p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-bold text-green-600 uppercase">Avg Prevention Rate</h3>
            <Target className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-[#13635d]">
            {patterns.length ? (patterns.reduce((s, p) => s + p.preventionRate, 0) / patterns.length).toFixed(1) : 0}%
          </p>
          <p className="text-xs text-gray-500">ML-powered detection</p>
        </div>
      </div>
    </div>
  )
}
