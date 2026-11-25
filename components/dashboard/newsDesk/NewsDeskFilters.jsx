import { useState } from 'react'
import { Button, Input, Select } from '../../ui'
import { EXTRACTION_STATUSES, PIPELINE_STATUS_FILTERS } from '../../../lib/newsDesk/statusBadges'
import { countActiveFilters } from '../../../lib/newsDesk/formatDeskList'
import { IconRefresh, IconSearch } from '../../ui/icons'

export default function NewsDeskFilters({
  filters,
  onChange,
  categories = [],
  onApply,
  onReset,
  onRefresh,
  loading = false,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const set = (key, value) => onChange({ ...filters, [key]: value })
  const activeCount = countActiveFilters(filters)

  const onSearchKey = (e) => {
    if (e.key === 'Enter') onApply?.()
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 md:px-5 py-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block flex-1 min-w-[12rem]">
            <span className="text-xs font-semibold text-slate-600">Search submissions</span>
            <div className="relative mt-1.5">
              <IconSearch className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                value={filters.q}
                onChange={(e) => set('q', e.target.value)}
                onKeyDown={onSearchKey}
                placeholder="Headline or article text…"
                className="pl-9 bg-white"
              />
            </div>
          </label>
          <div className="w-full sm:w-44">
            <span className="text-xs font-semibold text-slate-600">Extraction</span>
            <Select
              className="mt-1.5 bg-white"
              value={filters.extractionStatus}
              onChange={(e) => set('extractionStatus', e.target.value)}
            >
              {EXTRACTION_STATUSES.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
            <Button type="button" onClick={onApply} disabled={loading}>
              Apply
              {activeCount > 0 ? (
                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-[10px]">{activeCount}</span>
              ) : null}
            </Button>
            <Button type="button" variant="outline" onClick={onReset} disabled={loading}>
              Reset
            </Button>
            <Button type="button" variant="ghost" onClick={() => (onRefresh || onApply)()} disabled={loading}>
              <IconRefresh className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <button
          type="button"
          className="mt-3 text-xs font-medium text-brand hover:underline"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          {showAdvanced ? 'Hide' : 'More'} filters (category, dates, pipeline, sort)
        </button>
      </div>

      {showAdvanced ? (
        <div className="p-4 md:p-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 bg-white">
          <div>
            <span className="text-xs font-medium text-slate-600">Pipeline status</span>
            <Select
              className="mt-1"
              value={filters.pipelineStatus}
              onChange={(e) => set('pipelineStatus', e.target.value)}
            >
              {PIPELINE_STATUS_FILTERS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-600">Category</span>
            <Select className="mt-1" value={filters.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat.categoryId} value={cat.categoryId}>
                  {cat.categoryName}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-600">From date</span>
            <Input type="date" className="mt-1" value={filters.fromDate} onChange={(e) => set('fromDate', e.target.value)} />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-600">To date</span>
            <Input type="date" className="mt-1" value={filters.toDate} onChange={(e) => set('toDate', e.target.value)} />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-600">Sort by</span>
            <Select className="mt-1" value={filters.sort} onChange={(e) => set('sort', e.target.value)}>
              <option value="createdAt">Created</option>
              <option value="updatedAt">Updated</option>
            </Select>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-600">Order</span>
            <Select className="mt-1" value={filters.order} onChange={(e) => set('order', e.target.value)}>
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </Select>
          </div>
        </div>
      ) : null}
    </div>
  )
}