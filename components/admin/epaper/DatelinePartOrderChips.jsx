import { DATELINE_PARTS, DEFAULT_CUSTOM_PART_ORDER, templateFromPartOrder } from '../../../lib/epaper/datelineSettingsForm'

function swapAt(order, index, dir) {
  const next = [...order]
  const j = index + dir
  if (j < 0 || j >= next.length) return order
  ;[next[index], next[j]] = [next[j], next[index]]
  return next
}

export default function DatelinePartOrderChips({ order = DEFAULT_CUSTOM_PART_ORDER, onChange, paperNativeName }) {
  const seq = order?.length === 3 ? order : [...DEFAULT_CUSTOM_PART_ORDER]

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-600">
        మొదటి · రెండవ · మూడవ — arrows తో క్రమం మార్చండి. Paper = tenant native name (read-only).
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {seq.map((partId, index) => {
          const meta = DATELINE_PARTS.find((p) => p.id === partId) || DATELINE_PARTS[0]
          const label =
            partId === 'paper' && paperNativeName
              ? `${meta.labelTe} · ${paperNativeName}`
              : meta.labelTe
          return (
            <div
              key={partId}
              className="flex min-w-[10rem] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold text-slate-900 truncate" title={label}>
                {label}
              </span>
              <button
                type="button"
                disabled={index === 0}
                onClick={() => onChange(swapAt(seq, index, -1))}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                aria-label="Move left"
              >
                ←
              </button>
              <button
                type="button"
                disabled={index === seq.length - 1}
                onClick={() => onChange(swapAt(seq, index, 1))}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                aria-label="Move right"
              >
                →
              </button>
            </div>
          )
        })}
      </div>
      <p className="text-[11px] font-mono text-slate-500 break-all">
        Template: {templateFromPartOrder(seq)}
      </p>
    </div>
  )
}