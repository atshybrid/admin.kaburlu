/**
 * Tenants Presenter Hook (MVP Pattern)
 * Business logic for Tenants management
 */

import { useState, useCallback, useEffect } from 'react'
import { tenantsService } from '../lib/api/services/tenants'
import { prgiApi } from '../lib/api/services/prgiApi'
import { useCrud, useSearch } from './useCrud'

export function useTenants() {
  const crud = useCrud({
    fetchFn: tenantsService.getAll,
    createFn: tenantsService.create,
    updateFn: tenantsService.update,
    deleteFn: tenantsService.delete
  })

  const search = useSearch(crud.data, ['name', 'slug', 'prgiNumber'])

  // Additional tenant-specific state
  const [entities, setEntities] = useState([])
  const [categories, setCategories] = useState([])
  const [entitiesLoading, setEntitiesLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  // Fetch entities for a tenant
  const fetchEntities = useCallback(async (tenantId) => {
    if (!tenantId) return []
    try {
      setEntitiesLoading(true)
      const result = await tenantsService.getEntities(tenantId)
      setEntities(result)
      return result
    } catch (err) {
      setEntities([])
      return []
    } finally {
      setEntitiesLoading(false)
    }
  }, [])

  // Fetch categories for a tenant
  const fetchCategories = useCallback(async (tenantId) => {
    if (!tenantId) return []
    try {
      setCategoriesLoading(true)
      const result = await tenantsService.getCategories(tenantId)
      setCategories(result)
      return result
    } catch (err) {
      setCategories([])
      return []
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  // Create entity for a tenant
  const createEntity = useCallback(async (tenantId, payload) => {
    try {
      const result = await tenantsService.createEntity(tenantId, payload)
      await fetchEntities(tenantId)
      return { success: true, data: result }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [fetchEntities])

  // Add domain to tenant
  const addDomain = useCallback(async (tenantId, domain) => {
    try {
      const result = await tenantsService.addDomain(tenantId, { domain })
      await crud.fetch()
      return { success: true, data: result }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [crud])

  // Verify tenant PRGI status using PRGI API
  const verifyTenant = useCallback(async (tenantId) => {
    try {
      // Use prgiApi.verify for PRGI verification
      await prgiApi.verify(tenantId)
      await crud.fetch()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [crud])

  // Reject tenant PRGI status using PRGI API
  const rejectTenant = useCallback(async (tenantId, reason) => {
    try {
      await prgiApi.reject(tenantId, reason)
      await crud.fetch()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [crud])

  // Submit tenant PRGI for verification
  const submitTenantForVerification = useCallback(async (tenantId) => {
    try {
      await prgiApi.submit(tenantId)
      await crud.fetch()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [crud])

  // Load related data when a tenant is selected
  useEffect(() => {
    if (crud.selected?.id) {
      fetchEntities(crud.selected.id)
      fetchCategories(crud.selected.id)
    } else {
      setEntities([])
      setCategories([])
    }
  }, [crud.selected?.id, fetchEntities, fetchCategories])

  // Helper to create slug from name
  const slugify = (name) => {
    return String(name || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  return {
    // Base CRUD
    ...crud,
    
    // Search
    ...search,
    tenants: search.filteredData,

    // Entities
    entities,
    entitiesLoading,
    fetchEntities,
    createEntity,

    // Categories
    categories,
    categoriesLoading,
    fetchCategories,

    // Domain
    addDomain,

    // Verification (PRGI)
    verifyTenant,
    rejectTenant,
    submitTenantForVerification,

    // Utilities
    slugify
  }
}

export default useTenants
