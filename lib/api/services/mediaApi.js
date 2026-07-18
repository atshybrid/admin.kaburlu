/**
 * Media Upload API
 * Handles file uploads to backend storage
 */

import { getToken } from '../../../utils/auth'

/**
 * Upload a file to the media storage
 * @param {File} file - File object to upload
 * @param {string} folder - Optional folder path (e.g., 'logos', 'favicons', 'og-images')
 * @returns {Promise<Object>} Upload result with URL
 */
export async function uploadMedia(file, folder = 'general') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)
  formData.append('kind', 'image')

  const tokenData = getToken()
  const headers = {}
  if (tokenData?.token) {
    headers.Authorization = `Bearer ${tokenData.token}`
  }

  const response = await fetch('/api/admin/media/upload', {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text()
    let errorMessage = text
    try {
      const error = JSON.parse(text)
      errorMessage = error.message || error.error || text
      // Backend (non-prod) attaches a `detail` object with the real cause.
      const detailMsg = error.detail?.message || error.detail?.code
      if (detailMsg && !String(errorMessage).includes(detailMsg)) {
        errorMessage = `${errorMessage}: ${detailMsg}`
      }
    } catch {
      // text is not JSON
    }
    const err = new Error(errorMessage || 'Failed to upload file')
    err.status = response.status
    throw err
  }

  const data = await response.json()
  const url =
    data.publicUrl ||
    data.internalUrl ||
    data.url ||
    data.location ||
    data.data?.publicUrl ||
    data.data?.url
  return { url, ...data }
}

/**
 * Delete a media file
 * @param {string} url - Full URL or path of the file to delete
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteMedia(url) {
  const token = getToken()
  
  const response = await fetch('/api/proxy/media/delete', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete file' }))
    throw new Error(error.message || 'Failed to delete file')
  }

  return response.json()
}

const mediaApi = {
  upload: uploadMedia,
  delete: deleteMedia
}

export default mediaApi
