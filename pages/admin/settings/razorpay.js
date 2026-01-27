/**
 * Admin Global Payment Gateway (Razorpay) Settings
 * /admin/settings/razorpay route
 */
import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { getToken } from '../../../utils/auth'

// Use local proxy to avoid CORS
function getApiBase() {
  if (typeof window !== 'undefined') {
    return '/api/proxy'
  }
  return (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com').replace(/\/$/, '') + '/api/v1'
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
    active: true
  })

  const loadSettings = async () => {
    setLoading(true)
    setError('')
    try {
      const t = getToken()
      const apiUrl = `${getApiBase()}/admin/razorpay-config/global`
      console.log('🔍 Fetching Razorpay config from:', apiUrl)
      const res = await fetch(apiUrl, {
        headers: { 'Authorization': `Bearer ${t?.token || ''}` }
      })
      console.log('📥 Response status:', res.status)
      if (!res.ok) {
        if (res.status === 404) {
          setSettings(null)
          setEditing(true) // Show form if no config exists
          return
        }
        const errorText = await res.text()
        console.error('❌ Error response:', errorText)
        throw new Error(`Request failed: ${res.status}`)
      }
      const data = await res.json()
      console.log('✅ Razorpay config loaded:', data)
      setSettings(data)
      setForm({
        keyId: data.keyId || '',
        keySecret: '', // Don't pre-fill secret
        webhookSecret: data.webhookSecret || '',
        isLive: data.keyId?.startsWith('rzp_live') || false,
        active: data.active !== false
      })
    } catch (e) {
      console.error('❌ Load settings error:', e)
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
    setError('')
    try {
      const t = getToken()
      // Always use POST for global config (creates or updates)
      const payload = { 
        keyId: form.keyId.trim(), 
        active: form.active 
      }
      // Only send keySecret if provided (for update, can be optional)
      if (form.keySecret.trim()) {
        payload.keySecret = form.keySecret.trim()
      }
      if (form.webhookSecret.trim()) {
        payload.webhookSecret = form.webhookSecret.trim()
      }
      
      const res = await fetch(`${getApiBase()}/admin/razorpay-config/global`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = json?.message || json?.error || `Failed: ${res.status}`
        throw new Error(msg)
      }
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
                  Razorpay Key Secret {settings && <span className="text-slate-400 font-normal">(leave blank to keep existing)</span>}
                </label>
                <input
                  type="password"
                  value={form.keySecret}
                  onChange={e => setForm({...form, keySecret: e.target.value})}
                  placeholder={settings ? "Leave blank to keep existing" : "Enter key secret"}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required={!settings}
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
                    checked={form.active}
                    onChange={e => setForm({...form, active: e.target.checked})}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">Enabled</span>
                </label>
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}
            
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
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">ID</div>
                <div className="text-sm font-medium text-slate-900 font-mono">
                  {settings.id}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Tenant</div>
                <div className="text-sm font-medium text-slate-500">
                  {settings.tenantId || 'Global (All Tenants)'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Key ID</div>
                <div className="text-sm font-medium text-slate-900 font-mono">
                  {settings.keyId}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Key Secret</div>
                <div className="text-sm font-medium text-slate-900 font-mono">
                  {settings.keySecretMasked || '••••••••••••'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Mode</div>
                <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                  settings.keyId?.startsWith('rzp_live')
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                }`}>
                  {settings.keyId?.startsWith('rzp_live') ? 'Live' : 'Test'}
                </span>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</div>
                <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                  settings.active
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {settings.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Created</div>
                <div className="text-sm text-slate-600">
                  {settings.createdAt ? new Date(settings.createdAt).toLocaleString() : '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Updated</div>
                <div className="text-sm text-slate-600">
                  {settings.updatedAt ? new Date(settings.updatedAt).toLocaleString() : '-'}
                </div>
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
