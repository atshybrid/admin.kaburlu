import { useEffect, useState, useMemo } from 'react'
import { getToken } from '../../utils/auth'
import Loader from '../Loader'

// Avatar component
function UserAvatar({ src, name, size = 'sm' }) {
  const [imgError, setImgError] = useState(false)
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }
  const initials = (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  
  if (src && !imgError) {
    return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover`} onError={() => setImgError(true)} />
  }
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white font-medium`}>
      {initials}
    </div>
  )
}

// Role badge colors
function getRoleBadgeClass(roleName) {
  const role = (roleName || '').toUpperCase()
  if (role.includes('SUPER')) return 'bg-purple-100 text-purple-800 border-purple-200'
  if (role.includes('TENANT') || role.includes('ADMIN')) return 'bg-blue-100 text-blue-800 border-blue-200'
  if (role.includes('DESK') || role.includes('EDITOR')) return 'bg-amber-100 text-amber-800 border-amber-200'
  if (role.includes('REPORTER')) return 'bg-green-100 text-green-800 border-green-200'
  return 'bg-gray-100 text-gray-700 border-gray-200'
}

// Status badge
function StatusBadge({ status }) {
  const isActive = status === 'ACTIVE'
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      {status || 'UNKNOWN'}
    </span>
  )
}

export default function UsersView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(null)
  const [openCreate, setOpenCreate] = useState(false)
  const [openAllLogs, setOpenAllLogs] = useState(false)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTenant, setSelectedTenant] = useState('')
  const [selectedRole, setSelectedRole] = useState('')

  // Get unique tenants and roles from data
  const { tenants, roles } = useMemo(() => {
    const tenantMap = new Map()
    const roleMap = new Map()
    rows.forEach(u => {
      if (u.tenant?.id) tenantMap.set(u.tenant.id, u.tenant)
      if (u.role?.id) roleMap.set(u.role.id, u.role)
    })
    return {
      tenants: Array.from(tenantMap.values()).sort((a, b) => (a.name || '').localeCompare(b.name || '')),
      roles: Array.from(roleMap.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }
  }, [rows])

  // Filter rows
  const filteredRows = useMemo(() => {
    return rows.filter(u => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matches = (
          (u.mobileNumber || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.fullName || '').toLowerCase().includes(q) ||
          (u.role?.name || '').toLowerCase().includes(q) ||
          (u.tenant?.name || '').toLowerCase().includes(q)
        )
        if (!matches) return false
      }
      // Tenant filter
      if (selectedTenant && u.tenant?.id !== selectedTenant) return false
      // Role filter
      if (selectedRole && u.role?.id !== selectedRole) return false
      return true
    })
  }, [rows, searchQuery, selectedTenant, selectedRole])

  async function deleteUser(user) {
    if (!user) return
    const ok = typeof window !== 'undefined' ? window.confirm(`Delete user ${user.fullName || user.mobileNumber || user.email || ''}?`) : true
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Users</h2>
          <p className="text-sm text-gray-500">Manage all platform users</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setOpenAllLogs(true)} className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50 flex items-center gap-1.5">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Activity Logs
          </button>
          <button onClick={fetchUsers} className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50 flex items-center gap-1.5">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
          </button>
          <button onClick={() => setOpenCreate(true)} className="px-4 py-2 text-sm rounded-lg bg-brand text-white hover:bg-brand-dark flex items-center gap-1.5">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="search"
                placeholder="Search by name, mobile, email, role..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
          </div>
          
          {/* Tenant Filter */}
          <div className="sm:w-48">
            <select
              value={selectedTenant}
              onChange={e => setSelectedTenant(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand/20 focus:border-brand"
            >
              <option value="">All Tenants</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="sm:w-40">
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand/20 focus:border-brand"
            >
              <option value="">All Roles</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Clear filters */}
          {(searchQuery || selectedTenant || selectedRole) && (
            <button
              onClick={() => { setSearchQuery(''); setSelectedTenant(''); setSelectedRole('') }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              Clear
            </button>
          )}
        </div>
        
        {/* Results count */}
        <div className="mt-3 text-xs text-gray-500">
          Showing {filteredRows.length} of {rows.length} users
          {selectedTenant && tenants.find(t => t.id === selectedTenant) && (
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
              {tenants.find(t => t.id === selectedTenant)?.name}
            </span>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">User</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Contact</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Tenant</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Created</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && (
                <tr>
                  <td className="px-4 py-8" colSpan={7}>
                    <Loader size={72} label="Loading users..." />
                  </td>
                </tr>
              )}
              {error && !loading && (
                <tr><td className="px-4 py-6 text-center text-red-600" colSpan={7}>{error}</td></tr>
              )}
              {!loading && !error && filteredRows.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={7}>
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                      </svg>
                      <span>No users found</span>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && !error && filteredRows.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  {/* User Info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar src={u.profilePhotoUrl} name={u.fullName || u.mobileNumber} />
                      <div>
                        <div className="font-medium text-gray-900">{u.fullName || '—'}</div>
                        {u.designation?.name && (
                          <div className="text-xs text-gray-500">{u.designation.name}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  {/* Contact */}
                  <td className="px-4 py-3">
                    <div className="text-gray-900">{u.mobileNumber || '—'}</div>
                    <div className="text-xs text-gray-500">{u.email || '—'}</div>
                  </td>
                  
                  {/* Role */}
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full border font-medium ${getRoleBadgeClass(u.role?.name)}`}>
                      {u.role?.name || '—'}
                    </span>
                  </td>
                  
                  {/* Tenant */}
                  <td className="px-4 py-3">
                    {u.tenant ? (
                      <div>
                        <div className="text-gray-900 text-sm">{u.tenant.name}</div>
                        <div className="text-xs text-gray-400">{u.tenant.slug}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  
                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={u.status} />
                  </td>
                  
                  {/* Created */}
                  <td className="px-4 py-3 text-gray-600">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                  </td>
                  
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-brand transition-colors" 
                        onClick={() => setSelected(u)}
                        title="View Details"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                      </button>
                      <button 
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors" 
                        onClick={() => deleteUser(u)}
                        title="Delete User"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <UserDetailsModal user={selected} onClose={() => setSelected(null)} onRefresh={fetchUsers} />
      )}
      {openCreate && (
        <CreateUserModal onClose={() => setOpenCreate(false)} onCreated={() => { setOpenCreate(false); fetchUsers() }} />
      )}
      {openAllLogs && (
        <UserLogsPanel userId={null} onClose={() => setOpenAllLogs(false)} />
      )}
    </div>
  )
}

function UserDetailsModal({ user, onClose, onRefresh }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openEdit, setOpenEdit] = useState(false)
  const [openRolePerms, setOpenRolePerms] = useState(false)
  const [openLogs, setOpenLogs] = useState(false)

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
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl flex flex-col">
        <div className="h-14 px-4 flex items-center justify-between border-b shrink-0">
          <div className="font-semibold">User Details</div>
          <div className="flex items-center gap-2">
            {!loading && !error && data && (
              <>
                <button className="px-2 py-1 text-xs rounded border hover:bg-gray-50" onClick={() => setOpenLogs(true)}>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Logs
                  </span>
                </button>
                <button className="px-2 py-1 text-xs rounded border hover:bg-gray-50" onClick={() => setOpenEdit(true)}>Edit</button>
              </>
            )}
            <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <div className="p-4 overflow-auto flex-1">
          {loading && <Loader size={64} label="Loading user..." />}
          {error && !loading && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
          {!loading && !error && data && (
            <div className="space-y-6 text-sm">
              {/* User Header with Avatar */}
              <div className="flex items-center gap-4 pb-4 border-b">
                <UserAvatar src={data.profilePhotoUrl} name={data.fullName || data.mobileNumber} size="lg" />
                <div>
                  <div className="text-lg font-semibold text-gray-900">{data.fullName || '—'}</div>
                  {data.designation?.name && (
                    <div className="text-sm text-gray-500">{data.designation.name}</div>
                  )}
                  <StatusBadge status={data.status} />
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <div className="font-semibold mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                  Contact
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Mobile" value={data.mobileNumber} />
                  <Field label="Email" value={data.email} />
                </div>
              </div>

              {/* Tenant Info */}
              {data.tenant && (
                <div>
                  <div className="font-semibold mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                    Tenant
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Name" value={data.tenant.name} />
                    <Field label="Slug" value={data.tenant.slug} />
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div>
                <div className="font-semibold mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                    <path strokeWidth="2" strokeLinecap="round" d="M12 6v6l4 2"/>
                  </svg>
                  Timestamps
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Created" value={data.createdAt ? new Date(data.createdAt).toLocaleString() : undefined} />
                  {data.updatedAt && <Field label="Updated" value={new Date(data.updatedAt).toLocaleString()} />}
                  {data.upgradedAt && <Field label="Upgraded" value={new Date(data.upgradedAt).toLocaleString()} />}
                </div>
              </div>

              {/* System Info */}
              {(data.firebaseUid || data.mpin) && (
                <div>
                  <div className="font-semibold mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                      <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                    </svg>
                    System
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.firebaseUid && <Field label="Firebase UID" value={data.firebaseUid} />}
                    {data.mpin && <Field label="MPIN (hashed)" value={data.mpin} />}
                  </div>
                </div>
              )}

              {data.role && (
                <div>
                  <div className="font-semibold mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                    </svg>
                    Role
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Name</div>
                      <span className={`px-2 py-1 text-xs rounded-full border font-medium ${getRoleBadgeClass(data.role.name)}`}>
                        {data.role.name || '—'}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Permissions</div>
                      <div className="px-2 py-2 rounded border bg-gray-50 text-sm text-gray-800 max-h-24 overflow-y-auto">
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
                  <div className="font-semibold mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
                    </svg>
                    Language
                  </div>
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
            <EditUserModal user={data} onClose={() => setOpenEdit(false)} onSaved={(updated) => { setOpenEdit(false); setData(updated || data); if (onRefresh) onRefresh() }} />
          )}
          {openRolePerms && data?.role && (
            <RolePermissionsDrawer role={data.role} onClose={()=>setOpenRolePerms(false)} onSaved={() => { setOpenRolePerms(false); /* reload user to reflect changes */ }} />
          )}
          {openLogs && data && (
            <UserLogsPanel userId={data.id} onClose={() => setOpenLogs(false)} />
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
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">Language {loadingLangs && <Loader size={20} />}</label>
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
      setLoadingRoles(true)
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
      setLoadingLangs(true)
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
  function onlyDigits4(v) { return (v || '').replace(/\D/g, '').slice(0, 4) }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    const mobile = onlyDigits10(mobileNumber)
    if (mobile.length !== 10) { setError('Mobile number must be 10 digits'); return }
    if (mpin && mpin.length !== 4) { setError('MPIN must be exactly 4 digits'); return }
    if (!languageId) { setError('Language is required'); return }
    setSaving(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const payload = { 
        mobileNumber: mobile, 
        languageId,
        ...(roleId && { roleId }),
        ...(mpin && { mpin }),
        ...(email?.trim() && { email: email.trim() })
      }
      const res = await fetch(`${base}/api/v1/users`, {
        method: 'POST',
        headers: { 'accept': '*/*', 'Content-Type': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload)
      })
      if (!res.ok) { 
        const json = await res.json().catch(() => null)
        const msg = json?.message || json?.error || `Create failed: ${res.status}`
        throw new Error(msg) 
      }
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
            <label className="block text-xs font-semibold text-gray-700">Mobile Number (10 digits) <span className="text-red-500">*</span></label>
            <input className="mt-1 w-full border rounded p-2" inputMode="numeric" maxLength={10} value={mobileNumber} onChange={e=>setMobileNumber(onlyDigits10(e.target.value))} placeholder="9876543210" required />
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">Language <span className="text-red-500">*</span> {loadingLangs && <Loader size={16} />}</label>
            <select className="mt-1 w-full border rounded p-2 bg-white" value={languageId} onChange={e=>setLanguageId(e.target.value)} required disabled={loadingLangs}>
              <option value="">{loadingLangs ? 'Loading languages...' : 'Select language'}</option>
              {!loadingLangs && languages.map(l => (
                <option key={l.id} value={l.id}>{l.name}{l.nativeName ? ` (${l.nativeName})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">Role (optional) {loadingRoles && <Loader size={16} />}</label>
            <select className="mt-1 w-full border rounded p-2 bg-white" value={roleId} onChange={e=>setRoleId(e.target.value)} disabled={loadingRoles}>
              <option value="">{loadingRoles ? 'Loading roles...' : 'Select role (optional)'}</option>
              {!loadingRoles && roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700">MPIN (4 digits, optional)</label>
            <input className="mt-1 w-full border rounded p-2" inputMode="numeric" maxLength={4} value={mpin} onChange={e=>setMpin(onlyDigits4(e.target.value))} placeholder="Defaults to last 4 digits of mobile" />
            <p className="mt-1 text-xs text-gray-500">Leave empty to use last 4 digits of mobile number</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700">Email (optional)</label>
            <input className="mt-1 w-full border rounded p-2" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="user@example.com" />
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

// User Logs/Activity Component
function UserLogsPanel({ userId, onClose }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadLogs() {
      setError('')
      setLoading(true)
      try {
        const t = getToken()
        const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
        const endpoint = userId ? `${base}/api/v1/users/${userId}/logs` : `${base}/api/v1/users/logs`
        const res = await fetch(`${endpoint}?page=${page}&limit=50`, {
          headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` }
        })
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        const json = await res.json()
        const list = Array.isArray(json) ? json : (json?.data || json?.logs || [])
        if (!cancelled) {
          setLogs(prev => page === 1 ? list : [...prev, ...list])
          setHasMore(list.length >= 50)
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load logs')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadLogs()
    return () => { cancelled = true }
  }, [userId, page])

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleString()
    } catch { return dateStr }
  }

  const getActionColor = (action) => {
    const colors = {
      'LOGIN': 'bg-green-100 text-green-800',
      'LOGOUT': 'bg-gray-100 text-gray-800',
      'CREATE': 'bg-blue-100 text-blue-800',
      'UPDATE': 'bg-yellow-100 text-yellow-800',
      'DELETE': 'bg-red-100 text-red-800',
      'VIEW': 'bg-purple-100 text-purple-800',
    }
    return colors[action?.toUpperCase()] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            User Activity Logs
          </div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-4 overflow-auto h-[calc(100%-56px)]">
          {loading && page === 1 && <Loader size={64} label="Loading activity logs..." />}
          {error && !loading && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>
          )}
          {!loading && !error && logs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p>No activity logs found</p>
            </div>
          )}
          {logs.length > 0 && (
            <div className="space-y-3">
              {logs.map((log, idx) => (
                <div key={log.id || idx} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                          {log.action || 'ACTION'}
                        </span>
                        <span className="text-xs text-gray-500">{formatDate(log.createdAt || log.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-800 font-medium">{log.message || log.description || '—'}</p>
                      {log.module && (
                        <p className="text-xs text-gray-500 mt-1">Module: {log.module}</p>
                      )}
                      {log.ipAddress && (
                        <p className="text-xs text-gray-400 mt-1">IP: {log.ipAddress}</p>
                      )}
                      {log.userAgent && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate" title={log.userAgent}>Device: {log.userAgent}</p>
                      )}
                      {log.metadata && typeof log.metadata === 'object' && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 cursor-pointer hover:underline">View Details</summary>
                          <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">{JSON.stringify(log.metadata, null, 2)}</pre>
                        </details>
                      )}
                    </div>
                    {log.user && (
                      <div className="text-right text-xs text-gray-500 shrink-0">
                        <p className="font-medium text-gray-700">{log.user.mobileNumber || log.user.email || 'User'}</p>
                        {log.user.role?.name && <p>{log.user.role.name}</p>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {hasMore && (
                <div className="text-center py-4">
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={loading}
                    className="px-4 py-2 text-sm rounded border hover:bg-gray-50 disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
