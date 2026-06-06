/** Unwrap DJFW admin API responses (direct JSON, no auth envelope). */

export function unwrapDjfw(raw) {
  if (raw == null) return null
  if (Array.isArray(raw)) return raw
  if (typeof raw !== 'object') return raw
  if (raw.data != null && raw.success === true) return raw.data
  if (raw.items || raw.posts || raw.total != null) return raw
  return raw
}

export function electionReadiness(raw) {
  const d = unwrapDjfw(raw)
  if (!d) return { posts: [], totalPosts: 0, needElection: 0, ready: 0 }
  const posts = Array.isArray(d.posts) ? d.posts : []
  return {
    level: d.level,
    stateId: d.stateId,
    districtId: d.districtId,
    mandalId: d.mandalId,
    totalPosts: Number(d.totalPosts ?? posts.length),
    needElection: Number(d.needElection ?? posts.filter((p) => p.electionRequired).length),
    ready: Number(d.ready ?? posts.filter((p) => !p.electionRequired).length),
    posts,
  }
}

export function formatDjfwError(err) {
  const code = err?.data?.code
  const msg = err?.data?.error || err?.message || 'Request failed'
  return code ? `${msg} (${code})` : msg
}
