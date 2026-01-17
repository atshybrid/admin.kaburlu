/**
 * Image Upload Component
 * Handles image file selection, preview, and upload to backend
 */

import { useState, useRef } from 'react'
import Image from 'next/image'
import Button from './Button'
import Spinner from './Spinner'
import mediaApi from '../../lib/api/services/mediaApi'

export function ImageUpload({ 
  value, 
  onChange, 
  folder = 'general',
  label = 'Upload Image',
  accept = 'image/*',
  maxSizeMB = 5,
  showPreview = true,
  className = ''
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSizeMB) {
      setError(`File size must be less than ${maxSizeMB}MB`)
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    setError('')
    setUploading(true)

    try {
      const result = await mediaApi.upload(file, folder)
      
      if (result.url) {
        onChange(result.url)
      } else {
        setError('Upload succeeded but no URL returned')
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload image')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    onChange('')
    setError('')
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="space-y-3">
        {showPreview && value && (
          <div className="relative inline-block">
            <div className="relative w-auto h-32 max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={value} 
                alt="Preview" 
                className="rounded-lg border border-gray-300 object-contain h-32"
                style={{ maxHeight: '128px' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  setError('Failed to load image preview')
                }}
              />
            </div>
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
              type="button"
            >
              ×
            </button>
          </div>
        )}

        {!value && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleButtonClick}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Spinner className="w-4 h-4" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{label}</span>
                </>
              )}
            </Button>
            {value && (
              <input
                type="text"
                value={value}
                readOnly
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-50"
              />
            )}
          </div>
        )}

        {value && !showPreview && (
          <div className="flex gap-2">
            <input
              type="text"
              value={value}
              readOnly
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              className="text-red-600 hover:text-red-700"
            >
              Remove
            </Button>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
        
        {!error && !value && (
          <p className="text-xs text-gray-500">
            Max size: {maxSizeMB}MB. Supported formats: JPG, PNG, GIF, WebP
          </p>
        )}
      </div>
    </div>
  )
}

export default ImageUpload
