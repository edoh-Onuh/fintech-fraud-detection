import { useState } from 'react'
import { Lightbulb, AlertTriangle, TrendingUp, Shield, Bell, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react'

const recommendations = [
  {
    id: 1, title: 'Enable Adaptive Authentication', priority: 'critical', category: 'Security',
    description: 'Implement step-up authentication for high-risk transactions based on real-time risk scoring.',
    impact: 'Could prevent an estimated £89,000 in monthly fraud losses',
    recommendation: 'Deploy multi-factor auth triggers for transactions scoring above 0.6 risk threshold.',
    confidence: 96, action: 'Deploy Now',
    icon: Shield, color: 'border-l-red-500'
  },
  {
    id: 2, title: 'Update Velocity Rules', priority: 'high', category: 'Rules',
    description: 'Current velocity thresholds are outdated. New attack patterns bypass existing limits.',
    impact: 'Address 34% of undetected card testing attacks',
    recommendation: 'Reduce per-card transaction limit from 10 to 5 per hour during off-peak hours.',
    confidence: 91, action: 'Update Rules',
    icon: TrendingUp, color: 'border-l-orange-500'
  },
  {
    id: 3, title: 'Geographic Risk Scoring Enhancement', priority: 'high', category: 'ML Model',
    description: 'Add travel pattern analysis to improve geographic anomaly detection accuracy.',
    impact: 'Improve geographic fraud detection by 23%',
    recommendation: 'Integrate flight booking data and historical travel patterns into the risk model.',
    confidence: 88, action: 'Train Model',
    icon: AlertTriangle, color: 'border-l-amber-500'
  },
  {
    id: 4, title: 'Real-Time Alert Optimization', priority: 'medium', category: 'Operations',
    description: 'Reduce false positive alerts to improve analyst efficiency and response times.',
    impact: 'Save 120 analyst hours per month',
    recommendation: 'Implement alert clustering and priority-based routing with 15-min SLA for critical alerts.',
    confidence: 84, action: 'Configure',
    icon: Bell, color: 'border-l-blue-500'
  }
]

const priorityBadge = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  low: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
}

const categoryBadge = {
  Security: 'bg-red-500/10 text-red-400 border-red-500/20',
  Rules: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'ML Model': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Operations: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
}

export default function Recommendations() {
  const [expanded, setExpanded] = useState(null)

  const stats = [
    { label: 'Active', value: recommendations.length, color: 'text-blue-400' },
    { label: 'Critical', value: recommendations.filter(r => r.priority === 'critical').length, color: 'text-red-400' },
    { label: 'Avg Confidence', value: (recommendations.reduce((s, r) => s + r.confidence, 0) / recommendations.length).toFixed(0) + '%', color: 'text-emerald-400' },
    { label: 'Est. Savings', value: '£89K+', color: 'text-amber-400' }
  ]

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
          <Lightbulb className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Recommendations</h1>
          <p className="text-xs text-slate-500 mt-0.5">AI-powered security improvements</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-[#0a1628] border border-[#162032] rounded-2xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recommendation Cards */}
      <div className="space-y-3">
        {recommendations.map(rec => {
          const isExpanded = expanded === rec.id
          const Icon = rec.icon
          const pb = priorityBadge[rec.priority]
          const cb = categoryBadge[rec.category]

          return (
            <div key={rec.id} className={`bg-[#0a1628] border border-[#162032] rounded-2xl overflow-hidden hover:border-[#1e3050] transition-all border-l-4 ${rec.color}`}>
              {/* Card Header  */}
              <button
                onClick={() => setExpanded(isExpanded ? null : rec.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-[#162032] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h3 className="text-sm font-bold text-white">{rec.title}</h3>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border ${pb}`}>{rec.priority}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border ${cb}`}>{rec.category}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{rec.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-14 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${rec.confidence}%` }} />
                    </div>
                    <span className="text-xs font-bold text-white">{rec.confidence}%</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-[#162032] p-5 bg-white/[0.01] space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-[#04070d]/50 border border-[#162032] rounded-xl p-3.5">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Impact</p>
                      <p className="text-xs text-slate-300">{rec.impact}</p>
                    </div>
                    <div className="bg-[#04070d]/50 border border-[#162032] rounded-xl p-3.5">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Recommendation</p>
                      <p className="text-xs text-slate-300">{rec.recommendation}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => alert(`Action: ${rec.action}\nID: ${rec.id}`)}
                      className="px-3.5 py-2 bg-linear-to-r from-[#10b981] to-[#059669] text-white rounded-xl text-xs font-bold hover:from-[#34d399] hover:to-[#10b981] transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> {rec.action}
                    </button>
                    <button
                      onClick={() => alert(`${rec.title}\n\n${rec.description}\n\nImpact: ${rec.impact}`)}
                      className="px-3.5 py-2 bg-white/[0.03] border border-[#162032] text-white rounded-xl text-xs font-bold hover:bg-white/[0.06] transition-all"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => { if (confirm(`Dismiss "${rec.title}"?`)) alert('Dismissed.') }}
                      className="px-3.5 py-2 bg-white/[0.03] border border-[#162032] text-slate-500 rounded-xl text-xs font-bold hover:bg-white/[0.06] transition-all"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
