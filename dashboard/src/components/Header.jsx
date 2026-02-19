import { Bell, RefreshCw, Menu } from 'lucide-react'

export default function Header({ pageTitle, user, systemHealth, autoRefresh, setAutoRefresh, isOnline, onMenuToggle }) {
  return (
    <header className="h-14 bg-[#080e1c]/80 backdrop-blur-xl border-b border-[#162032] px-4 lg:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenuToggle} className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 text-slate-500 shrink-0">
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-base font-bold text-white truncate">{pageTitle}</h2>
        {systemHealth?.status === 'healthy' && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-400 uppercase tracking-wider shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Healthy
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Auto Refresh */}
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            autoRefresh
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-white/[0.03] text-slate-500 border border-[#162032] hover:text-slate-400'
          }`}
          title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} style={autoRefresh ? { animationDuration: '3s' } : {}} />
          <span className="hidden sm:inline">{autoRefresh ? 'Live' : 'Paused'}</span>
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#080e1c]" />
        </button>
      </div>
    </header>
  )
}
