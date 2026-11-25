export const DEFAULT_NEWS_ROOM_BASE = '/admin/news-room'

export function newsRoomPaths(base = DEFAULT_NEWS_ROOM_BASE) {
  const root = String(base || DEFAULT_NEWS_ROOM_BASE).replace(/\/$/, '')
  return {
    posts: root,
    post: `${root}/post`,
    settings: `${root}/settings`,
    review: (jobId) => `${root}/${encodeURIComponent(jobId)}`,
  }
}