/**
 * Modern Dashboard - MVP Architecture
 * 
 * This is the new dashboard page using proper Model-View-Presenter pattern
 * with modern UI components and proper separation of concerns.
 */

import Head from 'next/head'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import { getToken, logout } from '../utils/auth'

// Layout Components
import DashboardLayout from '../components/dashboard/DashboardLayout'

// Modern Views
import {
  OverviewView,
  TenantsView,
  UsersView,
  StatesView,
} from '../components/dashboard/views'

// Legacy Views (to be migrated)
import ReportersView from '../components/dashboard/ReportersView'
import CategoriesView from '../components/dashboard/CategoriesView'
import LanguagesView from '../components/dashboard/LanguagesView'
import DistrictsView from '../components/dashboard/DistrictsView'
import MandalsView from '../components/dashboard/MandalsView'
import AssemblyConstituenciesView from '../components/dashboard/AssemblyConstituenciesView'
import TenantIdCardSettingsView from '../components/dashboard/TenantIdCardSettingsView'
import RazorpaySettingsView from '../components/dashboard/RazorpaySettingsView'
import GlobalRazorpaySettingsView from '../components/dashboard/GlobalRazorpaySettingsView'
import RolesView from '../components/dashboard/RolesView'
import TenantDomainSettingsView from '../components/dashboard/TenantDomainSettingsView'
import ArticlesView from '../components/dashboard/ArticlesView'

// UI Components
import { Spinner } from '../components/ui'

/**
 * View mapping configuration
 * Maps route tabs to their corresponding view components
 */
const VIEW_COMPONENTS = {
  // Modern MVP Views
  overview: OverviewView,
  tenants: TenantsView,
  users: UsersView,
  states: StatesView,
  
  // Legacy Views (will be migrated progressively)
  reporters: ReportersView,
  categories: CategoriesView,
  languages: LanguagesView,
  districts: DistrictsView,
  mandals: MandalsView,
  assembly: AssemblyConstituenciesView,
  articles: ArticlesView,
  roles: RolesView,
  
  // Settings Views
  'tenant-idcard-settings': TenantIdCardSettingsView,
  'tenant-razorpay-settings': RazorpaySettingsView,
  'global-razorpay-settings': GlobalRazorpaySettingsView,
  'tenant-domain-settings': TenantDomainSettingsView,
}

/**
 * Allowed tabs for URL validation
 */
const ALLOWED_TABS = Object.keys(VIEW_COMPONENTS)

/**
 * Modern Dashboard Page Component
 * Uses MVP architecture with proper separation of concerns
 */
export default function ModernDashboard({ initialTab }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Get current tab from URL or props
  const currentTab = useMemo(() => {
    const queryTab = router.query?.tab
    const tab = queryTab || initialTab || 'overview'
    return ALLOWED_TABS.includes(tab) ? tab : 'overview'
  }, [router.query?.tab, initialTab])

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const tokenData = getToken()
        if (!tokenData?.token) {
          router.replace('/')
          return
        }
        setUser(tokenData.user || tokenData.data?.user || null)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.replace('/')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Handle logout
  const handleLogout = useCallback(() => {
    logout()
    router.push('/')
  }, [router])

  // Handle tab change
  const handleTabChange = useCallback((newTab) => {
    if (ALLOWED_TABS.includes(newTab)) {
      router.push(`/modern-dashboard/${newTab}`, undefined, { shallow: true })
    }
  }, [router])

  // Check if user is super admin
  const isSuperAdmin = useMemo(() => {
    return (user?.role || '').toUpperCase() === 'SUPER_ADMIN'
  }, [user])

  // Get the current view component
  const CurrentView = useMemo(() => {
    return VIEW_COMPONENTS[currentTab] || OverviewView
  }, [currentTab])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-slate-500 text-sm">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Non-admin user view
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-soft p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-slate-500 mb-6">
            You don&apos;t have permission to access the admin dashboard. Please contact your administrator.
          </p>
          <div className="flex flex-col gap-3">
            <div className="p-4 bg-slate-50 rounded-lg text-left">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Logged in as</p>
              <p className="text-sm font-medium text-slate-900">{user?.name || user?.email || 'Unknown User'}</p>
              <p className="text-xs text-slate-500 mt-0.5">{user?.role || 'No role assigned'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Main dashboard layout
  return (
    <>
      <Head>
        <title>{`${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)} | Kaburlu Admin`}</title>
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/modern-dashboard/${currentTab}`} />
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <DashboardLayout
        user={user}
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onLogout={handleLogout}
      >
        <CurrentView />
      </DashboardLayout>
    </>
  )
}

/**
 * Server-side props for URL validation and canonicalization
 */
export async function getServerSideProps(ctx) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const param = String(ctx.query?.tab || 'overview').trim().toLowerCase()

  // Validate tab
  if (!ALLOWED_TABS.includes(param)) {
    return {
      redirect: { destination: '/modern-dashboard', permanent: false }
    }
  }

  return {
    props: {
      initialTab: param,
    }
  }
}
