/**
 * Simple progress stepper for syndication desk
 */

export default function SyndicationStepper({ steps, currentStep, onStepClick }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        {steps.map((item, index) => {
          const done = index < currentStep
          const active = index === currentStep
          const clickable = index <= currentStep
          return (
            <div key={item.key} className="flex flex-1 items-center min-w-0">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(index)}
                className={`flex flex-col items-center gap-1 min-w-0 flex-1 ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold border-2 transition-colors ${
                    active
                      ? 'border-brand bg-brand text-white shadow-sm'
                      : done
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                  }`}
                >
                  {done ? '✓' : index + 1}
                </span>
                <span className={`text-xs font-semibold truncate w-full text-center ${active ? 'text-slate-900' : 'text-slate-500'}`}>
                  {item.label}
                </span>
                <span className="hidden sm:block text-[10px] text-slate-400 truncate w-full text-center">{item.hint}</span>
              </button>
              {index < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 sm:mx-2 rounded ${done ? 'bg-green-400' : 'bg-slate-200'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
