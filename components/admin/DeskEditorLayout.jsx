/**
 * Desk Editor Layout - Focused ePaper dashboard for DESK_EDITOR role
 * Clean, modern UI optimized for ePaper workflow
 */
import { useState, useEffect, createContext, useContext } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getToken, logout } from '../../utils/auth'
import useSessionExpiry from '../../hooks/useSessionExpiry'
import MpinReLoginModal from '../auth/MpinReLoginModal'

// Context for layout state
const LayoutContext = createContext({})
export const useLayout = () => useContext(LayoutContext)

// ePaper focused navigation for DESK_EDITOR
const NAV_ITEMS = [
  { 
    id: 'editions', 
    label: 'Editions', 
    href: '/admin/epaper/editions', 
    icon: 'newspaper',
    description: 'Manage ePaper editions'
  },
  { 
    id: 'upload', 
    label: 'Upload PDF', 
    href: '/admin/epaper/upload', 
    icon: 'upload',
    description: 'Upload new issues'
  },
]

// Modern Icons
function Icon({ name, className = 'w-5 h-5' }) {
  const icons = {
    'newspaper': (
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    ),
    'upload': (
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    ),
    'menu': <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />,
    'x': <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
    'logout': <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
    'bell': <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
    'chevron-down': <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />,
    'user': <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
    'calendar': <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    'file': <><path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" /><path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" /></>,
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      {icons[name] || icons['file']}
    </svg>
  )
}

// Sidebar for Desk Editor - Clean focused design
function Sidebar({ collapsed, onToggle, user }) {
  const router = useRouter()

  const isActive = (href) => router.pathname === href || router.pathname.startsWith(href + '/')

  return (
    <aside className={`hidden lg:flex flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'}`}>
      {/* Logo & Brand */}
      <div className="h-20 px-5 flex items-center border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand to-brand/80 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-brand/20">
            K
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-lg tracking-tight">Kaburlu</h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">ePaper Desk</p>
            </div>
          )}
        </div>
      </div>

      {/* User Info Card */}
      {!collapsed && (
        <div className="mx-4 mt-5 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
              {(user?.name || user?.mobileNumber || 'D')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'Desk Editor'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.mobileNumber || user?.email || 'Desk Editor'}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Active Session
            </span>
          </div>
        </div>
      )}

      {/* Navigation Label */}
      {!collapsed && (
        <div className="px-5 mt-8 mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">ePaper Management</p>
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 ${collapsed ? 'px-2 mt-6' : 'px-3'} space-y-2`}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          return (
            <Link key={item.id} href={item.href}>
              <div
                className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 cursor-pointer
                  ${active 
                    ? 'bg-gradient-to-r from-brand to-brand/90 text-white shadow-lg shadow-brand/25' 
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  } ${collapsed ? 'justify-center px-3' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                {/* Active indicator */}
                {active && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                )}
                
                <Icon 
                  name={item.icon} 
                  className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${active ? '' : 'group-hover:scale-110'}`} 
                />
                
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.label}</p>
                    {!active && (
                      <p className="text-[11px] text-slate-500 group-hover:text-slate-400 mt-0.5 truncate">
                        {item.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Quick Stats */}
      {!collapsed && (
        <div className="mx-4 mb-4 p-4 bg-gradient-to-br from-brand/20 to-transparent rounded-xl border border-brand/20">
          <div className="flex items-center gap-2 text-brand">
            <Icon name="calendar" className="w-4 h-4" />
            <span className="text-xs font-medium">Today&apos;s Date</span>
          </div>
          <p className="mt-1 text-lg font-semibold text-white">
            {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="h-12 mx-3 mb-3 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all"
      >
        <svg className={`w-5 h-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>
    </aside>
  )
}

// Modern Header
function Header({ user, onMenuClick, onLogout }) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const router = useRouter()

  // Get current page title
  const getPageTitle = () => {
    if (router.pathname.includes('upload')) return 'Upload PDF'
    if (router.pathname.includes('editions')) return 'Editions'
    return 'ePaper Dashboard'
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* Left - Mobile menu & Breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Icon name="menu" className="w-5 h-5 text-slate-600" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-sm">
          <span className="text-slate-400">ePaper</span>
          <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-medium text-slate-700">{getPageTitle()}</span>
        </div>
      </div>

      {/* Right - Quick Actions & User */}
      <div className="flex items-center gap-2">
        {/* Quick Upload Button */}
        <Link href="/admin/epaper/upload">
          <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand/90 transition-colors shadow-sm">
            <Icon name="upload" className="w-4 h-4" />
            Upload PDF
          </button>
        </Link>

        {/* Divider */}
        <div className="hidden sm:block w-px h-8 bg-slate-200 mx-2" />

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-sm font-semibold text-white">
                {(user?.name || user?.mobileNumber || 'D')[0].toUpperCase()}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-slate-700">{user?.name || 'Desk Editor'}</p>
              <p className="text-xs text-slate-500">Desk Editor</p>
            </div>
            <Icon name="chevron-down" className="w-4 h-4 text-slate-400" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                {/* User Info */}
                <div className="px-4 py-4 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {(user?.name || user?.mobileNumber || 'D')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{user?.name || 'Desk Editor'}</p>
                      <p className="text-xs text-slate-500">{user?.mobileNumber || user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-full uppercase">
                        Desk Editor
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-2">
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Icon name="logout" className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

// Mobile Sidebar
function MobileSidebar({ open, onClose, user }) {
  const router = useRouter()

  const isActive = (href) => router.pathname === href || router.pathname.startsWith(href + '/')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute left-0 top-0 h-full w-80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white overflow-y-auto">
        {/* Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand to-brand/80 rounded-xl flex items-center justify-center font-bold text-lg">
              K
            </div>
            <div>
              <h1 className="font-bold text-lg">Kaburlu</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">ePaper Desk</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="mx-4 mt-5 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
              {(user?.name || user?.mobileNumber || 'D')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">{user?.name || 'Desk Editor'}</p>
              <p className="text-xs text-slate-400">{user?.mobileNumber || user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-3 mt-6">
          <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            ePaper Management
          </p>
          <nav className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href)
              return (
                <Link key={item.id} href={item.href} onClick={onClose}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all
                      ${active 
                        ? 'bg-gradient-to-r from-brand to-brand/90 text-white shadow-lg' 
                        : 'text-slate-300 hover:bg-white/5'
                      }`}
                  >
                    <Icon name={item.icon} className="w-5 h-5" />
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Today's Date Card */}
        <div className="mx-4 mt-8 p-4 bg-gradient-to-br from-brand/20 to-transparent rounded-xl border border-brand/20">
          <div className="flex items-center gap-2 text-brand">
            <Icon name="calendar" className="w-4 h-4" />
            <span className="text-xs font-medium">Today&apos;s Date</span>
          </div>
          <p className="mt-1 text-lg font-semibold text-white">
            {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </aside>
    </div>
  )
}

// Main Layout Export
export default function DeskEditorLayout({ children, title }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Session expiry handling
  const { showMpinModal, handleMpinSuccess, handleModalClose } = useSessionExpiry()

  useEffect(() => {
    try {
      const tokenData = getToken()
      if (!tokenData || !tokenData.token) {
        router.replace('/')
      } else {
        setUser(tokenData.user || tokenData.data?.user || null)

        // Migration helper: ensure server has httpOnly cookie for BFF routes
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

  // Role check - only DESK_EDITOR uses this layout
  const hasAccess = (() => {
    if (!user) return false
    const role = user.role || user.roleName || user.userRole || user.role?.name || ''
    const roleStr = (typeof role === 'string' ? role : role?.name || '').toUpperCase().replace(/[_\s-]/g, '')
    const allowedRoles = ['SUPERADMIN', 'ADMIN', 'DESKEDITOR', 'NEWSDESK']
    return allowedRoles.some(r => roleStr === r || roleStr.includes(r))
  })()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-200 rounded-full" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">Loading Dashboard</p>
            <p className="text-xs text-slate-500 mt-1">Please wait...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-500 mb-8">
            You don&apos;t have permission to access the ePaper dashboard. Please contact your administrator.
          </p>
          <button
            onClick={handleLogout}
            className="w-full px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/25"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <LayoutContext.Provider value={{ user, sidebarCollapsed }}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Head>
          <title>{title ? `${title} | Kaburlu ePaper` : 'Kaburlu ePaper Dashboard'}</title>
          <meta name="robots" content="noindex,nofollow" />
        </Head>

        <div className="flex h-screen overflow-hidden">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            user={user}
          />

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header
              user={user}
              onMenuClick={() => setMobileOpen(true)}
              onLogout={handleLogout}
            />

            <main className="flex-1 overflow-y-auto">
              <div className="p-4 lg:p-6">
                {children}
              </div>
            </main>
          </div>
        </div>

        <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} user={user} />

        {/* Session Expiry MPIN Modal */}
        <MpinReLoginModal
          isOpen={showMpinModal}
          onClose={handleModalClose}
          onSuccess={handleMpinSuccess}
        />
      </div>
    </LayoutContext.Provider>
  )
}
