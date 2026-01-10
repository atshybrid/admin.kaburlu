/**
 * TenantIdCardsTab - Manage tenant ID card settings
 * API: GET/PUT /tenants/:tenantId/id-card-settings
 */
import { useState, useEffect, useCallback } from 'react'
import { idCardApi } from '../../../lib/api/tenantApi'

export default function TenantIdCardsTab({ tenantContext }) {
  const { tenant, refreshTenant } = tenantContext
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form state matching API response
  const [form, setForm] = useState({
    templateId: 'STYLE_1',
    frontLogoUrl: '',
    roundStampUrl: '',
    signUrl: '',
    primaryColor: '#004f9f',
    secondaryColor: '#ff0000',
    termsJson: [],
    officeAddress: '',
    helpLine1: '',
    helpLine2: '',
    validityType: 'PER_USER_DAYS',
    validityDays: 365,
    fixedValidUntil: null,
    idPrefix: 'KM',
    idDigits: 6,
  })

  const fetchSettings = useCallback(async () => {
    if (!tenant?.id) return
    setLoading(true)
    setError('')
    
    try {
      const data = await idCardApi.get(tenant.id)
      if (data) {
        setForm(prev => ({
          ...prev,
          templateId: data.templateId || 'STYLE_1',
          frontLogoUrl: data.frontLogoUrl || '',
          roundStampUrl: data.roundStampUrl || '',
          signUrl: data.signUrl || '',
          primaryColor: data.primaryColor || '#004f9f',
          secondaryColor: data.secondaryColor || '#ff0000',
          termsJson: data.termsJson || [],
          officeAddress: data.officeAddress || '',
          helpLine1: data.helpLine1 || '',
          helpLine2: data.helpLine2 || '',
          validityType: data.validityType || 'PER_USER_DAYS',
          validityDays: data.validityDays || 365,
          fixedValidUntil: data.fixedValidUntil || null,
          idPrefix: data.idPrefix || 'KM',
          idDigits: data.idDigits || 6,
        }))
      }
    } catch (e) {
      // 404 means no settings yet, which is fine
      if (!e.message.includes('404')) {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }, [tenant?.id])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    
    try {
      await idCardApi.upsert(tenant.id, form)
      setSuccess('ID card settings saved successfully')
      await fetchSettings()
      refreshTenant?.()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const templates = [
    { id: 'STYLE_1', name: 'Style 1', desc: 'Classic vertical press card' },
    { id: 'STYLE_2', name: 'Style 2', desc: 'Modern horizontal layout' },
    { id: 'STYLE_3', name: 'Style 3', desc: 'Minimal clean design' },
  ]

  const validityTypes = [
    { id: 'PER_USER_DAYS', name: 'Per User Days', desc: 'Validity starts from issue date' },
    { id: 'FIXED_END_DATE', name: 'Fixed End Date', desc: 'All cards expire on same date' },
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">ID Card Settings</h2>
          <p className="text-sm text-slate-500">Configure reporter ID card design, branding, and validity</p>
        </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Settings */}
          <div className="space-y-6">
            {/* Template Selection */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-medium text-slate-900 mb-4">Template Design</h3>
              <div className="grid grid-cols-3 gap-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleChange('templateId', template.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      form.templateId === template.id
                        ? 'bg-brand/10 border-brand ring-1 ring-brand'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-medium text-slate-900 text-sm">{template.name}</div>
                    <div className="text-xs text-slate-500">{template.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Branding Assets */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-medium text-slate-900 mb-4">Branding Assets</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Front Logo URL</label>
                  <input
                    type="url"
                    value={form.frontLogoUrl}
                    onChange={e => handleChange('frontLogoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                  />
                  <p className="text-xs text-slate-500 mt-1">Main logo displayed on the card front</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Back Logo URL</label>
                  <input
                    type="url"
                    value={form.backLogoUrl}
                    onChange={e => handleChange('backLogoUrl', e.target.value)}
                    placeholder="https://example.com/back-logo.png"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Round Stamp URL</label>
                    <input
                      type="url"
                      value={form.roundStampUrl}
                      onChange={e => handleChange('roundStampUrl', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Signature URL</label>
                    <input
                      type="url"
                      value={form.signUrl}
                      onChange={e => handleChange('signUrl', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-medium text-slate-900 mb-4">Color Scheme</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'primaryColor', label: 'Primary Color' },
                  { key: 'secondaryColor', label: 'Secondary Color' },
                  { key: 'backgroundColor', label: 'Background' },
                  { key: 'textColor', label: 'Text Color' },
                ].map((color) => (
                  <div key={color.key}>
                    <label className="block text-xs font-medium text-slate-700 mb-1">{color.label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form[color.key]}
                        onChange={e => handleChange(color.key, e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={form[color.key]}
                        onChange={e => handleChange(color.key, e.target.value)}
                        className="flex-1 px-2 py-1.5 border rounded text-xs font-mono focus:ring-2 focus:ring-brand focus:border-brand"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ID Configuration */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-medium text-slate-900 mb-4">ID Number Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ID Prefix</label>
                  <input
                    type="text"
                    value={form.idPrefix}
                    onChange={e => handleChange('idPrefix', e.target.value.toUpperCase())}
                    placeholder="REP"
                    maxLength={5}
                    className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand focus:border-brand"
                  />
                  <p className="text-xs text-slate-500 mt-1">e.g., REP, PRESS, NR</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ID Digits</label>
                  <select
                    value={form.idDigits}
                    onChange={e => handleChange('idDigits', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                  >
                    {[3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} digits</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Format: {form.idPrefix}-{new Date().getFullYear()}-{'0'.repeat(form.idDigits - 1)}1</p>
                </div>
              </div>
            </div>

            {/* Validity Settings */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-medium text-slate-900 mb-4">Validity Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Validity Period</label>
                  <select
                    value={form.validityMonths}
                    onChange={e => handleChange('validityMonths', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                  >
                    <option value={6}>6 Months</option>
                    <option value={12}>1 Year</option>
                    <option value={24}>2 Years</option>
                    <option value={36}>3 Years</option>
                  </select>
                </div>
                
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={form.autoRenew}
                    onChange={e => handleChange('autoRenew', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand"
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Auto Renewal</div>
                    <div className="text-xs text-slate-500">Automatically extend validity when reporter is active</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Display Fields */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-medium text-slate-900 mb-4">Display Fields</h3>
              <div className="space-y-2">
                {[
                  { key: 'showPhoto', label: 'Photo', desc: 'Reporter photo' },
                  { key: 'showQrCode', label: 'QR Code', desc: 'Verification QR code' },
                  { key: 'showDesignation', label: 'Designation', desc: 'Role/title' },
                  { key: 'showValidity', label: 'Validity Period', desc: 'Valid from/to dates' },
                  { key: 'showBloodGroup', label: 'Blood Group', desc: 'Blood type' },
                  { key: 'showEmergencyContact', label: 'Emergency Contact', desc: 'Phone number' },
                  { key: 'showAddress', label: 'Address', desc: 'Reporter address' },
                ].map((field) => (
                  <label key={field.key} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[field.key]}
                      onChange={e => handleChange(field.key, e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">{field.label}</div>
                      <div className="text-xs text-slate-500">{field.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:sticky lg:top-6 h-fit">
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-medium text-slate-900 mb-4">Live Preview</h3>
              <div className="flex justify-center">
                <div 
                  className={`rounded-xl shadow-xl overflow-hidden transition-all ${
                    form.templateId === 'horizontal' ? 'w-80' : 'w-56'
                  }`}
                  style={{ 
                    backgroundColor: form.backgroundColor,
                    color: form.textColor
                  }}
                >
                  {/* Card Header */}
                  <div 
                    className="p-3 text-center text-white"
                    style={{ backgroundColor: form.primaryColor }}
                  >
                    {form.frontLogoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img 
                        src={form.frontLogoUrl} 
                        alt="Logo" 
                        className="h-8 mx-auto mb-1 object-contain"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    ) : (
                      <div className="text-xs font-bold uppercase tracking-wider">
                        {tenant?.name || 'News Portal'}
                      </div>
                    )}
                    <div className="text-[10px] opacity-80">PRESS ID CARD</div>
                  </div>
                  
                  {/* Card Body */}
                  <div className="p-4">
                    {form.showPhoto && (
                      <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-2" style={{ borderColor: form.secondaryColor }}>
                        <svg className="w-10 h-10 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <div className="font-bold text-sm">Sample Reporter</div>
                      {form.showDesignation && (
                        <div className="text-xs opacity-70 mt-0.5">Senior Correspondent</div>
                      )}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-dashed space-y-1.5 text-xs" style={{ borderColor: `${form.textColor}30` }}>
                      <div className="flex justify-between">
                        <span className="opacity-60">ID:</span>
                        <span className="font-mono font-medium">{form.idPrefix}-{new Date().getFullYear()}-{'0'.repeat(form.idDigits - 1)}1</span>
                      </div>
                      {form.showValidity && (
                        <div className="flex justify-between">
                          <span className="opacity-60">Valid Till:</span>
                          <span>{new Date(Date.now() + form.validityMonths * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                        </div>
                      )}
                      {form.showBloodGroup && (
                        <div className="flex justify-between">
                          <span className="opacity-60">Blood:</span>
                          <span className="font-medium">O+</span>
                        </div>
                      )}
                      {form.showEmergencyContact && (
                        <div className="flex justify-between">
                          <span className="opacity-60">Emergency:</span>
                          <span>+91 98765 43210</span>
                        </div>
                      )}
                    </div>

                    {form.showQrCode && (
                      <div className="mt-3 flex justify-center">
                        <div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center">
                          <svg className="w-12 h-12 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h1v1h-1v-1zm-5 0h1v1h-1v-1zm2 0h1v1h-1v-1zm0 2h1v1h-1v-1zm2 0h1v1h-1v-1zm-4 2h1v1h-1v-1zm2 0h1v1h-1v-1zm2 0h1v1h-1v-1zm0 2h1v1h-1v-1z"/>
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Stamp & Signature */}
                    <div className="mt-3 flex items-end justify-between">
                      {form.roundStampUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img 
                          src={form.roundStampUrl} 
                          alt="Stamp" 
                          className="w-10 h-10 object-contain opacity-80"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      )}
                      {form.signUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img 
                          src={form.signUrl} 
                          alt="Signature" 
                          className="h-6 object-contain opacity-80"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Preview Info */}
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Template:</span>
                    <span className="font-medium capitalize">{form.templateId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ID Format:</span>
                    <span className="font-mono text-[10px]">{form.idPrefix}-YYYY-{'#'.repeat(form.idDigits)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Validity:</span>
                    <span>{form.validityMonths} months</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
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
                Save ID Card Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
