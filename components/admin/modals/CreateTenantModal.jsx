/**
 * Modern Create Tenant Modal
 * Clean UI with auto-slug generation and state dropdown
 */
import { useState, useEffect } from 'react'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import Spinner from '../../ui/Spinner'
import { statesApi } from '../../../lib/api/services/statesApi'
import { tenantsApi } from '../../../lib/api/tenantApi'

// Helper: Generate slug from name
function generateSlug(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function CreateTenantModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    prgiNumber: '',
    stateId: '',
  })
  const [slug, setSlug] = useState('')
  const [states, setStates] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingStates, setLoadingStates] = useState(false)
  const [error, setError] = useState('')

  // Load states on mount
  useEffect(() => {
    if (!isOpen) return
    
    async function fetchStates() {
      setLoadingStates(true)
      try {
        const data = await statesApi.list()
        setStates(data || [])
      } catch (err) {
        console.error('Failed to load states:', err)
        setError('Failed to load states')
      } finally {
        setLoadingStates(false)
      }
    }
    
    fetchStates()
  }, [isOpen])

  // Auto-generate slug when name changes
  useEffect(() => {
    if (formData.name) {
      setSlug(generateSlug(formData.name))
    } else {
      setSlug('')
    }
  }, [formData.name])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', prgiNumber: '', stateId: '' })
      setSlug('')
      setError('')
    }
  }, [isOpen])

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name.trim()) {
      setError('Tenant name is required')
      return
    }
    if (!formData.stateId) {
      setError('Please select a state')
      return
    }

    setLoading(true)
    setError('')

    try {
      const payload = {
        name: formData.name.trim(),
        slug: generateSlug(formData.name),
        stateId: formData.stateId,
      }
      
      // Only include PRGI number if provided
      if (formData.prgiNumber.trim()) {
        payload.prgiNumber = formData.prgiNumber.trim()
      }

      const result = await tenantsApi.create(payload)
      
      // Success callback
      if (onSuccess) {
        onSuccess(result)
      }
      
      // Close modal
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create tenant')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Tenant"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Tenant Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tenant Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={handleChange('name')}
            placeholder="e.g., PRASHNA AYUDHAM"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            disabled={loading}
          />
        </div>

        {/* Auto-generated Slug Preview */}
        {slug && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-600 font-medium">Auto-generated Slug:</span>
              <code className="text-sm text-blue-800 font-mono">{slug}</code>
            </div>
          </div>
        )}

        {/* PRGI Number (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PRGI Number <span className="text-gray-400 text-xs">(Optional)</span>
          </label>
          <input
            type="text"
            value={formData.prgiNumber}
            onChange={handleChange('prgiNumber')}
            placeholder="e.g., TGTEL/25/A0482"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            disabled={loading}
          />
        </div>

        {/* State Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State <span className="text-red-500">*</span>
          </label>
          {loadingStates ? (
            <div className="flex items-center justify-center py-2">
              <Spinner size="sm" />
              <span className="ml-2 text-sm text-gray-500">Loading states...</span>
            </div>
          ) : (
            <select
              value={formData.stateId}
              onChange={handleChange('stateId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={loading}
            >
              <option value="">Select a state</option>
              {states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
          )}
        </div>

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
            disabled={loading || loadingStates}
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                <span className="ml-2">Creating...</span>
              </>
            ) : (
              'Create Tenant'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
