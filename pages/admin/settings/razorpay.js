/**
 * Admin Global Payment Gateway (Razorpay) Settings
 * /admin/settings/razorpay route
 */
import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { getToken } from '../../../utils/auth'

function getApiBase() {
  return (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com').replace(/\/$/, '')
}

function RazorpaySettingsContent() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    keyId: '',
    keySecret: '',
    webhookSecret: '',
    isLive: false,
    enabled: true
  })

  const loadSettings = async () => {
    setLoading(true)
    setError('')
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/razorpay-settings`, {
        headers: { 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (!res.ok) {
        if (res.status === 404) {
          setSettings(null)
          return
        }
        throw new Error(`Request failed: ${res.status}`)
      }
      const data = await res.json()
      setSettings(data)
      setForm({
        keyId: data.keyId || '',
        keySecret: data.keySecret || '',
        webhookSecret: data.webhookSecret || '',
        isLive: data.isLive || false,
        enabled: data.enabled !== false
      })
    } catch (e) {
      setError(e.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const t = getToken()
      const method = settings ? 'PUT' : 'POST'
      const url = settings
        ? `${getApiBase()}/api/v1/razorpay-settings/${settings.id}`
        : `${getApiBase()}/api/v1/razorpay-settings`
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      setEditing(false)
      loadSettings()
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
          <h1 className="text-xl font-bold text-slate-900">Payment Gateway Settings</h1>
          <p className="text-sm text-slate-500">Configure global Razorpay integration</p>
        </div>
        {!editing && settings && (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark"
          >
            Edit Settings
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-brand rounded-full animate-spin mx-auto" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : editing || !settings ? (
          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Razorpay Key ID
                </label>
                <input
                  type="text"
                  value={form.keyId}
                  onChange={e => setForm({...form, keyId: e.target.value})}
                  placeholder="rzp_live_xxxxx or rzp_test_xxxxx"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Razorpay Key Secret
                </label>
                <input
                  type="password"
                  value={form.keySecret}
                  onChange={e => setForm({...form, keySecret: e.target.value})}
                  placeholder="••••••••••••••••"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Webhook Secret (Optional)
                </label>
                <input
                  type="password"
                  value={form.webhookSecret}
                  onChange={e => setForm({...form, webhookSecret: e.target.value})}
                  placeholder="••••••••••••••••"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isLive}
                    onChange={e => setForm({...form, isLive: e.target.checked})}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">Live Mode</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    onChange={e => setForm({...form, enabled: e.target.checked})}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">Enabled</span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-brand text-white rounded-lg text-sm disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              {editing && settings && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 border rounded-lg text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Key ID</div>
                <div className="text-sm font-medium text-slate-900 font-mono">
                  {settings.keyId?.substring(0, 10)}...
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Key Secret</div>
                <div className="text-sm font-medium text-slate-900">••••••••••••</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Mode</div>
                <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                  settings.isLive
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                }`}>
                  {settings.isLive ? 'Live' : 'Test'}
                </span>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</div>
                <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                  settings.enabled
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {settings.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Webhook URL</h4>
              <code className="text-xs text-blue-800 bg-blue-100 px-2 py-1 rounded">
                {getApiBase()}/api/v1/razorpay/webhook
              </code>
              <p className="text-xs text-blue-700 mt-2">
                Add this URL to your Razorpay Dashboard → Webhooks
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminRazorpaySettings() {
  return (
    <DashboardLayout title="Payment Settings">
      <RazorpaySettingsContent />
    </DashboardLayout>
  )
}
