/**
 * Add Union Member — POST /journalist/admin/members/create
 * Case A: TENANT_REPORTER (existing platform reporter)
 * Case B: NON_TENANT_REPORTER (Super Admin only)
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { journalistApi } from '../../../lib/api/services/journalistApi'
import { prgiApi } from '../../../lib/api/services/prgiApi'
import { locationService } from '../../../lib/api/services/locationService'
import {
  reporterDesignationsApi,
  sortDesignations,
} from '../../../lib/api/services/reporterDesignationsApi'
import {
  buildCreateMemberFormData,
  messageForCreateMemberError,
} from '../../../lib/journalist/createMemberErrors'
import { DEFAULT_UNION_NAME, resolveUnionName } from '../../../lib/journalist/unionConfig'
import { getToken } from '../../../utils/auth'
import { isSuperAdmin } from '../../../utils/roleUtils'
import {
  Modal,
  Button,
  FormField,
  Input,
  Select,
  Switch,
  toast,
} from '../../ui'

function AsyncSearchField({
  label,
  hint,
  placeholder,
  value,
  onChange,
  onSelect,
  searchFn,
  formatOption,
  required,
}) {
  const [q, setQ] = useState(value || '')
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    setQ(value || '')
  }, [value])

  const runSearch = useCallback(
    (term) => {
      clearTimeout(timerRef.current)
      if (!term || term.length < 2) {
        setItems([])
        return
      }
      timerRef.current = setTimeout(async () => {
        setLoading(true)
        try {
          const res = await searchFn(term)
          setItems(res?.items || [])
          setOpen(true)
        } catch {
          setItems([])
        } finally {
          setLoading(false)
        }
      }, 320)
    },
    [searchFn]
  )

  return (
    <FormField label={label} hint={hint} required={required}>
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={q}
          onChange={(e) => {
            const v = e.target.value
            setQ(v)
            onChange(v)
            runSearch(v)
          }}
          onFocus={() => items.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
        />
        {loading ? (
          <span className="absolute right-2 top-2 text-xs text-gray-400">…</span>
        ) : null}
        {open && items.length > 0 ? (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg text-sm">
            {items.map((item, idx) => (
              <li key={item.id || idx}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-gray-50"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const labelText = formatOption(item)
                    setQ(labelText)
                    onChange(labelText)
                    onSelect?.(item)
                    setOpen(false)
                  }}
                >
                  {formatOption(item)}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </FormField>
  )
}

function DesignationSearchField({
  label,
  hint,
  required,
  designations,
  loading,
  value,
  onChange,
}) {
  const [q, setQ] = useState(value || '')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setQ(value || '')
  }, [value])

  const filtered = useMemo(() => {
    const term = String(q || '').trim().toLowerCase()
    const pool = designations || []
    if (!term) return pool.slice(0, 35)
    return pool
      .filter((d) =>
        [d.name, d.nativeName, d.code, d.level, d.locationLabel].some(
          (f) => f && String(f).toLowerCase().includes(term)
        )
      )
      .slice(0, 40)
  }, [q, designations])

  return (
    <FormField label={label} hint={hint} required={required}>
      <div className="relative">
        <Input
          placeholder={loading ? 'Loading designations…' : 'Search designation…'}
          value={q}
          disabled={loading}
          onChange={(e) => {
            const v = e.target.value
            setQ(v)
            onChange(v)
            setOpen(true)
          }}
          onFocus={() => filtered.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
        />
        {loading ? (
          <span className="absolute right-2 top-2 text-xs text-gray-400">…</span>
        ) : null}
        {open && filtered.length > 0 ? (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg text-sm">
            {filtered.map((item) => (
              <li key={item.id || item.code}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-gray-50"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const name = item.name || ''
                    setQ(name)
                    onChange(name)
                    setOpen(false)
                  }}
                >
                  <span className="block font-medium text-gray-900">{item.name}</span>
                  {(item.nativeName || item.level) && (
                    <span className="block text-xs text-gray-500 mt-0.5">
                      {[item.nativeName, item.level].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {open && !loading && q.trim().length >= 1 && filtered.length === 0 ? (
          <p className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 shadow">
            No designation matches &quot;{q.trim()}&quot;
          </p>
        ) : null}
      </div>
    </FormField>
  )
}

const EMPTY = {
  memberType: 'TENANT_REPORTER',
  mobileNumber: '',
  unionName: DEFAULT_UNION_NAME,
  fullName: '',
  fatherName: '',
  currentNewspaper: '',
  workingArea: '',
  designation: '',
  publisherMobileNumber: '',
  state: '',
  mandal: '',
  mpin: '',
  autoApproveMembership: true,
  autoApproveDocuments: false,
  skipRequiredUploads: true,
  uploadDocuments: false,
}

export default function AddMemberModal({ isOpen, onClose, onCreated }) {
  const auth = getToken()
  const user = auth?.user || auth?.data?.user
  const canNonTenant = isSuperAdmin(user)

  const [form, setForm] = useState({ ...EMPTY })
  const [files, setFiles] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [locationPick, setLocationPick] = useState(null)
  const [unionLoading, setUnionLoading] = useState(false)
  const [designations, setDesignations] = useState([])
  const [designationsLoading, setDesignationsLoading] = useState(false)
  const mpinManualRef = useRef(false)

  useEffect(() => {
    if (!isOpen) return undefined
    let cancelled = false

    setForm({
      ...EMPTY,
      memberType: canNonTenant ? EMPTY.memberType : 'TENANT_REPORTER',
    })
    setFiles({})
    setLocationPick(null)
    mpinManualRef.current = false

    ;(async () => {
      setUnionLoading(true)
      try {
        const data = await journalistApi.getSettings()
        if (!cancelled) {
          setForm((f) => ({ ...f, unionName: resolveUnionName(data?.unionName) }))
        }
      } catch {
        /* keep default union name */
      } finally {
        if (!cancelled) setUnionLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isOpen, canNonTenant])

  useEffect(() => {
    if (!isOpen || !canNonTenant) return undefined
    let cancelled = false

    ;(async () => {
      setDesignationsLoading(true)
      try {
        const list = await reporterDesignationsApi.list()
        if (!cancelled) setDesignations(sortDesignations(list))
      } catch {
        if (!cancelled) setDesignations([])
      } finally {
        if (!cancelled) setDesignationsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isOpen, canNonTenant])

  const set = (key) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: v }))
  }

  const onFile = (key) => (e) => {
    const file = e.target.files?.[0]
    setFiles((f) => ({ ...f, [key]: file || undefined }))
  }

  const onNonTenantMobileChange = (e) => {
    const mobile = e.target.value
    const digits = String(mobile).replace(/\D/g, '')
    setForm((f) => ({
      ...f,
      mobileNumber: mobile,
      mpin: mpinManualRef.current ? f.mpin : locationService.mpinFromMobile(digits),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const mobile = String(form.mobileNumber || '').replace(/\D/g, '')
      const isTenantReporter = form.memberType === 'TENANT_REPORTER'
      const fields = {
        memberType: form.memberType,
        mobileNumber: mobile,
        unionName: resolveUnionName(form.unionName),
        autoApproveMembership: isTenantReporter ? true : form.autoApproveMembership,
        autoApproveDocuments: isTenantReporter
          ? Boolean(form.uploadDocuments)
          : form.autoApproveDocuments,
      }

      if (form.memberType === 'NON_TENANT_REPORTER') {
        Object.assign(fields, {
          fullName: form.fullName.trim(),
          fatherName: form.fatherName.trim(),
          currentNewspaper: form.currentNewspaper.trim(),
          workingArea: form.workingArea.trim(),
          designation: form.designation.trim(),
          publisherMobileNumber: String(form.publisherMobileNumber || '').replace(/\D/g, ''),
          state: form.state.trim() || locationPick?.state?.name || '',
          mandal: form.mandal.trim() || locationPick?.mandal?.name || '',
          mpin: form.mpin.trim() || locationService.mpinFromMobile(mobile),
          skipRequiredUploads: form.skipRequiredUploads,
        })
      }

      const uploadFiles = isTenantReporter && !form.uploadDocuments ? {} : files
      const fd = buildCreateMemberFormData(fields, uploadFiles)
      const res = await journalistApi.createMember(fd)
      const code = res?.code || 'CREATED'
      toast.success(res?.message || `Member created (${code})`)
      onCreated?.(res)
      onClose?.()
    } catch (err) {
      toast.error(messageForCreateMemberError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const isTenant = form.memberType === 'TENANT_REPORTER'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add union member"
      subtitle="Create membership directly (bypass application queue)"
      size={isTenant ? 'md' : 'xl'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            Create member
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <FormField label="Member type" required>
          <Select
            value={form.memberType}
            onChange={set('memberType')}
            disabled={!canNonTenant}
          >
            <option value="TENANT_REPORTER">Tenant reporter (existing platform reporter)</option>
            {canNonTenant ? (
              <option value="NON_TENANT_REPORTER">Non-tenant reporter (Super Admin only)</option>
            ) : null}
          </Select>
        </FormField>

        {isTenant ? (
          <div className="rounded-lg border border-blue-100 bg-blue-50/80 p-3 text-xs text-blue-900">
            <strong>Case A:</strong> Mobile must already exist as a <code>REPORTER</code> under a
            newspaper tenant. Name, district, and photo are pulled from that profile.
          </div>
        ) : (
          <div className="rounded-lg border border-amber-100 bg-amber-50/80 p-3 text-xs text-amber-900">
            <strong>Case B:</strong> Independent reporter — fill newspaper (PRGI search), working
            area (location API), and publisher mobile.
          </div>
        )}

        {isTenant ? (
          <div className="space-y-4">
            <FormField label="Mobile number" required hint="Must already be a platform reporter (REPORTER role)">
              <Input
                inputMode="numeric"
                placeholder="10-digit mobile"
                value={form.mobileNumber}
                onChange={set('mobileNumber')}
                maxLength={10}
                autoFocus
              />
            </FormField>

            <FormField
              label="Union name"
              required
              hint={unionLoading ? 'Loading from union settings…' : 'Fixed for your union — not editable'}
            >
              <Input
                value={form.unionName}
                disabled
                readOnly
                className="bg-gray-50 text-gray-700 cursor-not-allowed"
              />
            </FormField>

            <Switch
              label="Upload documents now"
              description="Off = no files sent (reporter profile photo may still apply). On = show upload fields."
              checked={form.uploadDocuments}
              onChange={(uploadDocuments) =>
                setForm((f) => ({ ...f, uploadDocuments, autoApproveDocuments: uploadDocuments }))
              }
            />

            {form.uploadDocuments ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 space-y-3">
                <p className="text-sm font-medium text-gray-800">Documents (optional)</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {['photo', 'aadhaar', 'pan', 'workingIdCard'].map((key) => (
                    <FormField key={key} label={key}>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="block w-full text-sm text-gray-600"
                        onChange={onFile(key)}
                      />
                    </FormField>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Mobile number" required>
              <Input
                inputMode="numeric"
                placeholder="10-digit mobile"
                value={form.mobileNumber}
                onChange={onNonTenantMobileChange}
                maxLength={10}
              />
            </FormField>
            <FormField label="Union name" required>
              <Input value={form.unionName} onChange={set('unionName')} />
            </FormField>
          </div>
        )}

        {!isTenant ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Full name" required>
                <Input value={form.fullName} onChange={set('fullName')} />
              </FormField>
              <FormField label="Father name">
                <Input value={form.fatherName} onChange={set('fatherName')} />
              </FormField>
            </div>

            <AsyncSearchField
              label="Current newspaper"
              hint="Search PRGI registered titles"
              placeholder="Type newspaper name…"
              required
              value={form.currentNewspaper}
              onChange={(v) => setForm((f) => ({ ...f, currentNewspaper: v }))}
              searchFn={(term) => prgiApi.searchNewspapers(term, { limit: 20 })}
              formatOption={(item) =>
                [item.title, item.district, item.state].filter(Boolean).join(' · ')
              }
            />

            <AsyncSearchField
              label="Working area"
              hint="Search district / mandal (locations API)"
              placeholder="e.g. Kamareddy"
              required
              value={form.workingArea}
              onChange={(v) => {
                setLocationPick(null)
                setForm((f) => ({ ...f, workingArea: v, state: '', mandal: '' }))
              }}
              onSelect={(item) => {
                setLocationPick(item)
                const { state, mandal } = locationService.fieldsFromPick(item)
                setForm((f) => ({
                  ...f,
                  workingArea: locationService.formatItemLabel(item),
                  state,
                  mandal,
                }))
              }}
              searchFn={(term) => locationService.searchCombined(term, { limit: 20 })}
              formatOption={(item) => locationService.formatItemLabel(item)}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <DesignationSearchField
                label="Designation"
                hint="Search and pick from platform reporter titles"
                required
                designations={designations}
                loading={designationsLoading}
                value={form.designation}
                onChange={(v) => setForm((f) => ({ ...f, designation: v }))}
              />
              <FormField label="Publisher mobile" required hint="Newspaper owner / publisher contact">
                <Input
                  inputMode="numeric"
                  value={form.publisherMobileNumber}
                  onChange={set('publisherMobileNumber')}
                  maxLength={10}
                />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                label="State"
                hint={form.state ? 'Filled from working area' : undefined}
              >
                <Input
                  value={form.state}
                  onChange={set('state')}
                  readOnly={Boolean(locationPick?.state?.name && form.state)}
                  className={locationPick?.state?.name && form.state ? 'bg-gray-50 text-gray-700 cursor-not-allowed' : ''}
                />
              </FormField>
              <FormField
                label="Mandal"
                hint={form.mandal ? 'Filled from working area' : undefined}
              >
                <Input
                  value={form.mandal}
                  onChange={set('mandal')}
                  readOnly={Boolean(form.mandal && locationPick)}
                  className={form.mandal && locationPick ? 'bg-gray-50 text-gray-700 cursor-not-allowed' : ''}
                />
              </FormField>
              <FormField label="MPIN" hint="Auto: last 4 digits of mobile (editable)">
                <Input
                  value={form.mpin}
                  onChange={(e) => {
                    mpinManualRef.current = true
                    set('mpin')(e)
                  }}
                  maxLength={4}
                  inputMode="numeric"
                />
              </FormField>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.skipRequiredUploads}
                onChange={set('skipRequiredUploads')}
                className="rounded border-gray-300"
              />
              Skip required document uploads (default on)
            </label>
          </>
        ) : null}

        {!isTenant ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.autoApproveMembership}
                  onChange={set('autoApproveMembership')}
                  className="rounded border-gray-300"
                />
                Auto-approve membership
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.autoApproveDocuments}
                  onChange={set('autoApproveDocuments')}
                  className="rounded border-gray-300"
                />
                Auto-approve documents
              </label>
            </div>

            <Switch
              label="Upload documents now"
              description="Show file fields below (or use skip required uploads above)"
              checked={form.uploadDocuments}
              onChange={(uploadDocuments) => setForm((f) => ({ ...f, uploadDocuments }))}
            />

            {form.uploadDocuments ? (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-medium text-gray-800 mb-3">Documents</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {['photo', 'aadhaar', 'pan', 'workingIdCard'].map((key) => (
                    <FormField key={key} label={key}>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="block w-full text-sm text-gray-600"
                        onChange={onFile(key)}
                      />
                    </FormField>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </form>
    </Modal>
  )
}
