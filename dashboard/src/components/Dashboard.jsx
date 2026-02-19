import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import './Dashboard.css'
import Header from './Header'
import StatsCard from './StatsCard'
import FraudChart from './FraudChart'
import ModelStatus from './ModelStatus'
import TransactionMonitor from './TransactionMonitor'
import FraudPatterns from './FraudPatterns'
import Recommendations from './Recommendations'
import AnalysisReport from './AnalysisReport'
import {
  LayoutDashboard, Network, Lightbulb, FileBarChart, Activity,
  ShieldAlert, CheckCircle, Clock, Shield, Menu, X, LogOut,
  ChevronRight, Wifi, WifiOff
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'patterns', label: 'Fraud Patterns', icon: Network },
  { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
  { id: 'analysis', label: 'Analysis Report', icon: FileBarChart }
]

const DEMO_METRICS = { total_transactions: 45678, fraud_detected: 1234, fraud_rate: 2.7, avg_response_time: 45, accuracy: 99.2, transactions_today: 3456, false_positive_rate: 0.8, detection_speed: '< 50ms' }
const DEMO_HEALTH = { status: 'healthy', uptime: '99.97%', active_models: 3, last_retrained: '2025-01-28' }
const DEMO_MODELS = [
  { name: 'XGBoost Primary', status: 'active', accuracy: 99.2, last_prediction: '2s ago' },
  { name: 'Neural Network', status: 'active', accuracy: 98.8, last_prediction: '5s ago' },
  { name: 'Ensemble Model', status: 'active', accuracy: 99.5, last_prediction: '1s ago' }
]

export default function Dashboard({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const { data: metrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: async () => { try { const r = await api.get('/metrics'); return r.data } catch { return DEMO_METRICS } },
    refetchInterval: autoRefresh ? 30000 : false,
    placeholderData: DEMO_METRICS
  })

  const { data: systemHealth } = useQuery({
    queryKey: ['health'],
    queryFn: async () => { try { const r = await api.get('/health'); return r.data } catch { return DEMO_HEALTH } },
    refetchInterval: autoRefresh ? 30000 : false,
    placeholderData: DEMO_HEALTH
  })

  const { data: models } = useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      try {
        const r = await api.get('/models')
        const data = r.data
        // Backend returns { count, models: [...] } — extract the array
        const list = Array.isArray(data) ? data : data?.models || data
        return Array.isArray(list) ? list : DEMO_MODELS
      } catch { return DEMO_MODELS }
    },
    refetchInterval: autoRefresh ? 60000 : false,
    placeholderData: DEMO_MODELS
  })

  const navigate = (page) => { setCurrentPage(page); setSidebarOpen(false) }
  const pageTitle = NAV_ITEMS.find(n => n.id === currentPage)?.label || 'Dashboard'

  const statsCards = [
    { title: 'Total Transactions', value: metrics?.total_transactions?.toLocaleString() || '—', icon: Activity, color: '#3b82f6', trend: '+12.5%', subtitle: 'vs last period' },
    { title: 'Fraud Detected', value: metrics?.fraud_detected?.toLocaleString() || '—', icon: ShieldAlert, color: '#ef4444', trend: '-8.3%', subtitle: 'fewer incidents' },
    { title: 'Approval Rate', value: `${metrics?.approval_rate ?? 97.4}%`, icon: CheckCircle, color: '#10b981', trend: '+0.3%', subtitle: 'transaction approval' },
    { title: 'Avg Response', value: `${metrics?.avg_response_time ?? 42}ms`, icon: Clock, color: '#f59e0b', trend: '-15ms', subtitle: 'faster than avg' }
  ]

  const renderContent = () => {
    switch (currentPage) {
      case 'patterns': return <div className="page-enter"><FraudPatterns /></div>
      case 'recommendations': return <div className="page-enter"><Recommendations /></div>
      case 'analysis': return <div className="page-enter"><AnalysisReport /></div>
      default:
        return (
          <div className="space-y-5 page-enter">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {statsCards.map((s, i) => <StatsCard key={i} {...s} />)}
            </div>

            {/* Charts + Models Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2">
                <FraudChart metrics={metrics} systemHealth={systemHealth} />
              </div>
              <div>
                <ModelStatus models={models} />
              </div>
            </div>

            {/* Transaction Monitor */}
            <TransactionMonitor systemHealth={systemHealth} />
          </div>
        )
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#04070d]">
      {/* Mobile Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ─── Sidebar ─── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#080e1c] border-r border-[#162032] flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Sidebar Header */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-[#162032] shrink-0">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#10b981] to-[#059669] flex items-center justify-center shadow-lg shadow-emerald-500/15">
            <Shield className="w-[18px] h-[18px] text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-white tracking-tight leading-none">JED 24</h1>
            <p className="text-[9px] text-emerald-400/70 font-semibold tracking-[0.2em] uppercase mt-0.5">Command Center</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto p-1.5 rounded-lg hover:bg-white/5 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const active = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  active
                    ? 'bg-[#10b981]/10 text-emerald-400 border border-[#10b981]/20'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <item.icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-emerald-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-emerald-400/50 shrink-0" />}
              </button>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#162032] space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02]">
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <WifiOff className="w-3.5 h-3.5 text-red-400 shrink-0" />}
            <span className="text-xs text-slate-500">{isOnline ? 'Connected' : 'Offline'}</span>
            <div className={`w-1.5 h-1.5 rounded-full ml-auto shrink-0 ${isOnline ? 'bg-emerald-400 animate-pulse-dot' : 'bg-red-400'}`} />
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all text-sm">
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="font-medium">Sign Out</span>
            <span className="ml-auto text-[10px] text-slate-700 truncate max-w-[80px]">{user?.username}</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          pageTitle={pageTitle}
          user={user}
          systemHealth={systemHealth}
          autoRefresh={autoRefresh}
          setAutoRefresh={setAutoRefresh}
          isOnline={isOnline}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-[1600px] mx-auto w-full">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  )
}
