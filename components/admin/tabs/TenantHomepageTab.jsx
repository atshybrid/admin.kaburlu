/**
 * TenantHomepageTab - Manage tenant homepage Style1 & Style2 configuration
 * Style1: GET/PATCH /tenant-theme/{tenantId}/homepage/style1
 * Style2: GET/PATCH /tenant-theme/{tenantId}/homepage/style2/v2
 */
import { useState, useEffect } from 'react'
import { getToken } from '../../../utils/auth'

// Use local proxy to avoid CORS
function getApiBase() {
  if (typeof window !== 'undefined') return '/api/proxy'
  return (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://app.kaburlumedia.com').replace(/\/$/, '') + '/api/v1'
}

// Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const DragIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
    <circle cx="9" cy="6" r="1.5" />
    <circle cx="15" cy="6" r="1.5" />
    <circle cx="9" cy="12" r="1.5" />
    <circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="18" r="1.5" />
    <circle cx="15" cy="18" r="1.5" />
  </svg>
)

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const LayoutIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
)

// Style1 Section Types
const STYLE1_SECTION_TYPES = [
  { 
    key: 'flashTicker', 
    label: 'Flash News Ticker', 
    description: 'Breaking news scrolling ticker',
    icon: '⚡',
    fields: ['limit'],
    defaults: { limit: 12 }
  },
  { 
    key: 'categoryHub', 
    label: 'Category Hub', 
    description: 'Multiple categories in a hub layout',
    icon: '🏠',
    fields: ['categorySlugs', 'limit'],
    defaults: { categorySlugs: [], limit: 5 }
  },
  { 
    key: 'hgBlock', 
    label: 'Highlights Block', 
    description: 'Highlighted articles from categories',
    icon: '✨',
    fields: ['categorySlugs', 'limit'],
    defaults: { categorySlugs: [], limit: 5 }
  },
  { 
    key: 'latestNews', 
    label: 'Latest News', 
    description: 'Most recent articles',
    icon: '📰',
    fields: ['limit'],
    defaults: { limit: 10 }
  },
  { 
    key: 'categorySection', 
    label: 'Category Section', 
    description: 'Single category articles',
    icon: '📁',
    fields: ['categorySlug', 'limit'],
    defaults: { limit: 6 }
  },
]

// Style2 Section Types
const STYLE2_SECTION_TYPES = [
  { 
    key: 'flashTicker', 
    label: 'Flash News Ticker', 
    description: 'Breaking news scrolling ticker at top',
    icon: '⚡',
    fields: ['limit'],
    defaults: { limit: 10 }
  },
  { 
    key: 'toiGrid3', 
    label: 'Top Stories Grid (TOI Style)', 
    description: 'Main grid with left category, center featured, right sidebar',
    icon: '📰',
    fields: ['leftCategorySlug', 'centerLimit', 'rightLatestLimit', 'rightMostReadLimit'],
    defaults: { centerLimit: 6, rightLatestLimit: 8, rightMostReadLimit: 8 }
  },
  { 
    key: 'section3', 
    label: 'Multi-Category Highlights', 
    description: 'Show articles from multiple categories',
    icon: '🔖',
    fields: ['categorySlugs', 'perCategoryLimit'],
    defaults: { categorySlugs: [], perCategoryLimit: 5 }
  },
  { 
    key: 'section4', 
    label: 'Category Grid', 
    description: 'Grid of categories with articles',
    icon: '📊',
    fields: ['rows', 'cols', 'perCategoryLimit'],
    defaults: { rows: 4, cols: 3, perCategoryLimit: 5 }
  },
  { 
    key: 'categorySection', 
    label: 'Single Category Section', 
    description: 'Featured section for one category',
    icon: '📁',
    fields: ['categorySlug', 'limit', 'style'],
    defaults: { limit: 6, style: 'grid' }
  },
  { 
    key: 'hero', 
    label: 'Hero Banner', 
    description: 'Large featured article at top',
    icon: '🌟',
    fields: ['limit'],
    defaults: { limit: 1 }
  },
]

// Section Card Component
function SectionCard({ section, index, categories, sectionTypes, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [expanded, setExpanded] = useState(false)
  const sectionType = sectionTypes.find(t => t.key === section.key) || sectionTypes[0]
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b">
        <button type="button" className="cursor-grab active:cursor-grabbing">
          <DragIcon />
        </button>
        
        <span className="text-xl">{sectionType.icon}</span>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={section.label || ''}
              onChange={e => onUpdate({ ...section, label: e.target.value })}
              placeholder={sectionType.label}
              className="text-sm font-semibold text-slate-900 bg-transparent border-0 focus:ring-0 p-0 w-full"
            />
          </div>
          <div className="text-xs text-slate-500">{sectionType.description}</div>
        </div>
        
        {/* Move buttons */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded hover:bg-slate-200"
        >
          <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded text-red-500 hover:bg-red-50"
        >
          <TrashIcon />
        </button>
      </div>
      
      {/* Expanded Configuration */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Category Slug (single) */}
          {sectionType.fields.includes('categorySlug') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                value={section.categorySlug || ''}
                onChange={e => onUpdate({ ...section, categorySlug: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Select category...</option>
                {categories.map(cat => (
                  <option key={cat.id || cat.slug} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Left Category (for toiGrid3) */}
          {sectionType.fields.includes('leftCategorySlug') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Left Column Category</label>
              <select
                value={section.leftCategorySlug || ''}
                onChange={e => onUpdate({ ...section, leftCategorySlug: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Select category...</option>
                {categories.map(cat => (
                  <option key={cat.id || cat.slug} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Multiple Categories */}
          {sectionType.fields.includes('categorySlugs') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Categories (click to select)</label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                {categories.map(cat => {
                  const isSelected = (section.categorySlugs || []).includes(cat.slug)
                  return (
                    <button
                      key={cat.id || cat.slug}
                      type="button"
                      onClick={() => {
                        const current = section.categorySlugs || []
                        const updated = isSelected 
                          ? current.filter(s => s !== cat.slug)
                          : [...current, cat.slug]
                        onUpdate({ ...section, categorySlugs: updated })
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        isSelected 
                          ? 'bg-brand text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected && <span className="mr-1">✓</span>}
                      {cat.name}
                    </button>
                  )
                })}
              </div>
              {(section.categorySlugs || []).length > 0 && (
                <div className="mt-2 text-xs text-slate-500">
                  Selected: {section.categorySlugs.join(', ')}
                </div>
              )}
            </div>
          )}
          
          {/* Limit fields */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {sectionType.fields.includes('limit') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Limit</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={section.limit || sectionType.defaults.limit || 6}
                  onChange={e => onUpdate({ ...section, limit: parseInt(e.target.value) || 6 })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            )}
            
            {sectionType.fields.includes('centerLimit') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Center Limit</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={section.centerLimit || 6}
                  onChange={e => onUpdate({ ...section, centerLimit: parseInt(e.target.value) || 6 })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            )}
            
            {sectionType.fields.includes('rightLatestLimit') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Latest News</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={section.rightLatestLimit || 8}
                  onChange={e => onUpdate({ ...section, rightLatestLimit: parseInt(e.target.value) || 8 })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            )}
            
            {sectionType.fields.includes('rightMostReadLimit') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Most Read</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={section.rightMostReadLimit || 8}
                  onChange={e => onUpdate({ ...section, rightMostReadLimit: parseInt(e.target.value) || 8 })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            )}
            
            {sectionType.fields.includes('perCategoryLimit') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Per Category</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={section.perCategoryLimit || 5}
                  onChange={e => onUpdate({ ...section, perCategoryLimit: parseInt(e.target.value) || 5 })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            )}
            
            {sectionType.fields.includes('rows') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rows</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={section.rows || 4}
                  onChange={e => onUpdate({ ...section, rows: parseInt(e.target.value) || 4 })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            )}
            
            {sectionType.fields.includes('cols') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Columns</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={section.cols || 3}
                  onChange={e => onUpdate({ ...section, cols: parseInt(e.target.value) || 3 })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            )}
          </div>
          
          {/* Style selector */}
          {sectionType.fields.includes('style') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Display Style</label>
              <div className="flex gap-2">
                {['grid', 'list', 'cards', 'hero'].map(style => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => onUpdate({ ...section, style })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium capitalize ${
                      section.style === style 
                        ? 'bg-brand text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Labels for toiGrid3 */}
          {section.key === 'toiGrid3' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Latest News Label</label>
                <input
                  type="text"
                  value={section.rightLatestLabel || 'Latest News'}
                  onChange={e => onUpdate({ ...section, rightLatestLabel: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Most Read Label</label>
                <input
                  type="text"
                  value={section.rightMostReadLabel || 'Most Read'}
                  onChange={e => onUpdate({ ...section, rightMostReadLabel: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Add Section Modal
function AddSectionModal({ isOpen, onClose, onAdd, sectionTypes }) {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Add Section</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 space-y-2">
          {sectionTypes.map(type => (
            <button
              key={type.key}
              onClick={() => {
                onAdd({ key: type.key, label: type.label, ...type.defaults })
                onClose()
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg border hover:border-brand hover:bg-brand/5 transition-all text-left"
            >
              <span className="text-2xl">{type.icon}</span>
              <div>
                <div className="font-medium text-slate-900">{type.label}</div>
                <div className="text-xs text-slate-500">{type.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Homepage Preview Skeleton
function HomepagePreview({ sections, sectionTypes }) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden text-xs">
      {/* Header */}
      <div className="h-10 bg-slate-800 flex items-center justify-center">
        <div className="w-20 h-4 bg-slate-600 rounded"></div>
      </div>
      
      {/* Preview sections */}
      <div className="p-3 space-y-3">
        {sections.map((section, i) => {
          const type = sectionTypes.find(t => t.key === section.key)
          return (
            <div key={i} className="border rounded-lg p-2 bg-slate-50">
              <div className="flex items-center gap-2 mb-2">
                <span>{type?.icon || '📦'}</span>
                <span className="font-medium text-slate-700">{section.label || type?.label}</span>
              </div>
              
              {/* Section preview based on type */}
              {section.key === 'flashTicker' && (
                <div className="h-4 bg-red-500 rounded flex items-center px-2">
                  <div className="w-8 h-2 bg-red-300 rounded"></div>
                </div>
              )}
              
              {section.key === 'toiGrid3' && (
                <div className="grid grid-cols-4 gap-1">
                  <div className="bg-blue-100 h-16 rounded"></div>
                  <div className="col-span-2 bg-slate-200 h-16 rounded"></div>
                  <div className="bg-green-100 h-16 rounded"></div>
                </div>
              )}
              
              {(section.key === 'categoryHub' || section.key === 'hgBlock') && (
                <div className="grid grid-cols-3 gap-1">
                  {[1,2,3].map(n => (
                    <div key={n} className="bg-indigo-100 h-12 rounded"></div>
                  ))}
                </div>
              )}
              
              {section.key === 'latestNews' && (
                <div className="space-y-1">
                  {[1,2,3].map(n => (
                    <div key={n} className="bg-slate-200 h-6 rounded"></div>
                  ))}
                </div>
              )}
              
              {section.key === 'section3' && (
                <div className="grid grid-cols-3 gap-1">
                  {[1,2,3].map(n => (
                    <div key={n} className="bg-purple-100 h-12 rounded"></div>
                  ))}
                </div>
              )}
              
              {section.key === 'section4' && (
                <div className="grid grid-cols-3 gap-1">
                  {[1,2,3,4,5,6].map(n => (
                    <div key={n} className="bg-amber-100 h-8 rounded"></div>
                  ))}
                </div>
              )}
              
              {section.key === 'categorySection' && (
                <div className="grid grid-cols-3 gap-1">
                  <div className="col-span-2 bg-teal-100 h-12 rounded"></div>
                  <div className="bg-teal-50 h-12 rounded"></div>
                </div>
              )}
              
              {section.key === 'hero' && (
                <div className="bg-gradient-to-r from-slate-200 to-slate-300 h-20 rounded"></div>
              )}
            </div>
          )
        })}
        
        {sections.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            No sections added yet
          </div>
        )}
      </div>
    </div>
  )
}

export default function TenantHomepageTab({ tenantContext }) {
  const { tenant, refreshTenant } = tenantContext
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [categories, setCategories] = useState([])
  const [sections, setSections] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [activeStyle, setActiveStyle] = useState('style1') // 'style1' or 'style2'
  
  // Get section types based on active style
  const sectionTypes = activeStyle === 'style1' ? STYLE1_SECTION_TYPES : STYLE2_SECTION_TYPES
  
  // API endpoints based on style
  const getConfigUrl = () => {
    return activeStyle === 'style1'
      ? `${getApiBase()}/api/v1/tenant-theme/${tenant.id}/homepage/style1`
      : `${getApiBase()}/api/v1/tenant-theme/${tenant.id}/homepage/style2/v2`
  }
  
  const getSectionsUrl = () => {
    return activeStyle === 'style1'
      ? `${getApiBase()}/api/v1/tenant-theme/${tenant.id}/homepage/style1/sections`
      : `${getApiBase()}/api/v1/tenant-theme/${tenant.id}/homepage/style2/v2/sections`
  }
  
  const getDefaultUrl = () => {
    return activeStyle === 'style1'
      ? `${getApiBase()}/api/v1/tenant-theme/${tenant.id}/homepage/style1/apply-default`
      : `${getApiBase()}/api/v1/tenant-theme/${tenant.id}/homepage/style2/v2/apply-default`
  }
  
  // Fetch current config and categories
  useEffect(() => {
    const fetchData = async () => {
      if (!tenant?.id) return
      setLoading(true)
      setError('')
      
      try {
        const t = getToken()
        const headers = { 
          'Authorization': `Bearer ${t?.token || ''}`,
          'Content-Type': 'application/json'
        }
        
        // Fetch config and categories in parallel
        const [configRes, catsRes] = await Promise.allSettled([
          fetch(getConfigUrl(), { headers }),
          fetch(`${getApiBase()}/api/v1/tenants/${tenant.id}/categories`, { headers })
        ])
        
        // Parse config
        if (configRes.status === 'fulfilled' && configRes.value.ok) {
          const data = await configRes.value.json()
          setSections(data?.data?.sections || data?.sections || [])
        } else {
          setSections([])
        }
        
        // Parse categories
        if (catsRes.status === 'fulfilled' && catsRes.value.ok) {
          const data = await catsRes.value.json()
          setCategories(Array.isArray(data) ? data : (data?.data || []))
        }
      } catch (e) {
        console.error('Failed to load homepage config:', e)
        setError('Failed to load configuration')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id, activeStyle])
  
  // Save sections
  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    
    try {
      const t = getToken()
      const res = await fetch(getSectionsUrl(), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify({ sections })
      })
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `Failed: ${res.status}`)
      }
      
      setSuccess(`${activeStyle === 'style1' ? 'Style1' : 'Style2'} configuration saved successfully!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }
  
  // Apply default config
  const handleApplyDefault = async () => {
    if (!confirm('This will replace your current configuration with the default. Continue?')) return
    
    setSaving(true)
    setError('')
    
    try {
      const t = getToken()
      const res = await fetch(getDefaultUrl(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${t?.token || ''}`
        }
      })
      
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      
      const data = await res.json()
      setSections(data?.data?.sections || data?.sections || [])
      setSuccess('Default configuration applied!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }
  
  // Section handlers
  const addSection = (section) => {
    setSections([...sections, section])
  }
  
  const updateSection = (index, section) => {
    const updated = [...sections]
    updated[index] = section
    setSections(updated)
  }
  
  const deleteSection = (index) => {
    setSections(sections.filter((_, i) => i !== index))
  }
  
  const moveSection = (index, direction) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= sections.length) return
    
    const updated = [...sections]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    setSections(updated)
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="animate-spin w-8 h-8 text-brand" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutIcon />
            Homepage Configuration
          </h2>
          <p className="text-sm text-slate-500">Configure homepage sections and link categories</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleApplyDefault}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshIcon />
            Reset to Default
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand/90 disabled:opacity-50"
          >
            {saving ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            ) : (
              <CheckIcon />
            )}
            Save Configuration
          </button>
        </div>
      </div>
      
      {/* Style Selector */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center gap-4 mb-3">
          <span className="text-sm font-medium text-slate-700">Homepage Style:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveStyle('style1')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeStyle === 'style1'
                  ? 'bg-brand text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🎨 Style 1
            </button>
            <button
              type="button"
              onClick={() => setActiveStyle('style2')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeStyle === 'style2'
                  ? 'bg-brand text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              📰 Style 2 (TOI)
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          {activeStyle === 'style1' 
            ? 'Classic layout with category hub, highlights, and latest news sections'
            : 'Times of India style layout with grid sections and sidebar widgets'
          }
        </p>
      </div>
      
      {/* Alerts */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
          ✓ {success}
        </div>
      )}
      
      {/* Main Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sections List */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">
              {activeStyle === 'style1' ? 'Style1' : 'Style2'} Sections ({sections.length})
            </h3>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90"
            >
              <PlusIcon />
              Add Section
            </button>
          </div>
          
          {sections.length === 0 ? (
            <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
              <div className="text-4xl mb-3">📦</div>
              <h3 className="font-semibold text-slate-900 mb-1">No sections configured</h3>
              <p className="text-sm text-slate-500 mb-4">Add sections to build your homepage layout</p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium"
              >
                <PlusIcon />
                Add First Section
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section, index) => (
                <SectionCard
                  key={`${section.key}-${index}`}
                  section={section}
                  index={index}
                  categories={categories}
                  sectionTypes={sectionTypes}
                  onUpdate={(updated) => updateSection(index, updated)}
                  onDelete={() => deleteSection(index)}
                  onMoveUp={() => moveSection(index, -1)}
                  onMoveDown={() => moveSection(index, 1)}
                  isFirst={index === 0}
                  isLast={index === sections.length - 1}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Preview Panel */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">Preview</h3>
          <HomepagePreview sections={sections} sectionTypes={sectionTypes} />
          
          {/* Quick Category List */}
          <div className="bg-white rounded-xl border p-4">
            <h4 className="font-medium text-slate-900 mb-3">Available Categories</h4>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {categories.slice(0, 20).map(cat => (
                <span key={cat.id || cat.slug} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                  {cat.name}
                </span>
              ))}
              {categories.length > 20 && (
                <span className="px-2 py-1 text-slate-400 text-xs">
                  +{categories.length - 20} more
                </span>
              )}
            </div>
          </div>
          
          {/* API Info */}
          <div className="bg-slate-50 rounded-xl border p-4 text-xs">
            <h4 className="font-medium text-slate-700 mb-2">API Endpoints</h4>
            <div className="space-y-1 text-slate-500 font-mono">
              <div>GET: /homepage/{activeStyle}</div>
              <div>PATCH: /homepage/{activeStyle}/sections</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Section Modal */}
      <AddSectionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addSection}
        sectionTypes={sectionTypes}
      />
    </div>
  )
}
