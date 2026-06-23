/**
 * Short News Cartoons — platform admin (list + composer)
 */

import { useCallback, useEffect, useState } from 'react'
import { useLayout } from '../DashboardLayout'
import { newsCartoonsApi } from '../../../lib/api/services/newsCartoonsApi'
import {
  normalizeCartoon,
  normalizeCartoonList,
  cartoonStatusColor,
} from '../../../lib/newsCartoons/normalize'
import { canAccessNewsCartoons } from '../../../lib/newsCartoons/platformRoles'
import CartoonComposer from './CartoonComposer'
import {
  Button,
  ConfirmDialog,
  Input,
  Spinner,
  StatCard,
  StatusBadge,
  toast,
} from '../../ui'
import { formatCartoonError } from '../../../lib/newsCartoons/cartoonErrors'

function CartoonCard({ item, onEdit, onDelete }) {
  return (
    <article className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
      <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm">
            No image
          </div>
        )}
        <div className="absolute top-2 left-2">
          <StatusBadge status={item.status} color={cartoonStatusColor(item.status)} />
        </div>
        {item.viewCount > 0 ? (
          <span className="absolute bottom-2 right-2 text-[10px] font-medium bg-black/60 text-white px-2 py-0.5 rounded-full">
            {item.viewCount} views
          </span>
        ) : null}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-slate-900 line-clamp-2 leading-snug">{item.title}</h3>
        {item.caption ? (
          <p className="text-xs text-slate-500 line-clamp-2">{item.caption}</p>
        ) : null}
        <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-400">
          {item.categoryName ? <span className="bg-slate-100 px-1.5 py-0.5 rounded">{item.categoryName}</span> : null}
          {item.languageCode ? <span className="uppercase">{item.languageCode}</span> : null}
          {item.seoSource ? <span>SEO: {item.seoSource}</span> : null}
        </div>
        <div className="flex gap-2 pt-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => onEdit(item)}>
            Edit
          </Button>
          <Button type="button" variant="outline-danger" size="sm" onClick={() => onDelete(item)}>
            Delete
          </Button>
        </div>
      </div>
    </article>
  )
}

export default function NewsCartoonsView() {
  const { user } = useLayout()
  const [mode, setMode] = useState('library')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [keywords, setKeywords] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: '1', limit: '50' }
      if (statusFilter) params.status = statusFilter
      if (keywords.trim()) params.keywords = keywords.trim()
      const raw = await newsCartoonsApi.list(params)
      setItems(normalizeCartoonList(raw).items)
    } catch (err) {
      toast.error(formatCartoonError(err, 'Failed to load cartoons'))
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, keywords])

  useEffect(() => {
    if (mode === 'library') load()
  }, [load, mode])

  if (!canAccessNewsCartoons(user)) {
    return (
      <div className="max-w-lg mx-auto mt-16 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <h2 className="text-lg font-semibold text-rose-900">Access denied</h2>
        <p className="text-sm text-rose-700 mt-2">
          Cartoon posting is for platform editorial roles only.
        </p>
      </div>
    )
  }

  const openCreate = () => {
    setEditing(null)
    setMode('compose')
  }

  const openEdit = (item) => {
    setEditing(item)
    setMode('compose')
  }

  const handleSaved = () => {
    setMode('library')
    setEditing(null)
    load()
  }

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return
    setDeleting(true)
    try {
      await newsCartoonsApi.remove(deleteTarget.id)
      toast.success('Cartoon deleted')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(formatCartoonError(err, 'Delete failed'))
    } finally {
      setDeleting(false)
    }
  }

  const published = items.filter((c) => c.status === 'PUBLISHED').length
  const drafts = items.filter((c) => c.status === 'DRAFT').length

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Short News · Platform
          </p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">News Cartoons</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Upload political cartoons, auto SEO, and publish to Short News feed.
          </p>
        </div>
        {mode === 'library' ? (
          <Button onClick={openCreate} className="shrink-0 shadow-sm">
            + Post cartoon
          </Button>
        ) : (
          <Button variant="outline" onClick={() => { setMode('library'); setEditing(null) }}>
            ← Back to library
          </Button>
        )}
      </header>

      {mode === 'library' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Total" value={items.length} />
            <StatCard title="Published" value={published} />
            <StatCard title="Drafts" value={drafts} />
          </div>

          <div className="flex flex-wrap gap-2">
            {['', 'PUBLISHED', 'DRAFT', 'ARCHIVED'].map((s) => (
              <button
                key={s || 'all'}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {s || 'All status'}
              </button>
            ))}
          </div>

          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              setKeywords(searchInput)
            }}
          >
            <Input
              placeholder="Search keywords, title…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="secondary">
              Search
            </Button>
            <Button type="button" variant="ghost" onClick={load} loading={loading}>
              Refresh
            </Button>
          </form>

          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : !items.length ? (
            <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 bg-white">
              <p className="text-4xl mb-3">🗞️</p>
              <p className="font-medium text-slate-800">No cartoons yet</p>
              <p className="text-sm text-slate-500 mt-1 mb-4">Post your first cartoon to Short News.</p>
              <Button onClick={openCreate}>Post cartoon</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((item) => (
                <CartoonCard
                  key={item.id}
                  item={item}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <CartoonComposer
          cartoon={editing}
          onSaved={handleSaved}
          onCancel={() => { setMode('library'); setEditing(null) }}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete cartoon?"
        message={`Remove "${deleteTarget?.title}" permanently?`}
        confirmText="Delete"
        loading={deleting}
        variant="danger"
      />
    </div>
  )
}
