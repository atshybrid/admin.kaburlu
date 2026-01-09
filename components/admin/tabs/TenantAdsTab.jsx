/**
 * TenantAdsTab - Manage tenant advertisement slots
 * API: GET/POST/PATCH/DELETE /tenants/:tenantId/ads
 * Style slots: GET/PUT/PATCH /tenants/:tenantId/ads/style1 and style2
 */
import { useState, useEffect, useCallback } from 'react'
import { adsApi } from '../../../lib/api/tenantApi'

// Ad slot definitions for Style1 and Style2 layouts
const STYLE1_SLOTS = [
  { id: 'header_top', name: 'Header Top', desc: 'Above header banner (728x90)' },
  { id: 'header_bottom', name: 'Header Bottom', desc: 'Below header (728x90)' },
  { id: 'sidebar_top', name: 'Sidebar Top', desc: 'Top of sidebar (300x250)' },
  { id: 'sidebar_middle', name: 'Sidebar Middle', desc: 'Middle sidebar (300x600)' },
  { id: 'sidebar_bottom', name: 'Sidebar Bottom', desc: 'Bottom sidebar (300x250)' },
  { id: 'content_top', name: 'Content Top', desc: 'Above main content (728x90)' },
  { id: 'content_middle', name: 'In-Content', desc: 'Between articles (728x90)' },
  { id: 'footer_top', name: 'Footer Top', desc: 'Above footer (728x90)' },
]

const STYLE2_SLOTS = [
  { id: 'hero_banner', name: 'Hero Banner', desc: 'Full width hero (1200x300)' },
  { id: 'below_hero', name: 'Below Hero', desc: 'After hero section (728x90)' },
  { id: 'category_banner', name: 'Category Banner', desc: 'Category section (970x250)' },
  { id: 'grid_inline_1', name: 'Grid Inline 1', desc: 'First inline ad (300x250)' },
  { id: 'grid_inline_2', name: 'Grid Inline 2', desc: 'Second inline ad (300x250)' },
  { id: 'sticky_sidebar', name: 'Sticky Sidebar', desc: 'Sticky right sidebar (300x600)' },
  { id: 'footer_banner', name: 'Footer Banner', desc: 'Pre-footer (970x90)' },
]

export default function TenantAdsTab({ tenantContext }) {
  const { tenant } = tenantContext
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeStyle, setActiveStyle] = useState('style1')
  
  const [style1Ads, setStyle1Ads] = useState({})
  const [style2Ads, setStyle2Ads] = useState({})
  const [customAds, setCustomAds] = useState([])
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSlot, setEditingSlot] = useState(null)
  const [slotForm, setSlotForm] = useState({
    enabled: true,
    code: '',
    type: 'adsense', // adsense | custom | image
    imageUrl: '',
    linkUrl: '',
    altText: '',
  })

  const fetchAds = useCallback(async () => {
    if (!tenant?.id) return
    setLoading(true)
    setError('')
    
    try {
      const [s1, s2, custom] = await Promise.all([
        adsApi.style1.get(tenant.id).catch(() => ({})),
        adsApi.style2.get(tenant.id).catch(() => ({})),
        adsApi.list(tenant.id).catch(() => []),
      ])
      
      setStyle1Ads(s1.slots || s1 || {})
      setStyle2Ads(s2.slots || s2 || {})
      setCustomAds(Array.isArray(custom) ? custom : custom.ads || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [tenant?.id])

  useEffect(() => {
    fetchAds()
  }, [fetchAds])

  const handleSlotClick = (slotId, style) => {
    const ads = style === 'style1' ? style1Ads : style2Ads
    const existing = ads[slotId] || {}
    
    setEditingSlot({ id: slotId, style })
    setSlotForm({
      enabled: existing.enabled ?? true,
      code: existing.code || '',
      type: existing.type || 'adsense',
      imageUrl: existing.imageUrl || '',
      linkUrl: existing.linkUrl || '',
      altText: existing.altText || '',
    })
    setShowAddModal(true)
  }

  const handleSaveSlot = async () => {
    if (!editingSlot) return
    setSaving(true)
    setError('')
    
    try {
      const { id: slotId, style } = editingSlot
      const currentAds = style === 'style1' ? { ...style1Ads } : { ...style2Ads }
      
      currentAds[slotId] = { ...slotForm }
      
      if (style === 'style1') {
        await adsApi.style1.patch(tenant.id, { slots: currentAds })
        setStyle1Ads(currentAds)
      } else {
        await adsApi.style2.patch(tenant.id, { slots: currentAds })
        setStyle2Ads(currentAds)
      }
      
      setSuccess('Ad slot saved successfully')
      setShowAddModal(false)
      setEditingSlot(null)
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveSlot = async () => {
    if (!editingSlot) return
    setSaving(true)
    
    try {
      const { id: slotId, style } = editingSlot
      const currentAds = style === 'style1' ? { ...style1Ads } : { ...style2Ads }
      
      delete currentAds[slotId]
      
      if (style === 'style1') {
        await adsApi.style1.put(tenant.id, { slots: currentAds })
        setStyle1Ads(currentAds)
      } else {
        await adsApi.style2.put(tenant.id, { slots: currentAds })
        setStyle2Ads(currentAds)
      }
      
      setSuccess('Ad slot removed')
      setShowAddModal(false)
      setEditingSlot(null)
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const getSlotStatus = (slotId, style) => {
    const ads = style === 'style1' ? style1Ads : style2Ads
    const slot = ads[slotId]
    if (!slot) return 'empty'
    if (!slot.enabled) return 'disabled'
    return 'active'
  }

  const currentSlots = activeStyle === 'style1' ? STYLE1_SLOTS : STYLE2_SLOTS

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Advertisement Settings</h2>
          <p className="text-sm text-slate-500">Configure ad slots for homepage layouts</p>
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

      {/* Style Tabs */}
      <div className="flex gap-2">
        {['style1', 'style2'].map((style) => (
          <button
            key={style}
            onClick={() => setActiveStyle(style)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeStyle === style
                ? 'bg-brand text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {style === 'style1' ? 'Style 1 (Classic)' : 'Style 2 (Modern)'}
          </button>
        ))}
      </div>

      {/* Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentSlots.map((slot) => {
          const status = getSlotStatus(slot.id, activeStyle)
          const ads = activeStyle === 'style1' ? style1Ads : style2Ads
          const slotData = ads[slot.id]
          
          return (
            <button
              key={slot.id}
              onClick={() => handleSlotClick(slot.id, activeStyle)}
              className={`p-4 rounded-xl border text-left transition-all hover:shadow-md ${
                status === 'active' 
                  ? 'bg-green-50 border-green-200' 
                  : status === 'disabled'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    status === 'active' ? 'bg-green-500' :
                    status === 'disabled' ? 'bg-yellow-500' : 'bg-slate-300'
                  }`}></span>
                  <span className="font-medium text-slate-900 text-sm">{slot.name}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  status === 'active' ? 'bg-green-100 text-green-700' :
                  status === 'disabled' ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-slate-200 text-slate-600'
                }`}>
                  {status === 'active' ? 'Active' : status === 'disabled' ? 'Disabled' : 'Empty'}
                </span>
              </div>
              
              <p className="text-xs text-slate-500 mb-2">{slot.desc}</p>
              
              {slotData && (
                <div className="text-xs text-slate-600 bg-white/50 rounded p-2">
                  <span className="font-medium capitalize">{slotData.type || 'adsense'}</span>
                  {slotData.code && (
                    <span className="text-slate-400 ml-1">• {slotData.code.length} chars</span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Custom Ads Section */}
      {customAds.length > 0 && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-medium text-slate-900 mb-4">Custom Ads ({customAds.length})</h3>
          <div className="space-y-2">
            {customAds.map((ad) => (
              <div 
                key={ad.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div>
                  <div className="font-medium text-sm text-slate-900">{ad.name || ad.slot}</div>
                  <div className="text-xs text-slate-500">{ad.type}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  ad.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                }`}>
                  {ad.enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slot Edit Modal */}
      {showAddModal && editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Configure Ad Slot
              </h3>
              <button 
                onClick={() => { setShowAddModal(false); setEditingSlot(null) }}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg mb-4">
              <div className="font-medium text-sm text-slate-900">
                {(activeStyle === 'style1' ? STYLE1_SLOTS : STYLE2_SLOTS).find(s => s.id === editingSlot.id)?.name}
              </div>
              <div className="text-xs text-slate-500">
                {(activeStyle === 'style1' ? STYLE1_SLOTS : STYLE2_SLOTS).find(s => s.id === editingSlot.id)?.desc}
              </div>
            </div>

            <div className="space-y-4">
              {/* Enable Toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={slotForm.enabled}
                  onChange={e => setSlotForm({ ...slotForm, enabled: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand"
                />
                <span className="text-sm font-medium text-slate-900">Enable this ad slot</span>
              </label>

              {/* Ad Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ad Type</label>
                <div className="flex gap-2">
                  {[
                    { id: 'adsense', name: 'AdSense' },
                    { id: 'custom', name: 'Custom HTML' },
                    { id: 'image', name: 'Image Banner' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSlotForm({ ...slotForm, type: type.id })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        slotForm.type === type.id
                          ? 'bg-brand text-white border-brand'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {type.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* AdSense/Custom Code */}
              {(slotForm.type === 'adsense' || slotForm.type === 'custom') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {slotForm.type === 'adsense' ? 'AdSense Code' : 'Custom HTML'}
                  </label>
                  <textarea
                    value={slotForm.code}
                    onChange={e => setSlotForm({ ...slotForm, code: e.target.value })}
                    rows={6}
                    placeholder={slotForm.type === 'adsense' 
                      ? '<ins class="adsbygoogle"...' 
                      : '<div class="ad-banner">...'
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand focus:border-brand"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Paste your complete ad code here
                  </p>
                </div>
              )}

              {/* Image Banner */}
              {slotForm.type === 'image' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
                    <input
                      type="url"
                      value={slotForm.imageUrl}
                      onChange={e => setSlotForm({ ...slotForm, imageUrl: e.target.value })}
                      placeholder="https://example.com/banner.jpg"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Link URL</label>
                    <input
                      type="url"
                      value={slotForm.linkUrl}
                      onChange={e => setSlotForm({ ...slotForm, linkUrl: e.target.value })}
                      placeholder="https://advertiser.com/landing"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Alt Text</label>
                    <input
                      type="text"
                      value={slotForm.altText}
                      onChange={e => setSlotForm({ ...slotForm, altText: e.target.value })}
                      placeholder="Advertisement description"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={handleRemoveSlot}
                disabled={saving || !style1Ads[editingSlot.id] && !style2Ads[editingSlot.id]}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Remove Ad
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingSlot(null) }}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSlot}
                  disabled={saving}
                  className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Ad Slot'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-medium text-blue-900 text-sm mb-2">💡 Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Style 1</strong> is the classic layout with sidebar - best for traditional news sites</li>
          <li>• <strong>Style 2</strong> is the modern grid layout - best for magazine-style sites</li>
          <li>• Configure ad slots for the homepage style you&apos;re using in Homepage Settings</li>
          <li>• AdSense ads auto-adjust to slot dimensions, custom images should match recommended sizes</li>
        </ul>
      </div>
    </div>
  )
}
