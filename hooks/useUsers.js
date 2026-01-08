/**
 * Users Presenter Hook (MVP Pattern)
 * Business logic for Users management
 */

import { useCallback } from 'react'
import { usersService } from '../lib/api/services/users'
import { useCrud, useSearch } from './useCrud'

export function useUsers() {
  const crud = useCrud({
    fetchFn: usersService.getAll,
    createFn: usersService.create,
    updateFn: usersService.update,
    deleteFn: usersService.delete
  })

  const search = useSearch(crud.data, ['mobileNumber', 'email', 'name'])

  // Update user role
  const updateRole = useCallback(async (userId, roleId) => {
    try {
      await usersService.updateRole(userId, roleId)
      await crud.fetch()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [crud])

  // Update user status
  const updateStatus = useCallback(async (userId, status) => {
    try {
      await usersService.updateStatus(userId, status)
      await crud.fetch()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [crud])

  return {
    ...crud,
    ...search,
    users: search.filteredData,
    updateRole,
    updateStatus
  }
}

export default useUsers
