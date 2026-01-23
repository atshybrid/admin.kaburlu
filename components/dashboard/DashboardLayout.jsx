/**
 * Dashboard Layout Component (MVP Pattern - View Layer)
 * Main layout wrapper for all dashboard pages
 */

import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { getToken, logout } from '../../utils/auth'
import ModernSidebar from './ModernSidebar'
import ModernMobileSidebar from './ModernMobileSidebar'
import ModernHeader from './ModernHeader'
import { ToastContainer } from '../ui/Toast.jsx'
import Spinner from '../ui/Spinner.jsx'
import { LayoutContext, useLayout } from '../admin/LayoutContext'

// Re-export for backward compatibility
export { useLayout }

export default function DashboardLayout({ children, title = 'Dashboard' }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Get current tab from URL
  const currentTab = router.query?.tab || 
    (router.pathname === '/dashboard' ? 'overview' : 
    router.pathname.split('/').pop())

  useEffect(() => {
    try {
      const tokenData = getToken()
      if (!tokenData || !tokenData.token) {
        router.replace('/')
      } else {
        setUser(tokenData.user || tokenData.data?.user || null)
      }
    } finally {
      setChecking(false)
    }
  }, [router])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  // Flexible role check - handles superadmin, super_admin, SUPERADMIN, admin, desk_editor, reporter, etc.
  const hasAccess = (() => {
    if (!user) return false
    const role = user.role || user.roleName || user.userRole || user.role?.name || ''
    const roleStr = (typeof role === 'string' ? role : role?.name || '').toUpperCase().replace(/[_\s-]/g, '')
    const allowedRoles = ['SUPERADMIN', 'ADMIN', 'DESKEDITOR', 'NEWSDESK', 'TENANTADMIN', 'REPORTER']
    return allowedRoles.some(r => roleStr === r || roleStr.includes(r))
  })()

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Spinner size="xl" />
        <p className="mt-4 text-sm text-gray-500">Checking authentication...</p>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-6">You don&apos;t have permission to access this dashboard. Please contact your administrator.</p>
          <button
            onClick={handleLogout}
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <LayoutContext.Provider value={{ user, setUser }}>
      <Head>
        <title>{title} | Kaburlu Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="min-h-screen bg-slate-50">
        <div className="flex">
          {/* Sidebar - Desktop */}
          <ModernSidebar
            user={user}
            onLogout={handleLogout}
            currentTab={currentTab}
          />

          {/* Mobile Sidebar */}
          <ModernMobileSidebar
            isOpen={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
            user={user}
            onLogout={handleLogout}
            currentTab={currentTab}
          />

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <ModernHeader
              user={user}
              onOpenNav={() => setMobileNavOpen(true)}
              onLogout={handleLogout}
              title={title}
            />

            {/* Page Content */}
            <div className="p-4 lg:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Toast notifications */}
      <ToastContainer />
    </LayoutContext.Provider>
  )
}
