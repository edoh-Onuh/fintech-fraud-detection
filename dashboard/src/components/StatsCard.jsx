import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatsCard({ title, value, icon, color = 'blue', trend, subtitle }) {
  const colors = {
    blue:   { iconBg: 'bg-[#13635d]', border: 'border-[#51a97d]/25', accent: 'bg-[#13635d]' },
    red:    { iconBg: 'bg-red-500',    border: 'border-red-200',       accent: 'bg-red-500' },
    green:  { iconBg: 'bg-[#51a97d]',  border: 'border-[#92eca2]/40', accent: 'bg-[#51a97d]' },
    purple: { iconBg: 'bg-[#035351]',  border: 'border-[#51a97d]/25', accent: 'bg-[#035351]' },
    orange: { iconBg: 'bg-[#51a97d]',  border: 'border-[#51a97d]/25', accent: 'bg-[#51a97d]' },
  }

  const c = colors[color] || colors.blue

  return (
    <div className={`relative bg-white ${c.border} border rounded-xl p-4 shadow-sm overflow-hidden`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 truncate">{title}</p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-2xl font-extrabold text-gray-900 leading-tight truncate">{value}</h3>
            {trend && (
              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                trend.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {trend.startsWith('+') ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {trend}
              </span>
            )}
          </div>
        </div>
        <div className={`shrink-0 p-2.5 ${c.iconBg} rounded-lg text-white`}>
          {icon}
        </div>
      </div>
      
      {subtitle && (
        <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100 truncate">{subtitle}</p>
      )}

      <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${c.accent} opacity-25`} />
    </div>
  )
}
