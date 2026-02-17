import { CheckCircle, AlertCircle, Circle, Cpu, Zap, Activity, TrendingUp } from 'lucide-react'

export default function ModelStatus({ models }) {
  const modelList = models?.models || []

  const getStatus = (model) => {
    if (!model.is_trained) return { icon: Circle, text: 'Not Trained', color: 'text-gray-400', bg: 'bg-gray-100', dot: 'bg-gray-400' }
    if (model.is_active) return { icon: CheckCircle, text: 'Active', color: 'text-[#51a97d]', bg: 'bg-[#92eca2]/15', dot: 'bg-[#92eca2]' }
    return { icon: AlertCircle, text: 'Standby', color: 'text-orange-500', bg: 'bg-orange-50', dot: 'bg-orange-400' }
  }

  return (
    <div className="bg-white border border-[#51a97d]/20 rounded-xl overflow-hidden shadow-sm min-w-0 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 bg-[#13635d] rounded-md shrink-0">
            <Cpu className="w-4 h-4 text-[#92eca2]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#13635d] truncate">Model Status</h3>
            <p className="text-[11px] text-[#51a97d]">{modelList.length} Models Registered</p>
          </div>
        </div>
        <span className="shrink-0 bg-[#13635d] text-[#92eca2] text-[10px] font-semibold px-2 py-0.5 rounded-md">
          {modelList.filter(m => m.is_active).length} Active
        </span>
      </div>

      {/* Model list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {modelList.length === 0 ? (
          <div className="text-center py-8 bg-[#e9f1f1]/40 rounded-lg border border-dashed border-[#51a97d]/20">
            <Cpu className="w-8 h-8 text-[#51a97d]/30 mx-auto mb-2" />
            <p className="text-[#13635d] font-semibold text-sm">No models registered</p>
            <p className="text-[#51a97d] text-xs mt-0.5">Train a model to get started</p>
          </div>
        ) : (
          modelList.map((model, index) => {
            const status = getStatus(model)
            const StatusIcon = status.icon
            return (
              <div key={index} className="bg-[#e9f1f1]/40 rounded-lg p-3 border border-[#51a97d]/10">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`shrink-0 p-1 rounded-md ${status.bg}`}>
                      <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-[#13635d] text-sm truncate">{model.model_name}</h4>
                      <span className="text-[10px] text-[#51a97d]">v{model.version}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    <span className={`text-[10px] font-semibold ${status.color}`}>{status.text}</span>
                  </div>
                </div>

                {model.metadata && (
                  <div className="grid grid-cols-3 gap-1.5">
                    {model.metadata.accuracy != null && (
                      <div className="bg-white rounded-md p-2 text-center border border-[#51a97d]/10">
                        <p className="text-[9px] text-[#51a97d] font-semibold uppercase mb-0.5">Accuracy</p>
                        <p className="text-sm font-bold text-[#13635d]">{(model.metadata.accuracy * 100).toFixed(1)}%</p>
                      </div>
                    )}
                    {model.metadata.auc_roc != null && (
                      <div className="bg-white rounded-md p-2 text-center border border-[#51a97d]/10">
                        <p className="text-[9px] text-[#51a97d] font-semibold uppercase mb-0.5">AUC-ROC</p>
                        <p className="text-sm font-bold text-[#13635d]">{model.metadata.auc_roc.toFixed(3)}</p>
                      </div>
                    )}
                    {model.feature_count > 0 && (
                      <div className="bg-white rounded-md p-2 text-center border border-[#51a97d]/10">
                        <p className="text-[9px] text-[#51a97d] font-semibold uppercase mb-0.5">Features</p>
                        <p className="text-sm font-bold text-[#13635d]">{model.feature_count}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
