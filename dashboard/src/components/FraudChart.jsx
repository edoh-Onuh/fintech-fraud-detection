import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, BarChart3, Activity, Loader2 } from 'lucide-react'
import { analyticsAPI } from '../services/api'

export default function FraudChart({ metrics, systemHealth }) {
  const [chartType, setChartType] = useState('area')

  // Fetch live risk trends from the API
  const { data: chartData, isLoading, isError } = useQuery({
    queryKey: ['risk-trends'],
    queryFn: async () => {
      const r = await analyticsAPI.getRiskTrends(14)
      const raw = r.data
      if (Array.isArray(raw) && raw.length > 0) {
        return raw.map(d => ({
          time: d.date?.slice(5) || d.date,
          legitimate: Math.round((d.total_amount || 0) / 100),
          fraudulent: d.fraud_count || 0,
          score: (d.avg_risk_score || 0) / 100
        }))
      }
      return []
    },
    staleTime: 60000,
    refetchInterval: 60000,
  })

  const types = [
    { id: 'area', icon: Activity, label: 'Area' },
    { id: 'line', icon: TrendingUp, label: 'Line' },
    { id: 'bar', icon: BarChart3, label: 'Bar' }
  ]

  const tooltipStyle = {
    background: 'rgba(10, 22, 40, 0.95)',
    border: '1px solid rgba(22, 32, 50, 0.8)',
    borderRadius: '12px',
    color: '#e2e8f0',
    padding: '10px 14px',
    fontSize: '12px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
  }

  const tickStyle = { fontSize: 11, fill: '#64748b' }

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="time" tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="legitimate" stroke="#10b981" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="fraudulent" stroke="#ef4444" strokeWidth={2.5} dot={false} />
          </LineChart>
        )
      case 'bar':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="time" tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="legitimate" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.8} />
            <Bar dataKey="fraudulent" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.8} />
          </BarChart>
        )
      default:
        return (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="time" tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="legitimate" stroke="#10b981" strokeWidth={2} fill="url(#emeraldGrad)" />
            <Area type="monotone" dataKey="fraudulent" stroke="#ef4444" strokeWidth={2} fill="url(#redGrad)" />
          </AreaChart>
        )
    }
  }

  const safeData = chartData?.length ? chartData : []
  const peakHour = safeData.length ? safeData.reduce((max, d) => d.fraudulent > max.fraudulent ? d : max, safeData[0]) : { time: '—', fraudulent: 0 }
  const avgFraudRate = safeData.length ? (safeData.reduce((s, d) => s + d.fraudulent, 0) / safeData.reduce((s, d) => s + d.legitimate + d.fraudulent, 0) * 100).toFixed(2) : '0.00'

  return (
    <div className="bg-[#0a1628] border border-[#162032] rounded-2xl overflow-hidden hover:border-[#1e3050] transition-all duration-200 h-full flex flex-col">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-[#162032] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="w-[18px] h-[18px] text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Detection Trends</h3>
            <p className="text-[10px] text-slate-600 mt-0.5">Real-time transaction flow</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 bg-[#04070d] rounded-lg p-0.5 border border-[#162032]">
          {types.map(t => (
            <button
              key={t.id}
              onClick={() => setChartType(t.id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                chartType === t.id ? 'bg-[#10b981]/15 text-emerald-400' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              <t.icon className="w-3 h-3" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chart Body */}
      <div className="p-4 pb-2 flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-[260px]">
            <div className="text-center">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
              <p className="mt-2 text-xs text-slate-500">Loading trends...</p>
            </div>
          </div>
        ) : isError || !safeData.length ? (
          <div className="flex items-center justify-center h-[260px]">
            <div className="text-center">
              <Activity className="w-6 h-6 text-slate-600 mx-auto" />
              <p className="mt-2 text-xs text-slate-500">{isError ? 'Failed to load trend data' : 'No trend data available'}</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            {renderChart()}
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div className="px-5 py-2.5 flex items-center gap-6 text-xs border-t border-[#162032]">
        <span className="flex items-center gap-2 text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Legitimate</span>
        <span className="flex items-center gap-2 text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />Fraudulent</span>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-3 border-t border-[#162032] shrink-0">
        <div className="px-4 py-3 border-r border-[#162032] text-center">
          <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-0.5">Peak Hour</p>
          <p className="text-sm font-bold text-white">{peakHour.time}</p>
        </div>
        <div className="px-4 py-3 border-r border-[#162032] text-center">
          <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-0.5">Avg Fraud</p>
          <p className="text-sm font-bold text-amber-400">{avgFraudRate}%</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-0.5">Accuracy</p>
          <p className="text-sm font-bold text-emerald-400">{metrics?.accuracy || '—'}%</p>
        </div>
      </div>
    </div>
  )
}
