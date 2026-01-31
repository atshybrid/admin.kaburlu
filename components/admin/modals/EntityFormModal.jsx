/**
 * Entity Management Form
 * Create/Edit tenant entity (publication details)
 */
import { useState, useEffect } from 'react'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import Spinner from '../../ui/Spinner'
import { languagesApi } from '../../../lib/api/services/languagesApi'
import { statesApi } from '../../../lib/api/services/statesApi'
import { entityApi } from '../../../lib/api/services/entityApi'

const PERIODICITY_OPTIONS = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'FORTNIGHTLY', label: 'Fortnightly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'OTHER', label: 'Other' },
]

export default function EntityFormModal({ isOpen, onClose, onSuccess, tenantId, existingEntity }) {
  const isEditMode = !!existingEntity

  const [formData, setFormData] = useState({
    registrationTitle: '',
    nativeName: '',
    periodicity: 'DAILY',
    customPeriodicity: '',
    registrationDate: '',
    languageId: '',
    ownerName: '',
    publisherName: '',
    editorName: '',
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

  const [languages, setLanguages] = useState([])
  const [states, setStates] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState('')

  // Load languages and states
  useEffect(() => {
    if (!isOpen) return
    
    async function fetchData() {
      setLoadingData(true)
      try {
        const [languagesData, statesData] = await Promise.all([
          languagesApi.list(),
          statesApi.list()
        ])
        setLanguages(languagesData || [])
        setStates(statesData || [])
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Failed to load languages and states')
      } finally {
        setLoadingData(false)
      }
    }
    
    fetchData()
  }, [isOpen])

  // Populate form with existing entity data
  useEffect(() => {
    if (isOpen && existingEntity) {
      const registrationDate = existingEntity.registrationDate 
        ? formatDateToInput(existingEntity.registrationDate)
        : ''
      
      setFormData({
        registrationTitle: existingEntity.registrationTitle || '',
        nativeName: existingEntity.nativeName || '',
        periodicity: existingEntity.periodicity || 'DAILY',
        customPeriodicity: '',
        registrationDate,
        languageId: existingEntity.languageId || '',
        ownerName: existingEntity.ownerName || '',
        publisherName: existingEntity.publisherName || '',
        editorName: existingEntity.editorName || '',
        publicationCountryId: existingEntity.publicationCountryId || '',
        publicationStateId: existingEntity.publicationStateId || '',
        publicationDistrictId: existingEntity.publicationDistrictId || '',
        publicationMandalId: existingEntity.publicationMandalId || '',
        printingPressName: existingEntity.printingPressName || '',
        printingDistrictId: existingEntity.printingDistrictId || '',
        printingMandalId: existingEntity.printingMandalId || '',
        printingCityName: existingEntity.printingCityName || '',
        address: existingEntity.address || '',
        // Contact Details
        contactMobile: existingEntity.contactMobile || '',
        contactEmail: existingEntity.contactEmail || '',
        contactPerson: existingEntity.contactPerson || '',
      })
    } else if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        registrationTitle: '',
        nativeName: '',
        periodicity: 'DAILY',
        customPeriodicity: '',
        registrationDate: '',
        languageId: '',
        ownerName: '',
        publisherName: '',
        editorName: '',
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
      setError('')
    }
  }, [isOpen, existingEntity])

  // Helper: Format date from ISO to DD/MM/YYYY for input
  function formatDateToInput(isoDate) {
    if (!isoDate) return ''
    try {
      const date = new Date(isoDate)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    } catch {
      return ''
    }
  }

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.registrationTitle.trim()) {
      setError('Registration title is required')
      return
    }
    if (!formData.languageId) {
      setError('Please select a language')
      return
    }
    if (!formData.registrationDate) {
      setError('Registration date is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const payload = {
        registrationTitle: formData.registrationTitle.trim(),
        nativeName: formData.nativeName.trim() || undefined,
        periodicity: formData.periodicity === 'OTHER' && formData.customPeriodicity 
          ? formData.customPeriodicity.trim() 
          : formData.periodicity,
        registrationDate: formData.registrationDate,
        languageId: formData.languageId,
        ownerName: formData.ownerName.trim(),
        publisherName: formData.publisherName.trim(),
        editorName: formData.editorName.trim(),
        publicationCountryId: formData.publicationCountryId || undefined,
        publicationStateId: formData.publicationStateId || undefined,
        publicationDistrictId: formData.publicationDistrictId || undefined,
        publicationMandalId: formData.publicationMandalId || undefined,
        printingPressName: formData.printingPressName.trim() || undefined,
        printingDistrictId: formData.printingDistrictId || undefined,
        printingMandalId: formData.printingMandalId || undefined,
        printingCityName: formData.printingCityName.trim() || undefined,
        address: formData.address.trim() || undefined,
        // Contact Details
        contactMobile: formData.contactMobile.trim() || null,
        contactEmail: formData.contactEmail.trim() || null,
        contactPerson: formData.contactPerson.trim() || null,
      }

      let result
      if (isEditMode) {
        result = await entityApi.update(tenantId, payload)
      } else {
        result = await entityApi.create(tenantId, payload)
      }
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      onClose()
    } catch (err) {
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} entity`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Entity Details' : 'Create Entity Details'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {loadingData && (
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
            <span className="ml-3 text-gray-600">Loading form data...</span>
          </div>
        )}

        {!loadingData && (
          <>
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.registrationTitle}
                    onChange={handleChange('registrationTitle')}
                    placeholder="e.g., Prashnaayudham"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Native Name <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.nativeName}
                      onChange={handleChange('nativeName')}
                      placeholder="e.g., ప్రశ్నాయుధం"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      disabled={loading}
                    />
                    {formData.nativeName && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, nativeName: '' })}
                        disabled={loading}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.languageId}
                    onChange={handleChange('languageId')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={loading}
                  >
                    <option value="">Select language</option>
                    {languages.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.name} ({lang.nativeName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Periodicity <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.periodicity}
                    onChange={handleChange('periodicity')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={loading}
                  >
                    {PERIODICITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.periodicity === 'OTHER' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom Periodicity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.customPeriodicity}
                      onChange={handleChange('customPeriodicity')}
                      placeholder="Specify periodicity"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      disabled={loading}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.registrationDate}
                    onChange={handleChange('registrationDate')}
                    placeholder="DD/MM/YYYY (e.g., 27/05/2025)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={loading}
                  />
                  <p className="mt-1 text-xs text-gray-500">Format: DD/MM/YYYY</p>
                </div>
              </div>
            </div>

            {/* Personnel Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Personnel Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={handleChange('ownerName')}
                    placeholder="e.g., KATYADA BAPU RAO"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Publisher Name
                  </label>
                  <input
                    type="text"
                    value={formData.publisherName}
                    onChange={handleChange('publisherName')}
                    placeholder="e.g., KATYADA BAPU RAO"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Editor Name
                  </label>
                  <input
                    type="text"
                    value={formData.editorName}
                    onChange={handleChange('editorName')}
                    placeholder="e.g., KATYADA BAPU RAO"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Publication Location */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Publication Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Publication State
                  </label>
                  <select
                    value={formData.publicationStateId}
                    onChange={handleChange('publicationStateId')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={loading}
                  >
                    <option value="">Select state</option>
                    {states.map((state) => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={handleChange('address')}
                    placeholder="123 Main Street, City"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Printing Press Details */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Printing Press Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Printing Press Name
                  </label>
                  <input
                    type="text"
                    value={formData.printingPressName}
                    onChange={handleChange('printingPressName')}
                    placeholder="e.g., SHASHI PRINTING PRESS"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Printing City Name
                  </label>
                  <input
                    type="text"
                    value={formData.printingCityName}
                    onChange={handleChange('printingCityName')}
                    placeholder="e.g., KAMAREDDY"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Mobile
                  </label>
                  <input
                    type="text"
                    value={formData.contactMobile}
                    onChange={handleChange('contactMobile')}
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={loading}
                  />
                  <p className="mt-1 text-xs text-gray-500">Primary contact number</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleChange('contactEmail')}
                    placeholder="contact@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={handleChange('contactPerson')}
                    placeholder="Contact person name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || loadingData}
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                <span className="ml-2">{isEditMode ? 'Updating...' : 'Creating...'}</span>
              </>
            ) : (
              isEditMode ? 'Update Entity' : 'Create Entity'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
