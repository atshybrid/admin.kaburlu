export default function DashboardHeader({ user, onOpenNav }) {
  return (
    <div className="sticky top-0 z-20 h-16 flex items-center justify-between backdrop-blur bg-white/85 border-b border-gray-200">
      <div className="flex items-center gap-4 pl-1">
        <button className="md:hidden p-2 rounded-lg border bg-white hover:bg-gray-50 shadow-sm" onClick={onOpenNav} aria-label="Open navigation">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
        <div>
          <h1 className="text-lg md:text-xl font-semibold tracking-tight text-gray-800">Dashboard</h1>
          <p className="text-[11px] text-gray-500">Welcome back, {user?.name || 'Admin'}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 pr-2">
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border bg-gray-50">
          <span className="w-2 h-2 rounded-full bg-green-500 shadow" />
          <span className="text-xs text-gray-600">Healthy</span>
        </div>
        <button className="btn-base btn-outline-brand !px-3 !py-2 text-xs" aria-label="Create Article">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14"/></svg>
          New
        </button>
        <div className="w-10 h-10 rounded-full bg-brand/15 flex items-center justify-center text-brand font-semibold shadow-sm">{(user?.name||'A').slice(0,1)}</div>
      </div>
    </div>
  )
}
