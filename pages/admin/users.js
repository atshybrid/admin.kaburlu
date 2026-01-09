/**
 * Admin Users Page
 * /admin/users route
 */
import { useState, useEffect } from 'react'
import SuperAdminLayout from '../../components/admin/SuperAdminLayout'
import { getToken } from '../../utils/auth'

function getApiBase() {
  return (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com').replace(/\/$/, '')
}

function UsersContent() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', roleId: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadRoles()
    loadUsers()
  }, [])

  const loadRoles = async () => {
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/roles`, {
        headers: { 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (res.ok) {
        const data = await res.json()
        setRoles(Array.isArray(data) ? data : (data?.data || []))
      }
    } catch (e) {
      console.error('Failed to load roles', e)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/users`, {
        headers: { 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : (data?.data || []))
    } catch (e) {
      setError(e.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newUser.username.trim() || !newUser.email.trim() || !newUser.password.trim()) return
    
    setSaving(true)
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify(newUser)
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      setNewUser({ username: '', email: '', password: '', roleId: '' })
      setShowAdd(false)
      loadUsers()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id === roleId)
    return role?.name || 'No Role'
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500">Manage platform users and permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm w-48"
          />
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark"
          >
            Add User
          </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border p-4 mb-6">
          <h3 className="font-medium text-slate-900 mb-3">New User</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              placeholder="Username"
              value={newUser.username}
              onChange={e => setNewUser({...newUser, username: e.target.value})}
              className="px-3 py-2 border rounded-lg text-sm"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={e => setNewUser({...newUser, email: e.target.value})}
              className="px-3 py-2 border rounded-lg text-sm"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={e => setNewUser({...newUser, password: e.target.value})}
              className="px-3 py-2 border rounded-lg text-sm"
              required
            />
            <select
              value={newUser.roleId}
              onChange={e => setNewUser({...newUser, roleId: e.target.value})}
              className="px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="">Select Role</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="mt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-brand text-white rounded-lg text-sm disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create User'}
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
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No users found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">User</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white text-xs font-medium">
                        {u.username?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span className="font-medium text-slate-900">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {getRoleName(u.roleId)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      u.isActive !== false
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {u.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default function AdminUsers() {
  return (
    <SuperAdminLayout title="Users">
      <UsersContent />
    </SuperAdminLayout>
  )
}
