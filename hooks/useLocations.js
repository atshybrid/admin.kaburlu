/**
 * Locations Presenter Hook (MVP Pattern)
 * Business logic for States, Districts, Mandals, Constituencies
 */

import { useCallback, useState, useEffect } from 'react'
import { locationsService } from '../lib/api/services/locations'
import { useCrud, useSearch } from './useCrud'

export function useStates() {
  const crud = useCrud({
    fetchFn: locationsService.states.getAll,
    createFn: locationsService.states.create,
    updateFn: locationsService.states.update,
    deleteFn: locationsService.states.delete
  })

  const search = useSearch(crud.data, ['name', 'code'])

  return {
    ...crud,
    ...search,
    states: search.filteredData
  }
}

export function useDistricts(stateId = null) {
  const fetchFn = useCallback(() => {
    return locationsService.districts.getAll(stateId)
  }, [stateId])

  const crud = useCrud({
    fetchFn,
    createFn: locationsService.districts.create,
    updateFn: locationsService.districts.update,
    deleteFn: locationsService.districts.delete,
    autoFetch: false
  })

  const search = useSearch(crud.data, ['name'])

  // Refetch when stateId changes
  useEffect(() => {
    crud.fetch()
  }, [stateId]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...crud,
    ...search,
    districts: search.filteredData
  }
}

export function useMandals(districtId = null) {
  const fetchFn = useCallback(() => {
    return locationsService.mandals.getAll(districtId)
  }, [districtId])

  const crud = useCrud({
    fetchFn,
    createFn: locationsService.mandals.create,
    updateFn: locationsService.mandals.update,
    deleteFn: locationsService.mandals.delete,
    autoFetch: false
  })

  const search = useSearch(crud.data, ['name'])

  // Refetch when districtId changes
  useEffect(() => {
    crud.fetch()
  }, [districtId]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...crud,
    ...search,
    mandals: search.filteredData
  }
}

export function useConstituencies(districtId = null) {
  const fetchFn = useCallback(() => {
    return locationsService.constituencies.getAll(districtId)
  }, [districtId])

  const crud = useCrud({
    fetchFn,
    createFn: locationsService.constituencies.create,
    updateFn: locationsService.constituencies.update,
    deleteFn: locationsService.constituencies.delete,
    autoFetch: false
  })

  const search = useSearch(crud.data, ['name', 'number'])

  // Refetch when districtId changes
  useEffect(() => {
    crud.fetch()
  }, [districtId]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...crud,
    ...search,
    constituencies: search.filteredData
  }
}
