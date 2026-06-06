/**
 * Compact workflow stepper — DJFW production order
 */

const STEPS = [
  { key: 'queue', label: 'Members & KYC' },
  { key: 'surveys', label: 'Surveys' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'elections', label: 'Elections' },
  { key: 'committee', label: 'Committee' },
]

export default function DjfwWorkflowBanner({ activeTab, onGoTo }) {
  const activeIdx = STEPS.findIndex((s) => s.key === activeTab)

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
      <span className="font-medium text-slate-400 mr-1">Workflow</span>
      {STEPS.map((s, i) => {
        const active = s.key === activeTab
        return (
          <span key={s.key} className="inline-flex items-center gap-2">
            {i > 0 ? <span className="text-slate-300">→</span> : null}
            <button
              type="button"
              onClick={() => onGoTo?.(s.key)}
              className={`px-2 py-1 rounded-md transition-colors ${
                active
                  ? 'bg-slate-900 text-white font-medium'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              {s.label}
            </button>
          </span>
        )
      })}
      {activeIdx >= 0 ? (
        <span className="ml-2 text-slate-400 hidden sm:inline">
          Step {activeIdx + 1} of {STEPS.length}
        </span>
      ) : null}
    </div>
  )
}
