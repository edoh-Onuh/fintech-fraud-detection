import { Cpu, CheckCircle, AlertTriangle, XCircle, Zap } from 'lucide-react'

const statusConfig = {
  active: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Active' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Warning' },
  error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Error' }
}

export default function ModelStatus({ models }) {
  const modelsList = Array.isArray(models) ? models : []

  return (
    <div className="bg-[#0a1628] border border-[#162032] rounded-2xl overflow-hidden hover:border-[#1e3050] transition-all duration-200 h-full flex flex-col">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-[#162032] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Cpu className="w-[18px] h-[18px] text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Model Status</h3>
            <p className="text-[10px] text-slate-600 mt-0.5">ML pipeline health</p>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-400">{modelsList.filter(m => m.status === 'active').length}/{modelsList.length}</span>
      </div>

      {/* Models List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {modelsList.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-slate-600">No models loaded</div>
        ) : (
          modelsList.map((model, i) => {
            const cfg = statusConfig[model.status] || statusConfig.active
            const StatusIcon = cfg.icon
            return (
              <div key={i} className={`p-4 rounded-xl bg-[#04070d]/50 border ${cfg.border} transition-all hover:bg-[#04070d]/80`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-sm font-bold text-white truncate">{model.name}</span>
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider shrink-0 ${cfg.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>
                {/* Accuracy bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-linear-to-r from-indigo-500 to-emerald-400 transition-all duration-700" style={{ width: `${model.accuracy}%` }} />
                  </div>
                  <span className="text-xs font-bold text-white w-12 text-right">{model.accuracy}%</span>
                </div>
                <p className="text-[10px] text-slate-600 mt-2">Last prediction: {model.last_prediction}</p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
