/**
 * Desk Editor Analytics Page - SUPER_ADMIN
 * View working hours and productivity of all desk editors
 */
import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { getToken } from '../../utils/auth'
import Loader from '../../components/Loader'

function getApiBase() {
  return (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com').replace(/\/$/, '')
}

// Stats Card
function StatCard({ title, value, subtitle, icon, color = 'brand' }) {
  const colors = {
    brand: 'from-brand to-brand-dark text-white',
    green: 'from-green-500 to-green-600 text-white',
    blue: 'from-blue-500 to-blue-600 text-white',
    purple: 'from-purple-500 to-purple-600 text-white',
    amber: 'from-amber-500 to-amber-600 text-white'
  }
  
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-5 shadow-lg`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium opacity-90">{title}</div>
        <div className="p-2 bg-white/20 rounded-lg">{icon}</div>
      </div>
      <div className="text-3xl font-bold">{value}</div>
      {subtitle && <div className="text-sm mt-1 opacity-80">{subtitle}</div>}
    </div>
  )
}

// Avatar
function Avatar({ src, name, size = 'md' }) {
  const [imgError, setImgError] = useState(false)
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }
  const initials = (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  
  if (src && !imgError) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover`} onError={() => setImgError(true)} />
  }
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white font-medium`}>
      {initials}
    </div>
  )
}

// Status Badge
function StatusBadge({ isActive }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
      {isActive ? 'Online' : 'Offline'}
    </span>
  )
}

// Format hours
function formatHours(hours) {
  if (!hours && hours !== 0) return '—'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

function DeskEditorAnalyticsContent() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [days, setDays] = useState(7)
  const [selectedEditor, setSelectedEditor] = useState(null)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/analytics/desk-editors?days=${days}`, {
        headers: { 'Authorization': `Bearer ${t?.token || ''}` }
      })
      
      if (!res.ok) {
        if (res.status === 404) {
          // API not yet available
          setData({ editors: [], summary: { totalEditors: 0, activeToday: 0, totalPages: 0, totalWorkingHours: 0 } })
          return
        }
        throw new Error(`Failed to fetch: ${res.status}`)
      }
      
      const json = await res.json()
      setData(json?.data || json)
    } catch (e) {
      setError(e.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const today = new Date().toISOString().split('T')[0]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size={72} label="Loading analytics..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={fetchAnalytics} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Retry
        </button>
      </div>
    )
  }

  const summary = data?.summary || {}
  const editors = data?.editors || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Desk Editor Analytics</h1>
          <p className="text-gray-500">Track working hours and productivity</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value={1}>Today</option>
            <option value={7}>Last 7 Days</option>
            <option value={14}>Last 14 Days</option>
            <option value={30}>Last 30 Days</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="p-2 border rounded-lg hover:bg-gray-50"
            title="Refresh"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Editors"
          value={summary.totalEditors || 0}
          subtitle="Registered desk editors"
          color="brand"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          }
        />
        <StatCard
          title="Active Today"
          value={summary.activeToday || 0}
          subtitle="Currently working"
          color="green"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          }
        />
        <StatCard
          title="Total Pages"
          value={summary.totalPages || 0}
          subtitle={`In last ${days} days`}
          color="blue"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          }
        />
        <StatCard
          title="Total Hours"
          value={formatHours(summary.totalWorkingHours || 0)}
          subtitle={`In last ${days} days`}
          color="purple"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <path strokeWidth="2" strokeLinecap="round" d="M12 6v6l4 2"/>
            </svg>
          }
        />
      </div>

      {/* Editors Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Editor</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Last Login</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Today</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">{days}D Hours</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Pages Today</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Pages</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {editors.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={8}>
                    No desk editors found
                  </td>
                </tr>
              )}
              {editors.map((editor) => {
                const todayHours = editor.workingHours?.dailyBreakdown?.[today]?.hours || 0
                const todayPages = editor.dailyPageBreakdown?.[today]?.pages || 0
                const isActive = editor.isOnline || (todayHours > 0 && new Date(editor.lastActivityAt) > new Date(Date.now() - 5 * 60 * 1000))
                
                return (
                  <tr key={editor.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={editor.profilePhotoUrl} name={editor.fullName || editor.mobileNumber} />
                        <div>
                          <div className="font-medium text-gray-900">{editor.fullName || '—'}</div>
                          <div className="text-xs text-gray-500">{editor.mobileNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge isActive={isActive} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(editor.lastLoginAt)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatHours(todayHours)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-brand">
                      {formatHours(editor.workingHours?.totalHours || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {todayPages}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-blue-600">
                      {editor.totalPages || 0}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedEditor(selectedEditor?.id === editor.id ? null : editor)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-brand transition-colors"
                        title="View Details"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Detail Panel */}
      {selectedEditor && (
        <EditorDetailPanel editor={selectedEditor} onClose={() => setSelectedEditor(null)} />
      )}
    </div>
  )
}

// Editor Detail Panel
function EditorDetailPanel({ editor, onClose }) {
  const dailyBreakdown = editor.workingHours?.dailyBreakdown || {}
  const pageBreakdown = editor.dailyPageBreakdown || {}
  const dates = [...new Set([...Object.keys(dailyBreakdown), ...Object.keys(pageBreakdown)])].sort().reverse()

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        <div className="h-14 px-4 flex items-center justify-between border-b shrink-0">
          <div className="font-semibold">Editor Details</div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div className="p-4 overflow-auto flex-1 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Avatar src={editor.profilePhotoUrl} name={editor.fullName} size="lg" />
            <div>
              <div className="text-lg font-semibold text-gray-900">{editor.fullName || '—'}</div>
              <div className="text-sm text-gray-500">{editor.mobileNumber}</div>
              <div className="text-xs text-gray-400">{editor.email || '—'}</div>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Total Hours</div>
              <div className="text-lg font-bold text-brand">{formatHours(editor.workingHours?.totalHours || 0)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Total Pages</div>
              <div className="text-lg font-bold text-blue-600">{editor.totalPages || 0}</div>
            </div>
          </div>

          {/* Daily Breakdown */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Daily Breakdown</h4>
            <div className="space-y-2">
              {dates.length === 0 && (
                <p className="text-sm text-gray-500">No activity data</p>
              )}
              {dates.map(date => {
                const hours = dailyBreakdown[date]?.hours || 0
                const pages = pageBreakdown[date]?.pages || 0
                const dateObj = new Date(date)
                const isToday = date === new Date().toISOString().split('T')[0]
                
                return (
                  <div key={date} className={`flex items-center justify-between p-3 rounded-lg ${isToday ? 'bg-brand/5 border border-brand/20' : 'bg-gray-50'}`}>
                    <div>
                      <div className="font-medium text-gray-900">
                        {isToday ? 'Today' : dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </div>
                      <div className="text-xs text-gray-500">{date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{formatHours(hours)}</div>
                      <div className="text-xs text-gray-500">{pages} pages</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sessions */}
          {editor.sessions && editor.sessions.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Recent Sessions</h4>
              <div className="space-y-2">
                {editor.sessions.slice(0, 10).map((session, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-gray-50 text-sm">
                    <div className="text-gray-600">
                      {new Date(session.loginAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="font-medium text-gray-900">
                      {session.durationMinutes ? `${Math.round(session.durationMinutes)}m` : 'Active'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DeskEditorAnalyticsPage() {
  return (
    <DashboardLayout>
      <DeskEditorAnalyticsContent />
    </DashboardLayout>
  )
}
