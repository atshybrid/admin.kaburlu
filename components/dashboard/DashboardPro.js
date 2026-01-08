/**
 * Dashboard Pro - Main Dashboard Layout
 * Modern admin dashboard with redesigned UI/UX
 */

import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import { getToken, logout } from '../../utils/auth'
import { useRouter } from 'next/router'
import { ToastProvider } from '../ui/primitives'
import SidebarPro, { MobileSidebarPro } from './SidebarPro'
import HeaderPro from './HeaderPro'
import OverviewPro from './OverviewPro'

// Import existing views
import TenantsView from './TenantsView'
import ReportersView from './ReportersView'
import UsersView from './UsersView'
import CategoriesView from './CategoriesView'
import LanguagesView from './LanguagesView'
import StatesView from './StatesView'
import DistrictsView from './DistrictsView'
import MandalsView from './MandalsView'
import AssemblyConstituenciesView from './AssemblyConstituenciesView'
import TenantIdCardSettingsView from './TenantIdCardSettingsView'
import RazorpaySettingsView from './RazorpaySettingsView'
import GlobalRazorpaySettingsView from './GlobalRazorpaySettingsView'
import RolesView from './RolesView'
import TenantDomainSettingsView from './TenantDomainSettingsView'
import ArticlesView from './ArticlesView'

export default function DashboardPro({ initialTab }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

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

  const isSuperAdmin = (user?.role || '').toUpperCase() === 'SUPER_ADMIN'
  const tab = (router.query?.tab || initialTab || 'overview')

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-slate-200 border-t-brand rounded-full animate-spin" />
          <span className="text-sm text-slate-500">Checking authentication...</span>
        </div>
      </div>
    )
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-sm text-slate-500 mb-6">
            You don&apos;t have permission to access the admin dashboard.
            Please contact your administrator for access.
          </p>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    )
  }

  const renderView = () => {
    switch (tab) {
      case 'tenants': return <TenantsView />
      case 'reporters': return <ReportersView />
      case 'users': return <UsersView />
      case 'categories': return <CategoriesView />
      case 'languages': return <LanguagesView />
      case 'states': return <StatesView />
      case 'districts': return <DistrictsView />
      case 'assembly': return <AssemblyConstituenciesView />
      case 'mandals': return <MandalsView />
      case 'tenant-idcard-settings': return <TenantIdCardSettingsView />
      case 'tenant-razorpay-settings': return <RazorpaySettingsView />
      case 'global-razorpay-settings': return <GlobalRazorpaySettingsView />
      case 'roles': return <RolesView />
      case 'tenant-domain-settings': return <TenantDomainSettingsView />
      case 'articles': return <ArticlesView />
      default: return <OverviewPro />
    }
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50">
        <Head>
          <title>Kaburlu Admin Dashboard</title>
          <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`} />
          <meta name="robots" content="noindex,nofollow" />
        </Head>

        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <SidebarPro
            user={user}
            onLogout={handleLogout}
            currentTab={tab}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Header */}
            <HeaderPro
              user={user}
              onOpenNav={() => setMobileOpen(true)}
              onLogout={handleLogout}
            />

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
              <div className="max-w-[1600px] mx-auto">
                {renderView()}
              </div>
            </main>
          </div>
        </div>

        {/* Mobile Sidebar */}
        <MobileSidebarPro
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          user={user}
          onLogout={handleLogout}
          currentTab={tab}
        />
      </div>
    </ToastProvider>
  )
}
