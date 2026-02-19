import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { Download, FileText, TrendingUp, AlertCircle, DollarSign, MapPin, Clock, Users } from 'lucide-react'

export default function AnalysisReport() {
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('7d')

  useEffect(() => { fetchReportData() }, [selectedPeriod])

  const fetchReportData = async () => {
    try {
      const mockData = {
        summary: { totalTransactions: 45678, fraudDetected: 1234, fraudRate: 2.7, totalAmount: 12456789, blockedAmount: 456789, savedAmount: 456789, falsePositives: 45, falseNegatives: 12 },
        fraudByType: [
          { name: 'Account Takeover', value: 412, amount: 156789 },
          { name: 'Card Testing', value: 298, amount: 45678 },
          { name: 'Velocity Attack', value: 234, amount: 89012 },
          { name: 'Geographic Anomaly', value: 156, amount: 78901 },
          { name: 'Unusual Pattern', value: 134, amount: 86409 }
        ],
        fraudByTime: [
          { hour: '00:00', fraud: 23, legitimate: 1245 }, { hour: '03:00', fraud: 45, legitimate: 890 },
          { hour: '06:00', fraud: 12, legitimate: 1567 }, { hour: '09:00', fraud: 34, legitimate: 3456 },
          { hour: '12:00', fraud: 56, legitimate: 4567 }, { hour: '15:00', fraud: 78, legitimate: 5234 },
          { hour: '18:00', fraud: 67, legitimate: 4123 }, { hour: '21:00', fraud: 43, legitimate: 2890 }
        ],
        fraudByRegion: [
          { region: 'London', fraud: 456, legitimate: 12345 }, { region: 'Manchester', fraud: 234, legitimate: 6789 },
          { region: 'Birmingham', fraud: 189, legitimate: 5432 }, { region: 'Glasgow', fraud: 145, legitimate: 4321 },
          { region: 'International', fraud: 210, legitimate: 3456 }
        ],
        modelPerformance: [
          { metric: 'Precision', XGBoost: 98.5, Ensemble: 99.2, Industry: 95.0 },
          { metric: 'Recall', XGBoost: 96.8, Ensemble: 98.1, Industry: 92.0 },
          { metric: 'F1-Score', XGBoost: 97.6, Ensemble: 98.6, Industry: 93.5 },
          { metric: 'Accuracy', XGBoost: 99.9, Ensemble: 100.0, Industry: 97.0 },
          { metric: 'Speed', XGBoost: 95.0, Ensemble: 88.0, Industry: 85.0 }
        ],
        riskDistribution: [
          { level: 'Critical', count: 234, percentage: 19 }, { level: 'High', count: 412, percentage: 33 },
          { level: 'Medium', count: 345, percentage: 28 }, { level: 'Low', count: 156, percentage: 13 },
          { level: 'Minimal', count: 87, percentage: 7 }
        ],
        trends: [
          { date: 'Jan 28', fraud: 45, saved: 42, revenue: 1234 }, { date: 'Jan 29', fraud: 52, saved: 48, revenue: 1456 },
          { date: 'Jan 30', fraud: 61, saved: 55, revenue: 1567 }, { date: 'Jan 31', fraud: 48, saved: 43, revenue: 1389 },
          { date: 'Feb 1', fraud: 55, saved: 51, revenue: 1678 }, { date: 'Feb 2', fraud: 67, saved: 62, revenue: 1890 },
          { date: 'Feb 3', fraud: 58, saved: 54, revenue: 1734 }
        ]
      }
      setReportData(mockData)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching report data:', error)
      setLoading(false)
    }
  }

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#10b981', '#3b82f6', '#8b5cf6']

  const exportReport = () => {
    if (!reportData) return
    const content = `FRAUD DETECTION ANALYSIS REPORT\nGenerated: ${new Date().toLocaleString('en-GB')}\nPeriod: Last ${selectedPeriod === '7d' ? '7 Days' : selectedPeriod === '30d' ? '30 Days' : '24 Hours'}\n\nTotal Transactions: ${reportData.summary.totalTransactions.toLocaleString()}\nFraud Detected: ${reportData.summary.fraudDetected.toLocaleString()}\nFraud Rate: ${reportData.summary.fraudRate}%\nBlocked: £${reportData.summary.blockedAmount.toLocaleString()}\nSaved: £${reportData.summary.savedAmount.toLocaleString()}`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Fraud_Report_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    alert('✅ Report downloaded successfully!')
  }

  const tooltipStyle = { background: '#0d1829', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e2e8f0', padding: '8px 12px', fontSize: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }
  const tickStyle = { fontSize: 11, fill: '#64748b' }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-sm text-slate-500">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const summaryCards = [
    { label: 'Total Transactions', value: reportData.summary.totalTransactions.toLocaleString(), icon: Users, color: 'border-blue-500/20', textColor: 'text-blue-400' },
    { label: 'Fraud Detected', value: reportData.summary.fraudDetected.toLocaleString(), icon: AlertCircle, color: 'border-red-500/20', textColor: 'text-red-400' },
    { label: 'Amount Blocked', value: `£${(reportData.summary.blockedAmount / 1000).toFixed(0)}K`, icon: AlertCircle, color: 'border-orange-500/20', textColor: 'text-orange-400' },
    { label: 'Money Saved', value: `£${(reportData.summary.savedAmount / 1000).toFixed(0)}K`, icon: DollarSign, color: 'border-emerald-500/20', textColor: 'text-emerald-400' }
  ]

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/15 rounded-lg shrink-0"><FileText className="w-5 h-5 text-blue-400" /></div>
          <div>
            <h1 className="text-xl font-bold text-white">Analysis Report</h1>
            <p className="text-sm text-slate-500 mt-0.5">Fraud detection analytics</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-emerald-500/40 outline-none [&>option]:bg-[#0d1829] [&>option]:text-white">
            <option value="24h">24 Hours</option>
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
          </select>
          <button onClick={exportReport} className="flex items-center gap-1.5 px-3 py-2 bg-[#10b981] text-white rounded-lg text-sm font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className={`bg-[#0d1829] border rounded-xl p-3 ${s.color}`}>
              <div className="flex items-center justify-between mb-1"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">{s.label}</p><Icon className="w-4 h-4 text-slate-600" /></div>
              <p className={`text-xl font-bold ${s.textColor}`}>{s.value}</p>
            </div>
          )
        })}
      </div>

      {/* Charts Row 1: Pie + Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Fraud by Type - Pie */}
        <div className="bg-[#0d1829] border border-white/6 rounded-xl overflow-hidden">
          <div className="p-4 pb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-400" /><h3 className="text-sm font-bold text-white">Fraud by Type</h3></div>
          <div className="px-2 pb-2">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={reportData.fraudByType} cx="50%" cy="50%" outerRadius={85} dataKey="value" labelLine={false}>{reportData.fraudByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie>
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ fontWeight: 700, color: '#10b981' }} formatter={(value, name) => [`£${value.toLocaleString()}`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="px-4 pb-3 space-y-1">
            {reportData.fraudByType.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1">
                <span className="flex items-center gap-2 text-slate-400"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i] }} />{t.name}</span>
                <span className="font-bold text-white">£{t.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Distribution - Bar */}
        <div className="bg-[#0d1829] border border-white/6 rounded-xl overflow-hidden">
          <div className="p-4 pb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-orange-400" /><h3 className="text-sm font-bold text-white">Risk Score Distribution</h3></div>
          <div className="px-2 pb-2">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={reportData.riskDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="level" tick={tickStyle} />
                <YAxis tick={tickStyle} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#10b981' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 border-t border-white/5">
            <div className="p-3 border-r border-white/5 text-center"><p className="text-[10px] text-slate-600 font-semibold uppercase mb-0.5">Critical Risk</p><p className="text-xl font-bold text-red-400">{reportData.riskDistribution[0].count}</p></div>
            <div className="p-3 text-center"><p className="text-[10px] text-slate-600 font-semibold uppercase mb-0.5">Low Risk</p><p className="text-xl font-bold text-emerald-400">{reportData.riskDistribution[4].count}</p></div>
          </div>
        </div>
      </div>

      {/* Fraud Trends */}
      <div className="bg-[#0d1829] border border-white/6 rounded-xl overflow-hidden">
        <div className="p-4 pb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-400" /><h3 className="text-sm font-bold text-white">Fraud Detection Trends</h3></div>
        <div className="px-2 pb-3">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={reportData.trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={tickStyle} />
              <YAxis yAxisId="left" tick={tickStyle} />
              <YAxis yAxisId="right" orientation="right" tick={tickStyle} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#10b981' }} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} iconType="circle" iconSize={7} />
              <Line yAxisId="left" type="monotone" dataKey="fraud" stroke="#ef4444" strokeWidth={2} name="Detected" dot={{ r: 3 }} />
              <Line yAxisId="left" type="monotone" dataKey="saved" stroke="#10b981" strokeWidth={2} name="Prevented" dot={{ r: 3 }} />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue (£K)" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2: Hourly + Geographic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hourly Pattern */}
        <div className="bg-[#0d1829] border border-white/6 rounded-xl overflow-hidden">
          <div className="p-4 pb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-purple-400" /><h3 className="text-sm font-bold text-white">Fraud by Time of Day</h3></div>
          <div className="px-2 pb-3">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={reportData.fraudByTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={tickStyle} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#10b981' }} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} iconType="circle" iconSize={7} />
                <Bar dataKey="fraud" fill="#ef4444" name="Fraud" radius={[3, 3, 0, 0]} />
                <Bar dataKey="legitimate" fill="#10b981" name="Legit" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic */}
        <div className="bg-[#0d1829] border border-white/6 rounded-xl overflow-hidden">
          <div className="p-4 pb-2 flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-400" /><h3 className="text-sm font-bold text-white">Fraud by Region</h3></div>
          <div className="p-4 pt-2 space-y-3">
            {reportData.fraudByRegion.map((r, i) => {
              const total = r.fraud + r.legitimate
              const pct = (r.fraud / total * 100).toFixed(1)
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-white">{r.region}</span>
                    <span className="text-slate-500">{r.fraud} / {total.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-white/8 rounded-full overflow-hidden"><div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} /></div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Model Performance - Radar */}
      <div className="bg-[#0d1829] border border-white/6 rounded-xl overflow-hidden">
        <div className="p-4 pb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-indigo-400" /><h3 className="text-sm font-bold text-white">Model Performance Comparison</h3></div>
        <div className="px-2 pb-3">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={reportData.modelPerformance}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Radar name="XGBoost" dataKey="XGBoost" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
              <Radar name="Ensemble" dataKey="Ensemble" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
              <Radar name="Industry" dataKey="Industry" stroke="#64748b" fill="#64748b" fillOpacity={0.2} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} iconType="circle" iconSize={7} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="bg-[#0d1829] border border-white/6 rounded-xl overflow-hidden">
        <div className="p-4 pb-2"><h3 className="text-sm font-bold text-white">Model Accuracy Metrics</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/4">
                <th className="text-left py-2.5 px-4 text-white font-bold text-xs">Metric</th>
                <th className="text-center py-2.5 px-4 text-white font-bold text-xs">XGBoost</th>
                <th className="text-center py-2.5 px-4 text-white font-bold text-xs">Ensemble</th>
                <th className="text-center py-2.5 px-4 text-white font-bold text-xs">Industry</th>
                <th className="text-center py-2.5 px-4 text-white font-bold text-xs">Advantage</th>
              </tr>
            </thead>
            <tbody>
              {reportData.modelPerformance.map((m, i) => {
                const adv = ((m.Ensemble - m.Industry) / m.Industry * 100).toFixed(1)
                return (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/4">
                    <td className="py-2.5 px-4 font-semibold text-white">{m.metric}</td>
                    <td className="text-center py-2.5 px-4 text-slate-400">{m.XGBoost}%</td>
                    <td className="text-center py-2.5 px-4 font-bold text-white">{m.Ensemble}%</td>
                    <td className="text-center py-2.5 px-4 text-slate-500">{m.Industry}%</td>
                    <td className="text-center py-2.5 px-4"><span className={`font-bold ${adv > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{adv > 0 ? '+' : ''}{adv}%</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Notes */}
      <div className="bg-[#0d1829] border border-white/6 rounded-xl p-4">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-1.5"><FileText className="w-4 h-4" /> Report Notes</h3>
        <ul className="space-y-2 text-xs text-slate-400">
          <li className="flex items-start gap-2 bg-white/4 rounded-lg px-3 py-2.5"><span className="text-emerald-400 shrink-0 font-bold">•</span>Data from {selectedPeriod === '7d' ? 'the last 7 days' : selectedPeriod === '30d' ? 'the last 30 days' : 'the last 24 hours'}</li>
          <li className="flex items-start gap-2 bg-white/4 rounded-lg px-3 py-2.5"><span className="text-emerald-400 shrink-0 font-bold">•</span>All monetary values in GBP (£)</li>
          <li className="flex items-start gap-2 bg-white/4 rounded-lg px-3 py-2.5"><span className="text-emerald-400 shrink-0 font-bold">•</span>False positive rate: {((reportData.summary.falsePositives / reportData.summary.totalTransactions) * 100).toFixed(2)}%</li>
          <li className="flex items-start gap-2 bg-white/4 rounded-lg px-3 py-2.5"><span className="text-emerald-400 shrink-0 font-bold">•</span>Models are continuously retrained with new data</li>
        </ul>
      </div>
    </div>
  )
}
