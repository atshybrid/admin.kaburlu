/**
 * Modern Pagination Component (MVP Pattern - View Layer)
 */

import { IconChevronLeft, IconChevronRight } from './Icons'

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  showFirstLast = true,
  maxVisiblePages = 5,
  className = ''
}) {
  const getPageNumbers = () => {
    const pages = []
    const half = Math.floor(maxVisiblePages / 2)

    let start = Math.max(1, currentPage - half)
    let end = Math.min(totalPages, start + maxVisiblePages - 1)

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    return pages
  }

  const pages = getPageNumbers()

  if (totalPages <= 1) return null

  return (
    <nav className={`flex items-center gap-1 ${className}`}>
      {/* Previous */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <IconChevronLeft className="w-4 h-4" />
      </button>

      {/* First page */}
      {showFirstLast && pages[0] > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            1
          </button>
          {pages[0] > 2 && (
            <span className="px-2 text-gray-400">…</span>
          )}
        </>
      )}

      {/* Page numbers */}
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`
            inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors
            ${currentPage === page
              ? 'bg-brand text-white shadow-sm'
              : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
            }
          `}
        >
          {page}
        </button>
      ))}

      {/* Last page */}
      {showFirstLast && pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && (
            <span className="px-2 text-gray-400">…</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <IconChevronRight className="w-4 h-4" />
      </button>
    </nav>
  )
}
