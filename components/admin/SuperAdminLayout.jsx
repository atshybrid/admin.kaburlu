/**
 * Super Admin Layout - Main dashboard layout for Super Admins
 * Clean separation: Global settings vs Tenant management
 */
import { useState, useEffect, createContext, useContext } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getToken, logout } from '../../utils/auth'

// Context for layout state
const LayoutContext = createContext({})
export const useLayout = () => useContext(LayoutContext)

// Navigation configuration - Clear hierarchy
const NAV_SECTIONS = [
  {
    id: 'platform',
    label: 'Platform',
    items: [
      { id: 'overview', label: 'Overview', href: '/admin', icon: 'home' },
      { id: 'languages', label: 'Languages', href: '/admin/languages', icon: 'globe' },
      { id: 'categories', label: 'Categories', href: '/admin/categories', icon: 'folder' },
      { id: 'roles', label: 'Roles', href: '/admin/roles', icon: 'shield' },
    ]
  },
  {
    id: 'locations',
    label: 'Locations',
    items: [
      { id: 'states', label: 'States', href: '/admin/states', icon: 'map' },
      { id: 'districts', label: 'Districts', href: '/admin/districts', icon: 'map-pin' },
      { id: 'mandals', label: 'Mandals', href: '/admin/mandals', icon: 'navigation' },
      { id: 'constituencies', label: 'Constituencies', href: '/admin/constituencies', icon: 'flag' },
    ]
  },
  {
    id: 'tenants',
    label: 'Tenants',
    items: [
      { id: 'all-tenants', label: 'All Tenants', href: '/admin/tenants', icon: 'building' },
    ]
  },
  {
    id: 'users',
    label: 'Users',
    items: [
      { id: 'platform-users', label: 'Platform Users', href: '/admin/users', icon: 'users' },
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    items: [
      { id: 'razorpay', label: 'Payment Gateway', href: '/admin/settings/razorpay', icon: 'credit-card' },
    ]
  },
  {
    id: 'epaper',
    label: 'ePaper (PDF)',
    items: [
      { id: 'epaper-upload', label: 'Upload Issue', href: '/admin/epaper/upload', icon: 'file-text' },
      { id: 'epaper-issues', label: 'Find Issues', href: '/admin/epaper/issues', icon: 'search' },
      { id: 'epaper-editions', label: 'Manage Editions', href: '/admin/epaper/editions-manage', icon: 'layers' },
      { id: 'epaper-config', label: 'Public Config', href: '/admin/epaper/config', icon: 'settings' },
    ]
  },
]

// Icons component
function Icon({ name, className = 'w-5 h-5' }) {
  const icons = {
    'home': <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    'globe': <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />,
    'folder': <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />,
    'shield': <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
    'map': <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />,
    'map-pin': <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />,
    'navigation': <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />,
    'flag': <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />,
    'building': <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
    'users': <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
    'credit-card': <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
    'menu': <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />,
    'x': <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
    'chevron-down': <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />,
    'chevron-right': <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />,
    'logout': <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
    'bell': <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
    'search': <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
    'plus': <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />,
    'file-text': <><path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" /><path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 17h6" /></>,
    'settings': <><path strokeLinecap="round" strokeLinejoin="round" d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a7.97 7.97 0 00.1-1 7.97 7.97 0 00-.1-1l2.1-1.6-2-3.4-2.5 1a7.9 7.9 0 00-1.7-1l-.4-2.7H9l-.4 2.7a7.9 7.9 0 00-1.7 1l-2.5-1-2 3.4L4.6 13a7.97 7.97 0 00-.1 1c0 .34.03.67.1 1L2.5 16.6l2 3.4 2.5-1a7.9 7.9 0 001.7 1l.4 2.7h6l.4-2.7a7.9 7.9 0 001.7-1l2.5 1 2-3.4L19.4 15z" /></>,
    'layers': <><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 5-9 5-9-5 9-5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9 5 9-5" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 16l9 5 9-5" /></>,
  }
  
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {icons[name] || icons['home']}
    </svg>
  )
}

// Sidebar component
function Sidebar({ collapsed, onToggle }) {
  const router = useRouter()
  const [expandedSections, setExpandedSections] = useState(['platform', 'tenants'])
  
  const toggleSection = (id) => {
    setExpandedSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }
  
  const isActive = (href) => {
    if (href === '/admin') return router.pathname === '/admin'
    return router.pathname.startsWith(href)
  }
  
  return (
    <aside className={`hidden lg:flex flex-col bg-slate-900 text-white transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center font-bold text-white">
              K
            </div>
            <span className="font-semibold text-lg">Kaburlu</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center font-bold text-white mx-auto">
            K
          </div>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV_SECTIONS.map((section) => (
          <div key={section.id} className="mb-2">
            {!collapsed && (
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-300"
              >
                {section.label}
                <Icon 
                  name={expandedSections.includes(section.id) ? 'chevron-down' : 'chevron-right'} 
                  className="w-4 h-4" 
                />
              </button>
            )}
            
            {(collapsed || expandedSections.includes(section.id)) && (
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'bg-brand text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      } ${collapsed ? 'justify-center' : ''}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon name={item.icon} className="w-5 h-5 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>
      
      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="h-12 border-t border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <Icon name={collapsed ? 'chevron-right' : 'chevron-down'} className="w-5 h-5 rotate-90" />
      </button>
    </aside>
  )
}

// Header component
function Header({ user, onMenuClick, onLogout }) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
      {/* Left - Mobile menu & Search */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
        >
          <Icon name="menu" className="w-5 h-5 text-slate-600" />
        </button>
        
        <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2">
          <Icon name="search" className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm outline-none w-48 lg:w-64"
          />
        </div>
      </div>
      
      {/* Right - Actions & User */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-slate-100 relative">
          <Icon name="bell" className="w-5 h-5 text-slate-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        
        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <div className="w-8 h-8 bg-brand/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-brand">
                {(user?.name || user?.mobileNumber || 'U')[0].toUpperCase()}
              </span>
            </div>
            <Icon name="chevron-down" className="w-4 h-4 text-slate-400" />
          </button>
          
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border shadow-lg z-50 py-2">
                <div className="px-4 py-3 border-b">
                  <div className="text-sm font-medium text-slate-900">{user?.name || 'Super Admin'}</div>
                  <div className="text-xs text-slate-500">{user?.mobileNumber || user?.email}</div>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <Icon name="logout" className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

// Mobile Sidebar
function MobileSidebar({ open, onClose }) {
  const router = useRouter()
  
  const isActive = (href) => {
    if (href === '/admin') return router.pathname === '/admin'
    return router.pathname.startsWith(href)
  }
  
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="absolute left-0 top-0 h-full w-72 bg-slate-900 text-white overflow-y-auto">
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center font-bold">K</div>
            <span className="font-semibold">Kaburlu Admin</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="py-4 px-3 space-y-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.id}>
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {section.label}
              </div>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'bg-brand text-white'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Icon name={item.icon} className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </div>
  )
}

// Main Layout Export
export default function SuperAdminLayout({ children, title }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

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

  // Flexible role check - handles superadmin, super_admin, SUPERADMIN, admin, etc.
  const isSuperAdmin = (() => {
    if (!user) return false
    const role = user.role || user.roleName || user.userRole || user.role?.name || ''
    const roleStr = (typeof role === 'string' ? role : role?.name || '').toUpperCase().replace(/[_\s-]/g, '')
    return (
      roleStr === 'SUPERADMIN' ||
      roleStr === 'ADMIN' ||
      roleStr.includes('SUPERADMIN') ||
      roleStr.includes('ADMIN') ||
      roleStr.includes('DESKEDITOR')
    )
  })()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-slate-200 border-t-brand rounded-full animate-spin" />
          <span className="text-sm text-slate-500">Loading...</span>
        </div>
      </div>
    )
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="x" className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-sm text-slate-500 mb-6">
            You don&apos;t have permission to access this dashboard.
          </p>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    )
  }

  return (
    <LayoutContext.Provider value={{ user, sidebarCollapsed }}>
      <div className="min-h-screen bg-slate-50">
        <Head>
          <title>{title ? `${title} | Kaburlu Admin` : 'Kaburlu Admin Dashboard'}</title>
          <meta name="robots" content="noindex,nofollow" />
        </Head>

        <div className="flex h-screen overflow-hidden">
          <Sidebar 
            collapsed={sidebarCollapsed} 
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
          />

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header 
              user={user} 
              onMenuClick={() => setMobileOpen(true)} 
              onLogout={handleLogout}
            />

            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>

        <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      </div>
    </LayoutContext.Provider>
  )
}
