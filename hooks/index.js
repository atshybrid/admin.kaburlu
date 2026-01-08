/**
 * Hooks Index - Presenter Layer (MVP Pattern)
 */

export { useCrud, useSearch, usePagination, useSort } from './useCrud'
export { useTenants } from './useTenants'
export { useUsers } from './useUsers'
export { useStates, useDistricts, useMandals, useConstituencies } from './useLocations'

// Common hook for async operations
import { useState, useCallback, useEffect } from 'react'

export function useAsync(asyncFn) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true)
      setError(null)
      const result = await asyncFn(...args)
      setData(result)
      return { success: true, data: result }
    } catch (err) {
      setError(err.message || 'An error occurred')
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [asyncFn])

  return {
    loading,
    error,
    data,
    execute,
    reset: () => { setData(null); setError(null) }
  }
}

// Debounce hook for search inputs
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// Toggle hook
export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue)
  
  const toggle = useCallback(() => setValue(v => !v), [])
  const setTrue = useCallback(() => setValue(true), [])
  const setFalse = useCallback(() => setValue(false), [])
  
  return [value, { toggle, setTrue, setFalse, setValue }]
}

// Form state hook
export function useForm(initialValues = {}) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
    // Clear error when field changes
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }, [errors])

  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }))
  }, [])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [])

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setValues,
    setErrors,
    setFieldError,
    reset,
    getFieldProps: (name) => ({
      value: values[name] || '',
      onChange: (e) => handleChange(name, e.target?.value ?? e),
      onBlur: () => handleBlur(name)
    }),
    isValid: Object.keys(errors).length === 0
  }
}
