import { useEffect, useMemo, useState } from 'react'
import { getToken, logout } from '../utils/auth'
import { useRouter } from 'next/router'
import Sidebar from '../components/dashboard/Sidebar'
import MobileSidebar from '../components/dashboard/MobileSidebar'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import StatCard from '../components/dashboard/StatCard'
import RecentTable from '../components/dashboard/RecentTable'
import TenantsView from '../components/dashboard/TenantsView'
import ReportersView from '../components/dashboard/ReportersView'
import UsersView from '../components/dashboard/UsersView'
import CategoriesView from '../components/dashboard/CategoriesView'
import LanguagesView from '../components/dashboard/LanguagesView'
import StatesView from '../components/dashboard/StatesView'
import DistrictsView from '../components/dashboard/DistrictsView'
import MandalsView from '../components/dashboard/MandalsView'
import AssemblyConstituenciesView from '../components/dashboard/AssemblyConstituenciesView'
import TenantIdCardSettingsView from '../components/dashboard/TenantIdCardSettingsView'
import RazorpaySettingsView from '../components/dashboard/RazorpaySettingsView'
import GlobalRazorpaySettingsView from '../components/dashboard/GlobalRazorpaySettingsView'
import RolesView from '../components/dashboard/RolesView'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

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
  const tab = (typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('tab')) : (router.query?.tab)) || 'overview'

  const userDisplay = useMemo(() => {
    try {
      return JSON.stringify(user, (key, value) => {
        if (!key) return value
        const lower = key.toLowerCase()
        if (lower === 'id' || lower.endsWith('id')) return undefined
        return value
      }, 2)
    } catch {
      return ''
    }
  }, [user])

  const stats = useMemo(() => ([
    { title: 'Total Articles', value: '12,348', delta: '+4.2%', description: 'All published & scheduled items', icon: (<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h10"/></svg>) },
    { title: 'Active Reporters', value: '482', delta: '+1.1%', description: 'Reporters active in last 7d', icon: (<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 14a4 4 0 10-8 0v4h8v-4zM12 10a3 3 0 100-6 3 3 0 000 6z"/></svg>) },
    { title: 'Pending Reviews', value: '37', delta: '-12%', description: 'Awaiting editorial action', icon: (<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/></svg>) },
    { title: 'Avg. Read Time', value: '3m 42s', delta: '+6%', description: 'Per session average', icon: (<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>) },
    { title: 'Bounce Rate', value: '46%', delta: '-2.1%', description: 'One-page sessions', icon: (<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18"/><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 15l4-4 4 4 4-4"/></svg>) },
    { title: 'New Signups', value: '129', delta: '+9.4%', description: 'Last 7d user registrations', icon: (<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 10a3 3 0 100-6 3 3 0 000 6z"/><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 20c0-3 3-5 6-5s6 2 6 5"/></svg>) }
  ]), [])

  const recent = useMemo(() => ([
    { title: 'Telangana budget highlights 2025', author: 'Ravi', category: 'Politics', status: 'Published', views: 12450 },
    { title: 'Hyderabad metro expansion plans', author: 'Anita', category: 'City', status: 'Review', views: 7841 },
    { title: 'Monsoon rains break records', author: 'Saleem', category: 'Weather', status: 'Published', views: 5322 },
    { title: 'Local sports league finals', author: 'Manoj', category: 'Sports', status: 'Draft', views: 0 },
  ]), [])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <span className="h-5 w-5 border-2 border-gray-300 border-t-brand rounded-full animate-spin mr-2" /> Checking authentication...
      </div>
    )
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Dashboard</h2>
            <button onClick={() => { logout(); router.push('/') }} className="px-4 py-2 rounded bg-red-500 text-white">Logout</button>
          </div>
          <hr className="my-4" />
          <div>
            <h3 className="font-medium">User Info</h3>
            <pre className="mt-2 p-4 bg-gray-100 rounded">{userDisplay}</pre>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1400px] flex">
        <Sidebar user={user} onLogout={() => { logout(); router.push('/') }} currentTab={tab} />
        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
          <DashboardHeader user={user} onOpenNav={() => setMobileOpen(true)} />
          {tab === 'tenants' ? (
            <TenantsView />
          ) : tab === 'reporters' ? (
            <ReportersView />
          ) : tab === 'users' ? (
            <UsersView />
          ) : tab === 'categories' ? (
            <CategoriesView />
          ) : tab === 'languages' ? (
            <LanguagesView />
          ) : tab === 'states' ? (
            <StatesView />
          ) : tab === 'districts' ? (
            <DistrictsView />
          ) : tab === 'assembly' ? (
            <AssemblyConstituenciesView />
          ) : tab === 'mandals' ? (
            <MandalsView />
          ) : tab === 'tenant-idcard-settings' ? (
            <TenantIdCardSettingsView />
          ) : tab === 'tenant-razorpay-settings' ? (
            <RazorpaySettingsView />
          ) : tab === 'global-razorpay-settings' ? (
            <GlobalRazorpaySettingsView />
          ) : tab === 'roles' ? (
            <RolesView />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mt-2">
                {stats.map((s, i) => (
                  <StatCard key={i} {...s} />
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 mt-6">
                <div className="xl:col-span-2">
                  <RecentTable rows={recent} />
                </div>
                <div className="bg-white rounded-xl border shadow-sm p-4 md:p-5">
                  <div className="font-semibold mb-3">Activity</div>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 mt-1 rounded-full bg-brand" />
                      New story submitted by Anita for review
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 mt-1 rounded-full bg-green-500" />
                      Budget highlight article published
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 mt-1 rounded-full bg-yellow-500" />
                      3 articles pending editorial approval
                    </li>
                  </ul>
                  <div className="mt-6">
                    <button className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark">Create Article</button>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} onLogout={() => { logout(); router.push('/') }} />
    </div>
  )
}
