/** Refresh list + global dashboard stats in parallel (News Desk dashboard). */
export async function refreshNewsDeskDashboard(loaders) {
  const { loadStats, loadList } = loaders || {}
  if (typeof loadStats !== 'function' || typeof loadList !== 'function') {
    throw new Error('loadStats and loadList are required')
  }
  await Promise.all([loadStats(), loadList()])
}