import { WEBNEWS_THEME_BINDINGS } from '../../lib/webnewsThemeBindings'

export default function WebnewsThemeBindingsPanel({ compact = false }) {
  return (
    <details className={`rounded-lg border border-slate-200 bg-slate-50/90 ${compact ? 'text-[11px]' : 'text-xs'} text-slate-700`}>
      <summary className="cursor-pointer font-semibold text-slate-900 px-3 py-2">
        Webnews v2 — ఏ setting ఎక్కడ apply అవుతుంది?
      </summary>
      <div className="px-3 pb-3 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-1.5 pr-2 font-medium">Admin</th>
              <th className="py-1.5 pr-2 font-medium">Saved JSON</th>
              <th className="py-1.5 font-medium">Consumer site</th>
            </tr>
          </thead>
          <tbody>
            {WEBNEWS_THEME_BINDINGS.map((row) => (
              <tr key={row.admin} className="border-b border-slate-100 last:border-0">
                <td className="py-1.5 pr-2 font-medium text-slate-800">{row.admin}</td>
                <td className="py-1.5 pr-2 font-mono text-[10px] text-slate-600">{row.saves}</td>
                <td className="py-1.5 text-slate-600">{row.webnews}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}