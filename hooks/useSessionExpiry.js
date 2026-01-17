import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'

let globalSessionExpiredHandler = null

export function setGlobalSessionExpiredHandler(handler) {
  globalSessionExpiredHandler = handler
}

export function triggerSessionExpired() {
  if (globalSessionExpiredHandler) {
    globalSessionExpiredHandler()
  }
}

export default function useSessionExpiry() {
  const [showMpinModal, setShowMpinModal] = useState(false)
  const router = useRouter()

  const handleSessionExpired = useCallback(() => {
    // Only show modal if not already on login page
    if (router.pathname !== '/' && router.pathname !== '/login') {
      setShowMpinModal(true)
    }
  }, [router.pathname])

  useEffect(() => {
    setGlobalSessionExpiredHandler(handleSessionExpired)
    
    return () => {
      setGlobalSessionExpiredHandler(null)
    }
  }, [handleSessionExpired])

  const handleMpinSuccess = useCallback(() => {
    setShowMpinModal(false)
    // Optionally reload the page to refresh data
    window.location.reload()
  }, [])

  const handleModalClose = useCallback(() => {
    setShowMpinModal(false)
  }, [])

  return {
    showMpinModal,
    handleMpinSuccess,
    handleModalClose
  }
}
