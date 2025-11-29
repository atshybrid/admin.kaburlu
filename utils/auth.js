export function saveToken(jwt, data) {
  const payload = {
    token: jwt,
    data,
    user: data.user || null,
    savedAt: Date.now()
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('kab_admin_auth', JSON.stringify(payload))
  }
}

export function getToken() {
  try {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem('kab_admin_auth')
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

export function logout() {
  if (typeof window !== 'undefined') localStorage.removeItem('kab_admin_auth')
}
