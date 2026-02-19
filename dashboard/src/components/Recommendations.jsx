import { useState, useEffect } from 'react'
import { AlertTriangle, TrendingUp, Shield, Activity, CheckCircle, Lightbulb } from 'lucide-react'

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ criticalAlerts: 0, preventedFraud: 0, modelAccuracy: 0, avgResponseTime: 0 })

  useEffect(() => {
    fetchRecommendations()
    fetchStats()
  }, [])

  const fetchRecommendations = async () => {
    try {
      const mockRecommendations = [
        { id: 1, priority: 'critical', category: 'Account Security', title: 'Multiple Failed Login Attempts Detected', description: 'User account "user_789" has experienced 15 failed login attempts in the last hour from 3 different IP addresses.', impact: 'High - Potential account takeover attempt', recommendation: 'Implement immediate account lock and require multi-factor authentication reset.', action: 'Lock Account', confidence: 95 },
        { id: 2, priority: 'high', category: 'Transaction Pattern', title: 'Unusual Velocity Pattern Detected', description: '5 high-value transactions (>£10,000) executed within 10 minutes from the same account.', impact: 'Medium - Possible card testing or account compromise', recommendation: 'Apply temporary transaction limits and request additional verification for next transaction.', action: 'Apply Limits', confidence: 87 },
        { id: 3, priority: 'high', category: 'Geographic Anomaly', title: 'Impossible Travel Detected', description: 'Transaction in London at 10:00 AM followed by transaction in Tokyo at 10:15 AM (same day).', impact: 'High - Physical impossibility indicates credential theft', recommendation: 'Flag account for review and require device re-verification.', action: 'Flag for Review', confidence: 92 },
        { id: 4, priority: 'medium', category: 'Model Performance', title: 'Model Drift Detected', description: 'XGBoost model accuracy has decreased by 3.2% over the last 7 days.', impact: 'Medium - Reduced fraud detection effectiveness', recommendation: 'Retrain model with recent transaction data to adapt to new fraud patterns.', action: 'Retrain Model', confidence: 78 },
        { id: 5, priority: 'medium', category: 'System Optimization', title: 'Response Time Degradation', description: 'Average API response time increased from 45ms to 120ms over last 24 hours.', impact: 'Low - May affect user experience during peak hours', recommendation: 'Scale up API instances or optimize database queries.', action: 'Optimize System', confidence: 65 },
        { id: 6, priority: 'low', category: 'Compliance', title: 'GDPR Audit Log Review Due', description: 'Quarterly audit log review is scheduled for completion.', impact: 'Low - Regulatory compliance requirement', recommendation: 'Review and archive audit logs for Q4 2025.', action: 'Review Logs', confidence: 100 }
      ]
      setRecommendations(mockRecommendations)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching recommendations:', error)
      setLoading(false)
    }
  }

  const fetchStats = () => {
    setStats({ criticalAlerts: 3, preventedFraud: 42, modelAccuracy: 99.94, avgResponseTime: 45 })
  }

  const priorityConfig = {
    critical: { badge: 'bg-red-500/15 text-red-400 border-red-500/30', accent: 'border-l-red-400' },
    high: { badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30', accent: 'border-l-orange-400' },
    medium: { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30', accent: 'border-l-amber-400' },
    low: { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30', accent: 'border-l-blue-400' },
  }

  const priorityIcons = {
    critical: <AlertTriangle className="w-4 h-4 text-red-400" />,
    high: <TrendingUp className="w-4 h-4 text-orange-400" />,
    medium: <Activity className="w-4 h-4 text-amber-400" />,
    low: <CheckCircle className="w-4 h-4 text-blue-400" />,
  }

  const statCards = [
    { label: 'Critical Alerts', value: stats.criticalAlerts, borderColor: 'border-red-500/20', textColor: 'text-red-400', icon: <AlertTriangle className="w-5 h-5 text-red-400" /> },
    { label: 'Fraud Prevented', value: stats.preventedFraud, borderColor: 'border-emerald-500/20', textColor: 'text-emerald-400', icon: <Shield className="w-5 h-5 text-emerald-400" /> },
    { label: 'Model Accuracy', value: `${stats.modelAccuracy}%`, borderColor: 'border-blue-500/20', textColor: 'text-blue-400', icon: <TrendingUp className="w-5 h-5 text-blue-400" /> },
    { label: 'Avg Response', value: `${stats.avgResponseTime}ms`, borderColor: 'border-purple-500/20', textColor: 'text-purple-400', icon: <Activity className="w-5 h-5 text-purple-400" /> },
  ]

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/15 rounded-lg shrink-0"><Lightbulb className="w-5 h-5 text-amber-400" /></div>
        <div>
          <h1 className="text-xl font-bold text-white">AI Intelligence Hub</h1>
          <p className="text-sm text-slate-500 mt-0.5">JED 24 Recommendation Engine</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s, i) => (
          <div key={i} className={`bg-[#0d1829] border rounded-xl p-3 ${s.borderColor}`}>
            <div className="flex items-center justify-between mb-1"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">{s.label}</p>{s.icon}</div>
            <p className={`text-2xl font-bold ${s.textColor}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div>
        <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-bold text-white">Active Recommendations</h2></div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-sm text-slate-500">Loading recommendations...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map(rec => {
              const pc = priorityConfig[rec.priority] || priorityConfig.low
              return (
                <div key={rec.id} className={`bg-[#0d1829] border border-white/6 rounded-xl overflow-hidden border-l-4 ${pc.accent}`}>
                  {/* Header */}
                  <div className="p-4 pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="p-1.5 bg-white/5 border border-white/8 rounded-lg shrink-0 shadow-sm">{priorityIcons[rec.priority]}</div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`px-1.5 py-0.5 rounded-lg text-[9px] font-bold uppercase border ${pc.badge}`}>{rec.category}</span>
                          </div>
                          <h3 className="text-sm font-bold text-white truncate">{rec.title}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${rec.confidence}%` }} />
                        </div>
                        <span className="text-sm font-bold text-white">{rec.confidence}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-4 pb-3 space-y-2 text-xs text-slate-400">
                    <p>{rec.description}</p>
                    <p><span className="font-semibold text-white">Impact:</span> {rec.impact}</p>
                    <p><span className="font-semibold text-white">Recommendation:</span> {rec.recommendation}</p>
                  </div>

                  {/* Actions */}
                  <div className="px-4 pb-3 flex flex-wrap gap-2">
                    <button onClick={() => alert(`✅ Action: ${rec.action}\nID: ${rec.id}`)} className="px-3 py-2 bg-[#10b981] text-white rounded-lg text-xs font-bold hover:bg-emerald-400 transition-all">{rec.action}</button>
                    <button onClick={() => alert(`📊 ${rec.title}\n\n${rec.description}\n\nImpact: ${rec.impact}`)} className="px-3 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-xs font-bold hover:bg-white/8 transition-all">View Details</button>
                    <button onClick={() => { if (confirm(`Dismiss "${rec.title}"?`)) alert('✓ Dismissed.') }} className="px-3 py-2 bg-white/5 border border-white/10 text-slate-400 rounded-lg text-xs font-bold hover:bg-white/8 transition-all">Dismiss</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
