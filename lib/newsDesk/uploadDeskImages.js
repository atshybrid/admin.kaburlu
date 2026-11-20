import { uploadMedia } from '../api/services/mediaApi'

/** Upload one or more image files to news-desk folder; returns public URLs. */
export async function uploadDeskImages(fileList) {
  const files = Array.from(fileList || []).filter((f) => f?.type?.startsWith('image/'))
  if (!files.length) return { uploaded: [], failed: 0 }

  const results = await Promise.all(
    files.map((file) => uploadMedia(file, 'news-desk').catch((err) => ({ error: err }))),
  )
  const uploaded = []
  let failed = 0
  for (const result of results) {
    if (result?.error) {
      failed += 1
      continue
    }
    if (result?.url) uploaded.push(result.url)
  }
  return { uploaded, failed }
}