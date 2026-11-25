export default function NewsDeskDetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-28 rounded-lg bg-slate-100 border border-slate-200" />
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-4">
          <div className="h-16 rounded-lg bg-slate-100 border border-slate-200" />
          <div className="h-96 rounded-lg bg-slate-100 border border-slate-200" />
        </div>
        <div className="lg:col-span-5 h-[28rem] rounded-lg bg-slate-100 border border-slate-200" />
      </div>
      <div className="h-48 rounded-lg bg-slate-100 border border-slate-200" />
    </div>
  )
}