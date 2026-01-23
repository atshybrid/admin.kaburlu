function getBaseUrl() {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE
  if (!url) throw new Error('Missing NEXT_PUBLIC_BACKEND_URL (or NEXT_PUBLIC_API_BASE)')
  return url.replace(/\/$/, '')
}

function authHeaders(token) {
  if (!token) throw new Error('Missing auth token')
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
}

async function parseJsonOrText(res) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

// GET: returns { tenantId, domainId, settings, effective }
export async function getDomainSettings({ tenantId, domainId, token }) {
  const res = await fetch(
    `${getBaseUrl()}/tenants/${tenantId}/domains/${domainId}/settings`,
    { headers: authHeaders(token), cache: 'no-store' }
  )

  if (!res.ok) {
    const body = await parseJsonOrText(res)
    throw new Error(typeof body === 'string' ? body : JSON.stringify(body))
  }
  return res.json()
}

// PUT: replaces whole domain settings JSON
export async function putDomainSettings({ tenantId, domainId, token, data }) {
  const res = await fetch(
    `${getBaseUrl()}/tenants/${tenantId}/domains/${domainId}/settings`,
    {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(data ?? {}),
    }
  )

  if (!res.ok) {
    const body = await parseJsonOrText(res)
    throw new Error(typeof body === 'string' ? body : JSON.stringify(body))
  }
  return res.json()
}

// PATCH: shallow-merge top-level keys only
export async function patchDomainSettings({ tenantId, domainId, token, data }) {
  const res = await fetch(
    `${getBaseUrl()}/tenants/${tenantId}/domains/${domainId}/settings`,
    {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(data ?? {}),
    }
  )

  if (!res.ok) {
    const body = await parseJsonOrText(res)
    throw new Error(typeof body === 'string' ? body : JSON.stringify(body))
  }
  return res.json()
}
