/**
 * Announcements Tab — Journalist Union Admin
 * Post new announcements; delete existing ones
 */

import { useState, useEffect, useCallback } from 'react'
import { journalistApi } from '../../../lib/api/services/journalistApi'
import {
  Button,
  Modal,
  FormField,
  Input,
  Textarea,
  ConfirmDialog,
  toast,
} from '../../ui'

function fmt(v) {
  if (!v) return '—'
  try {
    const d = new Date(v)
    if (isNaN(d)) return v
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
  } catch { return v }
}

export default function AnnouncementsTab() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm]       = useState({ title: '', body: '' })
  const [creating, setCreating]   = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await journalistApi.listAnnouncements()
      setItems(Array.isArray(data) ? data : data?.announcements ?? data?.data ?? [])
    } catch (err) {
      toast.error(err.message || 'Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    setCreating(true)
    try {
      await journalistApi.createAnnouncement(form)
      toast.success('Announcement posted')
      setCreateOpen(false)
      setForm({ title: '', body: '' })
      load()
    } catch (err) {
      toast.error(err.message || 'Failed to post announcement')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await journalistApi.deleteAnnouncement(deleteTarget.id)
      toast.success('Announcement deleted')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(err.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{items.length} announcement{items.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={load} loading={loading}>Refresh</Button>
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>Post Announcement</Button>
        </div>
      </div>

      {/* Announcement list */}
      {loading && items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No announcements yet</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900">{item.title}</h4>
                  {item.body && (
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{item.body}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">{fmt(item.createdAt)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-red-500 hover:text-red-700 shrink-0"
                  onClick={() => setDeleteTarget(item)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Post Announcement">
        <div className="space-y-4">
          <FormField label="Title *">
            <Input
              placeholder="Announcement title"
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </FormField>
          <FormField label="Body">
            <Textarea
              placeholder="Full message…"
              rows={4}
              value={form.body}
              onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={creating} onClick={handleCreate}>Post</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Announcement"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
        variant="danger"
      />
    </div>
  )
}
