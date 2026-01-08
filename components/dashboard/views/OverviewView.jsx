/**
 * Modern Overview View (MVP Pattern - View Layer)
 * Dashboard home with stats and recent activity
 */

import { useMemo } from 'react'
import {
  StatCard,
  Card,
  Badge,
  DataTable,
  IconFileText,
  IconUsers,
  IconClock,
  IconTrendingUp,
  IconBarChart,
  IconLayers
} from '../../ui'

export default function ModernOverviewView() {
  // Mock stats - in production, these would come from an API
  const stats = useMemo(() => [
    {
      title: 'Total Articles',
      value: '12,348',
      delta: '+4.2%',
      trend: 'up',
      description: 'All published & scheduled items',
      icon: <IconFileText className="w-5 h-5" />
    },
    {
      title: 'Active Reporters',
      value: '482',
      delta: '+1.1%',
      trend: 'up',
      description: 'Active in last 7 days',
      icon: <IconUsers className="w-5 h-5" />
    },
    {
      title: 'Pending Reviews',
      value: '37',
      delta: '-12%',
      trend: 'down',
      description: 'Awaiting editorial action',
      icon: <IconClock className="w-5 h-5" />
    },
    {
      title: 'Avg. Read Time',
      value: '3m 42s',
      delta: '+6%',
      trend: 'up',
      description: 'Per session average',
      icon: <IconTrendingUp className="w-5 h-5" />
    },
    {
      title: 'Bounce Rate',
      value: '46%',
      delta: '-2.1%',
      trend: 'down',
      description: 'One-page sessions',
      icon: <IconBarChart className="w-5 h-5" />
    },
    {
      title: 'Active Tenants',
      value: '24',
      delta: '+3',
      trend: 'up',
      description: 'Total platform tenants',
      icon: <IconLayers className="w-5 h-5" />
    }
  ], [])

  // Mock recent articles
  const recentArticles = useMemo(() => [
    { id: 1, title: 'Telangana budget highlights 2025', author: 'Ravi Kumar', category: 'Politics', status: 'published', views: 12450 },
    { id: 2, title: 'Hyderabad metro expansion plans', author: 'Anita Sharma', category: 'City', status: 'review', views: 7841 },
    { id: 3, title: 'Monsoon rains break records', author: 'Saleem Ahmed', category: 'Weather', status: 'published', views: 5322 },
    { id: 4, title: 'Local sports league finals', author: 'Manoj Reddy', category: 'Sports', status: 'draft', views: 0 },
    { id: 5, title: 'IT sector growth in Telangana', author: 'Priya Nair', category: 'Business', status: 'published', views: 8934 },
  ], [])

  const articleColumns = [
    {
      header: 'Title',
      accessor: 'title',
      render: (value) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      header: 'Author',
      accessor: 'author'
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (value) => <Badge variant="secondary">{value}</Badge>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => {
        const variants = {
          published: 'success',
          review: 'warning',
          draft: 'default'
        }
        return <Badge variant={variants[value] || 'default'} dot>{value}</Badge>
      }
    },
    {
      header: 'Views',
      accessor: 'views',
      render: (value) => value.toLocaleString()
    }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-brand to-brand/80 rounded-2xl p-6 lg:p-8 text-white shadow-lg">
        <h1 className="text-2xl lg:text-3xl font-bold">Welcome back! 👋</h1>
        <p className="mt-2 text-white/80 max-w-2xl">
          Here&apos;s an overview of your platform&apos;s performance. Check out the latest stats and recent activity below.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
            <p className="text-sm text-white/70">Today&apos;s Articles</p>
            <p className="text-2xl font-bold">127</p>
          </div>
          <div className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
            <p className="text-sm text-white/70">Active Sessions</p>
            <p className="text-2xl font-bold">2,847</p>
          </div>
          <div className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
            <p className="text-sm text-white/70">New Signups</p>
            <p className="text-2xl font-bold">89</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Recent Articles */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Recent Articles</h2>
            <p className="text-sm text-gray-500">Latest articles across all tenants</p>
          </div>
        </div>
        <DataTable
          columns={articleColumns}
          data={recentArticles}
          paginated={false}
          searchable={false}
          sortable={false}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-brand/30 hover:shadow-md transition-all cursor-pointer group">
          <div className="text-center py-4">
            <div className="w-12 h-12 mx-auto rounded-xl bg-brand/10 flex items-center justify-center text-brand group-hover:bg-brand group-hover:text-white transition-colors">
              <IconFileText className="w-6 h-6" />
            </div>
            <h3 className="mt-3 font-semibold text-gray-900">New Article</h3>
            <p className="text-sm text-gray-500">Create content</p>
          </div>
        </Card>

        <Card className="hover:border-brand/30 hover:shadow-md transition-all cursor-pointer group">
          <div className="text-center py-4">
            <div className="w-12 h-12 mx-auto rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <IconUsers className="w-6 h-6" />
            </div>
            <h3 className="mt-3 font-semibold text-gray-900">Add Reporter</h3>
            <p className="text-sm text-gray-500">Onboard team</p>
          </div>
        </Card>

        <Card className="hover:border-brand/30 hover:shadow-md transition-all cursor-pointer group">
          <div className="text-center py-4">
            <div className="w-12 h-12 mx-auto rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <IconLayers className="w-6 h-6" />
            </div>
            <h3 className="mt-3 font-semibold text-gray-900">New Tenant</h3>
            <p className="text-sm text-gray-500">Add platform</p>
          </div>
        </Card>

        <Card className="hover:border-brand/30 hover:shadow-md transition-all cursor-pointer group">
          <div className="text-center py-4">
            <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <IconBarChart className="w-6 h-6" />
            </div>
            <h3 className="mt-3 font-semibold text-gray-900">Analytics</h3>
            <p className="text-sm text-gray-500">View reports</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
