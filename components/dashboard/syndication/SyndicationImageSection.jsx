/**
 * Syndication image upload — crop (16:9 / 3:2) + dual portrait composite
 */

import { useState } from 'react'
import { articleService } from '../../../lib/api/services/articleService'
import SyndicationImageCropModal from './SyndicationImageCropModal'
import { FormField, Input, Spinner, toast } from '../../ui'

function ImageUploadRow({
  label,
  description,
  value,
  onChange,
  uploading,
  onPickFile,
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        {description ? <p className="text-xs text-slate-500 mt-0.5">{description}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer">
          <span className="inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50">
            {uploading ? 'Uploading…' : 'Upload & crop'}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onPickFile(file)
              event.target.value = ''
            }}
            disabled={uploading}
            className="hidden"
          />
        </label>
        <span className="text-xs text-slate-400">16:9 default · 3:2 · 2 portraits side-by-side</span>
        <span className="text-xs text-slate-400">or</span>
        <Input
          type="url"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Paste image URL..."
          className="flex-1 min-w-[200px]"
        />
        {uploading ? (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Spinner size="sm" />
            Uploading…
          </div>
        ) : null}
        {value && !uploading ? (
          <span className="text-sm font-medium text-green-600">Ready</span>
        ) : null}
      </div>
      {value ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={label}
            className="h-20 w-36 object-cover rounded-lg border border-slate-200"
            onError={(event) => { event.currentTarget.style.display = 'none' }}
          />
          <p className="text-xs text-slate-500 truncate max-w-md">{value}</p>
        </div>
      ) : null}
    </div>
  )
}

export default function SyndicationImageSection({
  sharedImageUrl,
  onSharedImageUrlChange,
  tenantImages,
  onTenantImageChange,
  selectedTenantIds,
  tenantLabel,
}) {
  const [uploadingShared, setUploadingShared] = useState(false)
  const [uploadingTenantId, setUploadingTenantId] = useState('')
  const [cropOpen, setCropOpen] = useState(false)
  const [cropFile, setCropFile] = useState(null)
  const [cropTarget, setCropTarget] = useState(null)

  const uploadFile = async (file, { onSuccess, setUploading }) => {
    setUploading(true)
    try {
      const result = await articleService.uploadMedia(file, {
        key: file.name,
        filename: file.name,
        kind: 'image',
        folder: 'syndication',
      })
      if (!result?.url) throw new Error('No URL returned from upload')
      onSuccess(result.url)
      toast.success('Image uploaded')
    } catch (error) {
      toast.error(error.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const openCropFor = (file, target) => {
    setCropFile(file)
    setCropTarget(target)
    setCropOpen(true)
  }

  const handleCropConfirm = async (file) => {
    const target = cropTarget
    if (!target) return
    if (target.type === 'shared') {
      await uploadFile(file, {
        onSuccess: onSharedImageUrlChange,
        setUploading: setUploadingShared,
      })
    } else {
      await uploadFile(file, {
        onSuccess: (url) => onTenantImageChange(target.tenantId, url),
        setUploading: (value) => setUploadingTenantId(value ? target.tenantId : ''),
      })
    }
    setCropOpen(false)
    setCropFile(null)
    setCropTarget(null)
  }

  const hasImage = Boolean(sharedImageUrl?.trim())
    || selectedTenantIds.some((tenantId) => Boolean(tenantImages[tenantId]?.trim()))

  return (
    <div className="border-t border-slate-200 pt-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Cover images</h3>
        <p className="text-sm text-slate-500 mt-1">
          Upload & crop — default 16:9. Portrait photos ki 2 pics side-by-side option undi.
        </p>
      </div>

      <div className={`rounded-lg border p-3 flex items-center gap-2 ${hasImage ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
        <span className={`w-2.5 h-2.5 rounded-full ${hasImage ? 'bg-green-500' : 'bg-amber-500'}`} />
        <span className="text-sm text-slate-700">
          {hasImage ? 'Image requirement satisfied' : 'Upload a shared cover image before publish'}
        </span>
      </div>

      <ImageUploadRow
        label="Shared cover image"
        description="Used for print, web, and short news unless a tenant override is set"
        value={sharedImageUrl}
        onChange={onSharedImageUrlChange}
        uploading={uploadingShared}
        onPickFile={(file) => openCropFor(file, { type: 'shared' })}
      />

      {selectedTenantIds.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-800">Per-tenant image overrides (optional)</p>
          {selectedTenantIds.map((tenantId) => (
            <ImageUploadRow
              key={tenantId}
              label={tenantLabel(tenantId)}
              description="Leave empty to use the shared cover image"
              value={tenantImages[tenantId] || ''}
              onChange={(url) => onTenantImageChange(tenantId, url)}
              uploading={uploadingTenantId === tenantId}
              onPickFile={(file) => openCropFor(file, { type: 'tenant', tenantId })}
            />
          ))}
        </div>
      )}

      <SyndicationImageCropModal
        open={cropOpen}
        initialFile={cropFile}
        confirming={uploadingShared || Boolean(uploadingTenantId)}
        onClose={() => {
          if (uploadingShared || uploadingTenantId) return
          setCropOpen(false)
          setCropFile(null)
          setCropTarget(null)
        }}
        onConfirm={handleCropConfirm}
      />
    </div>
  )
}

export function syndicationHasCoverImage(sharedImageUrl, tenantImages, selectedTenantIds) {
  return Boolean(sharedImageUrl?.trim())
    || selectedTenantIds.some((tenantId) => Boolean(tenantImages[tenantId]?.trim()))
}
