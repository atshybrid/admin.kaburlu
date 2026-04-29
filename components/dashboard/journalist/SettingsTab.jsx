/**
 * Settings Tab — Journalist Union Admin
 * Union-level: text settings + logo/stamp/idCardLogo/forStamp uploads
 * State-level: per-state text settings + presidentSignature/stateLogo/stateStamp uploads
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { journalistApi } from '../../../lib/api/services/journalistApi'
import {
  Button,
  Card,
  FormField,
  Input,
  toast,
} from '../../ui'

// ── Union-level image fields ──────────────────────────────────────────────────
const UNION_IMAGE_FIELDS = [
  { key: 'logoUrl',          field: 'logo',          label: 'Union Logo',       hint: 'Displayed on press cards and public pages' },
  { key: 'idCardLogoUrl',    field: 'idCardLogo',     label: 'ID Card Logo',     hint: 'Used specifically on ID card layout' },
  { key: 'stampImageUrl',    field: 'stamp',          label: 'Official Stamp',   hint: 'Printed on press card PDF' },
  { key: 'forStampImageUrl', field: 'forStamp',       label: 'For Stamp',        hint: 'Secondary stamp image' },
]

// ── State-level image fields ───────────────────────────────────────────────────
const STATE_IMAGE_FIELDS = [
  { key: 'presidentSignatureUrl', field: 'presidentSignature', label: 'President Signature', hint: 'State president ink signature' },
  { key: 'stateLogoUrl',          field: 'stateLogo',          label: 'State Logo',           hint: 'State-unit logo (overrides union logo)' },
  { key: 'stampImageUrl',         field: 'stateStamp',         label: 'State Stamp',          hint: 'Rubber stamp for this state unit' },
]

// ── Union text fields ──────────────────────────────────────────────────────────
const UNION_TEXT_FIELDS = [
  { key: 'displayName',        label: 'Display Name',        placeholder: 'Full display name' },
  { key: 'registrationNumber', label: 'Registration No.',    placeholder: 'e.g. 343/2025' },
  { key: 'primaryState',       label: 'Primary State',       placeholder: 'e.g. Telangana' },
  { key: 'address',            label: 'Address',             placeholder: 'Head office address' },
  { key: 'phone',              label: 'Phone',               placeholder: '+91 …' },
  { key: 'email',              label: 'Email',               placeholder: 'union@example.com' },
  { key: 'websiteUrl',         label: 'Website',             placeholder: 'https://…' },
  { key: 'foundedYear',        label: 'Founded Year',        placeholder: '2002', type: 'number' },
  { key: 'signatoryName',      label: 'Signatory Name',      placeholder: 'e.g. T. Arunkumar' },
  { key: 'signatoryTitle',     label: 'Signatory Title',     placeholder: 'e.g. Founder & National President' },
]

// ── State text fields ──────────────────────────────────────────────────────────
const STATE_TEXT_FIELDS = [
  { key: 'address', label: 'Address', placeholder: 'State office address' },
  { key: 'phone',   label: 'Phone',   placeholder: '+91 …' },
  { key: 'email',   label: 'Email',   placeholder: 'state@example.com' },
]

function ImageUploadRow({ imageUrl, label, hint, loading, onUpload }) {
  const fileRef = useRef(null)
  return (
    <div className="flex items-start gap-4">
      <div className="w-20 h-20 rounded border bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={label} className="w-full h-full object-contain" />
        ) : (
          <span className="text-[10px] text-gray-400 text-center px-1">{label}</span>
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400 mb-2">{hint}</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onUpload(e.target.files[0])}
        />
        <Button variant="secondary" size="xs" loading={loading} onClick={() => fileRef.current?.click()}>
          {imageUrl ? 'Replace' : 'Upload'}
        </Button>
        {imageUrl && (
          <a href={imageUrl} target="_blank" rel="noreferrer" className="ml-2 text-xs text-brand underline">
            View
          </a>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function SettingsTab({ unionName: propUnionName }) {
  const [settings, setSettings]     = useState(null)
  const [loading, setLoading]       = useState(false)
  const [unionForm, setUnionForm]   = useState({})
  const [saving, setSaving]         = useState(false)
  const [uploadingField, setUploadingField] = useState(null)  // 'logo', 'stamp', etc.

  // State configs
  const [activeState, setActiveState]     = useState(null)
  const [stateForm, setStateForm]         = useState({})
  const [savingState, setSavingState]     = useState(false)
  const [uploadingStateField, setUploadingStateField] = useState(null)

  // For SuperAdmin: which union to manage
  const [unionName, setUnionName] = useState(propUnionName || '')
  const [unionNameInput, setUnionNameInput] = useState(propUnionName || '')

  const load = useCallback(async (name) => {
    const target = name || unionName
    if (!target) return
    setLoading(true)
    try {
      const data = await journalistApi.getSettings(target)
      setSettings(data)
      setUnionForm({
        unionName:          data.unionName || '',
        displayName:        data.displayName || '',
        registrationNumber: data.registrationNumber || '',
        primaryState:       data.primaryState || '',
        address:            data.address || '',
        phone:              data.phone || '',
        email:              data.email || '',
        websiteUrl:         data.websiteUrl || '',
        foundedYear:        String(data.foundedYear || ''),
        signatoryName:      data.signatoryName || '',
        signatoryTitle:     data.signatoryTitle || '',
      })
      // default to first state
      if (data.stateConfigs?.length > 0) {
        const first = data.stateConfigs[0]
        setActiveState(first.state)
        setStateForm({ address: first.address || '', phone: first.phone || '', email: first.email || '' })
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [unionName])

  useEffect(() => { load() }, [load])

  const handleUnionSave = async () => {
    setSaving(true)
    try {
      await journalistApi.updateSettings({
        ...unionForm,
        foundedYear: unionForm.foundedYear ? Number(unionForm.foundedYear) : undefined,
      })
      toast.success('Union settings saved')
      load()
    } catch (err) {
      toast.error(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleUnionImageUpload = async (fieldKey, file) => {
    if (!file) return
    setUploadingField(fieldKey)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('field', fieldKey)
      if (unionForm.unionName) fd.append('unionName', unionForm.unionName)
      const res = await journalistApi.uploadSettingsImage(fd)
      toast.success(`${fieldKey} uploaded`)
      load()
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploadingField(null)
    }
  }

  // Switch to a different state tab
  const switchState = (stateName) => {
    const cfg = settings?.stateConfigs?.find(s => s.state === stateName)
    setActiveState(stateName)
    setStateForm({ address: cfg?.address || '', phone: cfg?.phone || '', email: cfg?.email || '' })
  }

  const handleStateSave = async () => {
    setSavingState(true)
    try {
      await journalistApi.updateStateSettings({
        unionName: unionForm.unionName,
        state: activeState,
        ...stateForm,
      })
      toast.success(`${activeState} settings saved`)
      load()
    } catch (err) {
      toast.error(err.message || 'Save failed')
    } finally {
      setSavingState(false)
    }
  }

  const handleStateImageUpload = async (fieldKey, file) => {
    if (!file) return
    setUploadingStateField(fieldKey)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('field', fieldKey)
      fd.append('state', activeState)
      if (unionForm.unionName) fd.append('unionName', unionForm.unionName)
      await journalistApi.uploadStateImage(fd)
      toast.success(`${fieldKey} uploaded`)
      load()
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploadingStateField(null)
    }
  }

  const activeStateCfg = settings?.stateConfigs?.find(s => s.state === activeState)

  // SuperAdmin: union name prompt
  if (!settings && !loading) {
    return (
      <div className="max-w-sm space-y-3">
        <p className="text-sm text-gray-600">Enter union name to load settings:</p>
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
            placeholder="e.g. Democratic Journalist Federation (Working)"
            value={unionNameInput}
            onChange={(e) => setUnionNameInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setUnionName(unionNameInput); load(unionNameInput) } }}
          />
          <Button variant="primary" size="sm" loading={loading} onClick={() => { setUnionName(unionNameInput); load(unionNameInput) }}>
            Load
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="py-12 text-center text-gray-400">Loading settings…</div>
  }

  return (
    <div className="space-y-8 max-w-2xl">

      {/* ── Union Information ───────────────────────────────────────────────── */}
      <Card title={`Union Settings — ${settings?.unionName || ''}`}>
        <div className="space-y-4 p-4">
          {UNION_TEXT_FIELDS.map(({ key, label, placeholder, type }) => (
            <FormField key={key} label={label}>
              <Input
                type={type || 'text'}
                placeholder={placeholder}
                value={unionForm[key] ?? ''}
                onChange={(e) => setUnionForm(f => ({ ...f, [key]: e.target.value }))}
              />
            </FormField>
          ))}
          <div className="flex justify-end pt-2">
            <Button variant="primary" loading={saving} onClick={handleUnionSave}>Save Union Settings</Button>
          </div>
        </div>
      </Card>

      {/* ── Union Images ────────────────────────────────────────────────────── */}
      <Card title="Union Images">
        <div className="space-y-5 p-4">
          {UNION_IMAGE_FIELDS.map(({ key, field, label, hint }) => (
            <ImageUploadRow
              key={key}
              imageUrl={settings?.[key]}
              label={label}
              hint={hint}
              loading={uploadingField === field}
              onUpload={(file) => handleUnionImageUpload(field, file)}
            />
          ))}
        </div>
      </Card>

      {/* ── State-level Settings ─────────────────────────────────────────────── */}
      {settings?.stateConfigs?.length > 0 && (
        <Card title="State-Level Settings">
          <div className="p-4 space-y-4">
            {/* State selector tabs */}
            <div className="flex gap-2 flex-wrap">
              {settings.stateConfigs.map((cfg) => (
                <button
                  key={cfg.state}
                  onClick={() => switchState(cfg.state)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeState === cfg.state
                      ? 'bg-brand text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cfg.state}
                </button>
              ))}
            </div>

            {activeStateCfg && (
              <div className="space-y-4">
                {/* State text fields */}
                {STATE_TEXT_FIELDS.map(({ key, label, placeholder }) => (
                  <FormField key={key} label={label}>
                    <Input
                      placeholder={placeholder}
                      value={stateForm[key] ?? ''}
                      onChange={(e) => setStateForm(f => ({ ...f, [key]: e.target.value }))}
                    />
                  </FormField>
                ))}
                <div className="flex justify-end">
                  <Button variant="primary" size="sm" loading={savingState} onClick={handleStateSave}>
                    Save {activeState} Settings
                  </Button>
                </div>

                {/* State image uploads */}
                <div className="border-t pt-4 space-y-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{activeState} — Images</p>
                  {STATE_IMAGE_FIELDS.map(({ key, field, label, hint }) => (
                    <ImageUploadRow
                      key={key}
                      imageUrl={activeStateCfg[key]}
                      label={label}
                      hint={hint}
                      loading={uploadingStateField === field}
                      onUpload={(file) => handleStateImageUpload(field, file)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

    </div>
  )
}
