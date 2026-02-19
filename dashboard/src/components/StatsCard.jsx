import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatsCard({ title, value, icon: IconComponent, color = 'blue', trend, subtitle }) {
  const palette = {
    blue:   { iconBg: 'bg-blue-500/15',    iconColor: 'text-blue-400',    accent: 'from-blue-500',    border: 'border-blue-500/15' },
    red:    { iconBg: 'bg-red-500/15',     iconColor: 'text-red-400',     accent: 'from-red-500',     border: 'border-red-500/15'  },
    green:  { iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400', accent: 'from-emerald-500', border: 'border-emerald-500/15' },
    purple: { iconBg: 'bg-purple-500/15',  iconColor: 'text-purple-400',  accent: 'from-purple-500',  border: 'border-purple-500/15' },
    orange: { iconBg: 'bg-orange-500/15',  iconColor: 'text-orange-400',  accent: 'from-orange-500',  border: 'border-orange-500/15' },
  }

  const p = palette[color] || palette.blue
  const isPositive = trend?.startsWith('+')

  return (
    <div className={`relative bg-[#0d1829] border ${p.border} rounded-xl p-5 overflow-hidden group hover:border-white/10 transition-colors`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider leading-tight">{title}</p>
        <div className={`shrink-0 p-2.5 ${p.iconBg} rounded-xl`}>
          {IconComponent && <IconComponent className={`w-5 h-5 ${p.iconColor}`} />}
        </div>
      </div>

      {/* Value */}
      <div className="flex items-end justify-between gap-2">
        <h3 className="text-3xl font-black text-white leading-none tracking-tight">{value}</h3>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap mb-0.5 ${
            isPositive ? 'bg-emerald-500/12 text-emerald-400' : 'bg-red-500/12 text-red-400'
          }`}>
            {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trend}
          </span>
        )}
      </div>

      {subtitle && <p className="text-[11px] text-slate-600 mt-2 truncate">{subtitle}</p>}

      {/* Bottom accent */}
      <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-linear-to-r ${p.accent} to-transparent opacity-40`} />
    </div>
  )
}
