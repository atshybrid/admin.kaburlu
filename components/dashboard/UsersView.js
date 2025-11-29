import { useEffect, useState } from 'react'
import { getToken } from '../../utils/auth'
import Loader from '../Loader'

export default function UsersView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(null)
  const [openCreate, setOpenCreate] = useState(false)

  async function deleteUser(user) {
    if (!user) return
    const ok = typeof window !== 'undefined' ? window.confirm(`Delete user ${user.mobileNumber || user.email || ''}?`) : true
    if (!ok) return
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const res = await fetch(`${base}/api/v1/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (!res.ok) { const txt = await res.text().catch(()=> ''); throw new Error(`Delete failed: ${res.status}${txt?` - ${txt}`:''}`) }
      await fetchUsers()
    } catch (e) {
      setError(e.message || 'Failed to delete user')
    }
  }

  async function fetchUsers() {
    try {
      setError('')
      setLoading(true)
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const res = await fetch(`${base}/api/v1/users`, {
        headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const json = await res.json()
      const list = Array.isArray(json) ? json : (json?.data || [])
      setRows(list)
    } catch (e) {
      setError(e.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Users</h2>
        <div className="flex items-center gap-2">
          <button onClick={fetchUsers} className="px-3 py-2 text-sm rounded border hover:bg-gray-50">Refresh</button>
          <button onClick={() => setOpenCreate(true)} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark">Add User</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-2">Mobile</th>
                <th className="text-left px-4 py-2">Email</th>
                <th className="text-left px-4 py-2">Role</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Created</th>
                <th className="text-left px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="px-4 py-6" colSpan={6}>
                    <Loader size={72} label="Loading users..." />
                  </td>
                </tr>
              )}
              {error && !loading && (
                <tr><td className="px-4 py-4 text-red-600" colSpan={6}>{error}</td></tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr><td className="px-4 py-4 text-gray-500" colSpan={6}>No users found.</td></tr>
              )}
              {!loading && !error && rows.map((u) => (
                <tr key={u.id || `${u.mobileNumber}-${u.email}`} className="border-t">
                  <td className="px-4 py-2 font-medium text-gray-800">{u.mobileNumber || '-'}</td>
                  <td className="px-4 py-2">{u.email || '-'}</td>
                  <td className="px-4 py-2">{u.role?.name || '-'}</td>
                  <td className="px-4 py-2">{u.status || '-'}</td>
                  <td className="px-4 py-2">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="px-2 py-1 text-xs rounded border hover:bg-gray-50" onClick={()=>setSelected(u)}>View</button>
                      <button className="px-2 py-1 text-xs rounded border border-red-300 text-red-700 hover:bg-red-50" onClick={()=>deleteUser(u)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <UserDetailsModal user={selected} onClose={() => setSelected(null)} />
      )}
      {openCreate && (
        <CreateUserModal onClose={() => setOpenCreate(false)} onCreated={() => { setOpenCreate(false); fetchUsers() }} />
      )}
    </div>
  )
}

function UserDetailsModal({ user, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openEdit, setOpenEdit] = useState(false)
  const [openRolePerms, setOpenRolePerms] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setError('')
      setLoading(true)
      try {
        const t = getToken()
        const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
        const res = await fetch(`${base}/api/v1/users/${user.id}`, {
          headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` }
        })
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        const json = await res.json()
        const obj = json?.data || json
        if (!cancelled) setData(obj)
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load user')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user?.id])

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-semibold">User Details</div>
          <div className="flex items-center gap-2">
            {!loading && !error && data && (
              <button className="px-2 py-1 text-xs rounded border hover:bg-gray-50" onClick={() => setOpenEdit(true)}>Edit</button>
            )}
            <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <div className="p-4 overflow-auto h-[calc(100%-56px)]">
          {loading && <Loader size={64} label="Loading user..." />}
          {error && !loading && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
          {!loading && !error && data && (
            <div className="space-y-6 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Mobile" value={data.mobileNumber} />
                <Field label="Email" value={data.email} />
                <Field label="Status" value={data.status} />
                <Field label="Created" value={data.createdAt ? new Date(data.createdAt).toLocaleString() : undefined} />
                {data.updatedAt && <Field label="Updated" value={new Date(data.updatedAt).toLocaleString()} />}
                {data.upgradedAt && <Field label="Upgraded At" value={new Date(data.upgradedAt).toLocaleString()} />}
                {data.firebaseUid && <Field label="Firebase UID" value={data.firebaseUid} />}
                {data.mpin && <Field label="MPIN (hashed)" value={data.mpin} />}
              </div>

              {data.role && (
                <div>
                  <div className="font-semibold mb-2">Role</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Name" value={data.role.name} />
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Permissions</div>
                      <div className="px-2 py-2 rounded border bg-gray-50 text-sm text-gray-800">
                        {Array.isArray(data.role.permissions)
                          ? (data.role.permissions.length ? data.role.permissions.join(', ') : '—')
                          : (data.role.permissions && typeof data.role.permissions === 'object'
                            ? (Object.entries(data.role.permissions).flatMap(([mod, acts]) => (Array.isArray(acts) ? acts.map(a => `${mod}:${a}`) : [])).join(', ') || '—')
                            : '—')}
                      </div>
                      <div className="mt-2">
                        <button className="px-2 py-1 text-xs rounded border hover:bg-gray-50" onClick={()=>setOpenRolePerms(true)}>Edit Role Permissions</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {data.language && (
                <div>
                  <div className="font-semibold mb-2">Language</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Name" value={data.language.name} />
                    {data.language.code && <Field label="Code" value={data.language.code} />}
                    {data.language.nativeName && <Field label="Native Name" value={data.language.nativeName} />}
                    {data.language.direction && <Field label="Direction" value={data.language.direction} />}
                  </div>
                </div>
              )}
            </div>
          )}
          {openEdit && data && (
            <EditUserModal user={data} onClose={() => setOpenEdit(false)} onSaved={(updated) => { setOpenEdit(false); setData(updated || data) }} />
          )}
          {openRolePerms && data?.role && (
            <RolePermissionsDrawer role={data.role} onClose={()=>setOpenRolePerms(false)} onSaved={() => { setOpenRolePerms(false); /* reload user to reflect changes */ }} />
          )}
        </div>
      </div>
    </div>
  )
}

function RolePermissionsDrawer({ role, onClose, onSaved }) {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [moduleKey, setModuleKey] = useState('')
  const [actions, setActions] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadModules() {
      setLoading(true); setError('')
      try {
        const t = getToken()
        const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
        const res = await fetch(`${base}/api/v1/permissions/modules/detailed`, { headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` } })
        const json = await res.json().catch(()=>null)
        const list = Array.isArray(json) ? json : (json?.data || [])
        if (!cancelled) {
          setModules(list)
          // Prefill: if role has permissions like 'articles:create', split
          const first = list[0]?.key || ''
          setModuleKey(first)
          const typical = list[0]?.typicalActions || []
          setActions([])
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load modules')
      } finally { if (!cancelled) setLoading(false) }
    }
    loadModules()
    return () => { cancelled = true }
  }, [])

  function toggleAction(act) {
    setActions(prev => prev.includes(act) ? prev.filter(a => a !== act) : [...prev, act])
  }

  const selectedModule = modules.find(m => m.key === moduleKey)
  const availableActions = selectedModule?.typicalActions || []

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    if (!moduleKey) { setError('Module is required'); return }
    if (!actions.length) { setError('Select at least one action'); return }
    setSaving(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const payload = { permissions: { [moduleKey]: actions } }
      const res = await fetch(`${base}/api/v1/roles/${role.id}/permissions`, {
        method: 'POST',
        headers: { 'accept': '*/*', 'Content-Type': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(()=>null)
      if (!res.ok) { const msg = (json && (json.message || json.error)) || `Update failed: ${res.status}`; throw new Error(msg) }
      if (onSaved) onSaved(json || null)
      onClose()
    } catch (e) {
      setError(e.message || 'Failed to update role permissions')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-semibold">Edit Role Permissions</div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSave} className="p-4 space-y-4 overflow-auto h-[calc(100%-56px)]">
          <div>
            <div className="text-sm text-gray-600">Role: <span className="font-medium text-gray-800">{role.name}</span></div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700">Module</label>
            <select className="mt-1 w-full border rounded p-2 bg-white" value={moduleKey} onChange={e=>{ setModuleKey(e.target.value); setActions([]) }} disabled={loading}>
              <option value="">{loading ? 'Loading modules...' : 'Select module'}</option>
              {!loading && modules.map(m => (
                <option key={m.key} value={m.key}>{m.displayName || m.key}</option>
              ))}
            </select>
            {selectedModule && (
              <div className="mt-2 text-xs text-gray-600">{selectedModule.description}</div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700">Actions</label>
            {availableActions.length === 0 ? (
              <div className="mt-1 text-sm text-gray-500">No actions available for this module.</div>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {availableActions.map(act => (
                  <label key={act} className="inline-flex items-center gap-2 px-2 py-1 border rounded">
                    <input type="checkbox" checked={actions.includes(act)} onChange={()=>toggleAction(act)} />
                    <span className="text-sm">{act}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
          <div className="pt-2 flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
            <button type="submit" disabled={saving || !moduleKey || actions.length===0} className="px-3 py-2 rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{saving ? 'Saving...' : 'Save Permissions'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div className="px-2 py-1 rounded border bg-gray-50 text-sm text-gray-800 min-h-[30px] flex items-center">{value || '—'}</div>
    </div>
  )
}

function EditUserModal({ user, onClose, onSaved }) {
  const [name, setName] = useState(user.name || '')
  const [mobileNumber, setMobileNumber] = useState(user.mobileNumber || '')
  const [email, setEmail] = useState(user.email || '')
  const [mpin, setMpin] = useState('') // optional; only send if provided
  const [languageId, setLanguageId] = useState(user.language?.id || '')
  const [deviceId, setDeviceId] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [languages, setLanguages] = useState([])
  const [loadingLangs, setLoadingLangs] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadLangs() {
      setLoadingLangs(true); setError('')
      try {
        const t = getToken()
        const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
        const res = await fetch(`${base}/api/v1/languages`, { headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` } })
        const json = await res.json()
        const list = Array.isArray(json) ? json : (json?.data || [])
        if (!cancelled) setLanguages(list)
      } catch { if (!cancelled) setLanguages([]) } finally { if (!cancelled) setLoadingLangs(false) }
    }
    loadLangs()
    return () => { cancelled = true }
  }, [])

  function onlyDigits10(v) { return (v || '').replace(/\D/g, '').slice(0, 10) }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    const mobile = onlyDigits10(mobileNumber)
    if (mobile.length !== 10) { setError('Mobile number must be 10 digits'); return }
    if (!languageId) { setError('Language is required'); return }
    setSaving(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const payload = {
        name: name?.trim() || undefined,
        mobileNumber: mobile,
        email: email?.trim() || undefined,
        languageId,
        deviceId: deviceId?.trim() || undefined,
        location: {
          latitude: latitude ? Number(latitude) : 0,
          longitude: longitude ? Number(longitude) : 0,
        },
      }
      if (mpin?.trim()) payload.mpin = mpin.trim()
      const res = await fetch(`${base}/api/v1/users/${user.id}`, {
        method: 'PUT',
        headers: { 'accept': '*/*', 'Content-Type': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) { const msg = (json && (json.message || json.error)) || `Update failed: ${res.status}`; throw new Error(msg) }
      const updated = json?.data || json || null
      if (onSaved) onSaved(updated)
      onClose()
    } catch (e) { setError(e.message || 'Failed to update user') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-semibold">Edit User</div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSave} className="p-4 space-y-4 overflow-auto h-[calc(100%-56px)]">
          <div>
            <label className="block text-xs font-semibold text-gray-700">Name</label>
            <input className="mt-1 w-full border rounded p-2" value={name} onChange={e=>setName(e.target.value)} placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700">Mobile Number (10 digits)</label>
            <input className="mt-1 w-full border rounded p-2" inputMode="numeric" maxLength={10} value={mobileNumber} onChange={e=>setMobileNumber(onlyDigits10(e.target.value))} placeholder="9999999999" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700">Email</label>
            <input className="mt-1 w-full border rounded p-2" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="john.doe@example.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700">MPIN (optional)</label>
            <input className="mt-1 w-full border rounded p-2" inputMode="numeric" maxLength={6} value={mpin} onChange={e=>setMpin(e.target.value.replace(/\D/g,''))} placeholder="1234" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 flex items-center gap-2">Language {loadingLangs && <Loader size={20} />}</label>
            <select className="mt-1 w-full border rounded p-2 bg-white" value={languageId} onChange={e=>setLanguageId(e.target.value)} required disabled={loadingLangs}>
              <option value="">{loadingLangs ? 'Loading languages...' : 'Select language'}</option>
              {!loadingLangs && languages.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Latitude</label>
              <input className="mt-1 w-full border rounded p-2" inputMode="decimal" value={latitude} onChange={e=>setLatitude(e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Longitude</label>
              <input className="mt-1 w-full border rounded p-2" inputMode="decimal" value={longitude} onChange={e=>setLongitude(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700">Device ID</label>
            <input className="mt-1 w-full border rounded p-2" value={deviceId} onChange={e=>setDeviceId(e.target.value)} placeholder="1234" />
          </div>
          {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
          <div className="pt-2 flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{saving? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CreateUserModal({ onClose, onCreated }) {
  const [mobileNumber, setMobileNumber] = useState('')
  const [mpin, setMpin] = useState('')
  const [email, setEmail] = useState('')
  const [roleId, setRoleId] = useState('')
  const [languageId, setLanguageId] = useState('')
  const [roles, setRoles] = useState([])
  const [languages, setLanguages] = useState([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [loadingLangs, setLoadingLangs] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadRoles() {
      setLoadingRoles(true); setError('')
      try {
        const t = getToken()
        const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
        const res = await fetch(`${base}/api/v1/roles`, { headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` } })
        const json = await res.json()
        const list = Array.isArray(json) ? json : (json?.data || [])
        if (!cancelled) setRoles(list)
      } catch { if (!cancelled) setRoles([]) } finally { if (!cancelled) setLoadingRoles(false) }
    }
    async function loadLangs() {
      setLoadingLangs(true); setError('')
      try {
        const t = getToken()
        const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
        const res = await fetch(`${base}/api/v1/languages`, { headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` } })
        const json = await res.json()
        const list = Array.isArray(json) ? json : (json?.data || [])
        if (!cancelled) setLanguages(list)
      } catch { if (!cancelled) setLanguages([]) } finally { if (!cancelled) setLoadingLangs(false) }
    }
    loadRoles(); loadLangs()
    return () => { cancelled = true }
  }, [])

  function onlyDigits10(v) { return (v || '').replace(/\D/g, '').slice(0, 10) }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    const mobile = onlyDigits10(mobileNumber)
    if (mobile.length !== 10) { setError('Mobile number must be 10 digits'); return }
    if (!mpin || mpin.length < 4) { setError('MPIN must be at least 4 digits'); return }
    if (!roleId) { setError('Role is required'); return }
    if (!languageId) { setError('Language is required'); return }
    setSaving(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const payload = { roleId, languageId, mobileNumber: mobile, mpin, email: email?.trim() || undefined }
      const res = await fetch(`${base}/api/v1/users`, {
        method: 'POST',
        headers: { 'accept': '*/*', 'Content-Type': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload)
      })
      if (!res.ok) { const txt = await res.text().catch(()=> ''); throw new Error(`Create failed: ${res.status}${txt?` - ${txt}`:''}`) }
      if (onCreated) onCreated()
      onClose()
      setMobileNumber(''); setMpin(''); setEmail(''); setRoleId(''); setLanguageId('')
    } catch (e) { setError(e.message || 'Failed to create user') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-semibold">Add User</div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSave} className="p-4 space-y-4 overflow-auto h-[calc(100%-56px)]">
          <div>
            <label className="block text-xs font-semibold text-gray-700">Mobile Number (10 digits)</label>
            <input className="mt-1 w-full border rounded p-2" inputMode="numeric" maxLength={10} value={mobileNumber} onChange={e=>setMobileNumber(onlyDigits10(e.target.value))} placeholder="9999999999" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700">MPIN</label>
            <input className="mt-1 w-full border rounded p-2" inputMode="numeric" maxLength={6} value={mpin} onChange={e=>setMpin(e.target.value.replace(/\D/g,''))} placeholder="1234" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700">Email (optional)</label>
            <input className="mt-1 w-full border rounded p-2" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="user@example.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 flex items-center gap-2">Role {loadingRoles && <Loader size={20} />}</label>
            <select className="mt-1 w-full border rounded p-2 bg-white" value={roleId} onChange={e=>setRoleId(e.target.value)} required disabled={loadingRoles}>
              <option value="">{loadingRoles ? 'Loading roles...' : 'Select role'}</option>
              {!loadingRoles && roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 flex items-center gap-2">Language {loadingLangs && <Loader size={20} />}</label>
            <select className="mt-1 w-full border rounded p-2 bg-white" value={languageId} onChange={e=>setLanguageId(e.target.value)} required disabled={loadingLangs}>
              <option value="">{loadingLangs ? 'Loading languages...' : 'Select language'}</option>
              {!loadingLangs && languages.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
          <div className="pt-2 flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{saving? 'Creating...' : 'Create User'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
