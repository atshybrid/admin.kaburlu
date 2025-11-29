export default function StatCard({ title, value, delta, icon, description }) {
  const positive = delta && delta.startsWith('+')
  return (
    <div className="card-surface relative overflow-hidden p-4 md:p-5">
      <div className="absolute top-0 left-0 right-0 gradient-bar" />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider font-medium text-gray-500">{title}</div>
          <div className="text-2xl font-bold mt-1 tracking-tight text-gray-900">{value}</div>
        </div>
        <div className="w-11 h-11 rounded-lg bg-brand/10 text-brand flex items-center justify-center shadow-inner">
          {icon}
        </div>
      </div>
      {description && (
        <div className="mt-3 text-xs text-gray-500 leading-relaxed">{description}</div>
      )}
      {delta && (
        <div className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d={positive ? 'M5 12l5 5L19 7' : 'M19 12l-5-5L5 17'} /></svg>
          {delta} vs last 7d
        </div>
      )}
    </div>
  )
}
