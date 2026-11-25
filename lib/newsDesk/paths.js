export const DEFAULT_NEWS_ROOM_BASE = '/admin/news-room'

/** Static pages under news desk/room — must not be treated as syndication job IDs in `[jobId]`. */
export const NEWS_DESK_RESERVED_SLUGS = new Set(['post', 'create', 'settings'])

export function newsRoomPaths(base = DEFAULT_NEWS_ROOM_BASE) {
  const root = String(base || DEFAULT_NEWS_ROOM_BASE).replace(/\/$/, '')
  return {
    posts: root,
    /** Intake form — requires `pages/.../post.js` or `create.js` under the same base path. */
    post: `${root}/post`,
    settings: `${root}/settings`,
    review: (jobId) => `${root}/${encodeURIComponent(jobId)}`,
  }
}