/**
 * Articles Management Page
 * /admin/articles route
 * Accessible to Super Admins, Tenant Admins, and Reporters
 * Uses role-based layouts for different user types
 */
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import ReporterLayout from '../../components/dashboard/ReporterLayout'
import ArticlesListView from '../../components/dashboard/ArticlesListView'
import { getToken } from '../../utils/auth'
import { isReporter } from '../../utils/roleUtils'

export default function ArticlesPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tokenData = getToken()
    if (tokenData?.user || tokenData?.data?.user) {
      const userData = tokenData.user || tokenData.data?.user
      setUser(userData)
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-3 border-slate-200 border-t-brand rounded-full animate-spin" />
      </div>
    )
  }

  // Use ReporterLayout for reporters, DashboardLayout for others
  const Layout = isReporter(user) ? ReporterLayout : DashboardLayout

  return (
    <Layout title="Articles" user={user}>
      <ArticlesListView />
    </Layout>
  )
}
