/**
 * Admin Roles Page
 * /admin/roles route
 */
import { useState, useEffect } from 'react'
import SuperAdminLayout from '../../components/admin/SuperAdminLayout'
import { getToken } from '../../utils/auth'

function getApiBase() {
  return (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com').replace(/\/$/, '')
}

function RolesContent() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newRole, setNewRole] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  const loadRoles = async () => {
    setLoading(true)
    setError('')
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/roles`, {
        headers: { 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = await res.json()
      setRoles(Array.isArray(data) ? data : (data?.data || []))
    } catch (e) {
      setError(e.message || 'Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoles()
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newRole.name.trim()) return
    
    setSaving(true)
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify(newRole)
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      setNewRole({ name: '', description: '' })
      setShowAdd(false)
      loadRoles()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Roles</h1>
          <p className="text-sm text-slate-500">Manage user roles and permissions</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark"
        >
          Add Role
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border p-4 mb-6">
          <div className="flex gap-4">
            <input
              placeholder="Role name"
              value={newRole.name}
              onChange={e => setNewRole({...newRole, name: e.target.value})}
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
              required
            />
            <input
              placeholder="Description (optional)"
              value={newRole.description}
              onChange={e => setNewRole({...newRole, description: e.target.value})}
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
            />
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-brand text-white rounded-lg text-sm disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-brand rounded-full animate-spin mx-auto" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : roles.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No roles defined</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {roles.map((r) => (
              <div key={r.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-slate-900">{r.name}</h3>
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                </div>
                {r.description && (
                  <p className="text-sm text-slate-500">{r.description}</p>
                )}
                {r.permissions && r.permissions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {r.permissions.slice(0, 3).map((p, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs bg-slate-100 rounded">
                        {p}
                      </span>
                    ))}
                    {r.permissions.length > 3 && (
                      <span className="px-2 py-0.5 text-xs bg-slate-100 rounded">
                        +{r.permissions.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminRoles() {
  return (
    <SuperAdminLayout title="Roles">
      <RolesContent />
    </SuperAdminLayout>
  )
}
