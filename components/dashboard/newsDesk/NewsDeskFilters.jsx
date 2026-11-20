import { Button, Input, Select } from '../../ui'
import { EXTRACTION_STATUSES, PIPELINE_STATUS_FILTERS } from '../../../lib/newsDesk/statusBadges'
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
  const set = (key, value) => onChange({ ...filters, [key]: value })

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <label className="block lg:col-span-2">
          <span className="text-xs font-medium text-slate-600">Search</span>
          <div className="relative mt-1">
            <IconSearch className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={filters.q}
              onChange={(e) => set('q', e.target.value)}
              placeholder="Headline or article text"
              className="pl-9"
            />
          </div>
        </label>
        <div>
          <span className="text-xs font-medium text-slate-600">Extraction status</span>
          <Select
            className="mt-1"
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
          <Input
            type="date"
            className="mt-1"
            value={filters.fromDate}
            onChange={(e) => set('fromDate', e.target.value)}
          />
        </div>
        <div>
          <span className="text-xs font-medium text-slate-600">To date</span>
          <Input
            type="date"
            className="mt-1"
            value={filters.toDate}
            onChange={(e) => set('toDate', e.target.value)}
          />
        </div>
        <div>
          <span className="text-xs font-medium text-slate-600">Sort</span>
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
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={onApply} disabled={loading}>
          Apply filters
        </Button>
        <Button type="button" variant="outline" onClick={onReset} disabled={loading}>
          Reset
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => (onRefresh || onApply)()}
          disabled={loading}
        >
          <IconRefresh className="w-4 h-4 mr-1.5" />
          Refresh
        </Button>
      </div>
    </div>
  )
}