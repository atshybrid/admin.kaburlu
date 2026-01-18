import { useState } from 'react'
import { FileText, Image as ImageIcon, Upload, Check, AlertCircle, Eye, Trash2 } from 'lucide-react'

export default function EditionCard({ 
  issue, 
  onPublish, 
  onUnpublish, 
  onDelete,
  onPreview,
  loading = false,
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
            <img
              src={issue.coverImageUrl}
              alt={`${issue.edition?.name || 'Edition'} cover`}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <ImageIcon className="w-16 h-16 mb-2" />
            <span className="text-sm">No preview</span>
          </div>
        )}
        
        {/* Status Badge */}
        {issue.publishedAt && (
          <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
            <Check className="w-3.5 h-3.5" />
            Published
          </div>
        )}
        
        {!issue.publishedAt && (
          <div className="absolute top-3 right-3 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
            <AlertCircle className="w-3.5 h-3.5" />
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
            <FileText className="w-4 h-4 text-gray-400" />
            <span>{issue.pageCount || 0} pages</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Upload className="w-4 h-4 text-gray-400" />
            <span>Uploaded {formatTime(issue.createdAt)}</span>
          </div>

          {issue.publishedAt && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="w-4 h-4" />
              <span>Published {formatTime(issue.publishedAt)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-100">
          {canPublish && !issue.publishedAt && (
            <button
              onClick={() => onPublish(issue)}
              disabled={loading}
              className="flex-1 bg-orange-500 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Publishing...' : 'Publish'}
            </button>
          )}

          {canPublish && issue.publishedAt && (
            <button
              onClick={() => onUnpublish(issue)}
              disabled={loading}
              className="flex-1 bg-gray-500 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Unpublishing...' : 'Unpublish'}
            </button>
          )}

          {issue.pdfUrl && (
            <a
              href={issue.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors text-sm"
            >
              <Eye className="w-4 h-4" />
              Preview
            </a>
          )}

          {canManage && (
            <button
              onClick={() => onDelete(issue)}
              disabled={loading}
              className="flex items-center justify-center px-4 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
