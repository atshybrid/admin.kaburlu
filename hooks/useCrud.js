/**
 * CRUD Hook Factory - Presenter Layer (MVP Pattern)
 * Generic hook for CRUD operations with loading/error states
 */

import { useState, useEffect, useCallback, useMemo } from 'react'

export function useCrud({
  fetchFn,
  createFn,
  updateFn,
  deleteFn,
  idField = 'id',
  autoFetch = true
}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [operationLoading, setOperationLoading] = useState(false)

  // Fetch all items
  const fetch = useCallback(async (...args) => {
    try {
      setError(null)
      setLoading(true)
      const result = await fetchFn(...args)
      setData(Array.isArray(result) ? result : [])
      return result
    } catch (err) {
      setError(err.message || 'Failed to fetch data')
      return []
    } finally {
      setLoading(false)
    }
  }, [fetchFn])

  // Create item
  const create = useCallback(async (payload) => {
    try {
      setOperationLoading(true)
      const result = await createFn(payload)
      // Refresh list
      await fetch()
      setIsCreating(false)
      return { success: true, data: result }
    } catch (err) {
      return { success: false, error: err.message || 'Failed to create' }
    } finally {
      setOperationLoading(false)
    }
  }, [createFn, fetch])

  // Update item
  const update = useCallback(async (id, payload) => {
    try {
      setOperationLoading(true)
      const result = await updateFn(id, payload)
      // Refresh list
      await fetch()
      setIsEditing(false)
      setSelected(null)
      return { success: true, data: result }
    } catch (err) {
      return { success: false, error: err.message || 'Failed to update' }
    } finally {
      setOperationLoading(false)
    }
  }, [updateFn, fetch])

  // Delete item
  const remove = useCallback(async (id) => {
    try {
      setOperationLoading(true)
      await deleteFn(id)
      // Refresh list
      await fetch()
      if (selected?.[idField] === id) {
        setSelected(null)
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message || 'Failed to delete' }
    } finally {
      setOperationLoading(false)
    }
  }, [deleteFn, fetch, selected, idField])

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetch()
    }
  }, [autoFetch]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // Data
    data,
    loading,
    error,
    selected,
    
    // UI State
    isCreating,
    isEditing,
    operationLoading,

    // Actions
    fetch,
    create,
    update,
    remove,
    
    // UI State setters
    setSelected,
    setIsCreating,
    setIsEditing,
    openCreate: () => setIsCreating(true),
    closeCreate: () => setIsCreating(false),
    openEdit: (item) => { setSelected(item); setIsEditing(true) },
    closeEdit: () => { setSelected(null); setIsEditing(false) },
    openView: (item) => setSelected(item),
    closeView: () => setSelected(null)
  }
}

/**
 * useSearch - Search and filter functionality
 */
export function useSearch(data, searchFields = []) {
  const [query, setQuery] = useState('')

  const filteredData = useMemo(() => {
    if (!query.trim()) return data

    const q = query.toLowerCase()
    return data.filter(item => {
      return searchFields.some(field => {
        const value = item[field]
        if (value === null || value === undefined) return false
        return String(value).toLowerCase().includes(q)
      })
    })
  }, [data, query, searchFields])

  return {
    query,
    setQuery,
    filteredData,
    hasResults: filteredData.length > 0,
    resultCount: filteredData.length,
    clearSearch: () => setQuery('')
  }
}

/**
 * usePagination - Client-side pagination
 */
export function usePagination(data, pageSize = 10) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(data.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = data.slice(startIndex, endIndex)

  // Reset to page 1 when data changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [data.length, totalPages, currentPage])

  return {
    currentPage,
    totalPages,
    pageSize,
    paginatedData,
    setCurrentPage,
    goToPage: setCurrentPage,
    nextPage: () => setCurrentPage(p => Math.min(p + 1, totalPages)),
    prevPage: () => setCurrentPage(p => Math.max(p - 1, 1)),
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
    startIndex: startIndex + 1,
    endIndex: Math.min(endIndex, data.length),
    totalItems: data.length
  }
}

/**
 * useSort - Sorting functionality
 */
export function useSort(data, defaultKey = null, defaultDir = 'asc') {
  const [sortKey, setSortKey] = useState(defaultKey)
  const [sortDir, setSortDir] = useState(defaultDir)

  const sortedData = useMemo(() => {
    if (!sortKey) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]

      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      let comparison = 0
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal
      } else {
        comparison = String(aVal).localeCompare(String(bVal))
      }

      return sortDir === 'asc' ? comparison : -comparison
    })
  }, [data, sortKey, sortDir])

  const toggleSort = useCallback((key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }, [sortKey])

  return {
    sortKey,
    sortDir,
    sortedData,
    toggleSort,
    setSortKey,
    setSortDir,
    clearSort: () => { setSortKey(null); setSortDir('asc') }
  }
}
