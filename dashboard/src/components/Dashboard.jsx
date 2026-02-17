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
  Activity, ShieldAlert, CheckCircle, Clock, TrendingUp,
  Menu, X
} from 'lucide-react'
import './Dashboard.css'

export default function Dashboard({ user, onLogout }) {
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => metricsAPI.getMetrics().then(r => r.data),
    refetchInterval: autoRefresh ? 5000 : false,
    retry: 2
  })

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => metricsAPI.getHealth().then(r => r.data),
    refetchInterval: autoRefresh ? 10000 : false,
    retry: 2
  })

  const { data: models } = useQuery({
    queryKey: ['models'],
    queryFn: () => modelsAPI.listModels().then(r => r.data),
    refetchInterval: autoRefresh ? 30000 : false,
    retry: 2
  })

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patterns', label: 'Patterns', icon: Network },
    { id: 'recommendations', label: 'Insights', icon: Lightbulb },
    { id: 'analysis', label: 'Reports', icon: FileBarChart }
  ]

  const handleNav = (id) => {
    setCurrentPage(id)
    setMobileMenuOpen(false)
  }

  // Sub-page rendering
  if (currentPage === 'patterns') {
    return (
      <div className="dashboard-container">
        <NavBar navItems={navItems} currentPage={currentPage} handleNav={handleNav} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <FraudPatterns />
        </main>
      </div>
    )
  }

  if (currentPage === 'recommendations') {
    return (
      <div className="dashboard-container">
        <NavBar navItems={navItems} currentPage={currentPage} handleNav={handleNav} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Recommendations />
        </main>
      </div>
    )
  }

  if (currentPage === 'analysis') {
    return (
      <div className="dashboard-container">
        <NavBar navItems={navItems} currentPage={currentPage} handleNav={handleNav} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <AnalysisReport />
        </main>
      </div>
    )
  }

  // Stat card data
  const statCards = [
    {
      title: 'Total Transactions',
      value: metrics?.total_transactions?.toLocaleString() ?? '—',
      change: '+12.5%',
      icon: Activity,
      color: 'blue'
    },
    {
      title: 'Fraud Detected',
      value: metrics?.fraud_detected?.toLocaleString() ?? '—',
      change: '-8.3%',
      icon: ShieldAlert,
      color: 'red'
    },
    {
      title: 'Approval Rate',
      value: metrics?.approval_rate ? `${metrics.approval_rate}%` : '—',
      change: '+2.1%',
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Avg Response',
      value: metrics?.avg_response_time ? `${metrics.avg_response_time}ms` : '—',
      change: '-15ms',
      icon: Clock,
      color: 'purple'
    }
  ]

  return (
    <div className="dashboard-container">
      <NavBar navItems={navItems} currentPage={currentPage} handleNav={handleNav} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      <Header
        user={user}
        onLogout={onLogout}
        systemHealth={health}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        isOnline={isOnline}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {metricsLoading
            ? Array(4).fill(null).map((_, i) => (
                <div key={i} className="skeleton h-24 rounded-xl" />
              ))
            : statCards.map((card, i) => (
                <StatsCard key={i} {...card} />
              ))
          }
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <FraudChart metrics={metrics} />
          <ModelStatus models={models} systemHealth={health} />
        </div>

        {/* Transaction Monitor */}
        <TransactionMonitor systemHealth={health} />
      </main>
    </div>
  )
}

/* ---------- Inline NavBar component ---------- */
function NavBar({ navItems, currentPage, handleNav, mobileMenuOpen, setMobileMenuOpen }) {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[#51a97d]/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="p-1 bg-[#13635d] rounded-md">
              <TrendingUp className="w-4 h-4 text-[#92eca2]" />
            </div>
            <span className="text-sm font-bold text-[#13635d] tracking-tight">JED 24</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon
              const active = currentPage === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-[#13635d] text-white'
                      : 'text-[#13635d]/70 hover:bg-[#e9f1f1] hover:text-[#13635d]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              )
            })}
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-1.5 rounded-md text-[#13635d] hover:bg-[#e9f1f1]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-[#51a97d]/10 py-2 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon
              const active = currentPage === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-[#13635d] text-white'
                      : 'text-[#13635d]/70 hover:bg-[#e9f1f1]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}
