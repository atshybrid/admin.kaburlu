/**
 * TenantPaymentsTab - Manage tenant-specific payment settings
 * API: GET/POST/PUT /tenants/:tenantId/razorpay-config
 */
import { useState, useEffect, useCallback } from 'react'
import { razorpayApi } from '../../../lib/api/tenantApi'

export default function TenantPaymentsTab({ tenantContext }) {
  const { tenant, refreshTenant } = tenantContext
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editing, setEditing] = useState(false)
  const [config, setConfig] = useState(null)
  
  const [form, setForm] = useState({
    keyId: '',
    keySecret: '',
    webhookSecret: '',
    isLive: false,
    enabled: true,
    useGlobalSettings: true
  })

  const fetchConfig = useCallback(async () => {
    if (!tenant?.id) return
    setLoading(true)
    setError('')
    
    try {
      const data = await razorpayApi.get(tenant.id)
      setConfig(data)
      if (data) {
        setForm({
          keyId: data.keyId || '',
          keySecret: '', // Never show secret
          webhookSecret: '', // Never show secret
          isLive: data.isLive || false,
          enabled: data.enabled !== false,
          useGlobalSettings: data.useGlobalSettings !== false
        })
      }
    } catch (e) {
      // 404 means no config yet
      if (!e.message.includes('404')) {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }, [tenant?.id])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    
    try {
      // Use upsert (PUT) which handles both create and update
      await razorpayApi.upsert(tenant.id, form)
      setSuccess('Payment settings saved')
      setEditing(false)
      await fetchConfig()
      refreshTenant?.()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Payment Settings</h2>
          <p className="text-sm text-slate-500">Configure Razorpay for this tenant</p>
        </div>
        {!editing && config && (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark"
          >
            Edit Settings
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        {editing || !config ? (
          <form onSubmit={handleSave} className="p-6 space-y-6">
            {/* Use Global Settings Toggle */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.useGlobalSettings}
                  onChange={e => setForm({...form, useGlobalSettings: e.target.checked})}
                  className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand"
                />
                <div>
                  <div className="font-medium text-blue-900">Use Global Settings</div>
                  <div className="text-xs text-blue-700">
                    Use the platform-wide Razorpay configuration instead of tenant-specific keys
                  </div>
                </div>
              </label>
            </div>

            {!form.useGlobalSettings && (
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
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand"
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
                    placeholder={config?.keyId ? '••••••••••••' : 'Enter secret key'}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                  />
                  <p className="text-xs text-slate-500 mt-1">Leave blank to keep existing secret</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Webhook Secret (Optional)
                  </label>
                  <input
                    type="password"
                    value={form.webhookSecret}
                    onChange={e => setForm({...form, webhookSecret: e.target.value})}
                    placeholder={config?.webhookSecret ? '••••••••••••' : 'Enter webhook secret'}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                  />
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isLive}
                      onChange={e => setForm({...form, isLive: e.target.checked})}
                      className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand"
                    />
                    <span className="text-sm text-slate-700">Live Mode</span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={e => setForm({...form, enabled: e.target.checked})}
                  className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand"
                />
                <span className="text-sm text-slate-700">Enable Payments</span>
              </label>
            </div>
            
            <div className="flex items-center gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    Saving...
                  </>
                ) : 'Save Settings'}
              </button>
              {editing && config && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 border rounded-lg text-sm hover:bg-slate-50"
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
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Configuration</div>
                <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                  config.useGlobalSettings
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-purple-50 text-purple-700 border border-purple-200'
                }`}>
                  {config.useGlobalSettings ? 'Using Global Settings' : 'Custom Settings'}
                </span>
              </div>
              {!config.useGlobalSettings && (
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Key ID</div>
                  <div className="text-sm font-medium text-slate-900 font-mono">
                    {config.keyId?.substring(0, 12)}...
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Mode</div>
                <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                  config.isLive
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                }`}>
                  {config.isLive ? 'Live' : 'Test'}
                </span>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</div>
                <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                  config.enabled
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {config.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subscription Plans Info */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-medium text-slate-900 mb-4">Subscription Plans</h3>
        <div className="text-sm text-slate-500 mb-4">
          Subscription plans can be configured separately in the tenant&apos;s subscription settings.
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg border">
            <div className="font-medium text-slate-900">Monthly</div>
            <div className="text-2xl font-bold text-brand mt-1">₹99</div>
            <div className="text-xs text-slate-500 mt-1">per month</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border ring-2 ring-brand">
            <div className="font-medium text-slate-900">Annual</div>
            <div className="text-2xl font-bold text-brand mt-1">₹999</div>
            <div className="text-xs text-slate-500 mt-1">per year (save 16%)</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border">
            <div className="font-medium text-slate-900">Lifetime</div>
            <div className="text-2xl font-bold text-brand mt-1">₹4999</div>
            <div className="text-xs text-slate-500 mt-1">one-time payment</div>
          </div>
        </div>
      </div>
    </div>
  )
}
