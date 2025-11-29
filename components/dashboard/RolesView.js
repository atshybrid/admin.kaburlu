import { useEffect, useMemo, useState } from 'react'
import { getToken } from '../../utils/auth'

export default function RolesView() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPermissions, setNewPermissions] = useState('')
  const [selectedRole, setSelectedRole] = useState(null)

  const tokenData = useMemo(() => {
    try { return getToken() } catch { return null }
  }, [])

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    'Accept': '*/*',
    ...(tokenData?.token ? { 'Authorization': `Bearer ${tokenData.token}` } : {})
  }), [tokenData])

  const fetchRoles = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('https://app.kaburlumedia.com/api/v1/roles', { headers })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const data = await res.json()
      setRoles(data?.data || [])
    } catch (e) {
      setError(String(e.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRoles() }, [])

  const handleAddRole = async () => {
    setError('')
    try {
      const payload = {
        name: newName.trim(),
        permissions: newPermissions
          .split(',')
          .map(p => p.trim())
          .filter(Boolean)
      }
      const res = await fetch('https://app.kaburlumedia.com/api/v1/roles', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`POST /roles failed: ${res.status} ${body}`)
      }
      setShowAdd(false)
      setNewName('')
      setNewPermissions('')
      await fetchRoles()
    } catch (e) {
      setError(String(e.message || e))
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Roles</div>
            <div className="text-sm text-gray-600">Manage system roles and permissions.</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchRoles} className="px-3 py-2 text-sm rounded border hover:bg-gray-50">Refresh</button>
            <button onClick={() => setShowAdd(true)} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark">Add Role</button>
          </div>
        </div>
        {error ? (
          <div className="mt-3 text-sm text-red-600">{error}</div>
        ) : null}
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="px-4 py-6 text-sm text-gray-600">Loading...</div>
          ) : roles.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-500">No roles found.</div>
          ) : (
            roles.map(r => {
              const permsList = Array.isArray(r.permissions)
                ? r.permissions
                : (r.permissions && typeof r.permissions === 'object'
                  ? Object.entries(r.permissions).flatMap(([mod, acts]) => (Array.isArray(acts) ? acts.map(a => `${mod}:${a}`) : []))
                  : [])
              return (
                <div key={r.id} className="border rounded-xl p-4 flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900">{r.name}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {permsList && permsList.length > 0 ? (
                        permsList.map((p, idx) => (
                          <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-800 border">{p}</span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">No permissions</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark" onClick={()=>setSelectedRole(r)}>Edit Permissions</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-xl border shadow-lg w-full max-w-lg p-4 md:p-5">
            <div className="font-semibold mb-3">Add Role</div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Role Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="e.g. CONTENT_MANAGER" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Permissions (comma-separated)</label>
                <input value={newPermissions} onChange={e => setNewPermissions(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="e.g. articles:create, articles:read" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button onClick={() => setShowAdd(false)} className="px-3 py-2 text-sm rounded border bg-white hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddRole} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark">Save</button>
            </div>
          </div>
        </div>
      )}

      {selectedRole && (
        <RolePermissionsDrawer role={selectedRole} onClose={()=>setSelectedRole(null)} onSaved={()=>{ setSelectedRole(null); fetchRoles() }} />
      )}
    </div>
  )
}

function RolePermissionsDrawer({ role, onClose, onSaved }) {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [moduleKey, setModuleKey] = useState('')
  const [selectedPerms, setSelectedPerms] = useState({}) // { [module]: [actions] }
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
          const firstKey = list[0]?.key || ''
          setModuleKey(firstKey)
          // Prefill from role.permissions
          let initial = {}
          if (Array.isArray(role.permissions)) {
            // Format like 'articles:create' strings
            role.permissions.forEach(p => {
              const [mod, act] = String(p).split(':')
              if (act) {
                initial[mod] = Array.from(new Set([...(initial[mod]||[]), act]))
              }
            })
          } else if (role.permissions && typeof role.permissions === 'object') {
            initial = Object.fromEntries(Object.entries(role.permissions).map(([k,v]) => [k, Array.isArray(v) ? v : []]))
          }
          setSelectedPerms(initial)
        }
      } catch (e) { if (!cancelled) setError(e.message || 'Failed to load modules') } finally { if (!cancelled) setLoading(false) }
    }
    loadModules()
    return () => { cancelled = true }
  }, [])

  function toggleAction(module, act) {
    setSelectedPerms(prev => {
      const current = prev[module] || []
      const next = current.includes(act) ? current.filter(a => a !== act) : [...current, act]
      return { ...prev, [module]: next }
    })
  }

  const selectedModule = modules.find(m => m.key === moduleKey)
  const availableActions = selectedModule?.typicalActions || []
  const currentActions = selectedPerms[moduleKey] || []

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    if (!moduleKey) { setError('Module is required'); return }
    const hasAny = Object.values(selectedPerms).some(arr => Array.isArray(arr) && arr.length>0)
    if (!hasAny) { setError('Select at least one action'); return }
    setSaving(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const payload = { permissions: selectedPerms }
      const res = await fetch(`${base}/api/v1/roles/${role.id}/permissions`, {
        method: 'POST',
        headers: { 'accept': '*/*', 'Content-Type': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(()=>null)
      if (!res.ok) { const msg = (json && (json.message || json.error)) || `Update failed: ${res.status}`; throw new Error(msg) }
      if (onSaved) onSaved(json || null)
      onClose()
    } catch (e) { setError(e.message || 'Failed to update role permissions') } finally { setSaving(false) }
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
            <select className="mt-1 w-full border rounded p-2 bg-white" value={moduleKey} onChange={e=>{ setModuleKey(e.target.value) }} disabled={loading}>
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
                    <input type="checkbox" checked={currentActions.includes(act)} onChange={()=>toggleAction(selectedModule.key, act)} />
                    <span className="text-sm">{act}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {/* Summary of selected modules */}
          {Object.keys(selectedPerms).length>0 && (
            <div className="text-xs text-gray-600">
              <div className="font-semibold mb-1">Selected Permissions</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(selectedPerms)
                  .flatMap(([mod, acts]) => (Array.isArray(acts) ? acts.map(a => ({ mod, a })) : []))
                  .map(({ mod, a }) => (
                    <span key={`${mod}:${a}`} className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 border">{mod}:{a}</span>
                  ))}
              </div>
            </div>
          )}
          {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
          <div className="pt-2 flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
            <button type="submit" disabled={saving || !moduleKey || !Object.values(selectedPerms).some(arr => Array.isArray(arr) && arr.length>0)} className="px-3 py-2 rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{saving ? 'Saving...' : 'Save Permissions'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
