import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatsCard({ title, value, icon: Icon, color, trend, subtitle }) {
  const isUp = trend?.startsWith('+')

  return (
    <div className="bg-[#0a1628] border border-[#162032] rounded-2xl p-5 hover:border-[#1e3050] transition-all duration-200 card-lift">
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg ${
            isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
          }`}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </span>
        )}
      </div>
      <p className="text-[26px] font-bold text-white mb-1 tracking-tight leading-none">{value}</p>
      <p className="text-xs font-medium text-slate-500 mt-2">{title}</p>
      {subtitle && <p className="text-[10px] text-slate-700 mt-0.5">{subtitle}</p>}
    </div>
  )
}
