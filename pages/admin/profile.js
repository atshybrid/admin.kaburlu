/**
 * My Profile Page - Desk Editor / Reporter Profile Management
 * /admin/profile route
 */
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { getToken } from '../../utils/auth'
import Loader from '../../components/Loader'

function getApiBase() {
  return (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com').replace(/\/$/, '')
}

// Avatar with initials fallback
function Avatar({ src, name, size = 'lg' }) {
  const [imgError, setImgError] = useState(false)
  const sizes = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-2xl',
    xl: 'w-32 h-32 text-3xl'
  }
  
  const initials = (name || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Get pixel dimensions for Image component
  const dimensions = { sm: 40, md: 64, lg: 96, xl: 128 }
  const dim = dimensions[size] || 96

  if (src && !imgError) {
    return (
      <div className={`${sizes[size]} relative rounded-full overflow-hidden border-4 border-white shadow-lg`}>
        <Image
          src={src}
          alt={name || 'Profile'}
          fill
          className="object-cover"
          onError={() => setImgError(true)}
          unoptimized={src.startsWith('http')}
        />
      </div>
    )
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white font-bold border-4 border-white shadow-lg`}>
      {initials}
    </div>
  )
}

// Input Field Component
function FormField({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

// Section Header
function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b">
      <div className="p-2 rounded-lg bg-brand/10 text-brand">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
    </div>
  )
}

function ProfileContent() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isNewProfile, setIsNewProfile] = useState(false)
  const [activeTab, setActiveTab] = useState('personal')

  // Form state
  const [form, setForm] = useState({
    fullName: '',
    surname: '',
    lastName: '',
    gender: '',
    dob: '',
    maritalStatus: '',
    bio: '',
    profilePhotoUrl: '',
    emergencyContactNumber: '',
    occupation: '',
    education: '',
    stateId: '',
    districtId: '',
    assemblyId: '',
    mandalId: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      pincode: ''
    },
    socialLinks: {
      twitter: '',
      facebook: '',
      instagram: '',
      linkedin: '',
      youtube: ''
    }
  })

  // Location dropdowns
  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [mandals, setMandals] = useState([])
  const [assemblies, setAssemblies] = useState([])
  const [loadingLocations, setLoadingLocations] = useState({})

  // Photo upload
  const [uploading, setUploading] = useState(false)

  // Load profile
  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/profiles/me`, {
        headers: { 'Authorization': `Bearer ${t?.token || ''}` }
      })
      
      if (res.status === 404) {
        // No profile yet
        setIsNewProfile(true)
        setProfile(null)
      } else if (res.ok) {
        const data = await res.json()
        const p = data?.data || data
        setProfile(p)
        setIsNewProfile(false)
        
        // Populate form
        setForm({
          fullName: p.fullName || '',
          surname: p.surname || '',
          lastName: p.lastName || '',
          gender: p.gender || '',
          dob: p.dob ? p.dob.split('T')[0] : '',
          maritalStatus: p.maritalStatus || '',
          bio: p.bio || '',
          profilePhotoUrl: p.profilePhotoUrl || '',
          emergencyContactNumber: p.emergencyContactNumber || '',
          occupation: p.occupation || '',
          education: p.education || '',
          stateId: p.stateId || '',
          districtId: p.districtId || '',
          assemblyId: p.assemblyId || '',
          mandalId: p.mandalId || '',
          address: {
            line1: p.address?.line1 || '',
            line2: p.address?.line2 || '',
            city: p.address?.city || '',
            pincode: p.address?.pincode || ''
          },
          socialLinks: {
            twitter: p.socialLinks?.twitter || '',
            facebook: p.socialLinks?.facebook || '',
            instagram: p.socialLinks?.instagram || '',
            linkedin: p.socialLinks?.linkedin || '',
            youtube: p.socialLinks?.youtube || ''
          }
        })
      } else {
        throw new Error(`Failed to load profile: ${res.status}`)
      }
    } catch (e) {
      setError(e.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load states
  const loadStates = useCallback(async () => {
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/states`, {
        headers: { 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (res.ok) {
        const data = await res.json()
        setStates(Array.isArray(data) ? data : (data?.data || []))
      }
    } catch (e) {
      console.error('Failed to load states', e)
    }
  }, [])

  // Load districts by state
  const loadDistricts = useCallback(async (stateId) => {
    if (!stateId) {
      setDistricts([])
      return
    }
    setLoadingLocations(prev => ({ ...prev, districts: true }))
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/districts?stateId=${stateId}`, {
        headers: { 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (res.ok) {
        const data = await res.json()
        setDistricts(Array.isArray(data) ? data : (data?.data || []))
      }
    } catch (e) {
      console.error('Failed to load districts', e)
    } finally {
      setLoadingLocations(prev => ({ ...prev, districts: false }))
    }
  }, [])

  // Load mandals by district
  const loadMandals = useCallback(async (districtId) => {
    if (!districtId) {
      setMandals([])
      return
    }
    setLoadingLocations(prev => ({ ...prev, mandals: true }))
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/mandals?districtId=${districtId}`, {
        headers: { 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMandals(Array.isArray(data) ? data : (data?.data || []))
      }
    } catch (e) {
      console.error('Failed to load mandals', e)
    } finally {
      setLoadingLocations(prev => ({ ...prev, mandals: false }))
    }
  }, [])

  // Load assemblies by district
  const loadAssemblies = useCallback(async (districtId) => {
    if (!districtId) {
      setAssemblies([])
      return
    }
    setLoadingLocations(prev => ({ ...prev, assemblies: true }))
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/assembly-constituencies?districtId=${districtId}`, {
        headers: { 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAssemblies(Array.isArray(data) ? data : (data?.data || []))
      }
    } catch (e) {
      console.error('Failed to load assemblies', e)
    } finally {
      setLoadingLocations(prev => ({ ...prev, assemblies: false }))
    }
  }, [])

  useEffect(() => {
    loadProfile()
    loadStates()
  }, [loadProfile, loadStates])

  useEffect(() => {
    if (form.stateId) {
      loadDistricts(form.stateId)
    }
  }, [form.stateId, loadDistricts])

  useEffect(() => {
    if (form.districtId) {
      loadMandals(form.districtId)
      loadAssemblies(form.districtId)
    }
  }, [form.districtId, loadMandals, loadAssemblies])

  // Handle form change
  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleAddressChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }))
  }

  const handleSocialChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [field]: value }
    }))
  }

  // Handle photo upload using media API
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'profiles')
      formData.append('kind', 'image')

      // Use the internal proxy API which handles auth
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        let errMsg = 'Upload failed'
        try {
          const errJson = JSON.parse(errText)
          errMsg = errJson.message || errJson.error || errMsg
        } catch {
          if (errText) errMsg = errText
        }
        throw new Error(errMsg)
      }
      
      const data = await res.json()
      // Backend returns publicUrl
      const url = data?.publicUrl || data?.url || data?.data?.publicUrl || data?.data?.url
      if (url) {
        handleChange('profilePhotoUrl', url)
        setSuccess('Photo uploaded successfully')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        throw new Error('No URL returned from upload')
      }
    } catch (e) {
      setError(e.message || 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  // Save profile
  const handleSave = async () => {
    setError('')
    setSuccess('')
    
    if (!form.fullName?.trim()) {
      setError('Full name is required')
      return
    }

    setSaving(true)
    try {
      const t = getToken()
      const method = isNewProfile ? 'POST' : 'PUT'
      
      // Clean up payload
      const payload = {
        fullName: form.fullName.trim(),
        ...(form.surname && { surname: form.surname.trim() }),
        ...(form.lastName && { lastName: form.lastName.trim() }),
        ...(form.gender && { gender: form.gender }),
        ...(form.dob && { dob: form.dob }),
        ...(form.maritalStatus && { maritalStatus: form.maritalStatus }),
        ...(form.bio && { bio: form.bio.trim() }),
        ...(form.profilePhotoUrl && { profilePhotoUrl: form.profilePhotoUrl }),
        ...(form.emergencyContactNumber && { emergencyContactNumber: form.emergencyContactNumber }),
        ...(form.occupation && { occupation: form.occupation.trim() }),
        ...(form.education && { education: form.education.trim() }),
        ...(form.stateId && { stateId: form.stateId }),
        ...(form.districtId && { districtId: form.districtId }),
        ...(form.assemblyId && { assemblyId: form.assemblyId }),
        ...(form.mandalId && { mandalId: form.mandalId }),
      }

      // Add address if any field is filled
      if (form.address.line1 || form.address.city || form.address.pincode) {
        payload.address = {
          ...(form.address.line1 && { line1: form.address.line1.trim() }),
          ...(form.address.line2 && { line2: form.address.line2.trim() }),
          ...(form.address.city && { city: form.address.city.trim() }),
          ...(form.address.pincode && { pincode: form.address.pincode.trim() })
        }
      }

      // Add social links if any field is filled
      const socialLinks = {}
      Object.entries(form.socialLinks).forEach(([key, val]) => {
        if (val?.trim()) socialLinks[key] = val.trim()
      })
      if (Object.keys(socialLinks).length > 0) {
        payload.socialLinks = socialLinks
      }

      const res = await fetch(`${getApiBase()}/api/v1/profiles/me`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || data?.error || `Failed: ${res.status}`)
      }

      const data = await res.json()
      setProfile(data?.data || data)
      setIsNewProfile(false)
      setSuccess('Profile saved successfully!')
      setTimeout(() => setSuccess(''), 5000)
    } catch (e) {
      setError(e.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size={72} label="Loading profile..." />
      </div>
    )
  }

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    { id: 'location', label: 'Location', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { id: 'professional', label: 'Professional', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
    { id: 'social', label: 'Social Links', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg> }
  ]

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-brand to-brand-dark rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative flex flex-col sm:flex-row items-center gap-6">
          {/* Profile Photo */}
          <div className="relative group">
            <Avatar src={form.profilePhotoUrl} name={form.fullName} size="xl" />
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploading}
              />
              {uploading ? (
                <Loader size={24} />
              ) : (
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </label>
          </div>
          
          {/* Profile Info */}
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl font-bold">{form.fullName || 'Your Name'}</h1>
            <p className="text-white/80 mt-1">{form.occupation || 'Add your occupation'}</p>
            {form.bio && <p className="text-white/70 text-sm mt-2 max-w-md">{form.bio}</p>}
          </div>

          {/* Status Badge */}
          <div className="hidden sm:block">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${isNewProfile ? 'bg-yellow-400/20 text-yellow-100' : 'bg-green-400/20 text-green-100'}`}>
              {isNewProfile ? 'New Profile' : 'Profile Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="border-b">
          <div className="flex overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'text-brand border-brand'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Personal Info Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <SectionHeader
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                title="Personal Information"
                subtitle="Your basic personal details"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField label="Full Name" required>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={e => handleChange('fullName', e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    placeholder="Enter your full name"
                  />
                </FormField>

                <FormField label="Surname">
                  <input
                    type="text"
                    value={form.surname}
                    onChange={e => handleChange('surname', e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    placeholder="Surname"
                  />
                </FormField>

                <FormField label="Last Name">
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={e => handleChange('lastName', e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    placeholder="Last name"
                  />
                </FormField>

                <FormField label="Gender">
                  <select
                    value={form.gender}
                    onChange={e => handleChange('gender', e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </FormField>

                <FormField label="Date of Birth">
                  <input
                    type="date"
                    value={form.dob}
                    onChange={e => handleChange('dob', e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </FormField>

                <FormField label="Marital Status">
                  <select
                    value={form.maritalStatus}
                    onChange={e => handleChange('maritalStatus', e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
                  >
                    <option value="">Select status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </FormField>

                <FormField label="Emergency Contact">
                  <input
                    type="tel"
                    value={form.emergencyContactNumber}
                    onChange={e => handleChange('emergencyContactNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    placeholder="10 digit mobile number"
                    maxLength={10}
                  />
                </FormField>
              </div>

              <FormField label="Bio" hint="A short description about yourself">
                <textarea
                  value={form.bio}
                  onChange={e => handleChange('bio', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
                  placeholder="Tell us about yourself..."
                />
              </FormField>
            </div>
          )}

          {/* Location Tab */}
          {activeTab === 'location' && (
            <div className="space-y-6">
              <SectionHeader
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>}
                title="Location Details"
                subtitle="Your residence and coverage area"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="State">
                  <select
                    value={form.stateId}
                    onChange={e => {
                      handleChange('stateId', e.target.value)
                      handleChange('districtId', '')
                      handleChange('mandalId', '')
                      handleChange('assemblyId', '')
                    }}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
                  >
                    <option value="">Select state</option>
                    {states.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="District">
                  <select
                    value={form.districtId}
                    onChange={e => {
                      handleChange('districtId', e.target.value)
                      handleChange('mandalId', '')
                      handleChange('assemblyId', '')
                    }}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
                    disabled={!form.stateId || loadingLocations.districts}
                  >
                    <option value="">{loadingLocations.districts ? 'Loading...' : 'Select district'}</option>
                    {districts.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Mandal">
                  <select
                    value={form.mandalId}
                    onChange={e => handleChange('mandalId', e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
                    disabled={!form.districtId || loadingLocations.mandals}
                  >
                    <option value="">{loadingLocations.mandals ? 'Loading...' : 'Select mandal'}</option>
                    {mandals.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Assembly Constituency">
                  <select
                    value={form.assemblyId}
                    onChange={e => handleChange('assemblyId', e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
                    disabled={!form.districtId || loadingLocations.assemblies}
                  >
                    <option value="">{loadingLocations.assemblies ? 'Loading...' : 'Select constituency'}</option>
                    {assemblies.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-4">Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Address Line 1">
                    <input
                      type="text"
                      value={form.address.line1}
                      onChange={e => handleAddressChange('line1', e.target.value)}
                      className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      placeholder="Street address"
                    />
                  </FormField>

                  <FormField label="Address Line 2">
                    <input
                      type="text"
                      value={form.address.line2}
                      onChange={e => handleAddressChange('line2', e.target.value)}
                      className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      placeholder="Apartment, suite, etc."
                    />
                  </FormField>

                  <FormField label="City">
                    <input
                      type="text"
                      value={form.address.city}
                      onChange={e => handleAddressChange('city', e.target.value)}
                      className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      placeholder="City"
                    />
                  </FormField>

                  <FormField label="PIN Code">
                    <input
                      type="text"
                      value={form.address.pincode}
                      onChange={e => handleAddressChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      placeholder="6 digit PIN code"
                      maxLength={6}
                    />
                  </FormField>
                </div>
              </div>
            </div>
          )}

          {/* Professional Tab */}
          {activeTab === 'professional' && (
            <div className="space-y-6">
              <SectionHeader
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                title="Professional Details"
                subtitle="Your work and education information"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Occupation">
                  <input
                    type="text"
                    value={form.occupation}
                    onChange={e => handleChange('occupation', e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    placeholder="e.g., District Reporter, Journalist"
                  />
                </FormField>

                <FormField label="Education">
                  <input
                    type="text"
                    value={form.education}
                    onChange={e => handleChange('education', e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    placeholder="e.g., B.Tech, M.A. Journalism"
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* Social Links Tab */}
          {activeTab === 'social' && (
            <div className="space-y-6">
              <SectionHeader
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
                title="Social Media Links"
                subtitle="Connect your social profiles"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Twitter / X">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                    <input
                      type="text"
                      value={form.socialLinks.twitter}
                      onChange={e => handleSocialChange('twitter', e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      placeholder="username"
                    />
                  </div>
                </FormField>

                <FormField label="Facebook">
                  <input
                    type="text"
                    value={form.socialLinks.facebook}
                    onChange={e => handleSocialChange('facebook', e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    placeholder="Profile URL or username"
                  />
                </FormField>

                <FormField label="Instagram">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                    <input
                      type="text"
                      value={form.socialLinks.instagram}
                      onChange={e => handleSocialChange('instagram', e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      placeholder="username"
                    />
                  </div>
                </FormField>

                <FormField label="LinkedIn">
                  <input
                    type="text"
                    value={form.socialLinks.linkedin}
                    onChange={e => handleSocialChange('linkedin', e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    placeholder="Profile URL"
                  />
                </FormField>

                <FormField label="YouTube">
                  <input
                    type="text"
                    value={form.socialLinks.youtube}
                    onChange={e => handleSocialChange('youtube', e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    placeholder="Channel URL"
                  />
                </FormField>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {profile?.updatedAt && `Last updated: ${new Date(profile.updatedAt).toLocaleString()}`}
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {saving ? (
              <>
                <Loader size={18} />
                Saving...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {isNewProfile ? 'Create Profile' : 'Save Changes'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <DashboardLayout title="My Profile">
      <ProfileContent />
    </DashboardLayout>
  )
}
