import { Shield, User, LogOut, RefreshCw, Zap, Activity, TrendingUp, Bell } from 'lucide-react'
import { useState } from 'react'

export default function Header({ user, onLogout, autoRefresh, setAutoRefresh }) {
  const [showNotifications, setShowNotifications] = useState(false)
  
  return (
    <header className="bg-linear-to-r from-[#13635d] via-[#035351] to-[#13635d] shadow-lg">
      {/* Main bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="bg-linear-to-br from-[#92eca2] to-[#51a97d] p-1.5 rounded-lg">
              <Zap className="text-[#13635d] w-5 h-5" strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white leading-none">JED 24</h1>
              <p className="text-[10px] text-[#92eca2]/80 font-medium hidden sm:block">Enterprise Fraud Intelligence</p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* System status — desktop */}
            <div className="hidden md:flex items-center gap-1.5 bg-white/10 rounded-md px-2.5 py-1 text-xs">
              <Activity className="w-3 h-3 text-[#92eca2]" />
              <span className="text-[#92eca2] font-medium">Active</span>
              <span className="text-white/40">99.9%</span>
            </div>

            {/* Auto-refresh */}
            <button
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                autoRefresh
                  ? 'bg-[#51a97d] text-white'
                  : 'bg-white/10 text-[#92eca2] hover:bg-white/15'
              }`}
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
            >
              <RefreshCw size={13} className={autoRefresh ? 'animate-spin' : ''} style={{ animationDuration: '2s' }} />
              <span className="hidden sm:inline">{autoRefresh ? 'Auto' : 'Manual'}</span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                className="relative p-1.5 bg-white/10 rounded-md hover:bg-white/15 transition-colors"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={15} className="text-[#92eca2]" />
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">3</span>
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-[#51a97d]/20 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-3 border-b border-[#51a97d]/10 bg-[#e9f1f1]/40 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#13635d]">Notifications</h3>
                    <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">3 new</span>
                  </div>
                  <div className="divide-y divide-[#51a97d]/10">
                    {[
                      { title: 'Velocity spike detected', sub: 'Account user_789 — critical', time: '2m ago', dot: 'bg-red-500' },
                      { title: 'Model accuracy alert', sub: 'XGBoost accuracy dropped 3.2%', time: '15m ago', dot: 'bg-orange-400' },
                      { title: 'Daily report ready', sub: 'Q1 fraud summary available', time: '1h ago', dot: 'bg-blue-400' },
                    ].map((n, i) => (
                      <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-[#e9f1f1]/30 cursor-pointer transition-colors">
                        <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${n.dot}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#13635d] truncate">{n.title}</p>
                          <p className="text-[10px] text-gray-500 truncate">{n.sub}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-[#51a97d]/10 text-center">
                    <button
                      className="inline-flex items-center justify-center text-xs font-semibold text-[#51a97d] hover:text-[#13635d] transition-colors py-1 px-3"
                      onClick={() => setShowNotifications(false)}
                    >
                      Dismiss all
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User */}
            <div className="flex items-center gap-1.5 bg-white/10 rounded-md px-2 py-1 cursor-pointer hover:bg-white/15 transition-colors">
              <div className="w-6 h-6 bg-linear-to-br from-[#51a97d] to-[#92eca2] rounded-full flex items-center justify-center shrink-0">
                <User size={12} className="text-[#13635d]" strokeWidth={2.5} />
              </div>
              <span className="hidden sm:inline text-white text-xs font-medium truncate max-w-20">{user?.username || 'Admin'}</span>
            </div>

            {/* Logout */}
            <button
              className="p-1.5 bg-red-500/20 rounded-md hover:bg-red-500/30 transition-colors"
              onClick={onLogout}
              title="Logout"
            >
              <LogOut size={15} className="text-red-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom stats — desktop */}
      <div className="hidden lg:block border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-7 text-xs">
            <div className="flex items-center gap-5">
              <span className="text-[#92eca2]/70">Detection Rate: <b className="text-white">99.94%</b></span>
              <span className="text-[#92eca2]/70">Active Models: <b className="text-white">2</b></span>
              <span className="text-[#92eca2]/70">Threats Blocked: <b className="text-white">1,247</b></span>
            </div>
            <span className="text-[#92eca2]/40">Updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
