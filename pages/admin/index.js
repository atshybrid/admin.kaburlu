/**
 * Admin Dashboard - Main entry point
 * /admin route
 * DESK_EDITOR users are redirected to ePaper section
 * REPORTER users are redirected to Articles section
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { getToken } from '../../utils/auth'
import { isReporter } from '../../utils/roleUtils'

// Check if user is DESK_EDITOR only
function isDeskEditorOnly(user) {
  if (!user) return false
  const role = user.role || user.roleName || user.userRole || user.role?.name || ''
  const roleStr = (typeof role === 'string' ? role : role?.name || '').toUpperCase().replace(/[_\s-]/g, '')
  const isAdmin = roleStr.includes('SUPERADMIN') || roleStr.includes('ADMIN')
  const isDeskEditor = roleStr.includes('DESKEDITOR')
  return isDeskEditor && !isAdmin
}

// Overview Dashboard Content
function OverviewContent() {
  return (
    <div className="p-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand to-brand-dark rounded-2xl p-6 text-white mb-6">
        <h1 className="text-2xl font-bold">Welcome to Kaburlu Admin</h1>
        <p className="text-white/80 mt-1">Manage your news platform from one place</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Tenants" value="24" trend="+3" />
        <StatCard label="Active Domains" value="42" trend="+5" />
        <StatCard label="Categories" value="156" />
        <StatCard label="Languages" value="8" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <ActionButton href="/admin/tenants" label="Manage Tenants" icon="building" />
            <ActionButton href="/admin/categories" label="Categories" icon="folder" />
            <ActionButton href="/admin/languages" label="Languages" icon="globe" />
            <ActionButton href="/admin/users" label="Users" icon="users" />
            <ActionButton href="/admin/epaper" label="Block Demos" icon="layout" />
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <ActivityItem 
              title="New tenant created" 
              description="Telangana Daily News" 
              time="2 hours ago" 
            />
            <ActivityItem 
              title="Domain verified" 
              description="news.example.com" 
              time="5 hours ago" 
            />
            <ActivityItem 
              title="Category added" 
              description="Sports - Telugu" 
              time="1 day ago" 
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, trend }) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="text-sm text-slate-500 mb-1">{label}</div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
        {trend && (
          <span className="text-xs text-green-600 font-medium mb-1">{trend}</span>
        )}
      </div>
    </div>
  )
}

function ActionButton({ href, label, icon }) {
  const icons = {
    building: <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
    folder: <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />,
    globe: <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />,
    users: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
    layout: <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-1h6v6h-6v-6z" />,
  }
  
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors"
    >
      <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center">
        <svg className="w-5 h-5 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {icons[icon]}
        </svg>
      </div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </a>
  )
}

function ActivityItem({ title, description, time }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-2 h-2 mt-2 bg-brand rounded-full shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-900">{title}</div>
        <div className="text-xs text-slate-500">{description}</div>
      </div>
      <div className="text-xs text-slate-400 shrink-0">{time}</div>
    </div>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const tokenData = getToken()
    const user = tokenData?.user || tokenData?.data?.user || null
    
    // Redirect DESK_EDITOR to ePaper section
    if (isDeskEditorOnly(user)) {
      router.replace('/admin/epaper/editions')
      return
    }
    
    // Redirect REPORTER to Articles section
    if (isReporter(user)) {
      router.replace('/admin/articles')
      return
    }
    
    setChecking(false)
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-3 border-slate-200 border-t-brand rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <DashboardLayout title="Overview">
      <OverviewContent />
    </DashboardLayout>
  )
}
