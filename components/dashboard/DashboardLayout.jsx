/**
 * Dashboard Layout Component (MVP Pattern - View Layer)
 * Main layout wrapper for all dashboard pages
 */

import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { getToken, logout } from '../../utils/auth'
import { canAccessNewsCartoons, normalizePlatformRole } from '../../lib/newsCartoons/platformRoles'
import { canAccessJournalistUnion } from '../../utils/roleUtils'
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

  useEffect(() => {
    try {
      const tokenData = getToken()
      if (!tokenData || !tokenData.token) {
        router.replace('/')
      } else {
        setUser(tokenData.user || tokenData.data?.user || null)
        // Ensure httpOnly cookie exists for BFF routes (e.g. /api/admin/media/upload)
        if (typeof window !== 'undefined') {
          const key = 'kab_admin_cookie_synced'
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1')
            fetch('/api/auth/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jwt: tokenData.token }),
            }).catch(() => {})
          }
        }
      }
    } finally {
      setChecking(false)
    }
  }, [router])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const hasAccess = (() => {
    if (!user) return false
    const roleStr = normalizePlatformRole(user)
    const legacyRoles = ['SUPERADMIN', 'ADMIN', 'DESKEDITOR', 'NEWSDESK', 'TENANTADMIN', 'REPORTER']
    if (legacyRoles.some((r) => roleStr === r || roleStr.includes(r))) return true
    if (canAccessJournalistUnion(user)) return true
    return canAccessNewsCartoons(user)
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
          />

          {/* Mobile Sidebar */}
          <ModernMobileSidebar
            isOpen={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
            user={user}
            onLogout={handleLogout}
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
