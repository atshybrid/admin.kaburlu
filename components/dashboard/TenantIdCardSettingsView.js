import { useEffect, useMemo, useState } from 'react'
import { getToken } from '../../utils/auth'

// Clean rewritten component: removed accidental nested imports/component duplication.
export default function TenantIdCardSettingsView() {
  const [tenants, setTenants] = useState([])
  const [tenantsLoading, setTenantsLoading] = useState(false)
  const [tenantsError, setTenantsError] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [settings, setSettings] = useState(null)
  const [list, setList] = useState([])
  const [meta, setMeta] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 })
  const [showEditor, setShowEditor] = useState(false)

  const [form, setForm] = useState({
    templateId: 'STYLE_1',
    frontLogoUrl: '',
    roundStampUrl: '',
    signUrl: '',
    primaryColor: '#004f9f',
    secondaryColor: '#ff0000',
    termsJson: [''],
    officeAddress: '',
    helpLine1: '',
    helpLine2: '',
    validityType: 'PER_USER_DAYS',
    validityDays: 0,
    fixedValidUntil: '',
    idPrefix: 'KM',
    idDigits: 6,
  })

  const tokenData = useMemo(() => { try { return getToken() } catch { return null } }, [])
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
  const headers = useMemo(() => ({ 'Content-Type': 'application/json', 'Accept': '*/*', ...(tokenData?.token ? { 'Authorization': `Bearer ${tokenData.token}` } : {}) }), [tokenData])

  const fetchTenants = async () => {
    setTenantsError('')
    setTenantsLoading(true)
    try {
      // Attempt richer list first
      let res = await fetch(`${apiBase}/api/v1/tenants?full=true`, { headers: { 'accept': '*/*', 'Authorization': headers['Authorization'] || '' } })
      if (!res.ok) {
        // fallback basic
        res = await fetch(`${apiBase}/api/v1/tenants`, { headers: { 'accept': '*/*', 'Authorization': headers['Authorization'] || '' } })
      }
      const data = await res.json().catch(()=>null)
      if (!res.ok) throw new Error(data?.message || data?.error || `TENANTS_FAILED ${res.status}`)
      const arr = Array.isArray(data) ? data : (data?.data || [])
      setTenants(arr)
      if (!tenantId && arr.length) setTenantId(arr[0].id)
    } catch (e) {
      setTenantsError(String(e.message || e))
    } finally { setTenantsLoading(false) }
  }

  const fetchSettingsList = async (page = meta.page, pageSize = meta.pageSize) => {
    try {
      const res = await fetch(`${apiBase}/api/v1/tenants/id-card-settings?page=${page}&pageSize=${pageSize}`, { headers })
      if (!res.ok) throw new Error('LIST_FAILED')
      const data = await res.json()
      setList(data?.data || [])
      setMeta(data?.meta || { page, pageSize, total: 0, totalPages: 0 })
    } catch {}
  }

  const blankForm = () => ({
    templateId: 'STYLE_1',
    frontLogoUrl: '',
    roundStampUrl: '',
    signUrl: '',
    primaryColor: '#004f9f',
    secondaryColor: '#ff0000',
    termsJson: [''],
    officeAddress: '',
    helpLine1: '',
    helpLine2: '',
    validityType: 'PER_USER_DAYS',
    validityDays: 0,
    fixedValidUntil: '',
    idPrefix: 'KM',
    idDigits: 6,
  })

  const fetchSettings = async (id) => {
    if (!id) return
    setLoading(true); setError(''); setSettings(null)
    try {
      const res = await fetch(`${apiBase}/api/v1/tenants/${id}/id-card-settings`, { headers })
      if (res.status === 404) {
        setSettings(null)
        setForm(blankForm())
      } else if (!res.ok) {
        const body = await res.text(); throw new Error(`GET_FAILED ${res.status} ${body}`)
      } else {
        const data = await res.json()
        setSettings(data)
        setForm({
          templateId: data.templateId || 'STYLE_1',
          frontLogoUrl: data.frontLogoUrl || '',
          roundStampUrl: data.roundStampUrl || '',
          signUrl: data.signUrl || '',
          primaryColor: data.primaryColor || '#004f9f',
          secondaryColor: data.secondaryColor || '#ff0000',
          termsJson: Array.isArray(data.termsJson) && data.termsJson.length ? data.termsJson.slice(0,5) : [''],
          officeAddress: data.officeAddress || '',
          helpLine1: data.helpLine1 || '',
          helpLine2: data.helpLine2 || '',
          validityType: data.validityType || 'PER_USER_DAYS',
          validityDays: data.validityDays ?? 0,
          fixedValidUntil: data.fixedValidUntil || '',
          idPrefix: data.idPrefix || 'KM',
          idDigits: data.idDigits ?? 6,
        })
      }
    } catch (e) { setError(String(e.message || e)) } finally { setLoading(false) }
  }

  useEffect(() => { fetchTenants(); fetchSettingsList(1, meta.pageSize) }, [])
  useEffect(() => { if (showEditor && tenants.length === 0 && !tenantsLoading) fetchTenants() }, [showEditor])

  const updateForm = (patch) => setForm(f => ({ ...f, ...patch }))

  const saveSettings = async () => {
    if (!tenantId) return
    setError('')
    try {
      const payload = {
        templateId: form.templateId,
        frontLogoUrl: form.frontLogoUrl,
        roundStampUrl: form.roundStampUrl,
        signUrl: form.signUrl,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        termsJson: (form.termsJson || []).map(t => String(t).trim()).filter(Boolean).slice(0,5),
        officeAddress: form.officeAddress,
        helpLine1: form.helpLine1,
        helpLine2: form.helpLine2,
        validityType: form.validityType,
        validityDays: form.validityType === 'PER_USER_DAYS' ? Number(form.validityDays || 0) : 0,
        fixedValidUntil: form.validityType === 'FIXED_END_DATE' ? form.fixedValidUntil : null,
        idPrefix: form.idPrefix,
        idDigits: Number(form.idDigits || 6),
      }
      const res = await fetch(`${apiBase}/api/v1/tenants/${tenantId}/id-card-settings`, { method: 'PUT', headers, body: JSON.stringify(payload) })
      if (!res.ok) { const body = await res.text(); throw new Error(`PUT_FAILED ${res.status} ${body}`) }
      await fetchSettings(tenantId)
    } catch (e) { setError(String(e.message || e)) }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border shadow-sm p-4 md:p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">ID Card Settings List</div>
            <div className="text-sm text-gray-600">Existing settings across tenants.</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchSettingsList(1, meta.pageSize)} className="px-2 py-2 text-xs rounded border bg-white hover:bg-gray-50">Refresh</button>
            <button onClick={() => { if(!tenantsLoading && tenants.length===0) fetchTenants(); setTenantId(''); setSettings(null); setForm(blankForm()); setShowEditor(true) }} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark">Add Settings</button>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 px-2">Tenant</th>
                <th className="py-2 px-2">Template</th>
                <th className="py-2 px-2">Updated</th>
                <th className="py-2 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td className="py-3 px-2" colSpan={4}>No settings found.</td></tr>
              ) : list.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="py-2 px-2 font-medium">{r.tenant?.name || r.tenantId}</td>
                  <td className="py-2 px-2">{r.templateId}</td>
                  <td className="py-2 px-2 text-gray-500">{new Date(r.updatedAt || r.createdAt).toLocaleString()}</td>
                  <td className="py-2 px-2">
                    <button onClick={() => { setTenantId(r.tenantId); setShowEditor(true); fetchSettings(r.tenantId) }} className="px-2 py-1 text-xs rounded bg-brand text-white hover:bg-brand-dark">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
          <div>Page {meta.page} of {meta.totalPages || 1}</div>
          <div className="flex items-center gap-2">
            <button disabled={meta.page <= 1} onClick={() => { const p = Math.max(1, meta.page - 1); fetchSettingsList(p, meta.pageSize); setMeta(m => ({ ...m, page: p })) }} className="px-2 py-1 rounded border bg-white hover:bg-gray-50 disabled:opacity-50">Prev</button>
            <button disabled={meta.page >= (meta.totalPages || 1)} onClick={() => { const p = Math.min(meta.totalPages || 1, meta.page + 1); fetchSettingsList(p, meta.pageSize); setMeta(m => ({ ...m, page: p })) }} className="px-2 py-1 rounded border bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {showEditor && (
        <IdCardSettingsEditorDrawer
          tenants={tenants}
          tenantId={tenantId}
          form={form}
          loading={loading}
          error={error}
          tenantsLoading={tenantsLoading}
          tenantsError={tenantsError}
          retryTenants={fetchTenants}
          onChangeForm={updateForm}
          onSelectTenant={(id)=>{ setTenantId(id); fetchSettings(id) }}
          onClose={()=>setShowEditor(false)}
          onSave={async()=>{ await saveSettings(); setShowEditor(false); fetchSettingsList(meta.page, meta.pageSize) }}
          onRefresh={()=>tenantId && fetchSettings(tenantId)}
          isCreate={!settings}
        />
      )}
    </div>
  )
}

function MediaUploadButton({ onUploaded }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const tokenData = useMemo(() => { try { return getToken() } catch { return null } }, [])
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
  const uploadUrl = `${apiBase}/api/v1/media/upload`
  const doUpload = async (file) => {
    setErr(''); if (!file) return; setBusy(true)
    try {
      // Basic client-side validation (optional enhancement)
      if (file.size > 5 * 1024 * 1024) throw new Error('Max size 5MB')
      if (!file.type.startsWith('image/')) throw new Error('Only images allowed')
      const form = new FormData()
      form.append('file', file)
      form.append('key', file.name || 'image')
      form.append('filename', file.name || 'image')
      form.append('folder', '')
      form.append('kind', 'image')
      const res = await fetch(uploadUrl, { method: 'POST', headers: { 'Authorization': `Bearer ${tokenData?.token || ''}` }, body: form })
      const json = await res.json().catch(()=>null)
      if (!res.ok) throw new Error((json && (json.message || json.error)) || `Upload failed: ${res.status}`)
      const url = json?.publicUrl || json?.data?.publicUrl || json?.data?.url || json?.url || ''
      if (url && onUploaded) onUploaded(url)
    } catch (e) { setErr(String(e.message || e)) } finally { setBusy(false) }
  }
  return (
    <div className="flex items-center gap-2">
      <label className="px-2 py-2 text-xs rounded border bg-white hover:bg-gray-50 cursor-pointer">
        Upload
        <input type="file" accept="image/*" className="hidden" onChange={e=>doUpload(e.target.files?.[0] || null)} />
      </label>
      {busy && <span className="text-xs text-gray-500">Uploading...</span>}
      {err && <span className="text-xs text-red-600">{err}</span>}
    </div>
  )
}

function IdCardSettingsEditorDrawer({ tenants, tenantId, form, loading, error, tenantsLoading, tenantsError, retryTenants, onChangeForm, onSelectTenant, onClose, onSave, onRefresh, isCreate }) {
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-semibold">{isCreate ? 'Add' : 'Edit'} ID Card Settings</div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-4 space-y-4 overflow-auto h-[calc(100%-56px)]">
          <div>
            <label className="text-sm text-gray-600 flex items-center justify-between">
              <span>Select Tenant</span>
              {tenantsLoading && <span className="text-xs text-gray-500">Loading...</span>}
            </label>
            <select value={tenantId} disabled={tenantsLoading} onChange={e => onSelectTenant(e.target.value)} className="mt-1 w-full border rounded px-3 py-2">
              <option value="">{tenantsLoading ? 'Loading tenants...' : 'Select tenant'}</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name || t.title || t.code || t.subdomain || t.id}</option>
              ))}
            </select>
            {tenantsError && <div className="mt-1 text-xs text-red-600 flex items-center gap-2">
              <span>{tenantsError}</span>
              <button onClick={retryTenants} className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-50">Retry</button>
            </div>}
          </div>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          {!tenantId ? (
            <div className="text-sm text-gray-600">Please select a tenant to continue.</div>
          ) : loading ? (
            <div className="text-sm text-gray-600">Loading...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Template</label>
                  <select value={form.templateId} onChange={e => onChangeForm({ templateId: e.target.value })} className="mt-1 w-full border rounded px-3 py-2">
                    <option value="STYLE_1">STYLE_1</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Front Logo URL</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input value={form.frontLogoUrl} onChange={e => onChangeForm({ frontLogoUrl: e.target.value })} className="flex-1 border rounded px-3 py-2" placeholder="https://..." />
                    <MediaUploadButton onUploaded={(url)=>onChangeForm({ frontLogoUrl: url })} />
                  </div>
                  {form.frontLogoUrl && <img src={form.frontLogoUrl} alt="logo" className="mt-2 h-12 object-contain border rounded" />}
                </div>
                <div>
                  <label className="text-sm text-gray-600">Round Stamp URL</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input value={form.roundStampUrl} onChange={e => onChangeForm({ roundStampUrl: e.target.value })} className="flex-1 border rounded px-3 py-2" placeholder="https://..." />
                    <MediaUploadButton onUploaded={(url)=>onChangeForm({ roundStampUrl: url })} />
                  </div>
                  {form.roundStampUrl && <img src={form.roundStampUrl} alt="stamp" className="mt-2 h-12 w-12 object-contain border rounded" />}
                </div>
                <div>
                  <label className="text-sm text-gray-600">Sign URL</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input value={form.signUrl} onChange={e => onChangeForm({ signUrl: e.target.value })} className="flex-1 border rounded px-3 py-2" placeholder="https://..." />
                    <MediaUploadButton onUploaded={(url)=>onChangeForm({ signUrl: url })} />
                  </div>
                  {form.signUrl && <img src={form.signUrl} alt="sign" className="mt-2 h-12 object-contain border rounded" />}
                </div>
                <div>
                  <label className="text-sm text-gray-600">Primary Color</label>
                  <input type="color" value={form.primaryColor} onChange={e => onChangeForm({ primaryColor: e.target.value })} className="mt-1 w-16 h-10 p-0 border rounded" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Secondary Color</label>
                  <input type="color" value={form.secondaryColor} onChange={e => onChangeForm({ secondaryColor: e.target.value })} className="mt-1 w-16 h-10 p-0 border rounded" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Office Address</label>
                  <textarea value={form.officeAddress} onChange={e => onChangeForm({ officeAddress: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" rows={3} />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Help Line 1</label>
                  <input value={form.helpLine1} onChange={e => onChangeForm({ helpLine1: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" placeholder="digits" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Help Line 2</label>
                  <input value={form.helpLine2} onChange={e => onChangeForm({ helpLine2: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" placeholder="digits" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Validity Type</label>
                  <select value={form.validityType} onChange={e => onChangeForm({ validityType: e.target.value })} className="mt-1 w-full border rounded px-3 py-2">
                    <option value="PER_USER_DAYS">PER_USER_DAYS</option>
                    <option value="FIXED_END_DATE">FIXED_END_DATE</option>
                  </select>
                </div>
                {form.validityType === 'PER_USER_DAYS' ? (
                  <div>
                    <label className="text-sm text-gray-600">Validity Days</label>
                    <input type="number" value={form.validityDays} onChange={e => onChangeForm({ validityDays: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" />
                  </div>
                ) : (
                  <div>
                    <label className="text-sm text-gray-600">Fixed Valid Until</label>
                    <input type="datetime-local" value={form.fixedValidUntil ? new Date(form.fixedValidUntil).toISOString().slice(0,16) : ''} onChange={e => onChangeForm({ fixedValidUntil: e.target.value ? new Date(e.target.value).toISOString() : '' })} className="mt-1 w-full border rounded px-3 py-2" />
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-600">ID Prefix</label>
                  <input value={form.idPrefix} onChange={e => onChangeForm({ idPrefix: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">ID Digits</label>
                  <input type="number" value={form.idDigits} onChange={e => onChangeForm({ idDigits: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" />
                </div>
              </div>
              <div className="mt-6">
                <div className="font-medium">Terms (max 5)</div>
                <div className="space-y-2 mt-2">
                  {(form.termsJson || []).map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input value={t} onChange={e => onChangeForm({ termsJson: (form.termsJson || []).map((v, i) => i===idx ? e.target.value : v) })} className="flex-1 border rounded px-3 py-2" placeholder={`Point ${idx+1}`} />
                      <button onClick={() => onChangeForm({ termsJson: (form.termsJson || []).filter((_, i) => i!==idx) })} className="px-2 py-2 text-xs rounded border bg-white hover:bg-gray-50">Remove</button>
                    </div>
                  ))}
                  {(form.termsJson || []).length < 5 && (
                    <button onClick={() => onChangeForm({ termsJson: [...(form.termsJson || []), ''] })} className="px-3 py-2 text-sm rounded border bg-white hover:bg-gray-50">Add Point</button>
                  )}
                </div>
              </div>
            </>
          )}
          <div className="mt-6 flex items-center justify-end gap-2">
            <button onClick={onRefresh} className="px-3 py-2 text-sm rounded border bg-white hover:bg-gray-50">Refresh</button>
            <button onClick={onSave} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark">{isCreate ? 'Add Settings' : 'Update Settings'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
