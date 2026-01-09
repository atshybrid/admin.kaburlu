/**
 * TenantBrandingTab - Manage tenant theme and branding settings
 * API: GET/PATCH /tenant-theme/:tenantId
 */
import { useState, useEffect, useCallback } from 'react'
import { themeApi } from '../../../lib/api/tenantApi'

export default function TenantBrandingTab({ tenantContext }) {
  const { tenant, refreshTenant } = tenantContext
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [form, setForm] = useState({
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#e11d48',
    secondaryColor: '#1e293b',
    headerBgColor: '#ffffff',
    footerBgColor: '#1e293b',
    headerHtml: '',
    footerHtml: '',
    fontFamily: 'Inter'
  })

  const fetchTheme = useCallback(async () => {
    if (!tenant?.id) return
    setLoading(true)
    setError('')
    
    try {
      const data = await themeApi.get(tenant.id)
      if (data) {
        setForm(prev => ({
          ...prev,
          logoUrl: data.logoUrl || '',
          faviconUrl: data.faviconUrl || '',
          primaryColor: data.primaryColor || '#e11d48',
          secondaryColor: data.secondaryColor || '#1e293b',
          headerBgColor: data.headerBgColor || '#ffffff',
          footerBgColor: data.footerBgColor || '#1e293b',
          headerHtml: data.headerHtml || '',
          footerHtml: data.footerHtml || '',
          fontFamily: data.fontFamily || 'Inter',
        }))
      }
    } catch (e) {
      // 404 means no theme yet
      if (!e.message.includes('404')) {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }, [tenant?.id])

  useEffect(() => {
    fetchTheme()
  }, [fetchTheme])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    
    try {
      await themeApi.update(tenant.id, form)
      setSuccess('Branding updated successfully')
      refreshTenant?.()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const fonts = [
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Poppins',
    'Nunito',
    'Raleway',
    'Montserrat',
    'Source Sans Pro',
    'Noto Sans'
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Branding & Theme</h2>
        <p className="text-sm text-slate-500">Customize the visual appearance of this tenant</p>
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

      <form onSubmit={handleSave} className="space-y-6">
        {/* Logo & Favicon */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-medium text-slate-900 mb-4">Logo & Favicon</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL</label>
              <input
                type="url"
                value={form.logoUrl}
                onChange={e => setForm({...form, logoUrl: e.target.value})}
                placeholder="https://example.com/logo.png"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              {form.logoUrl && (
                <div className="mt-2 p-2 bg-slate-50 rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.logoUrl} alt="Logo preview" className="h-10 object-contain" />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Favicon URL</label>
              <input
                type="url"
                value={form.faviconUrl}
                onChange={e => setForm({...form, faviconUrl: e.target.value})}
                placeholder="https://example.com/favicon.ico"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              {form.faviconUrl && (
                <div className="mt-2 p-2 bg-slate-50 rounded-lg inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.faviconUrl} alt="Favicon preview" className="h-8 w-8 object-contain" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-medium text-slate-900 mb-4">Colors</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Primary</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={e => setForm({...form, primaryColor: e.target.value})}
                  className="w-10 h-10 rounded cursor-pointer border"
                />
                <input
                  type="text"
                  value={form.primaryColor}
                  onChange={e => setForm({...form, primaryColor: e.target.value})}
                  className="flex-1 px-2 py-1 border rounded text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Secondary</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.secondaryColor}
                  onChange={e => setForm({...form, secondaryColor: e.target.value})}
                  className="w-10 h-10 rounded cursor-pointer border"
                />
                <input
                  type="text"
                  value={form.secondaryColor}
                  onChange={e => setForm({...form, secondaryColor: e.target.value})}
                  className="flex-1 px-2 py-1 border rounded text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Header BG</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.headerBgColor}
                  onChange={e => setForm({...form, headerBgColor: e.target.value})}
                  className="w-10 h-10 rounded cursor-pointer border"
                />
                <input
                  type="text"
                  value={form.headerBgColor}
                  onChange={e => setForm({...form, headerBgColor: e.target.value})}
                  className="flex-1 px-2 py-1 border rounded text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Footer BG</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.footerBgColor}
                  onChange={e => setForm({...form, footerBgColor: e.target.value})}
                  className="w-10 h-10 rounded cursor-pointer border"
                />
                <input
                  type="text"
                  value={form.footerBgColor}
                  onChange={e => setForm({...form, footerBgColor: e.target.value})}
                  className="flex-1 px-2 py-1 border rounded text-sm font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-medium text-slate-900 mb-4">Typography</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Font Family</label>
            <select
              value={form.fontFamily}
              onChange={e => setForm({...form, fontFamily: e.target.value})}
              className="w-full max-w-xs px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand focus:border-brand"
            >
              {fonts.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <div className="mt-3 p-4 bg-slate-50 rounded-lg" style={{ fontFamily: form.fontFamily }}>
              <p className="text-lg font-bold">Preview: The quick brown fox</p>
              <p className="text-sm">jumps over the lazy dog. 1234567890</p>
            </div>
          </div>
        </div>

        {/* Custom HTML */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-medium text-slate-900 mb-4">Custom HTML Injection</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Header HTML</label>
              <textarea
                value={form.headerHtml}
                onChange={e => setForm({...form, headerHtml: e.target.value})}
                placeholder="<!-- Custom scripts, tracking codes, etc. -->"
                rows={3}
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand focus:border-brand"
              />
              <p className="text-xs text-slate-500 mt-1">Injected into the &lt;head&gt; section</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Footer HTML</label>
              <textarea
                value={form.footerHtml}
                onChange={e => setForm({...form, footerHtml: e.target.value})}
                placeholder="<!-- Analytics, chat widgets, etc. -->"
                rows={3}
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand focus:border-brand"
              />
              <p className="text-xs text-slate-500 mt-1">Injected before &lt;/body&gt;</p>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <h3 className="font-medium text-slate-900 p-4 border-b">Live Preview</h3>
          <div className="p-4">
            <div 
              className="rounded-lg overflow-hidden border"
              style={{ fontFamily: form.fontFamily }}
            >
              {/* Header preview */}
              <div 
                className="p-3 flex items-center justify-between"
                style={{ backgroundColor: form.headerBgColor }}
              >
                {form.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logoUrl} alt="Logo" className="h-8 object-contain" />
                ) : (
                  <div 
                    className="font-bold text-lg"
                    style={{ color: form.primaryColor }}
                  >
                    {tenant?.name || 'Tenant Name'}
                  </div>
                )}
                <div className="flex gap-4 text-sm" style={{ color: form.secondaryColor }}>
                  <span>Home</span>
                  <span>News</span>
                  <span>Contact</span>
                </div>
              </div>
              {/* Content preview */}
              <div className="p-4 bg-white">
                <h4 
                  className="font-bold mb-2"
                  style={{ color: form.secondaryColor }}
                >
                  Sample Article Title
                </h4>
                <p className="text-sm text-slate-600 mb-3">
                  This is how your content will appear with the selected theme settings.
                </p>
                <button
                  className="px-3 py-1.5 rounded text-sm text-white"
                  style={{ backgroundColor: form.primaryColor }}
                >
                  Read More
                </button>
              </div>
              {/* Footer preview */}
              <div 
                className="p-3 text-center text-xs text-white"
                style={{ backgroundColor: form.footerBgColor }}
              >
                © 2024 {tenant?.name || 'Tenant Name'}. All rights reserved.
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Branding
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
