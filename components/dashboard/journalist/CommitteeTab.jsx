/**
 * Committee — post holders & definitions (card UI)
 * GET post-holders · POST seed-defaults · POST appoint · DELETE vacate
 */

import { useState, useEffect, useCallback } from 'react'
import { journalistApi } from '../../../lib/api/services/journalistApi'
import { DEFAULT_UNION_NAME } from '../../../lib/journalist/unionConfig'
import { useUnionSettings } from './useUnionSettings'
import { MemberSearchSelect } from './MemberSearchSelect'
import {
  StatusBadge,
  Button,
  Modal,
  FormField,
  Input,
  Select,
  ConfirmDialog,
  Dropdown,
  DropdownItem,
  toast,
  IconMoreVertical,
  Spinner,
} from '../../ui'

function fmt(v) {
  if (!v) return '—'
  try {
    const d = new Date(v)
    if (isNaN(d)) return v
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  } catch {
    return v
  }
}

function holderName(row) {
  return (
    row?.profile?.user?.profile?.fullName ||
    row?.journalistProfile?.user?.profile?.fullName ||
    '—'
  )
}

function holderPressId(row) {
  return row?.profile?.pressId || row?.journalistProfile?.pressId || '—'
}

function HolderCard({ row, onEdit, onVacate }) {
  const post = row.post || {}
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900">{holderName(row)}</h3>
          <p className="text-xs font-mono text-brand mt-0.5">{holderPressId(row)}</p>
        </div>
        <Dropdown
          trigger={
            <button type="button" className="p-1 rounded hover:bg-gray-100">
              <IconMoreVertical className="w-4 h-4 text-gray-500" />
            </button>
          }
        >
          <DropdownItem onClick={() => onEdit(row)}>Edit term</DropdownItem>
          <DropdownItem onClick={() => onVacate(row)} className="text-red-600">
            Vacate
          </DropdownItem>
        </Dropdown>
      </div>

      <div className="mt-3">
        <p className="font-medium text-sm text-gray-800">{post.title || '—'}</p>
        {post.nativeTitle ? <p className="text-xs text-gray-500">{post.nativeTitle}</p> : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge color="blue" label={post.level || '—'} />
        <StatusBadge color="purple" label={post.type || '—'} />
        <StatusBadge color={row.isActive ? 'green' : 'gray'} label={row.isActive ? 'Active' : 'Inactive'} />
      </div>

      <p className="mt-2 text-xs text-gray-500">
        {fmt(row.termStartDate)} → {fmt(row.termEndDate)}
      </p>
    </article>
  )
}

function PostDefCard({ post }) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="font-semibold text-gray-900">{post.title || '—'}</h3>
      {post.nativeTitle ? <p className="text-sm text-gray-500 mt-0.5">{post.nativeTitle}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge color="blue" label={post.level || '—'} />
        <StatusBadge color="purple" label={post.type || '—'} />
        {post.maxSeats != null ? (
          <span className="text-xs text-gray-500 px-2 py-0.5 bg-slate-100 rounded-full">
            Max {post.maxSeats} seat{post.maxSeats === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>
    </article>
  )
}

export default function CommitteeTab() {
  const { unionName } = useUnionSettings()
  const resolvedUnion = unionName || DEFAULT_UNION_NAME

  const [holdings, setHoldings] = useState([])
  const [postDefs, setPostDefs] = useState([])
  const [loading, setLoading] = useState(false)
  const [postDefsLoading, setPostDefsLoading] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState('holdings')
  const [seeding, setSeeding] = useState(false)

  const [appointOpen, setAppointOpen] = useState(false)
  const [appointMember, setAppointMember] = useState(null)
  const [appointForm, setAppointForm] = useState({
    postId: '',
    termStartDate: '',
    termEndDate: '',
    notes: '',
  })
  const [appointing, setAppointing] = useState(false)

  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState({ termEndDate: '', notes: '' })
  const [editLoading, setEditLoading] = useState(false)

  const [vacateTarget, setVacateTarget] = useState(null)
  const [vacating, setVacating] = useState(false)

  const loadHoldings = useCallback(async () => {
    setLoading(true)
    try {
      let data = await journalistApi.listPostHolders({ unionName: resolvedUnion })
      if (!Array.isArray(data) || !data.length) {
        data = await journalistApi.listCommittee()
      }
      setHoldings(Array.isArray(data) ? data : data?.holdings ?? data?.items ?? [])
    } catch (err) {
      toast.error(err.message || 'Failed to load committee')
      setHoldings([])
    } finally {
      setLoading(false)
    }
  }, [resolvedUnion])

  const loadPostDefs = useCallback(async () => {
    setPostDefsLoading(true)
    try {
      let data = await journalistApi.listPostDefinitionsPublic({ unionName: resolvedUnion })
      const posts = data?.posts ?? data?.items
      if (!posts?.length) {
        data = await journalistApi.listPostDefinitions()
      }
      setPostDefs(Array.isArray(posts) ? posts : data?.posts ?? data?.data ?? [])
    } catch (err) {
      toast.error(err.message || 'Failed to load post definitions')
      setPostDefs([])
    } finally {
      setPostDefsLoading(false)
    }
  }, [resolvedUnion])

  useEffect(() => {
    loadHoldings()
    loadPostDefs()
  }, [loadHoldings, loadPostDefs])

  const handleSeedDefaults = async () => {
    setSeeding(true)
    try {
      const res = await journalistApi.seedPostDefaults({ unionName: resolvedUnion })
      toast.success(res?.message || `Seeded ${res?.created ?? ''} post definitions`)
      loadPostDefs()
    } catch (err) {
      toast.error(err.message || 'Seed failed')
    } finally {
      setSeeding(false)
    }
  }

  const handleAppoint = async () => {
    if (!appointMember?.id || !appointForm.postId || !appointForm.termStartDate) {
      toast.error('Select member, post, and term start')
      return
    }
    setAppointing(true)
    try {
      await journalistApi.appointPostHolder({
        profileId: appointMember.id,
        postId: appointForm.postId,
        termStartDate: appointForm.termStartDate,
        ...(appointForm.termEndDate ? { termEndDate: appointForm.termEndDate } : {}),
        ...(appointForm.notes.trim() ? { notes: appointForm.notes.trim() } : {}),
      })
      toast.success('Member appointed')
      setAppointOpen(false)
      setAppointMember(null)
      setAppointForm({ postId: '', termStartDate: '', termEndDate: '', notes: '' })
      loadHoldings()
    } catch (err) {
      toast.error(err.message || 'Appointment failed')
    } finally {
      setAppointing(false)
    }
  }

  const handleEdit = async () => {
    if (!editTarget) return
    setEditLoading(true)
    try {
      await journalistApi.updatePostHolder(editTarget.id, editForm)
      toast.success('Post holder updated')
      setEditTarget(null)
      loadHoldings()
    } catch (err) {
      toast.error(err.message || 'Update failed')
    } finally {
      setEditLoading(false)
    }
  }

  const handleVacate = async () => {
    if (!vacateTarget) return
    setVacating(true)
    try {
      await journalistApi.removePostHolder(vacateTarget.id)
      toast.success('Position vacated')
      setVacateTarget(null)
      loadHoldings()
    } catch (err) {
      toast.error(err.message || 'Vacate failed')
    } finally {
      setVacating(false)
    }
  }

  const openEdit = (row) => {
    setEditTarget(row)
    setEditForm({
      termEndDate: row.termEndDate ? new Date(row.termEndDate).toISOString().split('T')[0] : '',
      notes: row.notes || '',
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <strong>Why committee?</strong> Seed 28 default posts once, appoint secretaries (APPOINTED),
        or use Elections tab for ELECTED posts. Vacate ends a term without deleting history.
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: 'holdings', label: 'Current holders' },
          { key: 'postdefs', label: 'Post definitions' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveSubTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeSubTab === t.key
                ? 'bg-brand text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex flex-wrap gap-2">
          {activeSubTab === 'postdefs' ? (
            <Button variant="secondary" size="sm" loading={seeding} onClick={handleSeedDefaults}>
              Seed defaults
            </Button>
          ) : null}
          {activeSubTab === 'holdings' ? (
            <Button variant="primary" size="sm" onClick={() => setAppointOpen(true)}>
              Appoint
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={activeSubTab === 'holdings' ? loadHoldings : loadPostDefs}
            loading={loading || postDefsLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {activeSubTab === 'holdings' ? (
        loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : holdings.length === 0 ? (
          <p className="text-center text-gray-500 py-12 border border-dashed rounded-xl">
            No active post holders — seed posts then appoint or conduct elections
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {holdings.map((row) => (
              <HolderCard key={row.id} row={row} onEdit={openEdit} onVacate={setVacateTarget} />
            ))}
          </div>
        )
      ) : null}

      {activeSubTab === 'postdefs' ? (
        postDefsLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : postDefs.length === 0 ? (
          <p className="text-center text-gray-500 py-12 border border-dashed rounded-xl">
            No post definitions — click Seed defaults (once per union)
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {postDefs.map((post) => (
              <PostDefCard key={post.id} post={post} />
            ))}
          </div>
        )
      ) : null}

      <Modal isOpen={appointOpen} onClose={() => setAppointOpen(false)} title="Appoint to post">
        <div className="space-y-3">
          <MemberSearchSelect
            label="Member *"
            hint="Search by name, mobile, or press ID"
            required
            unionName={resolvedUnion}
            onSelect={setAppointMember}
          />
          <FormField label="Post *">
            <Select
              value={appointForm.postId}
              onChange={(e) => setAppointForm((f) => ({ ...f, postId: e.target.value }))}
            >
              <option value="">Select post…</option>
              {postDefs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                  {p.nativeTitle ? ` (${p.nativeTitle})` : ''}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Term start *">
              <Input
                type="date"
                value={appointForm.termStartDate}
                onChange={(e) => setAppointForm((f) => ({ ...f, termStartDate: e.target.value }))}
              />
            </FormField>
            <FormField label="Term end">
              <Input
                type="date"
                value={appointForm.termEndDate}
                onChange={(e) => setAppointForm((f) => ({ ...f, termEndDate: e.target.value }))}
              />
            </FormField>
          </div>
          <FormField label="Notes">
            <Input
              value={appointForm.notes}
              onChange={(e) => setAppointForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Appointed by National Executive"
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAppointOpen(false)}>
              Cancel
            </Button>
            <Button loading={appointing} onClick={handleAppoint}>
              Appoint
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={Boolean(editTarget)} onClose={() => setEditTarget(null)} title="Edit post holder">
        <div className="space-y-3">
          <FormField label="Term end">
            <Input
              type="date"
              value={editForm.termEndDate}
              onChange={(e) => setEditForm((f) => ({ ...f, termEndDate: e.target.value }))}
            />
          </FormField>
          <FormField label="Notes">
            <Input
              value={editForm.notes}
              onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button loading={editLoading} onClick={handleEdit}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(vacateTarget)}
        onClose={() => setVacateTarget(null)}
        onConfirm={handleVacate}
        title="Vacate position"
        message={`Vacate "${vacateTarget?.post?.title}" for ${holderName(vacateTarget || {})}?`}
        confirmText="Vacate"
        loading={vacating}
        variant="danger"
      />
    </div>
  )
}
