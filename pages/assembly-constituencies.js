import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getToken, logout } from '../utils/auth'
import AssemblyConstituenciesView from '../components/dashboard/AssemblyConstituenciesView'

export default function AssemblyConstituenciesPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [user, setUser] = useState(null)

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

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <span className="h-5 w-5 border-2 border-gray-300 border-t-brand rounded-full animate-spin mr-2" /> Checking authentication...
      </div>
    )
  }

  if (!user) {
    return null
  }

  const isSuperAdmin = (user?.role || '').toUpperCase() === 'SUPER_ADMIN'

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Assembly Constituencies</h2>
            <button onClick={() => { logout(); router.push('/') }} className="px-4 py-2 rounded bg-red-500 text-white">Logout</button>
          </div>
          <hr className="my-4" />
          <div className="text-sm text-gray-600">Only Super Admin can manage assembly constituencies.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Assembly Constituencies</h1>
          <button onClick={() => { logout(); router.push('/') }} className="px-3 py-2 rounded bg-red-500 text-white text-sm">Logout</button>
        </div>
        <AssemblyConstituenciesView />
      </div>
    </div>
  )
}
