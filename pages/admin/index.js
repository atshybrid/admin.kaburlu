/**
 * Admin Dashboard - Main entry point
 * /admin route
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import Spinner from '../../components/ui/Spinner'
import { getAuthUser } from '../../utils/auth'
import { isReporter, isUnionModerator } from '../../utils/roleUtils'
import { isPlatformDeskUser, PLATFORM_DESK_HOME } from '../../lib/platformDesk'
import { fetchOverviewDashboardStats } from '../../lib/dashboard/overviewStats'

function isDeskEditorOnly(user) {
  if (!user) return false
  const role = user.role || user.roleName || user.userRole || user.role?.name || ''
  const roleStr = (typeof role === 'string' ? role : role?.name || '').toUpperCase().replace(/[_\s-]/g, '')
  const isAdmin = roleStr.includes('SUPERADMIN') || roleStr.includes('ADMIN')
  const isDeskEditor = roleStr.includes('DESKEDITOR')
  return isDeskEditor && !isAdmin
}

const QUICK_ACTIONS = [
  { href: '/admin/tenants', label: 'Manage Tenants', desc: 'Newspaper accounts', icon: 'building' },
  { href: '/admin/articles/create', label: 'Create Article', desc: 'Publish news', icon: 'article' },
  { href: '/admin/categories', label: 'Categories', desc: 'Content taxonomy', icon: 'folder' },
  { href: '/admin/users', label: 'Users', desc: 'Roles & access', icon: 'users' },
  { href: '/admin/epaper', label: 'ePaper', desc: 'PDF editions', icon: 'layout' },
  { href: '/admin/news-banners', label: 'News Banners', desc: 'Homepage promos', icon: 'banner' },
]

const STAT_ICONS = {
  tenants: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  ),
  domains: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  ),
  categories: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  ),
  languages: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m4 10v6m-5-3h6M7 8l4 4m0 0l4-4m-4 4V4" />
  ),
}

function OverviewContent() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dashboard, setDashboard] = useState(null)
  const user = getAuthUser()
  const displayName = user?.name || user?.fullName || 'Admin'

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchOverviewDashboardStats()
        if (!cancelled) setDashboard(data)
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load dashboard')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const stats = dashboard?.stats

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-brand via-brand to-brand-dark p-6 text-white shadow-lg shadow-brand/20">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-black/10 blur-2xl" />
        <div className="relative">
          <p className="text-sm font-medium text-white/80">Kaburlu Admin</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back, {displayName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
            Manage tenants, domains, articles, and ePaper from one modern control center.
          </p>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Tenants" value={stats?.tenants} loading={loading} icon="tenants" href="/admin/tenants" />
        <StatCard label="Active Domains" value={stats?.domains} loading={loading} icon="domains" href="/admin/tenants" />
        <StatCard label="Categories (TE)" value={stats?.categories} loading={loading} icon="categories" href="/admin/categories" />
        <StatCard label="Languages" value={stats?.languages} loading={loading} icon="languages" href="/admin/languages" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Quick Actions</h2>
              <p className="text-xs text-slate-500">Jump to common admin tasks</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {QUICK_ACTIONS.map((action) => (
              <ActionButton key={action.href} {...action} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
            <p className="text-xs text-slate-500">Latest tenant & domain events</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner size="md" />
            </div>
          ) : dashboard?.recentActivity?.length ? (
            <div className="space-y-1">
              {dashboard.recentActivity.map((item) => (
                <ActivityItem key={item.id} {...item} />
              ))}
            </div>
          ) : (
            <EmptyPanel message="No recent activity yet. Create a tenant to get started." />
          )}
        </div>
      </section>

      {!loading && dashboard?.recentTenants?.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Latest Tenants</h2>
              <p className="text-xs text-slate-500">Recently onboarded newspapers</p>
            </div>
            <Link href="/admin/tenants" className="text-sm font-medium text-brand hover:text-brand-dark">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {dashboard.recentTenants.map((tenant) => (
              <Link
                key={tenant.id}
                href={`/admin/tenants/${tenant.id}`}
                className="rounded-xl border border-slate-200 p-4 transition hover:border-brand/30 hover:bg-orange-50/40"
              >
                <p className="font-medium text-slate-900">{tenant.name || tenant.slug}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {(tenant.domains?.length || 0)} domain{(tenant.domains?.length || 0) === 1 ? '' : 's'}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function StatCard({ label, value, loading, icon, href }) {
  const content = (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/20 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {loading ? '—' : (value ?? 0)}
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {STAT_ICONS[icon]}
          </svg>
        </div>
      </div>
      <p className="mt-3 text-xs font-medium text-brand opacity-0 transition group-hover:opacity-100">
        Open section →
      </p>
    </div>
  )

  if (href) {
    return <Link href={href} className="block">{content}</Link>
  }
  return content
}

const ACTION_ICONS = {
  building: STAT_ICONS.tenants,
  article: <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
  folder: STAT_ICONS.categories,
  users: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
  layout: <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-1h6v6h-6v-6z" />,
  banner: <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />,
}

function ActionButton({ href, label, desc, icon }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5 transition hover:border-brand/25 hover:bg-slate-50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10">
        <svg className="h-5 w-5 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {ACTION_ICONS[icon]}
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </Link>
  )
}

function ActivityItem({ title, description, time, href }) {
  return (
    <Link href={href || '#'} className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition hover:bg-slate-50">
      <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="truncate text-xs text-slate-500">{description}</p>
      </div>
      <span className="shrink-0 text-[11px] text-slate-400">{time}</span>
    </Link>
  )
}

function EmptyPanel({ message }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {message}
    </div>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const user = getAuthUser()

    if (isPlatformDeskUser(user)) {
      router.replace(PLATFORM_DESK_HOME)
      return
    }
    if (isDeskEditorOnly(user)) {
      router.replace('/admin/epaper/editions')
      return
    }
    if (isUnionModerator(user)) {
      router.replace('/admin/journalist-union')
      return
    }
    if (isReporter(user)) {
      router.replace('/admin/articles')
      return
    }

    setChecking(false)
  }, [router])

  if (checking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <Spinner size="xl" />
        <p className="mt-4 text-sm text-slate-500">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <DashboardLayout title="Overview">
      <OverviewContent />
    </DashboardLayout>
  )
}
