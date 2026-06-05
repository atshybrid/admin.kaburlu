/**
 * Session Tracker for DESK_EDITOR Working Hours
 * - Sends heartbeat every 2 minutes to track active time
 * - Ends session on logout or browser close
 */

import { getApiBase } from '../lib/api/utils'

let heartbeatInterval = null
const HEARTBEAT_INTERVAL = 2 * 60 * 1000 // 2 minutes

function sessionEndpoint(subpath) {
  const clean = String(subpath || '').replace(/^\//, '')
  const base = getApiBase()
  return `${base.replace(/\/$/, '')}/${clean}`
}

/**
 * Get current session ID from localStorage
 */
export function getSessionId() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('kab_admin_auth')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed.sessionId || null
  } catch (e) {
    return null
  }
}

/**
 * Save session ID to auth storage
 */
export function saveSessionId(sessionId) {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem('kab_admin_auth')
    if (!raw) return
    const parsed = JSON.parse(raw)
    parsed.sessionId = sessionId
    localStorage.setItem('kab_admin_auth', JSON.stringify(parsed))
  } catch (e) {
    console.error('Failed to save sessionId:', e)
  }
}

/**
 * Clear session ID from auth storage
 */
export function clearSessionId() {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem('kab_admin_auth')
    if (!raw) return
    const parsed = JSON.parse(raw)
    delete parsed.sessionId
    localStorage.setItem('kab_admin_auth', JSON.stringify(parsed))
  } catch (e) {
    console.error('Failed to clear sessionId:', e)
  }
}

/**
 * Send heartbeat to backend to track active time
 */
function sendHeartbeat(sessionId) {
  if (!sessionId) return
  fetch(sessionEndpoint('auth/session/heartbeat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId })
  })
    .then((res) => {
      if (!res.ok) {
        /* silent — non-critical */
      }
    })
    .catch(() => {
      /* proxy/network failure — never surface to Next.js overlay */
    })
}

/**
 * Start session heartbeat
 * Called after successful login
 */
export function startSessionHeartbeat(sessionId) {
  if (typeof window === 'undefined') return
  
  // Stop any existing heartbeat first
  stopSessionHeartbeat()
  
  if (!sessionId) {
    sessionId = getSessionId()
  }
  
  if (!sessionId) {
    console.warn('No sessionId found, cannot start heartbeat')
    return
  }
  
  // Send initial heartbeat
  sendHeartbeat(sessionId)
  
  // Start interval
  heartbeatInterval = setInterval(() => {
    const currentSessionId = getSessionId()
    if (currentSessionId) {
      sendHeartbeat(currentSessionId)
    } else {
      stopSessionHeartbeat()
    }
  }, HEARTBEAT_INTERVAL)
  
  console.log('Session heartbeat started')
}

/**
 * Stop session heartbeat
 */
export function stopSessionHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
    console.log('Session heartbeat stopped')
  }
}

/**
 * End session properly (on logout or tab close)
 * This triggers working hours calculation on backend
 */
export async function endSession() {
  const sessionId = getSessionId()
  if (!sessionId) return
  
  stopSessionHeartbeat()
  
  try {
    // Use sendBeacon for reliability during page unload (same-origin via /api/proxy in browser)
    const url = sessionEndpoint('auth/session/end')
    const data = JSON.stringify({ sessionId })
    
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([data], { type: 'application/json' }))
    } else {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data,
        keepalive: true
      })
    }
  } catch (e) {
    console.error('Failed to end session:', e)
  } finally {
    clearSessionId()
  }
}

/**
 * Initialize session tracking
 * Called once in _app.js
 */
export function initSessionTracking() {
  if (typeof window === 'undefined') return
  
  const sessionId = getSessionId()
  if (sessionId) {
    startSessionHeartbeat(sessionId)
  }
  
  // Handle browser/tab close
  const handleBeforeUnload = () => {
    endSession()
  }
  
  // Handle visibility change (tab switch)
  const handleVisibilityChange = () => {
    const sessionId = getSessionId()
    if (!sessionId) return
    
    if (document.hidden) {
      // Tab hidden - stop heartbeat to save resources
      stopSessionHeartbeat()
    } else {
      // Tab visible - resume heartbeat
      startSessionHeartbeat(sessionId)
    }
  }
  
  window.addEventListener('beforeunload', handleBeforeUnload)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  // Return cleanup function
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    stopSessionHeartbeat()
  }
}

const sessionTracker = {
  getSessionId,
  saveSessionId,
  clearSessionId,
  startSessionHeartbeat,
  stopSessionHeartbeat,
  endSession,
  initSessionTracking
}

export default sessionTracker
