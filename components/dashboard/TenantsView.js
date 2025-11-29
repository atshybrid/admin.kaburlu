import { useEffect, useState } from 'react'
import { getToken } from '../../utils/auth'
import Loader from '../Loader'

function filterIds(value) {
  if (Array.isArray(value)) return value.map(filterIds)
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      const lower = k.toLowerCase()
      if (lower === 'id' || lower.endsWith('id')) continue
      out[k] = filterIds(v)
    }
    return out
  }
  return value
}

function formatIsoDate(v) {
  if (!v) return '—'
  try {
    const d = new Date(v)
    if (isNaN(d.getTime())) return v
    const dd = String(d.getDate()).padStart(2,'0')
    const mm = String(d.getMonth()+1).padStart(2,'0')
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  } catch { return v }
}

function categoryDisplayName(c) {
  if (!c) return ''
  return (
    c.translatedName ||
    c.translation?.name ||
    c.localizedName ||
    c.name ||
    c.category?.name ||
    c.title ||
    c.label ||
    c.slug ||
    ''
  )
}

function Field({ label, value, full }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div className="px-2 py-1 rounded border bg-gray-50 text-sm text-gray-800 min-h-[30px] flex items-center">{value || '—'}</div>
    </div>
  )
}

function TenantFormModal({ open, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [prgiNumber, setPrgiNumber] = useState('')
  const [stateId, setStateId] = useState('')
  // Removed create default domains option
  const [states, setStates] = useState([])
  const [statesLoading, setStatesLoading] = useState(false)
  const [statesError, setStatesError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function loadStates() {
      setStatesError('')
      setStatesLoading(true)
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      try {
        const t = getToken()
        let res = await fetch(base + '/api/v1/states', {
          headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` }
        })
        if (!res.ok && (res.status === 401 || res.status === 403)) {
          // Retry without auth
          res = await fetch(base + '/api/v1/states', { headers: { 'accept': '*/*' } })
        }
        if (!res.ok) throw new Error(`States request failed: ${res.status}`)
        const json = await res.json()
        const list = Array.isArray(json) ? json : (json?.data || [])
        if (!cancelled) setStates(list)
      } catch (e) {
        if (!cancelled) {
          setStates([])
          setStatesError(e.message || 'Failed to load states')
        }
      } finally {
        if (!cancelled) setStatesLoading(false)
      }
    }
    loadStates()
    return () => { cancelled = true }
  }, [open])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Name is required')
    if (!stateId) return setError('State is required')
    setLoading(true)
    try {
      const t = getToken()
      const payload = { name: name.trim(), prgiNumber: prgiNumber.trim() || undefined, stateId }
      const res = await fetch((process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com') + '/api/v1/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error(`Create failed: ${res.status}`)
      const created = await res.json()
      onCreated(created?.data || created)
      onClose()
      setName(''); setPrgiNumber(''); setStateId('')
    } catch (e) {
      setError(e.message || 'Failed to create tenant')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-semibold">Add Tenant</div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-auto h-[calc(100%-56px)]">
          <div>
            <label className="block text-xs font-semibold text-gray-700">Name</label>
            <input className="mt-1 w-full border rounded p-2" value={name} onChange={e=>setName(e.target.value)} placeholder="Kaburlu Media" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700">PRGI Number</label>
            <input className="mt-1 w-full border rounded p-2" value={prgiNumber} onChange={e=>setPrgiNumber(e.target.value)} placeholder="PRGI-TS-2025-01987" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 flex items-center gap-2">State {statesLoading && <Loader size={20} />}</label>
            <select className="mt-1 w-full border rounded p-2 bg-white" value={stateId} onChange={e=>setStateId(e.target.value)} required disabled={statesLoading || (!!statesError && states.length===0)}>
              <option value="">{statesLoading ? 'Loading states...' : (statesError ? 'Failed to load states' : 'Select a state')}</option>
              {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {statesError && <div className="text-[11px] text-red-600 mt-1">{statesError}</div>}
          </div>
          {/* Create default domains option removed per requirement */}
          {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
          <div className="pt-2 flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
            <button type="submit" disabled={loading} className="px-3 py-2 rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{loading? 'Creating...' : 'Create Tenant'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TenantsView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(null)
  const [openCreate, setOpenCreate] = useState(false)
  const [verifyTarget, setVerifyTarget] = useState(null)
  const [entityFor, setEntityFor] = useState(null)
  const [domainFor, setDomainFor] = useState(null)
  const [entitiesLoading, setEntitiesLoading] = useState(false)
  const [entitiesError, setEntitiesError] = useState('')
  const [entities, setEntities] = useState([])
  const [editBusinessFor, setEditBusinessFor] = useState(null)
  const [verifyDomainFor, setVerifyDomainFor] = useState(null)
  const [linkCategoriesFor, setLinkCategoriesFor] = useState(null)
  const [tenantCategories, setTenantCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoriesError, setCategoriesError] = useState('')

  async function fetchTenants() {
    try {
      setError('')
      setLoading(true)
      const t = getToken()
      const res = await fetch((process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com') + '/api/v1/tenants?full=true', {
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${t?.token || ''}`
        }
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = await res.json()
      const list = Array.isArray(data) ? data : (data?.data || [])
      setRows(list)
      return list
    } catch (e) {
      setError(e.message || 'Failed to load tenants')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTenants() }, [])

  async function fetchEntities(tenant) {
    if (!tenant?.id) return
    try {
      setEntitiesError('')
      setEntitiesLoading(true)
      const t = getToken()
      const res = await fetch((process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com') + `/api/v1/tenants/${tenant.id}/entity`, {
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${t?.token || ''}`
        }
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = await res.json()
      setEntities(Array.isArray(data) ? data : (data?.data || []))
    } catch (e) {
      setEntitiesError(e.message || 'Failed to load entities')
      setEntities([])
    } finally {
      setEntitiesLoading(false)
    }
  }

  async function fetchTenantCategories(tenant) {
    if (!tenant?.id) return
    try {
      setCategoriesError('')
      setCategoriesLoading(true)
      const t = getToken()
      const res = await fetch((process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com') + `/api/v1/tenants/${tenant.id}/categories`, {
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        }
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = await res.json()
      setTenantCategories(Array.isArray(data) ? data : (data?.data || []))
    } catch (e) {
      setCategoriesError(e.message || 'Failed to load categories')
      setTenantCategories([])
    } finally {
      setCategoriesLoading(false)
    }
  }

  useEffect(() => {
    if (selected) {
      fetchEntities(selected)
      fetchTenantCategories(selected)
    } else {
      setEntities([])
      setEntitiesError('')
      setEntitiesLoading(false)
      setTenantCategories([])
      setCategoriesError('')
      setCategoriesLoading(false)
    }
  }, [selected])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold">Tenants</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setOpenCreate(true)} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark">Add Tenant</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">PRGI Number</th>
                <th className="text-left px-4 py-2">Domains</th>
                <th className="text-left px-4 py-2">Language</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-right px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="px-4 py-6" colSpan={6}>
                    <Loader size={72} label="Loading tenants..." />
                  </td>
                </tr>
              )}
              {error && !loading && (
                <tr><td className="px-4 py-4 text-red-600" colSpan={4}>{error}</td></tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr><td className="px-4 py-4 text-gray-500" colSpan={4}>No tenants found.</td></tr>
              )}
              {!loading && !error && rows.map((r) => {
                const hasEntity = !!r.entity
                const languageName = r.entity?.language?.name || '-'
                const anyPending = (r.domains || []).some(d => (d.status || '').toUpperCase() === 'PENDING')
                const showAddDomain = !r.domains?.length && !anyPending
                const domainChips = (r.domains || []).map(d => d.domain)
                const primaryDomain = (r.domains || []).find(d => d.isPrimary)?.domain || ''
                const hasEpaper = (r.domains || []).some(d => (d.domain || '').startsWith('epaper.'))
                const domainDisplay = domainChips.length === 0 ? '-' : domainChips.slice(0,2).join(', ') + (domainChips.length > 2 ? ` +${domainChips.length - 2}` : '')
                return (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-2 font-medium text-gray-800">{r.name}</td>
                    <td className="px-4 py-2">{r.prgiNumber || '-'}</td>
                    <td className="px-4 py-2">
                      {domainChips.length === 0 ? (
                        <span className="text-gray-500">-</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {(r.domains || []).slice(0,3).map((d,i) => {
                            const status = (d.status || '').toUpperCase()
                            const cls = status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : status === 'PENDING' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            return (
                              <span key={i} className={`px-2 py-0.5 text-[11px] rounded border ${cls}`}>{d.domain}</span>
                            )
                          })}
                          {domainChips.length > 3 && <span className="px-2 py-0.5 text-[11px] rounded bg-gray-100 border text-gray-600">+{domainChips.length - 3}</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">{languageName}</td>
                    <td className="px-4 py-2">
                      <button onClick={() => setVerifyTarget(r)} className={`px-2 py-1 rounded text-xs border ${r.prgiStatus === 'VERIFIED' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'}`} title="Update status or add remark">
                        {r.prgiStatus || '-'}
                      </button>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        {showAddDomain && (
                          <button onClick={() => setDomainFor(r)} className="px-2 py-1 text-xs rounded border hover:bg-gray-50">Add Domain</button>
                        )}
                        {primaryDomain && !hasEpaper && !anyPending && (
                          <button onClick={async () => {
                            await addEpaperDomain(r, primaryDomain)
                            const list = await fetchTenants()
                            // no drawer in list view; table refresh is enough
                          }} className="px-2 py-1 text-xs rounded border hover:bg-gray-50">Add Epaper</button>
                        )}
                        {!hasEntity && (
                          <button onClick={() => setEntityFor(r)} className="px-2 py-1 text-xs rounded border hover:bg-gray-50">Add Entity</button>
                        )}
                        <button onClick={() => setSelected(r)} className="px-2 py-1 text-xs rounded border hover:bg-gray-50">View</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl">
            <div className="h-14 px-4 flex items-center justify-between border-b">
              <div className="font-semibold">Tenant Details</div>
              <button className="p-2 rounded hover:bg-gray-100" onClick={() => setSelected(null)}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-4 overflow-auto h-[calc(100%-56px)]">
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div><div className="text-gray-500 text-xs">Name</div><div className="font-medium">{selected.name}</div></div>
                <div><div className="text-gray-500 text-xs">Slug</div><div className="font-medium">{selected.slug}</div></div>
                <div><div className="text-gray-500 text-xs">PRGI Number</div><div className="font-medium">{selected.prgiNumber || '-'}</div></div>
                <div><div className="text-gray-500 text-xs">Status</div><div className="font-medium">{selected.prgiStatus || '-'}</div></div>
              </div>
              {/* Entity / Registration Info */}
              {selected.entity && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold">Registration Details</div>
                    <button onClick={() => setEditBusinessFor({ tenant: selected, entity: selected.entity })} className="px-2 py-1 text-xs rounded border hover:bg-gray-50">Edit Business</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <Field label="Registration Title" value={selected.entity.registrationTitle} />
                    <Field label="PRGI Number" value={selected.entity.prgiNumber || selected.prgiNumber} />
                    <Field label="Periodicity" value={selected.entity.periodicity} />
                    <Field label="Registration Date" value={formatIsoDate(selected.entity.registrationDate)} />
                    <Field label="Language" value={selected.entity.language?.name} />
                    <Field label="Publisher" value={selected.entity.publisherName} />
                    {selected.entity.editorName && <Field label="Editor" value={selected.entity.editorName} />}
                    {selected.entity.printingPressName && <Field label="Printing Press" value={selected.entity.printingPressName} />}
                    {selected.entity.printingCityName && <Field label="Printing City" value={selected.entity.printingCityName} />}
                    {selected.entity.address && <Field label="Address" value={selected.entity.address} full />}
                  </div>
                </div>
              )}
              {!selected.entity && (
                <div className="mt-6 p-4 border rounded bg-gray-50 text-sm flex items-center justify-between">
                  <span>No registration entity added yet.</span>
                  <button onClick={() => setEntityFor(selected)} className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-100">Add Entity</button>
                </div>
              )}

              {/* Domains List */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold">Domains</div>
                  {(() => {
                    const hasPrimary = (selected.domains || []).some(d => d.isPrimary)
                    return !hasPrimary ? (
                      <button onClick={() => setDomainFor(selected)} className="px-2 py-1 text-xs rounded border hover:bg-gray-50">Add Domain</button>
                    ) : null
                  })()}
                </div>
                <div className="border rounded">
                  {(selected.domains || []).length === 0 && (
                    <div className="p-3 text-sm text-gray-500">No domains configured.</div>
                  )}
                  {(selected.domains || []).length > 0 && (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-600">
                        <tr>
                          <th className="text-left px-3 py-2">Domain</th>
                          <th className="text-left px-3 py-2">Primary</th>
                          <th className="text-left px-3 py-2">Status</th>
                          <th className="text-left px-3 py-2">Verified</th>
                          <th className="text-right px-3 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.domains.map((d,i) => (
                          <tr key={i} className="border-t">
                            <td className="px-3 py-2 font-medium text-gray-800">{d.domain}</td>
                            <td className="px-3 py-2">{d.isPrimary ? <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 text-[11px]">Primary</span> : <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 border text-[11px]">Secondary</span>}</td>
                            <td className="px-3 py-2">
                              <button onClick={() => setVerifyDomainFor(d)} className={`px-2 py-0.5 rounded border text-[11px] transition ${d.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'}`} title="Click to verify domain via DNS TXT">{d.status || '-'}</button>
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-600">{d.verifiedAt ? formatIsoDate(d.verifiedAt) : '—'}</td>
                            <td className="px-3 py-2 text-right">
                              {d.isPrimary && (
                                <button onClick={() => setLinkCategoriesFor({ tenant: selected, domain: d })} className="px-2 py-1 text-xs rounded border hover:bg-gray-50">Link Categories</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                {(() => {
                  const primary = (selected.domains || []).find(d => d.isPrimary)?.domain || ''
                  const hasEpaper = (selected.domains || []).some(d => (d.domain || '').startsWith('epaper.'))
                  if (!primary || hasEpaper) return null
                  return (
                    <div className="mt-3 flex justify-end">
                      <button onClick={async () => { 
                        await addEpaperDomain(selected, primary)
                        const list = await fetchTenants()
                        const updated = (list || []).find(r => r.id === selected.id)
                        if (updated) setSelected(updated)
                      }} className="px-2 py-1 text-xs rounded border hover:bg-gray-50">Add Epaper</button>
                    </div>
                  )
                })()}
                {/* Linked Categories (Tenant-level) */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold">Linked Categories</div>
                  </div>
                  {categoriesLoading && <Loader size={48} label="Loading categories..." />}
                  {categoriesError && !categoriesLoading && (
                    <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{categoriesError}</div>
                  )}
                  {!categoriesLoading && !categoriesError && (
                    <div className="flex flex-wrap gap-2">
                      {tenantCategories.length === 0 && <div className="text-sm text-gray-500">No categories linked.</div>}
                      {tenantCategories.length > 0 && tenantCategories.map(c => (
                        <span key={c.id} className="px-2 py-0.5 text-[11px] rounded border bg-gray-50 text-gray-700">{categoryDisplayName(c)}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <TenantFormModal open={openCreate} onClose={() => setOpenCreate(false)} onCreated={() => { fetchTenants(); }} />
      {verifyTarget && (
        <VerifyModal tenant={verifyTarget} onClose={() => setVerifyTarget(null)} onUpdated={() => { setVerifyTarget(null); fetchTenants(); }} />
      )}
      {entityFor && (
        <AddEntityModal 
          tenant={entityFor} 
          onClose={() => setEntityFor(null)} 
          onSaved={() => { 
            // Refresh full tenants list and reselect current tenant if drawer is open
            fetchTenants(); 
            if (selected?.id === entityFor.id) {
              fetchEntities(entityFor)
            }
          }} 
        />
      )}
      {domainFor && (
        <AddDomainModal 
          tenant={domainFor} 
          onClose={() => setDomainFor(null)} 
          onAdded={async () => { 
            const list = await fetchTenants(); 
            if (selected?.id === domainFor.id) {
              const updated = (list || []).find(r => r.id === domainFor.id)
              if (updated) setSelected(updated)
            }
          }} 
        />
      )}
      {editBusinessFor && (
        <EditEntityBusinessModal 
          tenant={editBusinessFor.tenant} 
          entity={editBusinessFor.entity} 
          onClose={() => setEditBusinessFor(null)} 
          onSaved={() => { if (selected?.id === editBusinessFor.tenant?.id) fetchEntities(editBusinessFor.tenant); setEditBusinessFor(null) }}
        />
      )}
      {verifyDomainFor && selected && (
        <VerifyDomainModal 
          tenant={selected} 
          domain={verifyDomainFor} 
          onClose={() => setVerifyDomainFor(null)} 
          onVerified={async () => { 
            setVerifyDomainFor(null);
            const list = await fetchTenants();
            const updated = (list || []).find(r=>r.id===selected.id)
            if(updated) setSelected(updated)
          }}
        />
      )}
      {linkCategoriesFor && (
        <LinkCategoriesModal 
          tenant={linkCategoriesFor.tenant}
          domain={linkCategoriesFor.domain}
          onClose={() => setLinkCategoriesFor(null)}
          existingIds={(tenantCategories || []).map(c => c?.id || c?.categoryId || c?.category?.id).filter(Boolean)}
          onSaved={async () => {
            const list = await fetchTenants()
            const updated = (list || []).find(r=>r.id===selected?.id)
            if (updated) setSelected(updated)
            await fetchTenantCategories(updated || selected)
            setLinkCategoriesFor(null)
          }}
        />
      )}
    </div>
  )
}

function VerifyModal({ tenant, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reason, setReason] = useState('')

  async function verify() {
    setError('')
    setLoading(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const res = await fetch(`${base}/api/v1/prgi/${tenant.id}/verify`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${t?.token || ''}`
        }
      })
      if (!res.ok) throw new Error(`Verify failed: ${res.status}`)
      onUpdated()
    } catch (e) {
      setError(e.message || 'Failed to verify')
    } finally {
      setLoading(false)
    }
  }

  async function reject() {
    setError('')
    if (!reason.trim()) { setError('Please provide a rejection reason'); return }
    setLoading(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const res = await fetch(`${base}/api/v1/prgi/${tenant.id}/reject`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify({ reason: reason.trim() })
      })
      if (!res.ok) throw new Error(`Reject failed: ${res.status}`)
      onUpdated()
    } catch (e) {
      setError(e.message || 'Failed to reject')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-[92vw] max-w-md rounded-xl shadow-xl border">
        <div className="px-4 py-3 border-b font-semibold">Verify PRGI Status</div>
        <div className="p-4 space-y-3 text-sm">
          <div className="font-medium">Update PRGI status for <span className="font-semibold">{tenant.name}</span></div>
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
            <div><div className="text-gray-500">PRGI Number</div><div className="font-mono">{tenant.prgiNumber || '-'}</div></div>
            <div><div className="text-gray-500">Current Status</div><div className="font-mono">{tenant.prgiStatus || '-'}</div></div>
          </div>
          <div>
            <label className="block text-xs text-gray-600">Rejection reason (required only when rejecting)</label>
            <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={3} className="mt-1 w-full border rounded p-2 text-sm" placeholder="Explain why the PRGI is rejected" />
          </div>
          {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
        </div>
        <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm rounded border">Cancel</button>
          <button onClick={reject} disabled={loading} className="px-3 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">{loading ? 'Submitting...' : 'Reject'}</button>
          <button onClick={verify} disabled={loading} className="px-3 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60">{loading ? 'Submitting...' : 'Mark Verified'}</button>
        </div>
      </div>
    </div>
  )
}

function EditEntityBusinessModal({ tenant, entity, onClose, onSaved }) {
  const [address, setAddress] = useState(entity?.address || '')
  const [printingPressName, setPrintingPressName] = useState(entity?.printingPressName || '')
  const [printingCityName, setPrintingCityName] = useState(entity?.printingCityName || '')
  const [printingDistrictId, setPrintingDistrictId] = useState(entity?.printingDistrictId || '')
  const [printingMandalId, setPrintingMandalId] = useState(entity?.printingMandalId || '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleSave(e) {
    e.preventDefault()
    setMsg('')
    if (!tenant?.id) { setMsg('Missing tenant'); return }
    const payload = {
      address: address?.trim() || undefined,
      printingPressName: printingPressName?.trim() || undefined,
      printingCityName: printingCityName?.trim() || undefined,
      printingDistrictId: printingDistrictId?.trim() || undefined,
      printingMandalId: printingMandalId?.trim() || undefined
    }
    setSaving(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const res = await fetch(`${base}/api/v1/tenants/${tenant.id}/entity/business`, {
        method: 'PUT',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`Update failed: ${res.status}${txt ? ` - ${txt}` : ''}`)
      }
      if (onSaved) onSaved()
      onClose()
    } catch (e) {
      setMsg(e.message || 'Failed to update entity')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-[92vw] max-w-lg rounded-xl shadow-xl border">
        <div className="px-4 py-3 border-b font-semibold">Edit Business Details</div>
        <form onSubmit={handleSave} className="p-4 space-y-3 text-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-700">Address</label>
            <textarea rows={3} className="mt-1 w-full border rounded p-2" value={address} onChange={e=>setAddress(e.target.value)} placeholder="Office address" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Printing Press Name</label>
              <input className="mt-1 w-full border rounded p-2" value={printingPressName} onChange={e=>setPrintingPressName(e.target.value)} placeholder="Press name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Printing City</label>
              <input className="mt-1 w-full border rounded p-2" value={printingCityName} onChange={e=>setPrintingCityName(e.target.value)} placeholder="City" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Printing District</label>
              <input className="mt-1 w-full border rounded p-2" value={printingDistrictId} onChange={e=>setPrintingDistrictId(e.target.value)} placeholder="District (ID)" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Printing Mandal</label>
              <input className="mt-1 w-full border rounded p-2" value={printingMandalId} onChange={e=>setPrintingMandalId(e.target.value)} placeholder="Mandal (ID)" />
            </div>
          </div>
          {msg && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{msg}</div>}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded border">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{saving? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddDomainModal({ tenant, onClose, onAdded }) {
  const [domain, setDomain] = useState('')
  const [isPrimary, setIsPrimary] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  function isValidDomain(v) {
    if (!v) return false
    const s = v.trim().toLowerCase()
    // Disallow protocol, path, and spaces
    if (s.includes('://') || s.includes('/') || /\s/.test(s)) return false
    // Basic domain pattern: labels separated by dots, labels alnum or hyphen, not starting/ending with hyphen
    const re = /^(?!-)([a-z0-9-]{1,63})(?<!-)(\.(?!-)([a-z0-9-]{1,63})(?<!-))+$/
    return re.test(s)
  }

  async function handleSave(e) {
    e.preventDefault()
    setMsg('')
    if (!tenant?.id) { setMsg('Missing tenant'); return }
    if (!isValidDomain(domain)) { setMsg('Enter a valid domain like example.com'); return }
    setSaving(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const payload = { domain: domain.trim().toLowerCase(), isPrimary }
      const res = await fetch(`${base}/api/v1/tenants/${tenant.id}/domains`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`Add domain failed: ${res.status}${txt ? ` - ${txt}` : ''}`)
      }
      onClose()
      if (onAdded) await onAdded()
    } catch (e) {
      setMsg(e.message || 'Failed to add domain')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-[92vw] max-w-md rounded-xl shadow-xl border">
        <div className="px-4 py-3 border-b font-semibold">Add Domain to {tenant?.name}</div>
        <form onSubmit={handleSave} className="p-4 space-y-3 text-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-700">Domain</label>
            <input className="mt-1 w-full border rounded p-2" value={domain} onChange={e=>setDomain(e.target.value)} placeholder="example.com" />
            <div className="text-[11px] text-gray-500 mt-1">Enter only the domain name (no http/https)</div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPrimary} onChange={e=>setIsPrimary(e.target.checked)} />
            Set as primary domain
          </label>
          {msg && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{msg}</div>}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded border">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{saving? 'Adding...' : 'Add Domain'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

async function addEpaperDomain(tenant, primaryDomain) {
  try {
    const t = getToken()
    const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
    const epaper = `epaper.${primaryDomain}`
    const res = await fetch(`${base}/api/v1/tenants/${tenant.id}/domains`, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${t?.token || ''}`
      },
      body: JSON.stringify({ domain: epaper, isPrimary: false })
    })
    // No toast yet; actual refresh handled by caller after this resolves
  } catch {}
}

function VerifyDomainModal({ tenant, domain, onClose, onVerified }) {
  const [method, setMethod] = useState('DNS_TXT')
  const [force, setForce] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleVerify(e) {
    e.preventDefault()
    setMsg('')
    if (!domain?.id) { setMsg('Missing domain id'); return }
    setLoading(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const payload = { method, force }
      const res = await fetch(`${base}/api/v1/domains/${domain.id}/verify`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const txt = await res.text().catch(()=> '')
        throw new Error(`Verify failed: ${res.status}${txt?` - ${txt}`:''}`)
      }
      if (onVerified) onVerified()
      // Also refresh tenant list to reflect latest domain status
      try { await fetchTenants() } catch {}
    } catch(e) {
      setMsg(e.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-[92vw] max-w-md rounded-xl shadow-xl border">
        <div className="px-4 py-3 border-b font-semibold">Verify Domain Status</div>
        <form onSubmit={handleVerify} className="p-4 space-y-4 text-sm">
          <div className="text-xs text-gray-600">Tenant: <span className="font-medium text-gray-800">{tenant?.name}</span></div>
          <div>
            <label className="block text-xs font-semibold text-gray-700">Domain</label>
            <div className="mt-1 px-2 py-1 rounded border bg-gray-50 text-sm">{domain?.domain}</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Method</label>
              <select className="mt-1 w-full border rounded p-2 bg-white" value={method} onChange={e=>setMethod(e.target.value)}>
                <option value="DNS_TXT">DNS_TXT</option>
                <option value="DNS_CNAME">DNS_CNAME</option>
                <option value="FILE">FILE</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                <input type="checkbox" checked={force} onChange={e=>setForce(e.target.checked)} /> Force re-verify
              </label>
            </div>
          </div>
          <div className="text-[11px] text-gray-500 leading-relaxed">
            Ensure the required DNS TXT/CNAME record or verification file is present before running verification. Force will bypass cached status.
          </div>
          {msg && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{msg}</div>}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded border">Cancel</button>
            <button type="submit" disabled={loading} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{loading? 'Verifying...' : 'Verify Domain'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddEntityModal({ tenant, onClose, onSaved }) {
  const [periodicity, setPeriodicity] = useState('')
  const [registrationDate, setRegistrationDate] = useState('')
  const [adminMobile, setAdminMobile] = useState('')
  const [publisherMobile, setPublisherMobile] = useState('')
  const [publisherName, setPublisherName] = useState('')
  const [editorName, setEditorName] = useState('')
  const [printingPressName, setPrintingPressName] = useState('')
  const [printingCityName, setPrintingCityName] = useState('')
  const [address, setAddress] = useState('')
  const [languageId, setLanguageId] = useState('')
  const [languages, setLanguages] = useState([])
  const [loadingLangs, setLoadingLangs] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadLangs() {
      try {
        setLoadingLangs(true)
        const t = getToken()
        const res = await fetch((process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com') + '/api/v1/languages', {
          headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` }
        })
        const json = await res.json()
        const list = Array.isArray(json) ? json : (json?.data || [])
        if (!cancelled) setLanguages(list)
      } catch (e) {
        if (!cancelled) setLanguages([])
      } finally {
        if (!cancelled) setLoadingLangs(false)
      }
    }
    if (tenant) loadLangs()
    return () => { cancelled = true }
  }, [tenant])

  function toDdMmYyyy(isoDate) {
    if (!isoDate) return ''
    const [y, m, d] = isoDate.split('-')
    if (!y || !m || !d) return isoDate
    return `${d}/${m}/${y}`
  }

  function onlyDigits10(v) {
    return (v || '').replace(/\D/g, '').slice(0, 10)
  }

  async function handleSave(e) {
    e.preventDefault()
    setMsg('')
    if (!tenant?.id) { setMsg('Missing tenant'); return }
    if (!periodicity) { setMsg('Please select periodicity'); return }
    if (!registrationDate) { setMsg('Please select registration date'); return }
    const admin = onlyDigits10(adminMobile)
    if (admin.length !== 10) { setMsg('Admin mobile must be 10 digits'); return }
    if (!publisherName.trim()) { setMsg('Publisher name is required'); return }
    if (!languageId) { setMsg('Please select language'); return }

    const payload = {
      periodicity: periodicity.toUpperCase(),
      registrationDate: toDdMmYyyy(registrationDate),
      adminMobile: admin,
      publisherMobile: publisherMobile ? onlyDigits10(publisherMobile) : undefined,
      publisherName: publisherName.trim(),
      editorName: editorName.trim() || undefined,
      printingPressName: printingPressName.trim() || undefined,
      printingCityName: printingCityName.trim() || undefined,
      address: address.trim() || undefined,
      languageId
    }

    setSaving(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const res = await fetch(`${base}/api/v1/tenants/${tenant.id}/entity/simple`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`Save failed: ${res.status}${txt ? ` - ${txt}` : ''}`)
      }
      if (onSaved) onSaved()
      onClose()
    } catch (e) {
      setMsg(e.message || 'Failed to save entity')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-[92vw] max-w-lg rounded-xl shadow-xl border">
        <div className="px-4 py-3 border-b font-semibold">Add Entity to {tenant?.name}</div>
        <form onSubmit={handleSave} className="p-4 space-y-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Periodicity</label>
              <select className="mt-1 w-full border rounded p-2 bg-white" value={periodicity} onChange={e=>setPeriodicity(e.target.value)} required>
                <option value="">Select periodicity</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Registration Date</label>
              <input type="date" className="mt-1 w-full border rounded p-2" value={registrationDate} onChange={e=>setRegistrationDate(e.target.value)} required />
              <div className="text-[11px] text-gray-500 mt-1">Format sent: DD/MM/YYYY</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Admin Mobile (10 digits)</label>
              <input inputMode="numeric" pattern="[0-9]{10}" maxLength={10} className="mt-1 w-full border rounded p-2" value={adminMobile} onChange={e=>setAdminMobile(onlyDigits10(e.target.value))} placeholder="9999999999" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Publisher Mobile (optional)</label>
              <input inputMode="numeric" maxLength={10} className="mt-1 w-full border rounded p-2" value={publisherMobile} onChange={e=>setPublisherMobile(onlyDigits10(e.target.value))} placeholder="9999999999" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Publisher Name</label>
              <input className="mt-1 w-full border rounded p-2" value={publisherName} onChange={e=>setPublisherName(e.target.value)} placeholder="Publisher full name" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Editor Name (optional)</label>
              <input className="mt-1 w-full border rounded p-2" value={editorName} onChange={e=>setEditorName(e.target.value)} placeholder="Editor full name" />
            </div>
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
              <label className="block text-xs font-semibold text-gray-700">Printing Press Name</label>
              <input className="mt-1 w-full border rounded p-2" value={printingPressName} onChange={e=>setPrintingPressName(e.target.value)} placeholder="Press name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Printing City</label>
              <input className="mt-1 w-full border rounded p-2" value={printingCityName} onChange={e=>setPrintingCityName(e.target.value)} placeholder="City" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Address</label>
            <textarea rows={3} className="mt-1 w-full border rounded p-2" value={address} onChange={e=>setAddress(e.target.value)} placeholder="Office address" />
          </div>

          {msg && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{msg}</div>}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded border">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{saving? 'Saving...' : 'Save Entity'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function LinkCategoriesModal({ tenant, domain, onClose, onSaved, existingIds = [] }) {
  const DEFAULT_LANG = 'cmie0ihqu000eugb4w8giveum'
  const languageId = tenant?.entity?.language?.id || DEFAULT_LANG
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setError('')
      setLoading(true)
      try {
        const t = getToken()
        const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
        const res = await fetch(`${base}/api/v1/categories?languageId=${encodeURIComponent(languageId)}`, {
          headers: { 'accept': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` }
        })
        if (!res.ok) throw new Error(`Load categories failed: ${res.status}`)
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data?.data || [])
        if (!cancelled) setCategories(list)
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load categories')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (domain?.id) load()
    return () => { cancelled = true }
  }, [domain?.id, languageId])

  useEffect(() => {
    setSelectedIds(Array.isArray(existingIds) ? existingIds : [])
  }, [existingIds, domain?.id])

  function toggle(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const res = await fetch(`${base}/api/v1/domains/${domain.id}/categories`, {
        method: 'PUT',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify({ categoryIds: selectedIds })
      })
      if (!res.ok) {
        const txt = await res.text().catch(()=> '')
        throw new Error(`Link categories failed: ${res.status}${txt?` - ${txt}`:''}`)
      }
      if (onSaved) await onSaved()
      onClose()
    } catch (e) {
      setError(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-[92vw] max-w-lg rounded-xl shadow-xl border">
        <div className="px-4 py-3 border-b font-semibold">Link Categories to {domain?.domain}</div>
        <form onSubmit={handleSave} className="p-4 space-y-3 text-sm">
          <div className="text-xs text-gray-600">Language: <span className="font-medium text-gray-800">{tenant?.entity?.language?.name || 'Default'}</span></div>
          {loading && <Loader size={64} label="Loading categories..." />}
          {error && !loading && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
          {!loading && !error && (
            <div className="max-h-64 overflow-auto border rounded">
              {categories.length === 0 ? (
                <div className="p-3 text-gray-500">No categories found.</div>
              ) : (
                <ul className="divide-y">
                  {categories.map(c => (
                    <li key={c.id} className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <input id={`cat_${c.id}`} type="checkbox" className="cursor-pointer" checked={selectedIds.includes(c.id)} onChange={()=>toggle(c.id)} />
                        <label htmlFor={`cat_${c.id}`} className="cursor-pointer select-none">{categoryDisplayName(c)}</label>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded border">Cancel</button>
            <button type="submit" disabled={saving || loading} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{saving? 'Saving...' : 'Save Links'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
