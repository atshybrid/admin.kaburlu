/**
 * Union admins — Super Admin delegate access
 * GET /journalist/admin/union-admins
 * POST /journalist/admin/assign-union-admin
 * DELETE /journalist/admin/union-admins/:id
 */

import { useState, useEffect, useCallback } from 'react'
import { journalistApi } from '../../../lib/api/services/journalistApi'
import { normalizePagedList } from '../../../lib/journalist/apiNormalize'
import { formatJournalistApiError } from '../../../lib/journalist/memberErrors'
import { DEFAULT_UNION_NAME } from '../../../lib/journalist/unionConfig'
import { useUnionSettings } from './useUnionSettings'
import { Button, Card, CardRow, FormField, Input, Modal, toast } from '../../ui'

export default function UnionAdminsTab() {
  const { unionName } = useUnionSettings()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignForm, setAssignForm] = useState({
    userId: '',
    unionName: unionName || DEFAULT_UNION_NAME,
    state: 'Telangana',
  })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let raw
      try {
        raw = await journalistApi.listUnionAdmins()
      } catch (err) {
        if (err?.status === 404) {
          raw = await journalistApi.listUnionAdminsLegacy()
        } else {
          throw err
        }
      }
      const parsed = normalizePagedList(raw)
      setItems(parsed.items)
    } catch (err) {
      toast.error(formatJournalistApiError(err, 'Failed to load union admins'))
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setAssignForm((f) => ({ ...f, unionName: unionName || DEFAULT_UNION_NAME }))
  }, [unionName])

  const handleAssign = async () => {
    if (!assignForm.userId.trim()) {
      toast.error('User ID is required')
      return
    }
    setSaving(true)
    try {
      await journalistApi.assignUnionAdmin({
        userId: assignForm.userId.trim(),
        unionName: assignForm.unionName.trim(),
        state: assignForm.state.trim(),
      })
      toast.success('Union admin assigned')
      setAssignOpen(false)
      setAssignForm((f) => ({ ...f, userId: '' }))
      load()
    } catch (err) {
      toast.error(formatJournalistApiError(err, 'Assign failed'))
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (row) => {
    const id = row.id || row.userId
    if (!id || !window.confirm('Remove this union admin?')) return
    try {
      await journalistApi.removeUnionAdmin(id)
      toast.success('Removed')
      load()
    } catch (err) {
      toast.error(formatJournalistApiError(err, 'Remove failed'))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          Delegate union-level admin access for <strong>{unionName}</strong>
        </p>
        <Button size="sm" onClick={() => setAssignOpen(true)}>
          Assign admin
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500 rounded-lg border border-dashed border-gray-200 p-8 text-center">
          No union admins listed.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((row) => (
            <li key={row.id || row.userId}>
              <Card>
                <CardRow label="User ID" value={row.userId || row.id} />
                <CardRow label="Name" value={row.fullName || row.user?.profile?.fullName || '—'} />
                <CardRow label="Union" value={row.unionName || '—'} />
                <CardRow label="State" value={row.state || '—'} />
                <div className="pt-2">
                  <Button size="sm" variant="danger" onClick={() => handleRemove(row)}>
                    Remove
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign union admin"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleAssign}>Assign</Button>
          </>
        }
      >
        <div className="space-y-3">
          <FormField label="User ID (cluser_…)">
            <Input
              value={assignForm.userId}
              onChange={(e) => setAssignForm((f) => ({ ...f, userId: e.target.value }))}
              placeholder="Platform user id"
            />
          </FormField>
          <FormField label="Union name">
            <Input
              value={assignForm.unionName}
              onChange={(e) => setAssignForm((f) => ({ ...f, unionName: e.target.value }))}
            />
          </FormField>
          <FormField label="State">
            <Input
              value={assignForm.state}
              onChange={(e) => setAssignForm((f) => ({ ...f, state: e.target.value }))}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  )
}
