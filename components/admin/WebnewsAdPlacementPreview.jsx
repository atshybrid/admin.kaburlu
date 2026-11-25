import { WEBNEWS_AD_PLACEMENTS } from '../../lib/webnewsAdPlacements'

/**
 * Classic homepage wireframe — highlights selected Webnews v2 placement.
 */
export default function WebnewsAdPlacementPreview({ selectedId, onSelect }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-900">Placement preview (Classic layout)</h4>
        <span className="text-xs text-slate-500">Orange = selected slot</span>
      </div>

      <div className="relative mx-auto max-w-md aspect-[3/4] rounded-lg border border-slate-300 bg-white shadow-inner overflow-hidden">
        {/* chrome mock */}
        <div className="h-[6%] bg-slate-100 border-b border-slate-200" />
        <div className="h-[8%] flex items-center justify-center border-b border-slate-200">
          <span className="text-[10px] font-semibold text-slate-400 tracking-wide">MASTHEAD</span>
        </div>
        <div className="h-[5%] bg-brand/10 border-b border-slate-200 flex items-center px-2 gap-1">
          {['వార్తలు', 'రాష్ట్రం', 'ఆర్టికల్'].map((l) => (
            <span key={l} className="text-[8px] text-slate-500">{l}</span>
          ))}
        </div>

        <div className="absolute top-[19%] left-[3%] w-[63%] h-[76%] border border-dashed border-slate-200 rounded-sm bg-slate-50/50">
          <div className="p-2 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-3 bg-slate-200/80 rounded w-full" />
            ))}
          </div>
        </div>
        <div className="absolute top-[19%] left-[70%] w-[27%] h-[76%] border border-dashed border-slate-200 rounded-sm" />

        {WEBNEWS_AD_PLACEMENTS.filter((p) => p.preview).map((p) => {
          const { top, left, width, height, label } = p.preview
          const active = selectedId === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect?.(p.id)}
              title={`${p.name} — ${p.desktop} desktop`}
              className={`absolute flex items-center justify-center text-[8px] font-bold transition-all border-2 rounded-sm ${
                active
                  ? 'bg-amber-400/90 border-amber-600 text-amber-950 z-10 shadow-md scale-[1.02]'
                  : 'bg-sky-100/80 border-sky-300 text-sky-800 hover:bg-sky-200/90 z-[1]'
              }`}
              style={{ top, left, width, height }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {selectedId && (
        <p className="mt-3 text-xs text-slate-600 text-center">
          {WEBNEWS_AD_PLACEMENTS.find((p) => p.id === selectedId)?.nameTe}
          {' · '}
          <span className="font-mono text-slate-800">{selectedId}</span>
        </p>
      )}
    </div>
  )
}