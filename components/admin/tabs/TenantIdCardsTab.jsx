/**
 * TenantIdCardsTab - ID card design & validity settings
 * API: GET/PUT /tenants/:tenantId/id-card-settings
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { idCardSettingsApi } from '../../../lib/api/services/idCardSettingsApi'
import { formatWalletError } from '../../../lib/tenantWallet/walletErrors'
import { looksLikeInternalId } from '../../../lib/tenantWallet/displayLabels'
import { uploadMedia } from '../../../lib/api/services/mediaApi'

const MAX_UPLOAD_MB = 2

const DEFAULT_ALLOWED_VALIDITY_DAYS = [30, 90, 180, 365]

const VALIDITY_DAY_LABELS = {
  30: '1 Month (30 days)',
  90: '3 Months (90 days)',
  180: '6 Months (180 days)',
  365: '1 Year (365 days)',
}

function imageDisplayName(url) {
  if (!url) return ''
  const name = url.split('/').pop() || ''
  if (!name || looksLikeInternalId(name) || name.length > 48) return 'Uploaded image'
  return name
}

function templateDisplayName(templateId, templates) {
  return templates.find((t) => t.id === templateId)?.name || 'Classic'
}
const Icons = {
  template: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  branding: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  validity: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  contact: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  upload: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  spinner: (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  ),
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================
function TabButton({ active, icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
        active
          ? 'bg-brand text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function FormSection({ title, description, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function Input({ label, value, onChange, placeholder, type = 'text', hint, ...props }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
        {...props}
      />
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  )
}

function Select({ label, value, onChange, options, hint }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  )
}

function ColorPicker({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value || '#000000'}
            onChange={e => onChange(e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
          />
        </div>
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 px-2.5 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-brand/20 focus:border-brand"
        />
      </div>
    </div>
  )
}

function ImageUploader({ label, value, onChange, onUpload, uploading, hint }) {
  const hasImage = Boolean(value)
  
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <div className={`border-2 border-dashed rounded-xl p-4 transition-colors ${
        hasImage ? 'border-green-300 bg-green-50/50' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
      }`}>
        {hasImage ? (
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={value} 
              alt={label}
              className="h-16 w-auto max-w-[120px] object-contain rounded-lg border bg-white"
              onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%2394a3b8" font-size="12">Error</text></svg>' }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 truncate">{imageDisplayName(value)}</p>
              <div className="flex items-center gap-2 mt-2">
                <label className="px-3 py-1.5 text-xs font-medium bg-white text-slate-700 rounded-lg cursor-pointer hover:bg-slate-100 border transition-colors">
                  {uploading ? 'Uploading...' : 'Replace'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) onUpload(file)
                      e.target.value = ''
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center py-4 cursor-pointer">
            {uploading ? (
              <div className="flex items-center gap-2 text-slate-500">
                {Icons.spinner}
                <span className="text-sm">Uploading...</span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                  {Icons.upload}
                </div>
                <span className="text-sm font-medium text-slate-700">Click to upload</span>
                <span className="text-xs text-slate-500 mt-1">PNG, JPG up to 2MB</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onUpload(file)
                e.target.value = ''
              }}
            />
          </label>
        )}
      </div>
      {hint && <p className="text-xs text-slate-500 mt-1.5">{hint}</p>}
      
      {/* URL Input */}
      <div className="mt-2">
        <input
          type="url"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="Or paste image URL..."
          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-brand/20 focus:border-brand"
        />
      </div>
    </div>
  )
}

function TemplateCard({ id, name, description, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-4 rounded-xl border-2 text-left transition-all ${
        selected
          ? 'border-brand bg-brand/5 ring-2 ring-brand/20'
          : 'border-slate-200 hover:border-slate-300 bg-white'
      }`}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      <div className="w-full h-24 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 mb-3 flex items-center justify-center">
        <div className="w-12 h-16 bg-white rounded shadow-sm border" />
      </div>
      <div className="font-medium text-slate-900">{name}</div>
      <div className="text-xs text-slate-500 mt-0.5">{description}</div>
    </button>
  )
}

function TermsEditor({ terms, onChange }) {
  const addTerm = () => {
    onChange([...terms, ''])
  }
  
  const updateTerm = (index, value) => {
    const newTerms = [...terms]
    newTerms[index] = value
    onChange(newTerms)
  }
  
  const removeTerm = (index) => {
    onChange(terms.filter((_, i) => i !== index))
  }
  
  return (
    <div className="space-y-2">
      {terms.map((term, index) => (
        <div key={index} className="flex gap-2">
          <input
            type="text"
            value={term}
            onChange={e => updateTerm(index, e.target.value)}
            placeholder={`Term ${index + 1}`}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
          <button
            type="button"
            onClick={() => removeTerm(index)}
            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addTerm}
        className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors"
      >
        + Add Term
      </button>
    </div>
  )
}

// ============================================================================
// ID CARD PREVIEW
// ============================================================================
function IdCardPreview({ form, tenantName }) {
  const expiryDate = useMemo(() => {
    const days = form.validityDays || 365
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
  }, [form.validityDays])
  
  const idNumber = `${form.idPrefix || 'ID'}-${new Date().getFullYear()}-${'0'.repeat((form.idDigits || 6) - 1)}1`
  
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Front Side */}
      <div>
        <div className="text-xs text-slate-500 mb-2 text-center">Front</div>
        <div 
          className="w-[220px] h-[340px] rounded-xl shadow-2xl overflow-hidden border"
          style={{ backgroundColor: '#ffffff' }}
        >
          {/* Header */}
          <div 
            className="p-4 text-center"
            style={{ backgroundColor: form.primaryColor || '#004f9f' }}
          >
            {form.frontLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={form.frontLogoUrl} 
                alt="Logo" 
                className="h-10 mx-auto mb-1 object-contain"
                onError={(e) => e.target.style.display = 'none'}
              />
            ) : (
              <div className="text-white font-bold text-sm uppercase tracking-wide">
                {tenantName || 'News Portal'}
              </div>
            )}
            <div className="text-white/80 text-[10px] mt-1 uppercase tracking-wider">Press Identity Card</div>
          </div>
          
          {/* Photo */}
          <div className="flex justify-center -mt-6">
            <div 
              className="w-24 h-24 rounded-full bg-white flex items-center justify-center border-4 overflow-hidden"
              style={{ borderColor: form.secondaryColor || '#ff0000' }}
            >
              <svg className="w-14 h-14 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          {/* Info */}
          <div className="px-4 pt-3 pb-4 text-center">
            <div className="font-bold text-slate-900">SAMPLE REPORTER</div>
            <div className="text-xs text-slate-600 mt-0.5">Senior Correspondent</div>
            
            <div className="mt-3 pt-3 border-t border-dashed text-xs space-y-1.5">
              <div className="flex justify-between px-2">
                <span className="text-slate-500">ID No:</span>
                <span className="font-mono font-semibold text-slate-800">{idNumber}</span>
              </div>
              <div className="flex justify-between px-2">
                <span className="text-slate-500">Valid Till:</span>
                <span className="font-semibold text-slate-800">{expiryDate}</span>
              </div>
              <div className="flex justify-between px-2">
                <span className="text-slate-500">Blood:</span>
                <span className="font-semibold text-red-600">O+</span>
              </div>
            </div>
            
            {/* Stamp & Signature */}
            <div className="mt-3 flex items-end justify-between px-2">
              {form.roundStampUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.roundStampUrl} alt="Stamp" className="w-10 h-10 object-contain opacity-70" />
              ) : (
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-300" />
              )}
              {form.signUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.signUrl} alt="Signature" className="h-6 object-contain opacity-70" />
              ) : (
                <div className="w-16 h-6 border-b border-dashed border-slate-300" />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Back Side */}
      <div>
        <div className="text-xs text-slate-500 mb-2 text-center">Back</div>
        <div 
          className="w-[220px] h-[340px] rounded-xl shadow-2xl overflow-hidden border bg-white p-4"
        >
          <div 
            className="text-[10px] font-bold uppercase tracking-wide mb-3 pb-2 border-b text-center"
            style={{ color: form.primaryColor || '#004f9f' }}
          >
            Terms & Conditions
          </div>
          
          <div className="space-y-1.5 text-[9px] text-slate-600">
            {(form.termsJson?.length ? form.termsJson : [
              'This card is property of the organization',
              'Must be returned upon termination',
              'Report lost cards immediately',
              'Misuse will result in cancellation'
            ]).map((term, i) => (
              <div key={i} className="flex gap-1.5">
                <span>•</span>
                <span>{term}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-auto pt-4">
            <div 
              className="text-[10px] font-bold uppercase tracking-wide mb-2"
              style={{ color: form.primaryColor || '#004f9f' }}
            >
              Contact
            </div>
            {form.officeAddress && (
              <div className="text-[9px] text-slate-600 mb-2">{form.officeAddress}</div>
            )}
            <div className="flex gap-3 text-[9px]">
              {form.helpLine1 && <span className="text-slate-700">{form.helpLine1}</span>}
              {form.helpLine2 && <span className="text-slate-700">{form.helpLine2}</span>}
            </div>
          </div>
          
          {/* QR Code Placeholder */}
          <div className="flex justify-center mt-4">
            <div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h1v1h-1v-1zm-5 0h1v1h-1v-1zm2 0h1v1h-1v-1z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function TenantIdCardsTab({ tenantContext }) {
  const { tenant, refreshTenant } = tenantContext
  
  // UI State
  const [activeTab, setActiveTab] = useState('template')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState({})
  const [message, setMessage] = useState({ type: '', text: '' })
  const [allowedValidityDays, setAllowedValidityDays] = useState(DEFAULT_ALLOWED_VALIDITY_DAYS)
  
  // Form State - matches API payload
  const [form, setForm] = useState({
    templateId: 'STYLE_1',
    frontLogoUrl: '',
    backLogoUrl: '',
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
    idPrefix: 'KM',
    idDigits: 6,
  })
  
  const tabs = [
    { id: 'template', label: 'Template', icon: Icons.template },
    { id: 'branding', label: 'Branding', icon: Icons.branding },
    { id: 'validity', label: 'Validity', icon: Icons.validity },
    { id: 'contact', label: 'Contact & Terms', icon: Icons.contact },
  ]
  
  const templates = [
    { id: 'STYLE_1', name: 'Classic', description: 'Traditional press card style' },
    { id: 'STYLE_2', name: 'Modern', description: 'Clean minimal design' },
    { id: 'STYLE_3', name: 'Premium', description: 'Executive look with gradients' },
  ]
  
  // Show message helper
  const showMessage = useCallback((type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }, [])
  
  // Fetch settings
  const fetchSettings = useCallback(async () => {
    if (!tenant?.id) return
    setLoading(true)
    
    try {
      const data = await idCardSettingsApi.get(tenant.id)
      if (data) {
        const allowed = data.meta?.allowedValidityDays || DEFAULT_ALLOWED_VALIDITY_DAYS
        setAllowedValidityDays(allowed)
        const days = allowed.includes(data.validityDays) ? data.validityDays : (allowed[allowed.length - 1] || 365)
        setForm(prev => ({
          ...prev,
          templateId: data.templateId || 'STYLE_1',
          frontLogoUrl: data.frontLogoUrl || '',
          backLogoUrl: data.backLogoUrl || '',
          roundStampUrl: data.roundStampUrl || '',
          signUrl: data.signUrl || '',
          primaryColor: data.primaryColor || '#004f9f',
          secondaryColor: data.secondaryColor || '#ff0000',
          termsJson: Array.isArray(data.termsJson) ? data.termsJson : [],
          officeAddress: data.officeAddress || '',
          helpLine1: data.helpLine1 || '',
          helpLine2: data.helpLine2 || '',
          validityType: 'PER_USER_DAYS',
          validityDays: days,
          idPrefix: data.idPrefix || 'KM',
          idDigits: data.idDigits || 6,
        }))
      }
    } catch (e) {
      if (e?.status !== 404) {
        showMessage('error', formatWalletError(e, e.message || 'Failed to load'))
      }
    } finally {
      setLoading(false)
    }
  }, [tenant?.id, showMessage])
  
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])
  
  // Handle form changes
  const handleChange = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }, [])
  
  // Upload image
  const uploadImage = useCallback(async (file, fieldKey) => {
    if (!file || !tenant?.id) return

    if (!file.type?.startsWith('image/')) {
      showMessage('error', 'Please select a valid image file (PNG, JPG)')
      return
    }
    if (file.size / (1024 * 1024) > MAX_UPLOAD_MB) {
      showMessage('error', `Image must be under ${MAX_UPLOAD_MB}MB`)
      return
    }

    setUploading(prev => ({ ...prev, [fieldKey]: true }))
    try {
      const { url } = await uploadMedia(file, `tenants/${tenant.id}/id-card`)
      if (url) {
        handleChange(fieldKey, url)
        showMessage('success', 'Image uploaded!')
      } else {
        showMessage('error', 'Upload succeeded but no URL returned')
      }
    } catch (e) {
      showMessage('error', e?.message || 'Upload failed')
    } finally {
      setUploading(prev => ({ ...prev, [fieldKey]: false }))
    }
  }, [tenant?.id, handleChange, showMessage])
  
  // Save settings
  const handleSave = async () => {
    if (!tenant?.id) return

    if (!allowedValidityDays.includes(form.validityDays)) {
      showMessage('error', 'Validity must be 30, 90, 180, or 365 days')
      return
    }

    setSaving(true)
    
    try {
      const payload = {
        ...form,
        validityType: 'PER_USER_DAYS',
        validityDays: form.validityDays,
      }
      delete payload.fixedValidUntil
      await idCardSettingsApi.upsert(tenant.id, payload)
      showMessage('success', 'ID Card settings saved successfully!')
      await fetchSettings()
      refreshTenant?.()
    } catch (e) {
      showMessage('error', formatWalletError(e, e.message || 'Failed to save'))
    } finally {
      setSaving(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          {Icons.spinner}
          <span className="text-sm text-slate-500">Loading settings...</span>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">ID Card Settings</h2>
          <p className="text-sm text-slate-500">Configure reporter ID card design and validity</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 disabled:opacity-50 flex items-center gap-2 shadow-sm"
        >
          {saving ? Icons.spinner : Icons.check}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
      
      {/* Message */}
      {message.text && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? Icons.check : '⚠️'}
          {message.text}
        </div>
      )}
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left - Settings */}
        <div className="xl:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="bg-slate-100 p-1.5 rounded-xl flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                icon={tab.icon}
                label={tab.label}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </div>
          
          {/* Template Tab */}
          {activeTab === 'template' && (
            <div className="space-y-6">
              <FormSection title="Card Template" description="Choose a design style for your ID cards">
                <div className="grid grid-cols-3 gap-4">
                  {templates.map(template => (
                    <TemplateCard
                      key={template.id}
                      id={template.id}
                      name={template.name}
                      description={template.description}
                      selected={form.templateId === template.id}
                      onClick={() => handleChange('templateId', template.id)}
                    />
                  ))}
                </div>
              </FormSection>
              
              <FormSection title="ID Number Format" description="Configure how reporter IDs are generated">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="ID Prefix"
                    value={form.idPrefix}
                    onChange={v => handleChange('idPrefix', v.toUpperCase())}
                    placeholder="KM"
                    maxLength={5}
                    hint="Max 5 characters (e.g., KM, REP, PRESS)"
                  />
                  <Select
                    label="Number of Digits"
                    value={form.idDigits}
                    onChange={v => handleChange('idDigits', parseInt(v))}
                    options={[
                      { value: 4, label: '4 digits (0001)' },
                      { value: 5, label: '5 digits (00001)' },
                      { value: 6, label: '6 digits (000001)' },
                    ]}
                  />
                </div>
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500">Preview Format</div>
                  <div className="font-mono text-lg text-slate-900 mt-1">
                    {form.idPrefix || 'ID'}-{new Date().getFullYear()}-{'0'.repeat((form.idDigits || 6) - 1)}1
                  </div>
                </div>
              </FormSection>
            </div>
          )}
          
          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <FormSection title="Logo & Images" description="Upload branding assets for your ID cards">
                <div className="grid grid-cols-2 gap-6">
                  <ImageUploader
                    label="Front Logo"
                    value={form.frontLogoUrl}
                    onChange={v => handleChange('frontLogoUrl', v)}
                    onUpload={file => uploadImage(file, 'frontLogoUrl')}
                    uploading={uploading.frontLogoUrl}
                    hint="Displayed on card header (200x80px recommended)"
                  />
                  <ImageUploader
                    label="Back Logo"
                    value={form.backLogoUrl}
                    onChange={v => handleChange('backLogoUrl', v)}
                    onUpload={file => uploadImage(file, 'backLogoUrl')}
                    uploading={uploading.backLogoUrl}
                    hint="Optional logo for card back"
                  />
                  <ImageUploader
                    label="Round Stamp/Seal"
                    value={form.roundStampUrl}
                    onChange={v => handleChange('roundStampUrl', v)}
                    onUpload={file => uploadImage(file, 'roundStampUrl')}
                    uploading={uploading.roundStampUrl}
                    hint="Organization seal (PNG with transparency)"
                  />
                  <ImageUploader
                    label="Authorized Signature"
                    value={form.signUrl}
                    onChange={v => handleChange('signUrl', v)}
                    onUpload={file => uploadImage(file, 'signUrl')}
                    uploading={uploading.signUrl}
                    hint="Signature image (PNG with transparency)"
                  />
                </div>
              </FormSection>
              
              <FormSection title="Color Scheme" description="Customize card colors to match your brand">
                <div className="grid grid-cols-2 gap-4">
                  <ColorPicker
                    label="Primary Color"
                    value={form.primaryColor}
                    onChange={v => handleChange('primaryColor', v)}
                  />
                  <ColorPicker
                    label="Secondary Color"
                    value={form.secondaryColor}
                    onChange={v => handleChange('secondaryColor', v)}
                  />
                </div>
              </FormSection>
            </div>
          )}
          
          {/* Validity Tab */}
          {activeTab === 'validity' && (
            <div className="space-y-6">
              <FormSection
                title="Validity Period"
                description="Each reporter's card expires after the selected number of days from their issue date"
              >
                <Select
                  label="Validity Duration"
                  value={form.validityDays}
                  onChange={v => handleChange('validityDays', parseInt(v, 10))}
                  options={allowedValidityDays.map(d => ({
                    value: d,
                    label: VALIDITY_DAY_LABELS[d] || `${d} days`,
                  }))}
                  hint="Allowed: 30, 90, 180, or 365 days from issue date"
                />
              </FormSection>
            </div>
          )}
          
          {/* Contact & Terms Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <FormSection title="Contact Information" description="Displayed on the back of the card">
                <div className="space-y-4">
                  <Input
                    label="Office Address"
                    value={form.officeAddress}
                    onChange={v => handleChange('officeAddress', v)}
                    placeholder="123 Main Street, City, State 500001"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Helpline 1"
                      value={form.helpLine1}
                      onChange={v => handleChange('helpLine1', v)}
                      placeholder="+91 9876543210"
                    />
                    <Input
                      label="Helpline 2"
                      value={form.helpLine2}
                      onChange={v => handleChange('helpLine2', v)}
                      placeholder="+91 8765432109"
                    />
                  </div>
                </div>
              </FormSection>
              
              <FormSection title="Terms & Conditions" description="Rules displayed on card back">
                <TermsEditor
                  terms={form.termsJson || []}
                  onChange={terms => handleChange('termsJson', terms)}
                />
              </FormSection>
            </div>
          )}
        </div>
        
        {/* Right - Preview */}
        <div className="xl:col-span-1">
          <div className="sticky top-6">
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-6">
              <h3 className="font-semibold text-slate-900 text-center mb-4">Live Preview</h3>
              <IdCardPreview form={form} tenantName={tenant?.name} />
            </div>
            
            {/* Quick Info */}
            <div className="mt-4 p-4 bg-white rounded-xl border">
              <div className="text-xs text-slate-500 space-y-2">
                <div className="flex justify-between">
                  <span>Template:</span>
                  <span className="font-medium text-slate-700">{templateDisplayName(form.templateId, templates)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ID format:</span>
                  <span className="text-slate-700">{form.idPrefix}-YYYY-{'#'.repeat(form.idDigits || 6)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Validity:</span>
                  <span className="font-medium text-slate-700">
                    {form.validityDays} days from issue
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
