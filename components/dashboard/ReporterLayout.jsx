/**
 * Reporter/Tenant Admin Layout Component
 * Simplified layout showing only article-related pages
 */

import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { logout } from '../../utils/auth'
import { 
  IconFileText, 
  IconPlus, 
  IconLogout,
  IconMenu,
  IconX
} from '../ui/icons'

const articleNavigation = [
  { key: 'all-articles', href: '/admin/articles', label: 'All Articles', icon: IconFileText },
  { key: 'create-article', href: '/admin/articles/create', label: 'Create Article', icon: IconPlus },
]

export default function ReporterLayout({ children, title = 'Articles', user }) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const currentPath = router.pathname

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between h-16 px-4 lg:px-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <IconX className="w-6 h-6" /> : <IconMenu className="w-6 h-6" />}
            </button>
            
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand/80 flex items-center justify-center text-white font-bold shadow-lg shadow-brand/30">
              <span className="text-lg">K</span>
            </div>
            <div>
              <div className="text-base font-bold text-slate-900">Kaburlu</div>
              <div className="text-[11px] text-slate-500 font-medium hidden sm:block">Article Management</div>
            </div>
          </div>

          {/* User & Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand/20 to-brand/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-brand">
                  {user?.fullName?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-slate-900">
                  {user?.fullName || user?.name || 'User'}
                </div>
                <div className="text-xs text-slate-500 capitalize">
                  {user?.role?.name || user?.roleName || 'Reporter'}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <IconLogout className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white">
            <nav className="p-4 space-y-1">
              {articleNavigation.map((item) => {
                const Icon = item.icon
                const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/')
                return (
                  <Link key={item.key} href={item.href} legacyBehavior>
                    <a
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-brand text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </a>
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 min-h-[calc(100vh-4rem)] bg-white border-r border-slate-200">
          <nav className="flex-1 p-4 space-y-1">
            <div className="px-4 py-2 mb-2">
              <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Article Menu
              </div>
            </div>
            {articleNavigation.map((item) => {
              const Icon = item.icon
              const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/')
              return (
                <Link key={item.key} href={item.href} legacyBehavior>
                  <a
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-brand to-brand-dark text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {item.label}
                  </a>
                </Link>
              )
            })}
          </nav>

          {/* User Info in Sidebar */}
          <div className="border-t border-slate-100 p-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand/20 to-brand/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-brand">
                  {user?.fullName?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 truncate">
                  {user?.fullName || user?.name || 'User'}
                </div>
                <div className="text-xs text-slate-500 capitalize truncate">
                  {user?.role?.name || user?.roleName || 'Reporter'}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}
