import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Sidebar from '../../../components/dashboard/Sidebar'
import MobileSidebar from '../../../components/dashboard/MobileSidebar'
import DashboardHeader from '../../../components/dashboard/DashboardHeader'
import TenantCommandCenter from '../../../components/dashboard/TenantCommandCenter'
import { getToken, logout } from '../../../utils/auth'

export default function TenantDetailPage() {
  const router = useRouter()
  const { id } = router.query

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

  // Flexible role check - handles superadmin, super_admin, SUPERADMIN, admin, etc.
  const isSuperAdmin = (() => {
    if (!user) return false
    const role = user.role || user.roleName || user.userRole || user.role?.name || ''
    const roleStr = (typeof role === 'string' ? role : role?.name || '').toUpperCase().replace(/[_\s-]/g, '')
    return roleStr === 'SUPERADMIN' || roleStr === 'ADMIN' || roleStr.includes('SUPERADMIN') || roleStr.includes('ADMIN')
  })()

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
          <div className="text-sm text-gray-700">Access denied.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Head>
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/tenants/${id || ''}`} />
        <meta name="robots" content="noindex,nofollow" />
        <title>Tenant · Dashboard</title>
      </Head>
      <div className="mx-auto max-w-[1400px] flex">
        <Sidebar user={user} onLogout={() => { logout(); router.push('/') }} currentTab="tenants" />
        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
          <DashboardHeader user={user} onOpenNav={() => setMobileOpen(true)} />
          <TenantCommandCenter tenantId={id} />
        </main>
      </div>
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} onLogout={() => { logout(); router.push('/') }} />
    </div>
  )
}
