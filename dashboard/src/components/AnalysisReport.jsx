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

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6']

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

  const tooltipStyle = { background: '#fff', border: '1px solid #51a97d', borderRadius: 8, fontSize: 12 }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#51a97d] border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const summaryCards = [
    { label: 'Total Transactions', value: reportData.summary.totalTransactions.toLocaleString(), icon: Users, color: 'border-blue-200' },
    { label: 'Fraud Detected', value: reportData.summary.fraudDetected.toLocaleString(), icon: AlertCircle, color: 'border-red-200' },
    { label: 'Amount Blocked', value: `£${(reportData.summary.blockedAmount / 1000).toFixed(0)}K`, icon: AlertCircle, color: 'border-orange-200' },
    { label: 'Money Saved', value: `£${(reportData.summary.savedAmount / 1000).toFixed(0)}K`, icon: DollarSign, color: 'border-green-200' }
  ]

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#13635d] rounded-lg shrink-0">
            <FileText className="w-5 h-5 text-[#92eca2]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-[#13635d] truncate">Analysis Report</h1>
            <p className="text-sm text-[#51a97d]">Fraud detection analytics</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-1.5 border border-[#51a97d]/25 rounded-md text-sm text-[#13635d] focus:border-[#51a97d] outline-none"
          >
            <option value="24h">24 Hours</option>
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
          </select>
          <button onClick={exportReport} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#13635d] text-white rounded-md text-sm font-bold hover:bg-[#035351] transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className={`bg-white border rounded-xl p-3 overflow-hidden ${s.color}`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{s.label}</p>
                <Icon className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-xl font-bold text-[#13635d]">{s.value}</p>
            </div>
          )
        })}
      </div>

      {/* Charts Row 1: Pie + Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Fraud by Type - Pie */}
        <div className="bg-white border border-[#51a97d]/20 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 pb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-bold text-[#13635d]">Fraud by Type</h3>
          </div>
          <div className="px-2 pb-2">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={reportData.fraudByType} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                  {reportData.fraudByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="px-4 pb-3 space-y-1">
            {reportData.fraudByType.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1">
                <span className="flex items-center gap-2 text-gray-600">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i] }} />
                  {t.name}
                </span>
                <span className="font-bold text-[#13635d]">£{t.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Distribution - Bar */}
        <div className="bg-white border border-[#51a97d]/20 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 pb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-bold text-[#13635d]">Risk Score Distribution</h3>
          </div>
          <div className="px-2 pb-2">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={reportData.riskDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9f1f1" />
                <XAxis dataKey="level" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 border-t border-[#51a97d]/10">
            <div className="p-3 border-r border-[#51a97d]/10 text-center">
              <p className="text-[10px] text-gray-500 font-semibold uppercase">Critical Risk</p>
              <p className="text-xl font-bold text-red-600">{reportData.riskDistribution[0].count}</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-[10px] text-gray-500 font-semibold uppercase">Low Risk</p>
              <p className="text-xl font-bold text-green-600">{reportData.riskDistribution[4].count}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fraud Trends */}
      <div className="bg-white border border-[#51a97d]/20 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 pb-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold text-[#13635d]">Fraud Detection Trends</h3>
        </div>
        <div className="px-2 pb-3">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={reportData.trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9f1f1" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line yAxisId="left" type="monotone" dataKey="fraud" stroke="#ef4444" strokeWidth={2} name="Detected" dot={{ r: 3 }} />
              <Line yAxisId="left" type="monotone" dataKey="saved" stroke="#22c55e" strokeWidth={2} name="Prevented" dot={{ r: 3 }} />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue (£K)" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2: Hourly + Geographic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hourly Pattern */}
        <div className="bg-white border border-[#51a97d]/20 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 pb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-bold text-[#13635d]">Fraud by Time of Day</h3>
          </div>
          <div className="px-2 pb-3">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={reportData.fraudByTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9f1f1" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="fraud" fill="#ef4444" name="Fraud" radius={[3, 3, 0, 0]} />
                <Bar dataKey="legitimate" fill="#22c55e" name="Legit" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic */}
        <div className="bg-white border border-[#51a97d]/20 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 pb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-500" />
            <h3 className="text-sm font-bold text-[#13635d]">Fraud by Region</h3>
          </div>
          <div className="p-4 pt-2 space-y-3">
            {reportData.fraudByRegion.map((r, i) => {
              const total = r.fraud + r.legitimate
              const pct = (r.fraud / total * 100).toFixed(1)
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-[#13635d]">{r.region}</span>
                    <span className="text-gray-500">{r.fraud} / {total.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Model Performance - Radar */}
      <div className="bg-white border border-[#51a97d]/20 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 pb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-[#13635d]">Model Performance Comparison</h3>
        </div>
        <div className="px-2 pb-3">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={reportData.modelPerformance}>
              <PolarGrid stroke="#e9f1f1" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar name="XGBoost" dataKey="XGBoost" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
              <Radar name="Ensemble" dataKey="Ensemble" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
              <Radar name="Industry" dataKey="Industry" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.2} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="bg-white border border-[#51a97d]/20 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 pb-2">
          <h3 className="text-sm font-bold text-[#13635d]">Model Accuracy Metrics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#51a97d]/15 bg-[#e9f1f1]/30">
                <th className="text-left py-2.5 px-4 text-[#13635d] font-bold text-xs">Metric</th>
                <th className="text-center py-2.5 px-4 text-[#13635d] font-bold text-xs">XGBoost</th>
                <th className="text-center py-2.5 px-4 text-[#13635d] font-bold text-xs">Ensemble</th>
                <th className="text-center py-2.5 px-4 text-[#13635d] font-bold text-xs">Industry</th>
                <th className="text-center py-2.5 px-4 text-[#13635d] font-bold text-xs">Advantage</th>
              </tr>
            </thead>
            <tbody>
              {reportData.modelPerformance.map((m, i) => {
                const adv = ((m.Ensemble - m.Industry) / m.Industry * 100).toFixed(1)
                return (
                  <tr key={i} className="border-b border-[#51a97d]/10 hover:bg-[#e9f1f1]/20">
                    <td className="py-2.5 px-4 font-semibold text-[#13635d]">{m.metric}</td>
                    <td className="text-center py-2.5 px-4 text-gray-600">{m.XGBoost}%</td>
                    <td className="text-center py-2.5 px-4 font-bold text-[#13635d]">{m.Ensemble}%</td>
                    <td className="text-center py-2.5 px-4 text-gray-500">{m.Industry}%</td>
                    <td className="text-center py-2.5 px-4">
                      <span className={`font-bold ${adv > 0 ? 'text-green-600' : 'text-red-500'}`}>{adv > 0 ? '+' : ''}{adv}%</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Notes */}
      <div className="bg-white border border-[#51a97d]/20 rounded-xl overflow-hidden shadow-sm p-4">
        <h3 className="text-sm font-bold text-[#13635d] mb-2 flex items-center gap-1.5">
          <FileText className="w-4 h-4" /> Report Notes
        </h3>
        <ul className="space-y-1.5 text-xs text-gray-600">
          <li className="flex items-start gap-2 bg-[#e9f1f1]/30 rounded-md px-3 py-2">
            <span className="text-[#51a97d] shrink-0">•</span>
            Data from {selectedPeriod === '7d' ? 'the last 7 days' : selectedPeriod === '30d' ? 'the last 30 days' : 'the last 24 hours'}
          </li>
          <li className="flex items-start gap-2 bg-[#e9f1f1]/30 rounded-md px-3 py-2">
            <span className="text-[#51a97d] shrink-0">•</span>
            All monetary values in GBP (£)
          </li>
          <li className="flex items-start gap-2 bg-[#e9f1f1]/30 rounded-md px-3 py-2">
            <span className="text-[#51a97d] shrink-0">•</span>
            False positive rate: {((reportData.summary.falsePositives / reportData.summary.totalTransactions) * 100).toFixed(2)}%
          </li>
          <li className="flex items-start gap-2 bg-[#e9f1f1]/30 rounded-md px-3 py-2">
            <span className="text-[#51a97d] shrink-0">•</span>
            Models are continuously retrained with new data
          </li>
        </ul>
      </div>
    </div>
  )
}
