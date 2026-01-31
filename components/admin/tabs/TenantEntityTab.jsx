/**
 * Tenant Entity Tab - Business registration management
 * API: POST /api/v1/tenants/:tenantId/entity
 * Includes:
 *  - languageId (required)
 *  - adminMobile (optional) - creates TENANT_ADMIN user if provided
 *  - registrationTitle, prgiNumber, periodicity, etc.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { getToken } from '../../../utils/auth'

// Use local proxy to avoid CORS
function getApiBase() {
  if (typeof window !== 'undefined') return '/api/proxy'
  return (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://app.kaburlumedia.com').replace(/\/$/, '') + '/api/v1'
}

// Icons
const BuildingIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const CheckCircle = () => (
  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const AlertCircle = () => (
  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const MapPinIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const SpinnerIcon = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)

// Location Search Dropdown Component
function LocationSearchDropdown({ value, onChange, placeholder = "Search city/district..." }) {
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef(null)
  const debounceRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Sync query with external value
  useEffect(() => {
    if (value && value !== query) {
      setQuery(value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const searchLocations = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const t = getToken()
      const res = await fetch(
        `${getApiBase()}/locations/search-combined?q=${encodeURIComponent(searchQuery)}&limit=20`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${t?.token || ''}`
          }
        }
      )
      if (res.ok) {
        const data = await res.json()
        setResults(data.items || [])
      } else {
        setResults([])
      }
    } catch (e) {
      console.error('Location search error:', e)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInputChange = (e) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    setIsOpen(true)

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      searchLocations(newQuery)
    }, 300)
  }

  const handleSelect = (item) => {
    // Build display name from the location hierarchy
    const displayName = buildLocationName(item)
    setQuery(displayName)
    onChange(displayName)
    setIsOpen(false)
    setResults([])
  }

  const buildLocationName = (item) => {
    // Build a name like "Kamareddy, Telangana" or "Mandal, District, State"
    const parts = []
    if (item.match?.name) parts.push(item.match.name)
    if (item.type !== 'STATE' && item.state?.name && item.match?.name !== item.state?.name) {
      parts.push(item.state.name)
    }
    return parts.join(', ')
  }

  const getLocationTypeLabel = (type) => {
    const labels = {
      STATE: 'State',
      DISTRICT: 'District',
      MANDAL: 'Mandal',
      VILLAGE: 'Village',
      AC: 'Assembly Constituency'
    }
    return labels[type] || type
  }

  const getLocationTypeBadgeColor = (type) => {
    const colors = {
      STATE: 'bg-purple-100 text-purple-700',
      DISTRICT: 'bg-blue-100 text-blue-700',
      MANDAL: 'bg-green-100 text-green-700',
      VILLAGE: 'bg-amber-100 text-amber-700',
      AC: 'bg-pink-100 text-pink-700'
    }
    return colors[type] || 'bg-slate-100 text-slate-700'
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 pl-9 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {loading ? <SpinnerIcon /> : <SearchIcon />}
        </div>
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              onChange('')
              setResults([])
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-auto">
          {loading ? (
            <div className="p-3 text-center text-sm text-slate-500">
              <SpinnerIcon className="inline-block mr-2" />
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-3 text-center text-sm text-slate-500">
              {query.length >= 2 ? 'No locations found' : 'Type at least 2 characters'}
            </div>
          ) : (
            <ul className="py-1">
              {results.map((item, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-start gap-2"
                  >
                    <MapPinIcon />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-900 truncate">
                          {item.match?.name}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getLocationTypeBadgeColor(item.type)}`}>
                          {getLocationTypeLabel(item.type)}
                        </span>
                      </div>
                      {item.state && item.type !== 'STATE' && (
                        <div className="text-xs text-slate-500 truncate">
                          {item.district && item.type !== 'DISTRICT' && `${item.district.name}, `}
                          {item.state.name}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// Field display component
function Field({ label, value, hint }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-sm font-medium text-slate-900">{value || '—'}</div>
      {hint && <div className="text-xs text-slate-400 mt-0.5">{hint}</div>}
    </div>
  )
}

// Simple/Quick Setup Form
function QuickSetupForm({ tenantId, tenant, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [languages, setLanguages] = useState([])
  
  const [form, setForm] = useState({
    registrationTitle: tenant?.name || '',
    nativeName: '',
    languageId: '',
    adminMobile: '',
    prgiNumber: tenant?.prgiNumber || '',
    periodicity: 'DAILY',
    registrationDate: '',
    // Owner/Publisher/Editor fields
    ownerName: '',
    publisherName: '',
    editorName: '',
    // Location fields
    publicationCountryId: '',
    publicationStateId: '',
    publicationDistrictId: '',
    publicationMandalId: '',
    printingPressName: '',
    printingDistrictId: '',
    printingMandalId: '',
    printingCityName: '',
    address: '',
    // Contact Details
    contactMobile: '',
    contactEmail: '',
    contactPerson: '',
  })

  useEffect(() => {
    async function loadLanguages() {
      try {
        const t = getToken()
        console.log('Fetching languages... token:', t)
        const res = await fetch(`${getApiBase()}/languages`, {
          headers: { 'Authorization': `Bearer ${t?.token || ''}` }
        })
        console.log('Languages response status:', res.status)
        if (res.ok) {
          const data = await res.json()
          console.log('Languages API response:', data)
          const languagesList = Array.isArray(data) ? data : (data?.data || [])
          console.log('Extracted languages list:', languagesList)
          setLanguages(languagesList)
        } else {
          console.error('Failed to fetch languages, status:', res.status)
        }
      } catch (e) {
        console.error('Failed to load languages', e)
      }
    }
    loadLanguages()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.languageId || !form.registrationTitle) {
      setError('Language and Registration Title are required')
      return
    }
    
    setError('')
    setLoading(true)
    
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/tenants/${tenantId}/entity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify({
          registrationTitle: form.registrationTitle,
          nativeName: form.nativeName || undefined,
          languageId: form.languageId,
          adminMobile: form.adminMobile || undefined,
          prgiNumber: form.prgiNumber || undefined,
          periodicity: form.periodicity,
          registrationDate: form.registrationDate || undefined,
          ownerName: form.ownerName || undefined,
          publisherName: form.publisherName || undefined,
          editorName: form.editorName || undefined,
          publicationCountryId: form.publicationCountryId || undefined,
          publicationStateId: form.publicationStateId || undefined,
          publicationDistrictId: form.publicationDistrictId || undefined,
          publicationMandalId: form.publicationMandalId || undefined,
          printingPressName: form.printingPressName || undefined,
          printingDistrictId: form.printingDistrictId || undefined,
          printingMandalId: form.printingMandalId || undefined,
          printingCityName: form.printingCityName || undefined,
          address: form.address || undefined,
          // Contact Details
          contactMobile: form.contactMobile || null,
          contactEmail: form.contactEmail || null,
          contactPerson: form.contactPerson || null,
        })
      })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || `Failed: ${res.status}`)
      }
      
      onSuccess()
    } catch (e) {
      setError(e.message || 'Failed to create entity')
    } finally {
      setLoading(false)
    }
  }

  const periodicities = ['DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL']

  return (
    <div className="bg-white rounded-xl border">
      <div className="p-5 border-b">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <BuildingIcon />
          Quick Entity Setup
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Create entity with essential details. You can add more info later.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        {/* Required Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Registration Title <span className="text-red-500">*</span>
            </label>
            <input
              required
              disabled
              value={form.registrationTitle}
              onChange={e => setForm({...form, registrationTitle: e.target.value})}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-gray-50 cursor-not-allowed"
              placeholder="Daily Kaburlu News"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Language <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.languageId}
              onChange={e => setForm({...form, languageId: e.target.value})}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white"
            >
              <option value="">Select language</option>
              {languages.map(lang => (
                <option key={lang.id} value={lang.id}>{lang.name}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">Primary language for content</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Native Name <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              value={form.nativeName}
              onChange={e => setForm({...form, nativeName: e.target.value})}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
              placeholder="e.g., ప్రశ్నాయుధం"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Registration Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={form.registrationDate}
              onChange={e => setForm({...form, registrationDate: e.target.value})}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">DD/MM/YYYY format</p>
          </div>
        </div>
        
        {/* Optional Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Admin Mobile Number
            </label>
            <input
              value={form.adminMobile}
              onChange={e => setForm({...form, adminMobile: e.target.value})}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
              placeholder="+91 9876543210"
            />
            <p className="text-xs text-slate-500 mt-1">
              Creates a TENANT_ADMIN user with this mobile
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">PRGI Number</label>
            <input
              disabled
              value={form.prgiNumber}
              onChange={e => setForm({...form, prgiNumber: e.target.value})}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-gray-50 cursor-not-allowed"
              placeholder="PRGI-TS-2025-01987"
            />
            {tenant?.prgiNumber && (
              <p className="text-xs text-green-600 mt-1">Auto-filled from tenant registration</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Periodicity</label>
            <select
              value={form.periodicity}
              onChange={e => setForm({...form, periodicity: e.target.value})}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white"
            >
              {periodicities.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Owner/Publisher/Editor Section */}
        <div className="border-t pt-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-slate-900">Owner & Editorial Details</h4>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.ownerName && form.publisherName === form.ownerName && form.editorName === form.ownerName}
                onChange={e => {
                  if (e.target.checked && form.ownerName) {
                    setForm({...form, publisherName: form.ownerName, editorName: form.ownerName})
                  }
                }}
                className="rounded border-slate-300 text-brand focus:ring-brand"
              />
              Same owner as Publisher & Editor
            </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Owner Name</label>
              <input
                value={form.ownerName}
                onChange={e => {
                  const ownerName = e.target.value
                  // Auto-fill publisher and editor if they're empty or same as old owner
                  const updates = { ownerName }
                  if (!form.publisherName || form.publisherName === form.ownerName) {
                    updates.publisherName = ownerName
                  }
                  if (!form.editorName || form.editorName === form.ownerName) {
                    updates.editorName = ownerName
                  }
                  setForm({...form, ...updates})
                }}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                placeholder="Owner full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Publisher Name</label>
              <input
                value={form.publisherName}
                onChange={e => setForm({...form, publisherName: e.target.value})}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                placeholder="Publisher name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Editor Name</label>
              <input
                value={form.editorName}
                onChange={e => setForm({...form, editorName: e.target.value})}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                placeholder="Editor name"
              />
            </div>
          </div>
        </div>

        {/* Printing Press & Location Section */}
        <div className="border-t pt-5">
          <h4 className="text-sm font-semibold text-slate-900 mb-4">Printing Press & Location</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Printing Press Name</label>
              <input
                value={form.printingPressName}
                onChange={e => setForm({...form, printingPressName: e.target.value})}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                placeholder="SHASHI PRINTING PRESS"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Printing City Name</label>
              <input
                value={form.printingCityName}
                onChange={e => setForm({...form, printingCityName: e.target.value})}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                placeholder="KAMAREDDY"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
              <textarea
                value={form.address}
                onChange={e => setForm({...form, address: e.target.value})}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none"
                placeholder="123 Main Street, City"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Contact Details Section */}
        <div className="border-t pt-5">
          <h4 className="text-sm font-semibold text-slate-900 mb-4">Contact Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Mobile</label>
              <input
                value={form.contactMobile}
                onChange={e => setForm({...form, contactMobile: e.target.value})}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                placeholder="9876543210"
                maxLength={10}
              />
              <p className="text-xs text-slate-500 mt-1">Primary contact number</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Email</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={e => setForm({...form, contactEmail: e.target.value})}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                placeholder="contact@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Person</label>
              <input
                value={form.contactPerson}
                onChange={e => setForm({...form, contactPerson: e.target.value})}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                placeholder="Person name"
              />
            </div>
          </div>
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}
        
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Entity'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Full Edit Form
function EntityEditForm({ entity, tenantId, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [languages, setLanguages] = useState([])
  
  const [form, setForm] = useState({
    registrationTitle: entity?.registrationTitle || '',
    nativeName: entity?.nativeName || '',
    periodicity: entity?.periodicity || 'DAILY',
    registrationDate: entity?.registrationDate?.split('T')[0] || '',
    languageId: entity?.language?.id || entity?.languageId || '',
    ownerName: entity?.ownerName || '',
    publisherName: entity?.publisherName || '',
    editorName: entity?.editorName || '',
    printingPressName: entity?.printingPressName || '',
    printingCityName: entity?.printingCityName || '',
    address: entity?.address || '',
    // Contact Details
    contactMobile: entity?.contactMobile || '',
    contactEmail: entity?.contactEmail || '',
    contactPerson: entity?.contactPerson || '',
  })
  
  // PRGI number is immutable - shown read-only
  const prgiNumber = entity?.prgiNumber || ''

  useEffect(() => {
    async function loadLanguages() {
      try {
        const t = getToken()
        const res = await fetch(`${getApiBase()}/languages`, {
          headers: { 'Authorization': `Bearer ${t?.token || ''}` }
        })
        if (res.ok) {
          const data = await res.json()
          setLanguages(Array.isArray(data) ? data : (data?.data || []))
        }
      } catch (e) {
        console.error('Failed to load languages', e)
      }
    }
    loadLanguages()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const t = getToken()
      // API: PUT /tenants/:tenantId/entity (full update)
      const url = `${getApiBase()}/tenants/${tenantId}/entity`
      
      // Build payload - exclude prgiNumber as it's immutable
      const payload = {
        registrationTitle: form.registrationTitle,
        nativeName: form.nativeName || undefined,
        periodicity: form.periodicity,
        registrationDate: form.registrationDate || undefined,
        languageId: form.languageId,
        ownerName: form.ownerName || undefined,
        publisherName: form.publisherName || undefined,
        editorName: form.editorName || undefined,
        printingPressName: form.printingPressName || undefined,
        printingCityName: form.printingCityName || undefined,
        address: form.address || undefined,
        // Contact Details
        contactMobile: form.contactMobile || null,
        contactEmail: form.contactEmail || null,
        contactPerson: form.contactPerson || null,
      }
      
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify(payload)
      })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || data.message || `Failed: ${res.status}`)
      }
      
      onSuccess()
    } catch (e) {
      setError(e.message || 'Failed to update entity')
    } finally {
      setLoading(false)
    }
  }

  const periodicities = ['DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL']

  return (
    <div className="bg-white rounded-xl border">
      <div className="p-5 border-b">
        <h3 className="font-semibold text-slate-900">Edit Entity Details</h3>
        <p className="text-sm text-slate-500">Update business registration and publication details</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        {/* PRGI Number - Read Only (immutable) */}
        {prgiNumber && (
          <div className="p-3 bg-slate-50 border rounded-lg flex items-center gap-3">
            <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="text-xs text-slate-500">PRGI Number (immutable)</div>
              <div className="font-medium text-slate-900">{prgiNumber}</div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Registration Title <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.registrationTitle}
              onChange={e => setForm({...form, registrationTitle: e.target.value})}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
              placeholder="e.g., Daily Kaburlu News"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Native Name</label>
            <input
              value={form.nativeName}
              onChange={e => setForm({...form, nativeName: e.target.value})}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
              placeholder="e.g., ప్రశ్నాయుధం"
            />
            <p className="text-xs text-slate-500 mt-1">Title in native language (Telugu, Hindi, etc.)</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Language <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.languageId}
              onChange={e => setForm({...form, languageId: e.target.value})}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white"
            >
              <option value="">Select language</option>
              {languages.map(lang => (
                <option key={lang.id} value={lang.id}>{lang.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Periodicity</label>
            <select
              value={form.periodicity}
              onChange={e => setForm({...form, periodicity: e.target.value})}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white"
            >
              {periodicities.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Registration Date</label>
            <input
              type="date"
              value={form.registrationDate}
              onChange={e => setForm({...form, registrationDate: e.target.value})}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Owner Name</label>
            <input
              value={form.ownerName}
              onChange={e => setForm({...form, ownerName: e.target.value})}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
              placeholder="e.g., KATYADA BAPU RAO"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Publisher Name</label>
            <input
              value={form.publisherName}
              onChange={e => setForm({...form, publisherName: e.target.value})}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Editor Name</label>
            <input
              value={form.editorName}
              onChange={e => setForm({...form, editorName: e.target.value})}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Printing Press Name</label>
            <input
              value={form.printingPressName}
              onChange={e => setForm({...form, printingPressName: e.target.value})}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Printing City</label>
            <LocationSearchDropdown
              value={form.printingCityName}
              onChange={(val) => setForm({...form, printingCityName: val})}
              placeholder="Search city or district..."
            />
            <p className="text-xs text-slate-500 mt-1">Search and select a location</p>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
          <textarea
            value={form.address}
            onChange={e => setForm({...form, address: e.target.value})}
            rows={3}
            className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none"
          />
        </div>

        {/* Contact Details Section */}
        <div className="border-t pt-5 mt-5">
          <h4 className="text-sm font-semibold text-slate-900 mb-4">Contact Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Mobile</label>
              <input
                value={form.contactMobile}
                onChange={e => setForm({...form, contactMobile: e.target.value})}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                placeholder="9876543210"
                maxLength={10}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Email</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={e => setForm({...form, contactEmail: e.target.value})}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                placeholder="contact@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Person</label>
              <input
                value={form.contactPerson}
                onChange={e => setForm({...form, contactPerson: e.target.value})}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                placeholder="Contact person name"
              />
            </div>
          </div>
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}
        
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Update Entity'}
          </button>
        </div>
      </form>
    </div>
  )
}

// View Mode Component
function EntityView({ entity, tenant, onEdit }) {
  return (
    <div className="bg-white rounded-xl border">
      <div className="p-5 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
            <CheckCircle />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Entity Registered</h3>
            <p className="text-sm text-slate-500">Business registration details</p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-50"
        >
          <EditIcon />
          Edit
        </button>
      </div>
      
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <Field label="Registration Title" value={entity.registrationTitle} />
        <Field label="Native Name" value={entity.nativeName} hint="In native language" />
        <Field label="PRGI Number" value={entity.prgiNumber || tenant?.prgiNumber} />
        <Field label="Language" value={entity.language?.name} />
        <Field label="Periodicity" value={entity.periodicity} />
        <Field 
          label="Registration Date" 
          value={entity.registrationDate ? new Date(entity.registrationDate).toLocaleDateString() : null} 
        />
        <Field label="Owner" value={entity.ownerName} />
        <Field label="Publisher" value={entity.publisherName} />
        <Field label="Editor" value={entity.editorName} />
        <Field label="Printing Press" value={entity.printingPressName} />
        <Field label="Printing City" value={entity.printingCityName} />
        <div className="md:col-span-2 lg:col-span-3">
          <Field label="Address" value={entity.address} />
        </div>
        
        {/* Contact Details */}
        <Field label="Contact Mobile" value={entity.contactMobile} />
        <Field label="Contact Email" value={entity.contactEmail} />
        <Field label="Contact Person" value={entity.contactPerson} />
      </div>
    </div>
  )
}

// Main Component - Now uses tenantContext prop
export default function TenantEntityTab({ tenantContext }) {
  const { tenant, entity, refreshEntity } = tenantContext || {}
  const tenantId = tenant?.id
  const [editing, setEditing] = useState(false)

  const handleSuccess = async () => {
    await refreshEntity()
    setEditing(false)
  }

  // No entity - show quick setup
  if (!entity) {
    return (
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle />
          <div>
            <h4 className="font-medium text-amber-900">Entity Required</h4>
            <p className="text-sm text-amber-800 mt-0.5">
              Create a business entity to complete tenant setup. This is required before you can
              configure domains, homepage, or other settings.
            </p>
          </div>
        </div>
        
        <QuickSetupForm tenantId={tenantId} tenant={tenant} onSuccess={handleSuccess} />
      </div>
    )
  }

  // Has entity - show view or edit
  if (editing) {
    return (
      <EntityEditForm 
        entity={entity} 
        tenantId={tenantId} 
        onSuccess={handleSuccess} 
        onCancel={() => setEditing(false)} 
      />
    )
  }

  return <EntityView entity={entity} tenant={tenant} onEdit={() => setEditing(true)} />
}
