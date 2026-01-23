/**
 * Create Article Page
 * /admin/articles/create route
 * Accessible to Super Admins, Tenant Admins, and Reporters
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getToken } from '../../../utils/auth'
import { hasArticleAccess } from '../../../utils/roleUtils'
import PostArticle from '../../../components/dashboard/PostArticle'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'

export default function CreateArticlePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  // Auth check
  useEffect(() => {
    const tokenData = getToken()
    if (!tokenData?.token) {
      router.replace('/')
      return
    }
    
    const userData = tokenData.user || tokenData.data?.user || {}
    
    // Check if user has article access
    if (!hasArticleAccess(userData)) {
      router.replace('/')
      return
    }
    
    setUser(userData)
    setLoading(false)
  }, [router])

  const handleSuccess = (article) => {
    // Redirect to articles list after successful creation
    setTimeout(() => {
      router.push('/admin/articles')
    }, 1500)
  }

  const handleCancel = () => {
    router.push('/admin/articles')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-slate-200 border-t-brand rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout title="Create Article">
      <PostArticle 
        user={user}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </DashboardLayout>
  )
}
