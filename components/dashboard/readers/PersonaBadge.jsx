import { PERSONA_LABELS } from '../../../lib/readers/normalize'

const STYLES = {
  reader: 'bg-slate-100 text-slate-700 ring-slate-200',
  citizen_reporter: 'bg-sky-100 text-sky-800 ring-sky-200',
  govt_official: 'bg-indigo-100 text-indigo-800 ring-indigo-200',
  public_figure: 'bg-violet-100 text-violet-800 ring-violet-200',
}

export default function PersonaBadge({ persona, label }) {
  const text = label || PERSONA_LABELS[persona] || persona || '—'
  const style = STYLES[persona] || STYLES.reader
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ring-1 ${style}`}>
      {text}
    </span>
  )
}
