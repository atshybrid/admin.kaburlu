export function saveToken(jwt, data) {
  const enrichedUser = data?.user
    ? {
        ...data.user,
        tenantId: data.tenantId ?? data.user.tenantId ?? null,
        domainId: data.domainId ?? data.user.domainId ?? null,
        platformDesk: data.platformDesk ?? data.user.platformDesk ?? false,
      }
    : null

  const payload = {
    token: jwt,
    refreshToken: data.refreshToken || null,
    sessionId: data.sessionId || null, // 🆕 Working hours tracking
    data,
    user: enrichedUser,
    expiresIn: data.expiresIn || 86400, // Default 24 hours
    savedAt: Date.now()
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('kab_admin_auth', JSON.stringify(payload))
    
    // Start session heartbeat if sessionId is present
    if (data.sessionId) {
      import('./sessionTracker').then(module => {
        module.startSessionHeartbeat(data.sessionId)
      }).catch(console.error)
    }
  }
}

export function getToken() {
  try {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem('kab_admin_auth')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    
    // Check if token is expired
    const now = Date.now()
    const savedAt = parsed.savedAt || 0
    const expiresIn = (parsed.expiresIn || 86400) * 1000 // Convert to milliseconds
    
    if (now - savedAt > expiresIn) {
      // Token expired, try to refresh
      refreshTokenIfNeeded(parsed).catch(() => {
        // If refresh fails, return null to trigger logout
        return null
      })
      return null
    }

    if (parsed.user) {
      parsed.user = {
        ...parsed.user,
        tenantId: parsed.user.tenantId ?? parsed.data?.tenantId ?? null,
        domainId: parsed.user.domainId ?? parsed.data?.domainId ?? null,
        platformDesk: parsed.user.platformDesk ?? parsed.data?.platformDesk ?? false,
      }
    }
    
    return parsed
  } catch (e) {
    return null
  }
}

/** User object merged with login payload (tenantId, platformDesk, etc.) */
export function getAuthUser() {
  const tokenData = getToken()
  if (!tokenData) return null
  const user = tokenData.user || tokenData.data?.user || null
  if (!user) return null
  return {
    ...user,
    tenantId: user.tenantId ?? tokenData.data?.tenantId ?? null,
    domainId: user.domainId ?? tokenData.data?.domainId ?? null,
    platformDesk: user.platformDesk ?? tokenData.data?.platformDesk ?? false,
  }
}

export async function refreshTokenIfNeeded(authData) {
  if (!authData || !authData.refreshToken) {
    throw new Error('No refresh token available')
  }

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.token}`
      },
      body: JSON.stringify({
        refreshToken: authData.refreshToken
      })
    })

    if (!response.ok) {
      throw new Error('Token refresh failed')
    }

    const result = await response.json()
    
    if (result.success && result.data?.jwt) {
      // Save new token
      const newData = {
        ...authData.data,
        refreshToken: authData.refreshToken, // Keep the same refresh token
        expiresIn: result.data.expiresIn || 86400
      }
      saveToken(result.data.jwt, newData)
      return result.data.jwt
    }
    
    throw new Error('Invalid refresh response')
  } catch (error) {
    console.error('Token refresh failed:', error)
    logout()
    throw error
  }
}

export function logout() {
  if (typeof window !== 'undefined') {
    // End session first (for working hours calculation)
    import('./sessionTracker').then(module => {
      module.endSession()
    }).catch(console.error)
    
    localStorage.removeItem('kab_admin_auth')
    // Best-effort: clear server-side httpOnly cookie
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  }
}

export function handleUnauthorized() {
  if (typeof window !== 'undefined') {
    // Try to import and trigger session expiry modal
    import('../hooks/useSessionExpiry').then(module => {
      if (module.triggerSessionExpired) {
        module.triggerSessionExpired()
      }
    }).catch(() => {
      // Fallback to logout if modal not available
      logout()
      window.location.href = '/'
    })
  }
}
