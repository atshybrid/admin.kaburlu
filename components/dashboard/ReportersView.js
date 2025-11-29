import { useEffect, useMemo, useState } from 'react'
import { getToken } from '../../utils/auth'
import Loader from '../Loader'

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

export default function ReportersView() {
  const [tenantList, setTenantList] = useState([])
  const [tenantLoading, setTenantLoading] = useState(true)
  const [tenantErr, setTenantErr] = useState('')
  const [tenantSel, setTenantSel] = useState('')

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load tenants for selector
  useEffect(() => {
    let cancelled = false
    async function loadTenants() {
      setTenantErr('')
      setTenantLoading(true)
      try {
        const t = getToken()
        const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
        const res = await fetch(base + '/api/v1/tenants', {
          headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` }
        })
        if (!res.ok) throw new Error(`Failed to load tenants: ${res.status}`)
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data?.data || [])
        if (!cancelled) setTenantList(list)
      } catch (e) {
        if (!cancelled) setTenantErr(e.message || 'Failed to load tenants')
      } finally {
        if (!cancelled) setTenantLoading(false)
      }
    }
    loadTenants()
    return () => { cancelled = true }
  }, [])

  async function loadReporters(tenantId) {
    if (!tenantId) return
    setError('')
    setLoading(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const res = await fetch(`${base}/api/v1/tenants/${tenantId}/reporters`, {
        headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (!res.ok) throw new Error(`Load failed: ${res.status}`)
      const data = await res.json()
      setRows(Array.isArray(data) ? data : (data?.data || []))
    } catch (e) {
      setError(e.message || 'Failed to load reporters')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const tenantName = useMemo(() => {
    const t = tenantList.find(x => x.id === tenantSel)
    return t?.name || '-'
  }, [tenantList, tenantSel])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Reporters</h2>
          <div className="text-xs text-gray-600">Select a tenant to view reporters</div>
        </div>
        <div className="flex items-center gap-2 min-w-[260px]">
          <div className="w-full">
            <label className="block text-xs font-semibold text-gray-700 flex items-center gap-2">Tenant {tenantLoading && <Loader size={18} />}</label>
            <select className="mt-1 w-full border rounded p-2 bg-white" value={tenantSel} onChange={e=>{setTenantSel(e.target.value); loadReporters(e.target.value)}} disabled={tenantLoading || !!tenantErr}>
              <option value="">{tenantLoading ? 'Loading tenants...' : (tenantErr ? 'Failed to load tenants' : 'Select tenant')}</option>
              {tenantList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!tenantSel && (
        <div className="bg-white rounded-xl border shadow-sm p-6 text-sm text-gray-600">
          Please select a tenant to view reporters.
        </div>
      )}

      {tenantSel && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="font-semibold">Tenant: {tenantName}</div>
            <div className="text-xs text-gray-500">{rows.length} result(s)</div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-2">Name</th>
                  <th className="text-left px-4 py-2">Mobile</th>
                  <th className="text-left px-4 py-2">Level</th>
                  <th className="text-left px-4 py-2">Designation</th>
                  <th className="text-left px-4 py-2">KYC</th>
                  <th className="text-left px-4 py-2">Active</th>
                  <th className="text-left px-4 py-2">Subscription</th>
                  <th className="text-left px-4 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={8} className="px-4 py-8"><Loader size={64} label="Loading reporters..." /></td></tr>
                )}
                {error && !loading && (
                  <tr><td colSpan={8} className="px-4 py-4 text-red-600">{error}</td></tr>
                )}
                {!loading && !error && rows.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-6 text-gray-500">No reporters found.</td></tr>
                )}
                {!loading && !error && rows.map((r, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-4 py-2 font-medium text-gray-800">{r.fullName || '—'}</td>
                    <td className="px-4 py-2">{r.mobileNumber || '—'}</td>
                    <td className="px-4 py-2">{(r.level || '').replaceAll('_',' ')}</td>
                    <td className="px-4 py-2">{r.designation?.name || '—'}</td>
                    <td className="px-4 py-2">{r.kycStatus || '—'}</td>
                    <td className="px-4 py-2">{r.active ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2">{r.subscriptionActive ? `Active${r.monthlySubscriptionAmount ? ` • ₹${r.monthlySubscriptionAmount}`:''}` : '—'}</td>
                    <td className="px-4 py-2">{formatIsoDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
