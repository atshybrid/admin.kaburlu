/**
 * Create reader / citizen reporter / govt official / public figure
 */

import { useEffect, useMemo, useState } from 'react'
import { readersAdminApi } from '../../../lib/api/services/readersAdminApi'
import { normalizePersonas, personaRequiresApproval } from '../../../lib/readers/normalize'
import { formatReaderAdminError } from '../../../lib/readers/readerErrors'
import { Button, FormField, Input, Modal, Select, toast } from '../../ui'

const DEFAULT_PERSONAS = [
  {
    key: 'reader',
    label: 'Reader',
    labelTe: 'రీడర్',
    requiresApproval: false,
    subRoles: [],
  },
  {
    key: 'citizen_reporter',
    label: 'Citizen Reporter',
    labelTe: 'పౌరు రిపోర్టర్',
    requiresApproval: false,
    subRoles: [],
  },
  {
    key: 'govt_official',
    label: 'Government Official',
    labelTe: 'ప్రభుత్వ అధికారి',
    requiresApproval: true,
    subRoles: [
      { key: 'police', label: 'Police' },
      { key: 'revenue', label: 'Revenue' },
    ],
  },
  {
    key: 'public_figure',
    label: 'Public Figure',
    labelTe: 'ప్రముఖ వ్యక్తి',
    requiresApproval: true,
    subRoles: [
      { key: 'political', label: 'Political Leader' },
      { key: 'film', label: 'Film' },
    ],
  },
]

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '')
}

const EMPTY_FORM = {
  mobileNumber: '',
  persona: 'reader',
  subRoleKey: '',
  fullName: '',
  email: '',
  departmentName: '',
  organizationName: '',
  autoApprove: true,
}

export default function CreateReaderModal({ isOpen, onClose, onCreated }) {
  const [personas, setPersonas] = useState(DEFAULT_PERSONAS)
  const [loadingPersonas, setLoadingPersonas] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (!isOpen) return
    setForm(EMPTY_FORM)
    setLoadingPersonas(true)
    readersAdminApi
      .getFeedsConfig()
      .then((raw) => {
        const list = normalizePersonas(raw)
        if (list.length) setPersonas(list)
      })
      .catch(() => {})
      .finally(() => setLoadingPersonas(false))
  }, [isOpen])

  const selectedPersona = useMemo(
    () => personas.find((p) => p.key === form.persona) || personas[0],
    [personas, form.persona],
  )

  const subRoles = selectedPersona?.subRoles || []
  const needsDept = form.persona === 'govt_official'
  const needsOrg = form.persona === 'public_figure'
  const needsApproval = personaRequiresApproval(form.persona, personas)

  const handlePersonaChange = (persona) => {
    const requires = personaRequiresApproval(persona, personas)
    setForm((f) => ({
      ...f,
      persona,
      subRoleKey: '',
      autoApprove: !requires,
    }))
  }

  const handleSubmit = async () => {
    const mobile = digitsOnly(form.mobileNumber)
    if (mobile.length < 10) {
      toast.error('Enter a valid 10-digit mobile number')
      return
    }
    if (!form.persona) {
      toast.error('Select a persona')
      return
    }

    setSaving(true)
    try {
      const body = {
        mobileNumber: mobile,
        persona: form.persona,
        fullName: form.fullName.trim() || undefined,
        email: form.email.trim() || undefined,
        subRoleKey: form.subRoleKey || undefined,
        departmentName: needsDept ? form.departmentName.trim() || undefined : undefined,
        organizationName: needsOrg ? form.organizationName.trim() || undefined : undefined,
        autoApprove: form.autoApprove,
      }
      const res = await readersAdminApi.create(body)
      const status = res?.readerProfile?.approvalStatus
      toast.success(
        status === 'PENDING_APPROVAL'
          ? 'Created — pending your approval'
          : 'Reader created and activated',
      )
      onCreated?.(res)
      onClose?.()
    } catch (err) {
      toast.error(formatReaderAdminError(err, 'Create failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add reader account"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || loadingPersonas}>
            {saving ? 'Creating…' : 'Create account'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Create reader, citizen reporter, government official, or public figure. Govt officials and
          public figures can be held for approval.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Mobile number" required>
            <Input
              value={form.mobileNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, mobileNumber: digitsOnly(e.target.value).slice(0, 10) }))
              }
              placeholder="9876543210"
            />
          </FormField>
          <FormField label="Full name">
            <Input
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="Display name"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Persona" required>
            <Select
              value={form.persona}
              onChange={(e) => handlePersonaChange(e.target.value)}
            >
              {personas.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.labelTe ? `${p.label} · ${p.labelTe}` : p.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Email">
            <Input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="optional@email.com"
            />
          </FormField>
        </div>

        {subRoles.length > 0 ? (
          <FormField label="Sub-role">
            <Select
              value={form.subRoleKey}
              onChange={(e) => setForm((f) => ({ ...f, subRoleKey: e.target.value }))}
              placeholder="Select sub-role"
            >
              {subRoles.map((sr) => (
                <option key={sr.key} value={sr.key}>
                  {sr.labelTe ? `${sr.label} · ${sr.labelTe}` : sr.label}
                </option>
              ))}
            </Select>
          </FormField>
        ) : null}

        {needsDept ? (
          <FormField label="Department name">
            <Input
              value={form.departmentName}
              onChange={(e) => setForm((f) => ({ ...f, departmentName: e.target.value }))}
              placeholder="e.g. Cyberabad Police"
            />
          </FormField>
        ) : null}

        {needsOrg ? (
          <FormField label="Organization name">
            <Input
              value={form.organizationName}
              onChange={(e) => setForm((f) => ({ ...f, organizationName: e.target.value }))}
              placeholder="e.g. Film industry / NGO"
            />
          </FormField>
        ) : null}

        <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-slate-200 p-3">
          <input
            type="checkbox"
            checked={form.autoApprove}
            onChange={(e) => setForm((f) => ({ ...f, autoApprove: e.target.checked }))}
            className="mt-1"
          />
          <span className="text-sm text-slate-700">
            <span className="font-medium">Auto-approve</span>
            <span className="block text-slate-500 text-xs mt-0.5">
              {needsApproval
                ? 'Off by default for govt / public figure — account stays pending until you approve.'
                : 'On by default for reader / citizen reporter — account is active immediately.'}
            </span>
          </span>
        </label>
      </div>
    </Modal>
  )
}
