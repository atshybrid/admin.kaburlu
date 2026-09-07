/**
 * Platform Syndication — list + compose
 */

import { useCallback, useEffect, useState } from 'react'
import { useLayout } from '../DashboardLayout'
import syndicationApi from '../../../lib/api/services/syndicationApi'
import { canAccessSyndication } from '../../../lib/syndication/platformRoles'
import SyndicationDesk from './SyndicationDesk'
import { Button, Spinner, StatusBadge, toast } from '../../ui'

function statusColor(status) {
  if (status === 'PUBLISHED') return 'green'
  if (status === 'PREVIEW_READY') return 'blue'
  if (status === 'DRAFT') return 'gray'
  return 'gray'
}

const STATUS_FILTERS = [
  { value: '', label: 'All jobs' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PREVIEW_READY', label: 'Ready' },
  { value: 'PUBLISHED', label: 'Published' },
]

export default function SyndicationView() {
  const { user } = useLayout()
  const [mode, setMode] = useState('library')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [activeJobId, setActiveJobId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: 1, pageSize: 30 }
      if (statusFilter) params.status = statusFilter
      const response = await syndicationApi.listJobs(params)
      setItems(response?.items || [])
    } catch (error) {
      toast.error(error.message || 'Failed to load syndication jobs')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    if (mode === 'library') load()
  }, [load, mode])

  if (!canAccessSyndication(user)) {
    return (
      <div className="max-w-lg mx-auto mt-16 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <h2 className="text-lg font-semibold text-rose-900">Access denied</h2>
        <p className="text-sm text-rose-700 mt-2">
          Platform syndication is for desk editorial roles only.
        </p>
      </div>
    )
  }

  if (mode === 'compose') {
    return (
      <div className="space-y-5 max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">New syndication</h1>
            <p className="text-sm text-slate-500 mt-0.5">Paste → AI rewrite → publish to all newspapers</p>
          </div>
          <Button type="button" variant="outline" onClick={() => { setMode('library'); setActiveJobId('') }}>
            ← All jobs
          </Button>
        </div>
        <SyndicationDesk
          jobId={activeJobId}
          onJobChange={setActiveJobId}
          onPublished={() => setMode('library')}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Syndication</h1>
          <p className="text-sm text-slate-500 mt-0.5">One paste — multi-tenant print, web & short news</p>
        </div>
        <Button type="button" onClick={() => { setActiveJobId(''); setMode('compose') }}>
          + New job
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value || 'all'}
            type="button"
            onClick={() => setStatusFilter(value)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              statusFilter === value
                ? 'border-brand bg-brand text-white shadow-sm'
                : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center">
          <p className="text-slate-600 font-medium">No jobs yet</p>
          <p className="text-sm text-slate-500 mt-1">Start a new syndication job to publish across tenants</p>
          <Button type="button" className="mt-4" onClick={() => { setActiveJobId(''); setMode('compose') }}>
            Create first job
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <button
              key={item.jobId}
              type="button"
              onClick={() => { setActiveJobId(item.jobId); setMode('compose') }}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-brand/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <StatusBadge status={item.status} color={statusColor(item.status)} />
                <span className="text-xs text-slate-400">
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                </span>
              </div>
              <p className="mt-3 font-semibold text-slate-900 line-clamp-2">
                {item.masterPrint?.headline || item.category?.categoryName || 'Untitled job'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {item.tenants?.length || 0} tenant(s) · {item.category?.categoryName || 'Auto category'}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
