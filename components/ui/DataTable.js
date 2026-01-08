/**
 * Modern Data Table Component (MVP Pattern - View Layer)
 * Features: Sorting, Filtering, Pagination, Row Actions, Selection
 */

import { useState, useMemo, useCallback } from 'react'
import { IconChevronDown, IconChevronUp, IconSearch, IconFilter, IconRefresh, IconPlus } from './Icons'
import Badge from './Badge'
import Spinner from './Spinner'
import EmptyState from './EmptyState'
import Pagination from './Pagination'

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  error = null,
  searchable = true,
  searchPlaceholder = 'Search...',
  sortable = true,
  selectable = false,
  paginated = true,
  pageSize = 10,
  actions = null,
  onRowClick = null,
  onRefresh = null,
  onCreate = null,
  createLabel = 'Add New',
  title = '',
  subtitle = '',
  emptyTitle = 'No data found',
  emptySubtitle = 'Try adjusting your search or filters',
  className = '',
  headerClassName = '',
  rowClassName = '',
  toolbar = null
}) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState(new Set())

  // Filter data by search
  const filteredData = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter(row => {
      return columns.some(col => {
        const val = col.accessor ? row[col.accessor] : null
        if (val === null || val === undefined) return false
        return String(val).toLowerCase().includes(q)
      })
    })
  }, [data, search, columns])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData
    const sorted = [...filteredData].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      const comparison = String(aVal).localeCompare(String(bVal))
      return sortDir === 'asc' ? comparison : -comparison
    })
    return sorted
  }, [filteredData, sortKey, sortDir])

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData
    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage, pageSize, paginated])

  const totalPages = Math.ceil(sortedData.length / pageSize)

  const handleSort = useCallback((key) => {
    if (!sortable) return
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }, [sortKey, sortable])

  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(r => r.id)))
    } else {
      setSelectedRows(new Set())
    }
  }, [paginatedData])

  const handleSelectRow = useCallback((id) => {
    setSelectedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const renderCellValue = (column, row) => {
    if (column.render) {
      return column.render(row[column.accessor], row)
    }

    const value = row[column.accessor]

    if (value === null || value === undefined) return <span className="text-gray-400">—</span>

    if (column.type === 'badge') {
      return <Badge variant={column.badgeVariant?.(value) || 'default'}>{value}</Badge>
    }

    if (column.type === 'date') {
      try {
        return new Date(value).toLocaleDateString()
      } catch {
        return value
      }
    }

    if (column.type === 'datetime') {
      try {
        return new Date(value).toLocaleString()
      } catch {
        return value
      }
    }

    if (typeof value === 'boolean') {
      return value ? (
        <Badge variant="success">Yes</Badge>
      ) : (
        <Badge variant="secondary">No</Badge>
      )
    }

    return value
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      {(title || searchable || onCreate || onRefresh || toolbar) && (
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Title Section */}
            {title && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
              </div>
            )}

            {/* Actions Section */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {searchable && (
                <div className="relative flex-1 sm:flex-none">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                    placeholder={searchPlaceholder}
                    className="w-full sm:w-72 pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                  />
                </div>
              )}

              {toolbar}

              <div className="flex items-center gap-2">
                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    disabled={loading}
                    className="inline-flex items-center justify-center w-10 h-10 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    title="Refresh"
                  >
                    <IconRefresh className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                )}

                {onCreate && (
                  <button
                    onClick={onCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand-dark transition-colors shadow-sm"
                  >
                    <IconPlus className="w-4 h-4" />
                    <span>{createLabel}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`bg-gray-50/80 border-b border-gray-100 ${headerClassName}`}>
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && selectedRows.size === paginatedData.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand/20"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.accessor || col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${
                    sortable && col.sortable !== false ? 'cursor-pointer select-none hover:bg-gray-100/50' : ''
                  } ${col.headerClassName || ''}`}
                  onClick={() => col.sortable !== false && handleSort(col.accessor)}
                  style={{ width: col.width }}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {sortable && col.sortable !== false && sortKey === col.accessor && (
                      sortDir === 'asc' ? (
                        <IconChevronUp className="w-3.5 h-3.5 text-brand" />
                      ) : (
                        <IconChevronDown className="w-3.5 h-3.5 text-brand" />
                      )
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} className="py-16">
                  <div className="flex flex-col items-center justify-center">
                    <Spinner size="lg" />
                    <p className="mt-3 text-sm text-gray-500">Loading data...</p>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} className="py-16">
                  <div className="flex flex-col items-center justify-center text-center px-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-900">Error loading data</p>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                    {onRefresh && (
                      <button onClick={onRefresh} className="mt-4 text-sm text-brand hover:underline">
                        Try again
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} className="py-16">
                  <EmptyState title={emptyTitle} subtitle={emptySubtitle} />
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className={`hover:bg-gray-50/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${rowClassName}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.id)}
                        onChange={() => handleSelectRow(row.id)}
                        className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand/20"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.accessor || col.key}
                      className={`px-4 py-3.5 text-sm ${col.className || ''}`}
                    >
                      {renderCellValue(col, row)}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && !loading && !error && sortedData.length > 0 && (
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * pageSize, sortedData.length)}</span> of{' '}
              <span className="font-medium">{sortedData.length}</span> results
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}
    </div>
  )
}
