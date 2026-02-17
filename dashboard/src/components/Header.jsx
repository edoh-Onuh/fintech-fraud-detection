import { Shield, User, LogOut, RefreshCw, Zap, Activity, TrendingUp, Bell } from 'lucide-react'
import { useState } from 'react'

export default function Header({ user, onLogout, autoRefresh, setAutoRefresh }) {
  const [showNotifications, setShowNotifications] = useState(false)
  
  return (
    <header className="bg-gradient-to-r from-[#13635d] via-[#035351] to-[#13635d] shadow-lg">
      {/* Main bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="bg-gradient-to-br from-[#92eca2] to-[#51a97d] p-1.5 rounded-lg">
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
            <button
              className="relative p-1.5 bg-white/10 rounded-md hover:bg-white/15 transition-colors"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={15} className="text-[#92eca2]" />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">3</span>
            </button>

            {/* User */}
            <div className="flex items-center gap-1.5 bg-white/10 rounded-md px-2 py-1 cursor-pointer hover:bg-white/15 transition-colors">
              <div className="w-6 h-6 bg-gradient-to-br from-[#51a97d] to-[#92eca2] rounded-full flex items-center justify-center shrink-0">
                <User size={12} className="text-[#13635d]" strokeWidth={2.5} />
              </div>
              <span className="hidden sm:inline text-white text-xs font-medium truncate max-w-[80px]">{user?.username || 'Admin'}</span>
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
