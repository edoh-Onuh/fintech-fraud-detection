import { useState, useEffect } from 'react'
import { AlertTriangle, TrendingUp, Shield, Users, Activity, CheckCircle, Lightbulb } from 'lucide-react'

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
        { id: 1, priority: 'critical', category: 'Account Security', title: 'Multiple Failed Login Attempts Detected',
          description: 'User account "user_789" has experienced 15 failed login attempts in the last hour from 3 different IP addresses.',
          impact: 'High - Potential account takeover attempt',
          recommendation: 'Implement immediate account lock and require multi-factor authentication reset.',
          action: 'Lock Account', confidence: 95 },
        { id: 2, priority: 'high', category: 'Transaction Pattern', title: 'Unusual Velocity Pattern Detected',
          description: '5 high-value transactions (>£10,000) executed within 10 minutes from the same account.',
          impact: 'Medium - Possible card testing or account compromise',
          recommendation: 'Apply temporary transaction limits and request additional verification for next transaction.',
          action: 'Apply Limits', confidence: 87 },
        { id: 3, priority: 'high', category: 'Geographic Anomaly', title: 'Impossible Travel Detected',
          description: 'Transaction in London at 10:00 AM followed by transaction in Tokyo at 10:15 AM (same day).',
          impact: 'High - Physical impossibility indicates credential theft',
          recommendation: 'Flag account for review and require device re-verification.',
          action: 'Flag for Review', confidence: 92 },
        { id: 4, priority: 'medium', category: 'Model Performance', title: 'Model Drift Detected',
          description: 'XGBoost model accuracy has decreased by 3.2% over the last 7 days.',
          impact: 'Medium - Reduced fraud detection effectiveness',
          recommendation: 'Retrain model with recent transaction data to adapt to new fraud patterns.',
          action: 'Retrain Model', confidence: 78 },
        { id: 5, priority: 'medium', category: 'System Optimization', title: 'Response Time Degradation',
          description: 'Average API response time increased from 45ms to 120ms over last 24 hours.',
          impact: 'Low - May affect user experience during peak hours',
          recommendation: 'Scale up API instances or optimize database queries.',
          action: 'Optimize System', confidence: 65 },
        { id: 6, priority: 'low', category: 'Compliance', title: 'GDPR Audit Log Review Due',
          description: 'Quarterly audit log review is scheduled for completion.',
          impact: 'Low - Regulatory compliance requirement',
          recommendation: 'Review and archive audit logs for Q4 2025.',
          action: 'Review Logs', confidence: 100 }
      ]
      setRecommendations(mockRecommendations)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching recommendations:', error)
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/metrics')
      const data = await response.json()
      setStats({ criticalAlerts: 3, preventedFraud: data.fraud_detected || 0, modelAccuracy: 99.94, avgResponseTime: data.avg_response_time || 0 })
    } catch {
      setStats({ criticalAlerts: 3, preventedFraud: 42, modelAccuracy: 99.94, avgResponseTime: 45 })
    }
  }

  const priorityStyles = {
    critical: { badge: 'bg-red-100 text-red-700 border-red-200', accent: 'border-l-red-500' },
    high: { badge: 'bg-orange-100 text-orange-700 border-orange-200', accent: 'border-l-orange-500' },
    medium: { badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', accent: 'border-l-yellow-500' },
    low: { badge: 'bg-blue-100 text-blue-700 border-blue-200', accent: 'border-l-blue-500' }
  }

  const priorityIcons = {
    critical: <AlertTriangle className="w-4 h-4 text-red-600" />,
    high: <TrendingUp className="w-4 h-4 text-orange-600" />,
    medium: <Activity className="w-4 h-4 text-yellow-600" />,
    low: <CheckCircle className="w-4 h-4 text-blue-600" />
  }

  const statCards = [
    { label: 'Critical Alerts', value: stats.criticalAlerts, color: 'border-red-200 bg-red-50', textColor: 'text-red-700', icon: <AlertTriangle className="w-5 h-5 text-red-500" /> },
    { label: 'Fraud Prevented', value: stats.preventedFraud, color: 'border-green-200 bg-green-50', textColor: 'text-green-700', icon: <Shield className="w-5 h-5 text-green-500" /> },
    { label: 'Model Accuracy', value: `${stats.modelAccuracy}%`, color: 'border-blue-200 bg-blue-50', textColor: 'text-blue-700', icon: <TrendingUp className="w-5 h-5 text-blue-500" /> },
    { label: 'Avg Response', value: `${stats.avgResponseTime}ms`, color: 'border-purple-200 bg-purple-50', textColor: 'text-purple-700', icon: <Activity className="w-5 h-5 text-purple-500" /> }
  ]

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#13635d] rounded-lg shrink-0">
          <Lightbulb className="w-5 h-5 text-[#92eca2]" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[#13635d] truncate">AI Intelligence Hub</h1>
          <p className="text-sm text-[#51a97d]">JED 24 Recommendation Engine</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s, i) => (
          <div key={i} className={`border rounded-xl p-3 overflow-hidden ${s.color}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-600">{s.label}</p>
              {s.icon}
            </div>
            <p className={`text-2xl font-bold ${s.textColor}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recommendations List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#13635d]">Active Recommendations</h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#51a97d] border-t-transparent mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Loading recommendations...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map(rec => {
              const ps = priorityStyles[rec.priority] || priorityStyles.low
              return (
                <div
                  key={rec.id}
                  className={`bg-white border border-[#51a97d]/15 rounded-xl overflow-hidden shadow-sm border-l-4 ${ps.accent}`}
                >
                  {/* Header */}
                  <div className="p-4 pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="p-1.5 bg-white border border-gray-200 rounded-lg shrink-0 shadow-sm">
                          {priorityIcons[rec.priority]}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${ps.badge}`}>{rec.category}</span>
                          </div>
                          <h3 className="text-sm font-bold text-[#13635d] truncate">{rec.title}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#51a97d] rounded-full" style={{ width: `${rec.confidence}%` }} />
                        </div>
                        <span className="text-sm font-bold text-[#13635d]">{rec.confidence}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-4 pb-3 space-y-2 text-xs text-gray-600">
                    <p>{rec.description}</p>
                    <p><span className="font-semibold text-[#13635d]">Impact:</span> {rec.impact}</p>
                    <p><span className="font-semibold text-[#13635d]">Recommendation:</span> {rec.recommendation}</p>
                  </div>

                  {/* Actions */}
                  <div className="px-4 pb-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => alert(`✅ Action: ${rec.action}\nID: ${rec.id}`)}
                      className="px-3 py-1.5 bg-[#13635d] text-white rounded-md text-xs font-bold hover:bg-[#035351] transition-colors"
                    >
                      {rec.action}
                    </button>
                    <button
                      onClick={() => alert(`📊 ${rec.title}\n\n${rec.description}\n\nImpact: ${rec.impact}`)}
                      className="px-3 py-1.5 border border-[#51a97d] text-[#13635d] rounded-md text-xs font-bold hover:bg-[#e9f1f1] transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => { if (confirm(`Dismiss "${rec.title}"?`)) alert('✓ Dismissed.') }}
                      className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-md text-xs font-bold hover:bg-gray-50 transition-colors"
                    >
                      Dismiss
                    </button>
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
