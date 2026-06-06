/**
 * Create / edit news banner
 */

import { useState, useEffect } from 'react'
import { newsBannersApi } from '../../../lib/api/services/newsBannersApi'
import { normalizeBanner } from '../../../lib/newsBanners/normalize'
import BannerMediaUpload from './BannerMediaUpload'
import ImageUpload from '../../ui/ImageUpload'
import { Button, FormField, Input, Modal, Select, toast } from '../../ui'
import { ApiError } from '../../../lib/api/client'

const EMPTY = {
  title: '',
  subtitle: '',
  mediaType: 'IMAGE',
  mediaUrl: '',
  thumbnailUrl: '',
  linkUrl: '',
  tenantId: '',
  sortOrder: 1,
  status: 'ACTIVE',
}

function formatErr(err, fb) {
  if (err instanceof ApiError) return err.data?.code ? `${err.message} (${err.data.code})` : err.message
  return err?.message || fb
}

export default function BannerFormModal({ isOpen, onClose, banner, onSaved }) {
  const isEdit = Boolean(banner?.id)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (!isOpen) return
    if (banner) {
      setForm({
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        mediaType: banner.mediaType || 'IMAGE',
        mediaUrl: banner.mediaUrl || '',
        thumbnailUrl: banner.thumbnailUrl || '',
        linkUrl: banner.linkUrl || '',
        tenantId: banner.tenantId || '',
        sortOrder: banner.sortOrder ?? 1,
        status: banner.status || 'ACTIVE',
      })
    } else {
      setForm({ ...EMPTY })
    }
  }, [isOpen, banner])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleSave = async () => {
    const title = form.title.trim()
    if (!title) {
      toast.error('Title is required')
      return
    }
    if (!form.mediaUrl.trim()) {
      toast.error('Upload banner media first')
      return
    }

    const body = {
      title,
      subtitle: form.subtitle.trim() || null,
      mediaType: form.mediaType,
      mediaUrl: form.mediaUrl.trim(),
      thumbnailUrl: form.thumbnailUrl.trim() || null,
      linkUrl: form.linkUrl.trim() || null,
      tenantId: form.tenantId.trim() || null,
      sortOrder: Number(form.sortOrder) || 0,
      status: form.status,
    }

    setSaving(true)
    try {
      let res
      if (isEdit) {
        res = await newsBannersApi.replace(banner.id, body)
      } else {
        res = await newsBannersApi.create(body)
      }
      const saved = normalizeBanner(res?.banner || res)
      toast.success(isEdit ? 'Banner updated' : 'Banner created')
      onSaved?.(saved)
      onClose()
    } catch (err) {
      toast.error(formatErr(err, 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  const isVideo = form.mediaType === 'VIDEO'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      contentOverflow="visible"
      title={isEdit ? 'Edit banner' : 'New news banner'}
      subtitle="Upload to Bunny CDN, then publish to app carousel"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={handleSave}>
            {isEdit ? 'Save changes' : 'Create banner'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Title *">
            <Input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Election Coverage 2026"
            />
          </FormField>
          <FormField label="Subtitle">
            <Input
              value={form.subtitle}
              onChange={(e) => set('subtitle', e.target.value)}
              placeholder="Watch live"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Media type *">
            <Select
              value={form.mediaType}
              onChange={(e) => {
                const v = e.target.value
                setForm((f) => ({
                  ...f,
                  mediaType: v,
                  mediaUrl: v !== f.mediaType ? '' : f.mediaUrl,
                  thumbnailUrl: v !== f.mediaType ? '' : f.thumbnailUrl,
                }))
              }}
            >
              <option value="IMAGE">Image (WebP on CDN)</option>
              <option value="VIDEO">Video (MP4 loop)</option>
            </Select>
          </FormField>
          <FormField label="Status">
            <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DRAFT">Draft</option>
            </Select>
          </FormField>
          <FormField label="Sort order" hint="lower = first in carousel">
            <Input
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => set('sortOrder', e.target.value)}
            />
          </FormField>
        </div>

        <FormField label={isVideo ? 'Banner video *' : 'Banner image *'}>
          <BannerMediaUpload
            mediaType={form.mediaType}
            value={form.mediaUrl}
            onChange={(url) => set('mediaUrl', url)}
          />
        </FormField>

        {isVideo ? (
          <FormField label="Video poster / thumbnail" hint="optional — shown before play">
            <ImageUpload
              value={form.thumbnailUrl}
              onChange={(url) => set('thumbnailUrl', url)}
              folder="news-banners/thumbnails"
              label="Upload poster"
              maxSizeMB={3}
            />
          </FormField>
        ) : null}

        <FormField label="Link URL" hint="tap opens in app browser">
          <Input
            value={form.linkUrl}
            onChange={(e) => set('linkUrl', e.target.value)}
            placeholder="https://kaburlumedia.com/election"
          />
        </FormField>

        <FormField label="Tenant ID" hint="empty = visible to all tenants">
          <Input
            value={form.tenantId}
            onChange={(e) => set('tenantId', e.target.value)}
            placeholder="Optional — cmk7..."
            className="font-mono text-sm"
          />
        </FormField>
      </div>
    </Modal>
  )
}
