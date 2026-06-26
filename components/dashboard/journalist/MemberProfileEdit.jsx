/**
 * Edit union member profile — PATCH /journalist/union-admin/members/:id
 */

import { useEffect, useState } from 'react'
import { patchMemberProfile } from '../../../lib/journalist/memberDocumentActions'
import {
  buildProfilePatch,
  GENDER_OPTIONS,
  memberToProfileForm,
  NOMINEE_RELATIONS,
} from '../../../lib/journalist/memberProfileForm'
import { formatDocActionError } from '../../../lib/journalist/memberDocumentActions'
import LocationSearchField from './LocationSearchField'
import NewspaperSearchField from './NewspaperSearchField'
import { Button, FormField, Input, Select, toast } from '../../ui'

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  )
}

export default function MemberProfileEdit({ profileId, member, onSaved, readOnly }) {
  const [form, setForm] = useState(() => memberToProfileForm(member))
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [locationLocked, setLocationLocked] = useState(false)

  useEffect(() => {
    setForm(memberToProfileForm(member))
    setLocationLocked(false)
  }, [member?.id, member?.updatedAt])

  const set = (key) => (e) => {
    const v = e.target.value
    setForm((f) => ({ ...f, [key]: v }))
  }

  const applyLocationPick = (pick) => {
    setLocationLocked(true)
    setForm((f) => ({
      ...f,
      workingArea: pick.workingArea || f.workingArea,
      state: pick.state || f.state,
      district: pick.district || f.district,
      mandal: pick.mandal || f.mandal,
      stateId: pick.stateId || '',
      districtId: pick.districtId || '',
    }))
  }

  const handleSave = async () => {
    if (!profileId) return
    if (!form.fullName?.trim()) {
      toast.error('Full name is required')
      return
    }
    const body = buildProfilePatch(form)
    if (!Object.keys(body).length) {
      toast.info('No changes to save')
      return
    }
    setSaving(true)
    try {
      const res = await patchMemberProfile(profileId, body)
      const updated =
        res?.member ||
        res?.data?.member ||
        (res?.data && typeof res.data === 'object' && res.data.id ? res.data : null) ||
        res?.profile ||
        null
      toast.success(res?.message || 'Profile updated')
      onSaved?.(updated)
    } catch (err) {
      toast.error(formatDocActionError(err, 'Profile update failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100 text-left"
      >
        <span className="text-sm font-semibold text-slate-900">Edit profile</span>
        <span className="text-xs text-slate-500">{expanded ? 'Hide' : 'Show'}</span>
      </button>

      {expanded ? (
        <div className="p-4 space-y-5">
          <Section title="Personal">
            <FormField label="Full name *" className="sm:col-span-2">
              <Input value={form.fullName} onChange={set('fullName')} disabled={readOnly} />
            </FormField>
            <FormField label="Father name">
              <Input value={form.fatherName} onChange={set('fatherName')} disabled={readOnly} />
            </FormField>
            <FormField label="Mobile">
              <Input
                value={form.mobileNumber}
                onChange={set('mobileNumber')}
                disabled={readOnly}
                placeholder="10-digit mobile"
              />
            </FormField>
            <FormField label="Email">
              <Input type="email" value={form.email} onChange={set('email')} disabled={readOnly} />
            </FormField>
            <FormField label="Date of birth">
              <Input type="date" value={form.dob} onChange={set('dob')} disabled={readOnly} />
            </FormField>
            <FormField label="Gender">
              <Select value={form.gender} onChange={set('gender')} disabled={readOnly}>
                <option value="">—</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </Select>
            </FormField>
          </Section>

          <Section title="Location">
            <LocationSearchField
              className="sm:col-span-2"
              label="Search area"
              hint="Type district / mandal / village — pick to auto-fill below"
              value={form.workingArea}
              onChange={(v) => {
                setLocationLocked(false)
                setForm((f) => ({
                  ...f,
                  workingArea: v,
                  stateId: '',
                  districtId: '',
                }))
              }}
              onLocationPick={applyLocationPick}
              disabled={readOnly}
            />
            <FormField
              label="State"
              hint={locationLocked && form.state ? 'Auto-filled — edit if needed' : undefined}
            >
              <Input value={form.state} onChange={set('state')} disabled={readOnly} />
            </FormField>
            <FormField
              label="District"
              hint={locationLocked && form.district ? 'Auto-filled — edit if needed' : undefined}
            >
              <Input value={form.district} onChange={set('district')} disabled={readOnly} />
            </FormField>
            <FormField label="Mandal" hint="Manual entry if not in search">
              <Input value={form.mandal} onChange={set('mandal')} disabled={readOnly} />
            </FormField>
            <FormField label="Address line" className="sm:col-span-2">
              <Input
                value={form.addressLine}
                onChange={set('addressLine')}
                disabled={readOnly}
                placeholder="House no., street, village (optional)"
              />
            </FormField>
          </Section>

          <Section title="Work">
            <FormField label="Designation">
              <Input value={form.designation} onChange={set('designation')} disabled={readOnly} />
            </FormField>
            <NewspaperSearchField
              className="sm:col-span-2"
              value={form.currentNewspaper}
              onChange={(v) => setForm((f) => ({ ...f, currentNewspaper: v }))}
              onSelect={(item) =>
                setForm((f) => ({
                  ...f,
                  currentNewspaper: item.title || f.currentNewspaper,
                }))
              }
              disabled={readOnly}
            />
            <FormField label="Publisher mobile">
              <Input
                value={form.publisherMobileNumber}
                onChange={set('publisherMobileNumber')}
                disabled={readOnly}
              />
            </FormField>
          </Section>

          <Section title="Nominee (insurance prefill)">
            <FormField label="Nominee name">
              <Input value={form.nomineeName} onChange={set('nomineeName')} disabled={readOnly} />
            </FormField>
            <FormField label="Relation">
              <Select value={form.nomineeRelation} onChange={set('nomineeRelation')} disabled={readOnly}>
                <option value="">—</option>
                {NOMINEE_RELATIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Nominee mobile">
              <Input value={form.nomineeMobile} onChange={set('nomineeMobile')} disabled={readOnly} />
            </FormField>
          </Section>

          {!readOnly ? (
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button size="sm" loading={saving} onClick={handleSave}>
                Save profile
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
