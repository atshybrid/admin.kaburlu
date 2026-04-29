/**
 * Committee Tab — Journalist Union Admin
 * View post definitions; appoint, update and vacate committee members
 */

import { useState, useEffect, useCallback } from 'react'
import { journalistApi } from '../../../lib/api/services/journalistApi'
import {
  DataTable,
  StatusBadge,
  Button,
  Modal,
  Card,
  CardRow,
  FormField,
  Input,
  Select,
  ConfirmDialog,
  Dropdown,
  DropdownItem,
  toast,
  IconMoreVertical,
} from '../../ui'

function fmt(v) {
  if (!v) return '—'
  try {
    const d = new Date(v)
    if (isNaN(d)) return v
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
  } catch { return v }
}

export default function CommitteeTab() {
  const [holdings, setHoldings]       = useState([])
  const [postDefs, setPostDefs]       = useState([])
  const [loading, setLoading]         = useState(false)
  const [postDefsLoading, setPostDefsLoading] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState('holdings')

  // Appoint modal
  const [appointOpen, setAppointOpen] = useState(false)
  const [appointForm, setAppointForm] = useState({
    journalistProfileId: '',
    postDefinitionId: '',
    termStartDate: '',
    termEndDate: '',
  })
  const [appointing, setAppointing]   = useState(false)

  // Edit modal
  const [editTarget, setEditTarget]   = useState(null)
  const [editForm, setEditForm]       = useState({ termEndDate: '', isActive: true })
  const [editLoading, setEditLoading] = useState(false)

  // Vacate confirm
  const [vacateTarget, setVacateTarget] = useState(null)
  const [vacating, setVacating]         = useState(false)

  // New post def modal
  const [newPostOpen, setNewPostOpen] = useState(false)
  const [newPostForm, setNewPostForm] = useState({ title: '', nativeTitle: '', level: 'STATE', type: 'ELECTED' })
  const [newPostLoading, setNewPostLoading] = useState(false)

  const loadHoldings = useCallback(async () => {
    setLoading(true)
    try {
      const data = await journalistApi.listCommittee()
      setHoldings(Array.isArray(data) ? data : data?.holdings ?? data?.data ?? [])
    } catch (err) {
      toast.error(err.message || 'Failed to load committee')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadPostDefs = useCallback(async () => {
    setPostDefsLoading(true)
    try {
      const data = await journalistApi.listPostDefinitions()
      setPostDefs(Array.isArray(data) ? data : data?.posts ?? data?.data ?? [])
    } catch (err) {
      toast.error(err.message || 'Failed to load post definitions')
    } finally {
      setPostDefsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHoldings()
    loadPostDefs()
  }, [loadHoldings, loadPostDefs])

  const handleAppoint = async () => {
    setAppointing(true)
    try {
      await journalistApi.appointMember(appointForm)
      toast.success('Member appointed')
      setAppointOpen(false)
      setAppointForm({ journalistProfileId: '', postDefinitionId: '', termStartDate: '', termEndDate: '' })
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
      await journalistApi.updateCommittee(editTarget.id, editForm)
      toast.success('Committee record updated')
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
      await journalistApi.vacateCommittee(vacateTarget.id)
      toast.success('Position vacated')
      setVacateTarget(null)
      loadHoldings()
    } catch (err) {
      toast.error(err.message || 'Vacate failed')
    } finally {
      setVacating(false)
    }
  }

  const handleCreatePost = async () => {
    setNewPostLoading(true)
    try {
      await journalistApi.createPostDefinition(newPostForm)
      toast.success('Post definition created')
      setNewPostOpen(false)
      setNewPostForm({ title: '', nativeTitle: '', level: 'STATE', type: 'ELECTED' })
      loadPostDefs()
    } catch (err) {
      toast.error(err.message || 'Create failed')
    } finally {
      setNewPostLoading(false)
    }
  }

  const openEdit = (row) => {
    setEditTarget(row)
    setEditForm({
      termEndDate: row.termEndDate ? new Date(row.termEndDate).toISOString().split('T')[0] : '',
      isActive: row.isActive ?? true,
    })
  }

  const holdingsColumns = [
    {
      header: 'Member',
      accessor: 'journalistProfile',
      render: (v) => (
        <div>
          <p className="font-medium text-gray-900">{v?.user?.profile?.fullName || '—'}</p>
          <p className="text-xs text-gray-500">{v?.pressId || v?.user?.mobileNumber || '—'}</p>
        </div>
      )
    },
    {
      header: 'Post',
      accessor: 'post',
      render: (v) => (
        <div>
          <p className="font-medium text-sm text-gray-800">{v?.title || '—'}</p>
          {v?.nativeTitle && <p className="text-xs text-gray-400">{v.nativeTitle}</p>}
        </div>
      )
    },
    {
      header: 'Level',
      accessor: 'post',
      render: (v) => <StatusBadge color="blue" label={v?.level || '—'} />
    },
    {
      header: 'Type',
      accessor: 'post',
      render: (v) => <StatusBadge color="purple" label={v?.type || '—'} />
    },
    {
      header: 'Term',
      accessor: 'termStartDate',
      render: (v, row) => (
        <span className="text-xs text-gray-500">
          {fmt(v)} → {fmt(row.termEndDate)}
        </span>
      )
    },
    {
      header: 'Active',
      accessor: 'isActive',
      render: (v) => <StatusBadge color={v ? 'green' : 'gray'} label={v ? 'Active' : 'Inactive'} />
    },
    {
      header: '',
      accessor: 'id',
      render: (_, row) => (
        <Dropdown trigger={<button className="p-1 rounded hover:bg-gray-100"><IconMoreVertical className="w-4 h-4 text-gray-500" /></button>}>
          <DropdownItem onClick={() => openEdit(row)}>Edit Term</DropdownItem>
          <DropdownItem onClick={() => setVacateTarget(row)} className="text-red-600">Vacate</DropdownItem>
        </Dropdown>
      )
    }
  ]

  const postDefColumns = [
    {
      header: 'Title',
      accessor: 'title',
      render: (v, row) => (
        <div>
          <p className="font-medium text-gray-900">{v || '—'}</p>
          {row.nativeTitle && <p className="text-xs text-gray-400">{row.nativeTitle}</p>}
        </div>
      )
    },
    {
      header: 'Level',
      accessor: 'level',
      render: (v) => <StatusBadge color="blue" label={v || '—'} />
    },
    {
      header: 'Type',
      accessor: 'type',
      render: (v) => <StatusBadge color="purple" label={v || '—'} />
    },
  ]

  return (
    <div className="space-y-4">
      {/* Sub-tab toggle */}
      <div className="flex items-center gap-2">
        {[
          { key: 'holdings', label: 'Current Committee' },
          { key: 'postdefs', label: 'Post Definitions' },
        ].map((t) => (
          <button
            key={t.key}
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
        <div className="ml-auto flex gap-2">
          {activeSubTab === 'holdings' && (
            <Button variant="primary" size="sm" onClick={() => setAppointOpen(true)}>Appoint Member</Button>
          )}
          {activeSubTab === 'postdefs' && (
            <Button variant="primary" size="sm" onClick={() => setNewPostOpen(true)}>New Post</Button>
          )}
          <Button variant="ghost" size="sm" onClick={activeSubTab === 'holdings' ? loadHoldings : loadPostDefs} loading={loading || postDefsLoading}>
            Refresh
          </Button>
        </div>
      </div>

      {activeSubTab === 'holdings' && (
        <DataTable columns={holdingsColumns} data={holdings} loading={loading} emptyMessage="No committee members" rowKey="id" />
      )}

      {activeSubTab === 'postdefs' && (
        <DataTable columns={postDefColumns} data={postDefs} loading={postDefsLoading} emptyMessage="No post definitions" rowKey="id" />
      )}

      {/* Appoint modal */}
      <Modal open={appointOpen} onClose={() => setAppointOpen(false)} title="Appoint Committee Member">
        <div className="space-y-3">
          <FormField label="Journalist Profile ID">
            <Input
              placeholder="Journalist profile ID"
              value={appointForm.journalistProfileId}
              onChange={(e) => setAppointForm(f => ({ ...f, journalistProfileId: e.target.value }))}
            />
          </FormField>
          <FormField label="Post">
            <Select
              value={appointForm.postDefinitionId}
              onChange={(e) => setAppointForm(f => ({ ...f, postDefinitionId: e.target.value }))}
              options={[
                { value: '', label: 'Select post…' },
                ...postDefs.map(p => ({ value: p.id, label: `${p.title}${p.nativeTitle ? ` (${p.nativeTitle})` : ''}` }))
              ]}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Term Start">
              <Input type="date" value={appointForm.termStartDate} onChange={(e) => setAppointForm(f => ({ ...f, termStartDate: e.target.value }))} />
            </FormField>
            <FormField label="Term End">
              <Input type="date" value={appointForm.termEndDate} onChange={(e) => setAppointForm(f => ({ ...f, termEndDate: e.target.value }))} />
            </FormField>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAppointOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={appointing} onClick={handleAppoint}>Appoint</Button>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Committee Record">
        <div className="space-y-3">
          <FormField label="Term End Date">
            <Input
              type="date"
              value={editForm.termEndDate}
              onChange={(e) => setEditForm(f => ({ ...f, termEndDate: e.target.value }))}
            />
          </FormField>
          <FormField label="Active">
            <Select
              value={String(editForm.isActive)}
              onChange={(e) => setEditForm(f => ({ ...f, isActive: e.target.value === 'true' }))}
              options={[
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button variant="primary" loading={editLoading} onClick={handleEdit}>Save</Button>
          </div>
        </div>
      </Modal>

      {/* New post definition modal */}
      <Modal open={newPostOpen} onClose={() => setNewPostOpen(false)} title="Create Post Definition">
        <div className="space-y-3">
          <FormField label="Title (English)">
            <Input
              placeholder="e.g. State President"
              value={newPostForm.title}
              onChange={(e) => setNewPostForm(f => ({ ...f, title: e.target.value }))}
            />
          </FormField>
          <FormField label="Native Title (Telugu/Urdu)">
            <Input
              placeholder="e.g. రాష్ట్ర అధ్యక్షుడు"
              value={newPostForm.nativeTitle}
              onChange={(e) => setNewPostForm(f => ({ ...f, nativeTitle: e.target.value }))}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Level">
              <Select
                value={newPostForm.level}
                onChange={(e) => setNewPostForm(f => ({ ...f, level: e.target.value }))}
                options={[
                  { value: 'STATE', label: 'State' },
                  { value: 'DISTRICT', label: 'District' },
                  { value: 'MANDAL', label: 'Mandal' },
                  { value: 'NATIONAL', label: 'National' },
                ]}
              />
            </FormField>
            <FormField label="Type">
              <Select
                value={newPostForm.type}
                onChange={(e) => setNewPostForm(f => ({ ...f, type: e.target.value }))}
                options={[
                  { value: 'ELECTED', label: 'Elected' },
                  { value: 'NOMINATED', label: 'Nominated' },
                  { value: 'APPOINTED', label: 'Appointed' },
                ]}
              />
            </FormField>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setNewPostOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={newPostLoading} onClick={handleCreatePost}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* Vacate confirm */}
      <ConfirmDialog
        open={!!vacateTarget}
        title="Vacate Position"
        message={`Vacate "${vacateTarget?.post?.title}" for ${vacateTarget?.journalistProfile?.user?.profile?.fullName || 'this member'}? This will mark the holding as inactive.`}
        confirmLabel="Vacate"
        onConfirm={handleVacate}
        onCancel={() => setVacateTarget(null)}
        loading={vacating}
        variant="danger"
      />
    </div>
  )
}
