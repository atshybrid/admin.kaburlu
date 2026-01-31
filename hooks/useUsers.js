/**
 * Users Presenter Hook (MVP Pattern)
 * Business logic for Users management
 */

import { useCallback, useState } from 'react'
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

// Hook for User Logs/Activity
export function useUserLogs(userId = null) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch logs for a specific user or all logs
  const fetchLogs = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    try {
      let data
      if (userId) {
        data = await usersService.getLogs(userId, params)
      } else {
        data = await usersService.getAllLogs(params)
      }
      setLogs(data)
      return { success: true, data }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Create a log entry for a user
  const createLog = useCallback(async (targetUserId, payload) => {
    setLoading(true)
    setError(null)
    try {
      const data = await usersService.createLog(targetUserId || userId, payload)
      await fetchLogs() // Refresh logs after creating
      return { success: true, data }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [userId, fetchLogs])

  return {
    logs,
    loading,
    error,
    fetchLogs,
    createLog,
    setLogs
  }
}

export default useUsers
