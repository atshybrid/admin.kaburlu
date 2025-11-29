import { useEffect, useState } from 'react'
import { getToken } from '../../utils/auth'
import Loader from '../Loader'

export default function StatesView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])

  async function fetchStates() {
    try {
      setError('')
      setLoading(true)
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const res = await fetch(`${base}/api/v1/states`, {
        headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const json = await res.json()
      const list = Array.isArray(json) ? json : (json?.data || [])
      setRows(list)
    } catch (e) {
      setError(e.message || 'Failed to load states')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStates() }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">States</h2>
        <button onClick={fetchStates} className="px-3 py-2 text-sm rounded border hover:bg-gray-50">Refresh</button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Created</th>
                <th className="text-left px-4 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="px-4 py-6" colSpan={4}>
                    <Loader size={72} label="Loading states..." />
                  </td>
                </tr>
              )}
              {error && !loading && (
                <tr><td className="px-4 py-4 text-red-600" colSpan={4}>{error}</td></tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr><td className="px-4 py-4 text-gray-500" colSpan={4}>No states found.</td></tr>
              )}
              {!loading && !error && rows.map((s) => (
                <tr key={s.id || s.name} className="border-t">
                  <td className="px-4 py-2 font-medium text-gray-800">{s.name || '-'}</td>
                  <td className="px-4 py-2">{s.isDeleted ? 'Deleted' : 'Active'}</td>
                  <td className="px-4 py-2">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-2">{s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
