import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { getToken, logout } from '../../../utils/auth'
import { ACTIVE_BLOCK_CODES } from '../../../lib/epaper/epaperActiveBlocks'

function todayYmd() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const blockKeys = ACTIVE_BLOCK_CODES

function defaultTemplateMap() {
  return Object.fromEntries(ACTIVE_BLOCK_CODES.map((code) => [code, '']))
}

export default function EPaperAutoAssignPage() {
  const router = useRouter()

  const [tenantId, setTenantId] = useState('cmkh94g0s01eykb21toi1oucu')
  const [fromDate, setFromDate] = useState(todayYmd())
  const [status, setStatus] = useState('PUBLISHED')
  const [backendBaseUrl, setBackendBaseUrl] = useState('http://localhost:3001/api/v1')
  const [clearUnmapped, setClearUnmapped] = useState(false)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState(null)
  const [error, setError] = useState('')
  const [templateMap, setTemplateMap] = useState(defaultTemplateMap())

  const summary = useMemo(() => {
    if (!response?.results) return null
    const byCode = {}
    response.results.forEach((item) => {
      const code = item.suggestedBlockCode || 'N/A'
      byCode[code] = (byCode[code] || 0) + 1
    })
    return byCode
  }, [response])

  const updateTemplate = (key, value) => {
    setTemplateMap(prev => ({ ...prev, [key]: value }))
  }

  const runAutoAssign = async ({ dryRun }) => {
    setLoading(true)
    setError('')

    try {
      const token = getToken()
      if (!token) {
        logout()
        router.push('/')
        return
      }

      const payload = {
        tenantId: tenantId.trim(),
        fromDate,
        status,
        dryRun,
        clearUnmapped,
        backendBaseUrl: backendBaseUrl.trim() || undefined,
        templateMap: Object.fromEntries(
          Object.entries(templateMap).map(([k, v]) => [k, v?.trim() || null])
        ),
      }

      const res = await fetch('/api/admin/epaper/auto-assign-blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (res.status === 401) {
        logout()
        router.push('/')
        return
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || data?.error || 'Request failed')
      setResponse(data)
    } catch (err) {
      setError(err?.message || 'Failed to run auto assignment')
      setResponse(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-900">ePaper Auto Block Assignment</h1>
            <p className="text-sm text-gray-600 mt-1">Tenant/date articles fetch చేసి suitable block template IDs assign చేస్తుంది.</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant ID</label>
                <input value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="DRAFT">DRAFT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Backend Base URL</label>
                <input value={backendBaseUrl} onChange={(e) => setBackendBaseUrl(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input id="clearUnmapped" type="checkbox" checked={clearUnmapped} onChange={(e) => setClearUnmapped(e.target.checked)} />
              <label htmlFor="clearUnmapped" className="text-sm text-gray-700">Clear existing template when block mapping missing</label>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-800 mb-2">Template ID Mapping</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {blockKeys.map((key) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{key}</label>
                    <input
                      value={templateMap[key]}
                      onChange={(e) => updateTemplate(key, e.target.value)}
                      placeholder="templateBlockId"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => runAutoAssign({ dryRun: true })}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? 'Running...' : 'Run Dry Check'}
              </button>

              <button
                onClick={() => runAutoAssign({ dryRun: false })}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 disabled:opacity-60"
              >
                {loading ? 'Assigning...' : 'Assign Templates'}
              </button>
            </div>

            {error ? <div className="text-sm text-red-600">{error}</div> : null}
          </div>

          {response ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
                <div><span className="text-gray-500">Total</span><div className="font-semibold">{response.totalArticles}</div></div>
                <div><span className="text-gray-500">Assigned</span><div className="font-semibold text-green-700">{response.assignedCount}</div></div>
                <div><span className="text-gray-500">Skipped</span><div className="font-semibold text-amber-700">{response.skippedCount}</div></div>
                <div><span className="text-gray-500">Failed</span><div className="font-semibold text-red-700">{response.failedCount}</div></div>
                <div><span className="text-gray-500">Dry Run</span><div className="font-semibold">{String(response.dryRun)}</div></div>
                <div><span className="text-gray-500">Tenant</span><div className="font-semibold break-all">{response.tenantId}</div></div>
              </div>

              {summary ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Suggested Block Distribution</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(summary).map(([code, count]) => (
                      <span key={code} className="px-2 py-1 rounded bg-gray-100 text-xs font-medium text-gray-800">{code}: {count}</span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-gray-700">
                      <th className="px-3 py-2">Article</th>
                      <th className="px-3 py-2">Words</th>
                      <th className="px-3 py-2">Images</th>
                      <th className="px-3 py-2">Suggested</th>
                      <th className="px-3 py-2">Template ID</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(response.results || []).map((item) => (
                      <tr key={item.articleId} className="border-t">
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-900 break-words max-w-md">{item.title}</div>
                          <div className="text-xs text-gray-500">{item.articleId}</div>
                        </td>
                        <td className="px-3 py-2">{item.wordCount}</td>
                        <td className="px-3 py-2">{item.imageCount}</td>
                        <td className="px-3 py-2 font-medium">{item.suggestedBlockCode}</td>
                        <td className="px-3 py-2 break-all text-xs">{item.assignedTemplateBlockId || '-'}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            item.status === 'ASSIGNED' ? 'bg-green-100 text-green-800' :
                            item.status === 'DRY_RUN' ? 'bg-blue-100 text-blue-800' :
                            item.status?.startsWith('SKIPPED') ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  )
}
