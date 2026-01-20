import { useState } from 'react'
import Image from 'next/image'

export default function EditionCard({ 
  issue, 
  onPublish, 
  onUnpublish, 
  onDelete,
  onPreview,
  loading = false,
  loadingIssueId = null,
  userRole 
}) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const canManage = ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN_EDITOR', 'ADMINEDITOR'].includes(
    String(userRole || '').toUpperCase().replace(/[_\s-]/g, '')
  )

  const canPublish = ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN_EDITOR', 'ADMINEDITOR', 'DESK_EDITOR', 'DESKEDITOR'].includes(
    String(userRole || '').toUpperCase().replace(/[_\s-]/g, '')
  )

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Cover Image */}
      <div className="relative aspect-[3/4] bg-gray-100">
        {!imageError && issue.coverImageUrl ? (
          <>
            <Image
              src={issue.coverImageUrl}
              alt={`${issue.edition?.name || 'Edition'} cover`}
              fill
              className={`object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              unoptimized
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <svg className="w-16 h-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">No preview</span>
          </div>
        )}
        
        {/* Status Badge */}
        {issue.publishedAt && (
          <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Published
          </div>
        )}
        
        {!issue.publishedAt && (
          <div className="absolute top-3 right-3 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Draft
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Edition Info */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {issue.edition?.name || 'Unknown Edition'}
          </h3>
          {issue.subEdition && (
            <p className="text-sm text-gray-500">
              {issue.subEdition.name}
            </p>
          )}
        </div>

        {/* Meta Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{issue.pageCount || 0} pages</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Uploaded {formatTime(issue.createdAt)}</span>
          </div>

          {issue.publishedAt && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Published {formatTime(issue.publishedAt)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-100">
          {canPublish && !issue.publishedAt && (
            <button
              onClick={() => onPublish(issue)}
              disabled={loading || loadingIssueId === issue.id}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors text-sm ${
                loadingIssueId === issue.id
                  ? 'bg-orange-400 text-white cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loadingIssueId === issue.id ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Publishing…
                </span>
              ) : 'Publish'}
            </button>
          )}

          {canPublish && issue.publishedAt && (
            <button
              onClick={() => onUnpublish(issue)}
              disabled={loading || loadingIssueId === issue.id}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors text-sm ${
                loadingIssueId === issue.id
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loadingIssueId === issue.id ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Unpublishing…
                </span>
              ) : 'Unpublish'}
            </button>
          )}

          {issue.pdfUrl && (
            <a
              href={issue.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </a>
          )}

          {canManage && (
            <button
              onClick={() => onDelete(issue)}
              disabled={loading || loadingIssueId === issue.id}
              className={`flex items-center justify-center px-4 py-2.5 rounded-lg font-medium transition-colors ${
                loadingIssueId === issue.id
                  ? 'bg-red-100 text-red-400 cursor-not-allowed'
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loadingIssueId === issue.id ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
