/**
 * Overview Dashboard Component
 * Modern overview with stats, charts placeholder, recent activity, and quick actions
 */

import { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, StatCard, Badge, Button, DataTable, LoadingState, EmptyState } from '../ui/primitives'
import { getToken } from '../../utils/auth'

function getApiBase() {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com'
  return String(base).replace(/\/$/, '').replace(/\/api\/v1$/i, '')
}

export default function OverviewPro() {
  const [stats, setStats] = useState(null)
  const [recentArticles, setRecentArticles] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading dashboard data
    const timer = setTimeout(() => {
      setStats({
        totalArticles: { value: '12,348', change: '+4.2%', type: 'positive' },
        activeReporters: { value: '482', change: '+1.1%', type: 'positive' },
        pendingReviews: { value: '37', change: '-12%', type: 'positive' },
        avgReadTime: { value: '3m 42s', change: '+6%', type: 'positive' },
        totalTenants: { value: '24', change: '+2', type: 'positive' },
        totalUsers: { value: '1,847', change: '+9.4%', type: 'positive' },
      })
      setRecentArticles([
        { id: 1, title: 'Telangana budget highlights 2025', author: 'Ravi Kumar', category: 'Politics', status: 'Published', views: 12450 },
        { id: 2, title: 'Hyderabad metro expansion plans', author: 'Anita Reddy', category: 'City', status: 'Review', views: 7841 },
        { id: 3, title: 'Monsoon rains break records', author: 'Saleem Khan', category: 'Weather', status: 'Published', views: 5322 },
        { id: 4, title: 'Local sports league finals', author: 'Manoj Patel', category: 'Sports', status: 'Draft', views: 0 },
        { id: 5, title: 'New infrastructure projects announced', author: 'Priya Sharma', category: 'Development', status: 'Published', views: 3210 },
      ])
      setRecentActivity([
        { id: 1, type: 'article', message: 'New story submitted by Anita for review', time: '5 min ago', color: 'brand' },
        { id: 2, type: 'publish', message: 'Budget highlight article published', time: '12 min ago', color: 'emerald' },
        { id: 3, type: 'pending', message: '3 articles pending editorial approval', time: '1 hour ago', color: 'amber' },
        { id: 4, type: 'user', message: 'New reporter registered: Rahul Singh', time: '2 hours ago', color: 'sky' },
        { id: 5, type: 'tenant', message: 'Domain verified for Kaburlu Today', time: '3 hours ago', color: 'violet' },
      ])
      setLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  const articleColumns = useMemo(() => [
    {
      header: 'Title',
      accessor: 'title',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900 line-clamp-1">{row.title}</div>
          <div className="text-xs text-slate-500 mt-0.5">{row.author}</div>
        </div>
      )
    },
    { header: 'Category', accessor: 'category' },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <Badge 
          variant={row.status === 'Published' ? 'success' : row.status === 'Review' ? 'warning' : 'default'}
          dot
        >
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Views',
      accessor: 'views',
      render: (row) => row.views?.toLocaleString() || '0'
    },
  ], [])

  if (loading) {
    return <LoadingState label="Loading dashboard..." />
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand to-brand-dark rounded-2xl p-6 text-white">
        <h1 className="text-xl font-semibold">Welcome back! 👋</h1>
        <p className="text-white/80 mt-1 text-sm">Here&apos;s what&apos;s happening with your news platform today.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Article
          </Button>
          <Button variant="ghost" size="sm" className="text-white/90 hover:bg-white/20 hover:text-white">
            View Reports
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Articles"
          value={stats.totalArticles.value}
          change={stats.totalArticles.change}
          changeType={stats.totalArticles.type}
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 10h16M4 14h10"/></svg>}
        />
        <StatCard
          title="Active Reporters"
          value={stats.activeReporters.value}
          change={stats.activeReporters.change}
          changeType={stats.activeReporters.type}
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
        />
        <StatCard
          title="Pending Reviews"
          value={stats.pendingReviews.value}
          change={stats.pendingReviews.change}
          changeType={stats.pendingReviews.type}
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg>}
        />
        <StatCard
          title="Avg. Read Time"
          value={stats.avgReadTime.value}
          change={stats.avgReadTime.change}
          changeType={stats.avgReadTime.type}
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>}
        />
        <StatCard
          title="Total Tenants"
          value={stats.totalTenants.value}
          change={stats.totalTenants.change}
          changeType={stats.totalTenants.type}
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>}
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers.value}
          change={stats.totalUsers.change}
          changeType={stats.totalUsers.type}
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Articles */}
        <div className="xl:col-span-2">
          <Card padding="none">
            <div className="px-5 py-4 border-b border-slate-100">
              <CardHeader
                title="Recent Articles"
                subtitle="Latest published and pending articles"
                actions={
                  <Button variant="ghost" size="sm">View All</Button>
                }
                className="!mb-0"
              />
            </div>
            <DataTable
              columns={articleColumns}
              data={recentArticles}
              emptyTitle="No articles yet"
            />
          </Card>
        </div>

        {/* Activity Feed */}
        <div>
          <Card>
            <CardHeader
              title="Activity"
              subtitle="Recent platform activity"
              actions={
                <Badge variant="info">{recentActivity.length} new</Badge>
              }
            />
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                    activity.color === 'brand' ? 'bg-brand' :
                    activity.color === 'emerald' ? 'bg-emerald-500' :
                    activity.color === 'amber' ? 'bg-amber-500' :
                    activity.color === 'sky' ? 'bg-sky-500' :
                    activity.color === 'violet' ? 'bg-violet-500' :
                    'bg-slate-400'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700">{activity.message}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100">
              <Button variant="primary" className="w-full">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create Article
              </Button>
            </div>
          </Card>

          {/* Quick Links */}
          <Card className="mt-4">
            <CardHeader title="Quick Actions" />
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Add Tenant', icon: '🏢', href: '/dashboard/tenants' },
                { label: 'Manage Users', icon: '👥', href: '/dashboard/users' },
                { label: 'Categories', icon: '📁', href: '/dashboard/categories' },
                { label: 'Roles', icon: '🔐', href: '/dashboard/roles' },
              ].map((item) => (
                <button
                  key={item.label}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                  onClick={() => window.location.href = item.href}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
