import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { metricsAPI, modelsAPI } from '../services/api'
import Header from './Header'
import StatsCard from './StatsCard'
import FraudChart from './FraudChart'
import ModelStatus from './ModelStatus'
import TransactionMonitor from './TransactionMonitor'
import FraudPatterns from './FraudPatterns'
import Recommendations from './Recommendations'
import AnalysisReport from './AnalysisReport'
import {
  LayoutDashboard, Network, Lightbulb, FileBarChart,
  Activity, ShieldAlert, CheckCircle, Clock,
  Shield, Menu, X, LogOut, ChevronRight,
  TrendingUp, Wifi, WifiOff
} from 'lucide-react'

export default function Dashboard({ user, onLogout }) {
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const isDemoMode = localStorage.getItem('token') === 'demo_offline_token'

  const DEMO_METRICS = { total_transactions: 48291, fraud_detected: 1247, approval_rate: 97.4, avg_response_time: 42 }
  const DEMO_HEALTH  = { status: 'healthy', total_predictions: 48291, fraud_rate: 0.026, uptime: '99.9%' }
  const DEMO_MODELS  = { models: [{ model_name: 'XGBoost Ensemble', version: '2.1.0', is_trained: true, is_active: true, feature_count: 47, metadata: { accuracy: 0.9947, auc_roc: 0.998 } }] }

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => isDemoMode ? Promise.resolve(DEMO_METRICS) : metricsAPI.getMetrics().then(r => r.data),
    refetchInterval: autoRefresh && !isDemoMode ? 5000 : false,
    retry: isDemoMode ? 0 : 2
  })
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => isDemoMode ? Promise.resolve(DEMO_HEALTH) : metricsAPI.getHealth().then(r => r.data),
    refetchInterval: autoRefresh && !isDemoMode ? 10000 : false,
    retry: isDemoMode ? 0 : 2
  })
  const { data: models } = useQuery({
    queryKey: ['models'],
    queryFn: () => isDemoMode ? Promise.resolve(DEMO_MODELS) : modelsAPI.listModels().then(r => r.data),
    refetchInterval: autoRefresh && !isDemoMode ? 30000 : false,
    retry: isDemoMode ? 0 : 2
  })

  const navItems = [
    { id: 'dashboard',       label: 'Dashboard',  icon: LayoutDashboard, desc: 'Overview & metrics' },
    { id: 'patterns',        label: 'Patterns',   icon: Network,         desc: 'Fraud pattern detection' },
    { id: 'recommendations', label: 'Insights',   icon: Lightbulb,       desc: 'AI recommendations' },
    { id: 'analysis',        label: 'Reports',    icon: FileBarChart,    desc: 'Analytics reports' },
  ]

  const pageTitles = {
    dashboard:       'Dashboard',
    patterns:        'Pattern Intelligence',
    recommendations: 'AI Insights',
    analysis:        'Analysis Reports',
  }

  const statCards = [
    { title: 'Total Transactions', value: metrics?.total_transactions?.toLocaleString() ?? '—', trend: '+12.5%', icon: Activity,    color: 'blue'   },
    { title: 'Fraud Detected',     value: metrics?.fraud_detected?.toLocaleString()     ?? '—', trend: '-8.3%',  icon: ShieldAlert, color: 'red'    },
    { title: 'Approval Rate',      value: metrics?.approval_rate  ? `${metrics.approval_rate}%` : '—', trend: '+2.1%', icon: CheckCircle, color: 'green'  },
    { title: 'Avg Response',       value: metrics?.avg_response_time ? `${metrics.avg_response_time}ms` : '—', trend: '-15ms', icon: Clock, color: 'purple' },
  ]

  const renderContent = () => {
    switch (currentPage) {
      case 'patterns':        return <FraudPatterns />
      case 'recommendations': return <Recommendations />
      case 'analysis':        return <AnalysisReport />
      default: return (
        <div className="space-y-5">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {metricsLoading
              ? Array(4).fill(null).map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)
              : statCards.map((card, i) => <StatsCard key={i} {...card} />)
            }
          </div>
          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <FraudChart metrics={metrics} systemHealth={health} />
            <ModelStatus models={models} systemHealth={health} />
          </div>
          {/* Transaction Monitor */}
          <TransactionMonitor systemHealth={health} />
        </div>
      )
    }
  }

  return (
    <div className="flex h-screen bg-[#070d1a] overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative z-50 lg:z-auto
        flex flex-col h-full w-60
        bg-[#060c17] border-r border-white/5
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        shrink-0
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="p-2 bg-[#10b981] rounded-lg shadow-md shadow-emerald-500/30 shrink-0">
            <Shield className="w-5 h-5 text-[#060c17]" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <span className="text-lg font-black text-white leading-none block">JED 24</span>
            <span className="text-[10px] text-emerald-400/60 font-semibold tracking-widest uppercase">Fraud Intel</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden p-1 text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* System health badge */}
        <div className="mx-4 mt-4 mb-2 flex items-center gap-2 bg-[#10b981]/8 border border-[#10b981]/20 rounded-lg px-3 py-2">
          {isOnline
            ? <><Wifi className="w-3.5 h-3.5 text-emerald-400" /><span className="text-xs text-emerald-400 font-semibold">System Online</span></>
            : <><WifiOff className="w-3.5 h-3.5 text-red-400" /><span className="text-xs text-red-400 font-semibold">Offline</span></>
          }
          {isDemoMode && <span className="ml-auto text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold uppercase">Demo</span>}
        </div>

        {/* Nav label */}
        <p className="px-5 pt-3 pb-1 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Navigation</p>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon
            const active = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => { setCurrentPage(item.id); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  active
                    ? 'bg-[#10b981]/15 text-emerald-400 border border-[#10b981]/25'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="truncate">{item.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-emerald-500/60" />}
              </button>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-white/5 p-3 space-y-1.5">
          {/* User */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/4">
            <div className="w-7 h-7 bg-linear-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shrink-0">
              <span className="text-xs font-black text-white">{(user?.username || 'A')[0].toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.username || 'Admin'}</p>
              <p className="text-[10px] text-slate-500 truncate capitalize">{user?.roles?.[0] || 'user'}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/8 transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <Header
          pageTitle={pageTitles[currentPage]}
          user={user}
          onLogout={onLogout}
          systemHealth={health}
          autoRefresh={autoRefresh}
          setAutoRefresh={setAutoRefresh}
          isOnline={isOnline}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
