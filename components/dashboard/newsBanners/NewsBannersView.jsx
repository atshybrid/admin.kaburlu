/**
 * News Banners — Super Admin carousel management
 */

import { useState, useEffect, useCallback } from 'react'
import { newsBannersApi } from '../../../lib/api/services/newsBannersApi'
import {
  normalizeBanner,
  normalizeBannerList,
  bannerStatusColor,
  isVideoBanner,
} from '../../../lib/newsBanners/normalize'
import BannerFormModal from './BannerFormModal'
import {
  Button,
  ConfirmDialog,
  Input,
  Spinner,
  StatCard,
  StatusBadge,
  toast,
} from '../../ui'
import { ApiError } from '../../../lib/api/client'

function formatErr(err, fb) {
  if (err instanceof ApiError) return err.data?.code ? `${err.message} (${err.data.code})` : err.message
  return err?.message || fb
}

function BannerPreview({ banner }) {
  const video = isVideoBanner(banner)
  const poster = banner.thumbnailUrl || undefined

  if (!banner.mediaUrl) {
    return (
      <div className="aspect-[16/7] bg-gray-100 flex items-center justify-center text-gray-400 text-sm rounded-t-xl">
        No media
      </div>
    )
  }

  if (video) {
    return (
      <div className="aspect-[16/7] bg-black rounded-t-xl overflow-hidden relative">
        <video
          src={banner.mediaUrl}
          poster={poster}
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
          onMouseLeave={(e) => {
            e.currentTarget.pause()
            e.currentTarget.currentTime = 0
          }}
        />
        <span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase tracking-wide bg-black/70 text-white px-2 py-0.5 rounded">
          MP4
        </span>
      </div>
    )
  }

  return (
    <div className="aspect-[16/7] bg-gray-50 rounded-t-xl overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={banner.mediaUrl} alt="" className="w-full h-full object-cover" />
    </div>
  )
}

export default function NewsBannersView() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      const raw = await newsBannersApi.list(params)
      let list = normalizeBannerList(raw).items
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        list = list.filter(
          (b) =>
            b.title?.toLowerCase().includes(q) ||
            b.subtitle?.toLowerCase().includes(q)
        )
      }
      setItems(list)
    } catch (err) {
      toast.error(formatErr(err, 'Failed to load banners'))
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (banner) => {
    setEditing(banner)
    setFormOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return
    setDeleting(true)
    try {
      await newsBannersApi.remove(deleteTarget.id)
      toast.success('Banner deleted')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(formatErr(err, 'Delete failed'))
    } finally {
      setDeleting(false)
    }
  }

  const activeCount = items.filter((b) => b.status === 'ACTIVE').length
  const videoCount = items.filter((b) => isVideoBanner(b)).length

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">News Banners</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            App home carousel — images (WebP) &amp; videos (MP4) on Bunny CDN.
            Upload first via <code className="text-xs bg-gray-100 px-1 rounded">/admin/news-banners/upload</code>, then create.
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0 shadow-sm">
          + New banner
        </Button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total banners" value={items.length} />
        <StatCard title="Active" value={activeCount} />
        <StatCard title="Video banners" value={videoCount} />
      </div>

      <div className="flex flex-wrap gap-2">
        {['', 'ACTIVE', 'DRAFT', 'INACTIVE'].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-600'
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
          load()
        }}
      >
        <Input
          placeholder="Search title or subtitle…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-2xl bg-gray-50/50">
          <p className="text-gray-600 font-medium">No banners yet</p>
          <p className="text-sm text-gray-500 mt-1">Upload image or MP4, then create your first carousel item</p>
          <Button className="mt-4" size="sm" onClick={openCreate}>
            Create banner
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((banner) => (
            <article
              key={banner.id}
              className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <BannerPreview banner={banner} />
              <div className="p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 truncate">{banner.title}</h3>
                    {banner.subtitle ? (
                      <p className="text-sm text-gray-500 truncate">{banner.subtitle}</p>
                    ) : null}
                  </div>
                  <StatusBadge label={banner.status} color={bannerStatusColor(banner.status)} />
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  <span className="bg-gray-100 px-2 py-0.5 rounded font-mono">#{banner.sortOrder}</span>
                  <span>{banner.mediaType}</span>
                  {banner.tenantId ? (
                    <span className="font-mono truncate max-w-[140px]" title={banner.tenantId}>
                      {banner.tenantId}
                    </span>
                  ) : (
                    <span>All tenants</span>
                  )}
                  {banner.linkUrl ? (
                    <a
                      href={banner.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand hover:underline truncate max-w-[160px]"
                    >
                      Link ↗
                    </a>
                  ) : null}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(banner)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="outline-danger" onClick={() => setDeleteTarget(banner)}>
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <BannerFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        banner={editing}
        onSaved={() => load()}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete banner?"
        message={`Remove "${deleteTarget?.title}" from the carousel? This cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
      />
    </div>
  )
}
