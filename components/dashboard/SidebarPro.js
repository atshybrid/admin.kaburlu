/**
 * Modern Sidebar Component
 * Collapsible sidebar with better visual hierarchy and navigation groups
 */

import Link from 'next/link'
import { useState } from 'react'
import { 
  IconMenu, IconUsers, IconFolder, IconLang, IconArticles, 
  IconGeo, IconTenant, IconSettings, IconKey 
} from '../ui/Icons'

const navGroups = [
  {
    title: 'Main',
    items: [
      { key: 'overview', href: '/dashboard', label: 'Overview', icon: IconMenu },
      { key: 'articles', href: '/dashboard/articles', label: 'Articles', icon: IconArticles },
      { key: 'reporters', href: '/dashboard/reporters', label: 'Reporters', icon: IconUsers },
      { key: 'categories', href: '/dashboard/categories', label: 'Categories', icon: IconFolder },
      { key: 'languages', href: '/dashboard/languages', label: 'Languages', icon: IconLang },
      { key: 'users', href: '/dashboard/users', label: 'Users', icon: IconUsers },
    ]
  },
  {
    title: 'Location',
    items: [
      { key: 'states', href: '/dashboard/states', label: 'States', icon: IconGeo },
      { key: 'districts', href: '/dashboard/districts', label: 'Districts', icon: IconGeo },
      { key: 'assembly', href: '/dashboard/assembly', label: 'Assembly Constituency', icon: IconGeo },
      { key: 'mandals', href: '/dashboard/mandals', label: 'Mandals', icon: IconGeo },
    ]
  },
  {
    title: 'Tenants',
    items: [
      { key: 'tenants', href: '/dashboard/tenants', label: 'Tenants', icon: IconTenant },
      { key: 'tenant-idcard-settings', href: '/dashboard/tenant-idcard-settings', label: 'ID Card Settings', icon: IconKey },
      { key: 'tenant-razorpay-settings', href: '/dashboard/tenant-razorpay-settings', label: 'Razorpay Settings', icon: IconKey },
      { key: 'tenant-domain-settings', href: '/dashboard/tenant-domain-settings', label: 'Domain Settings', icon: IconSettings },
    ]
  },
  {
    title: 'Settings',
    items: [
      { key: 'roles', href: '/dashboard/roles', label: 'Roles & Permissions', icon: IconUsers },
      { key: 'global-razorpay-settings', href: '/dashboard/global-razorpay-settings', label: 'Global Razorpay', icon: IconSettings },
    ]
  }
]

export default function SidebarPro({ user, onLogout, currentTab = 'overview', collapsed = false, onToggle }) {
  const [hoveredGroup, setHoveredGroup] = useState(null)

  return (
    <aside 
      className={`hidden md:flex md:flex-col h-screen bg-white border-r border-slate-200 transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-60'
      }`}
    >
      {/* Logo Header */}
      <div className="h-16 px-4 flex items-center border-b border-slate-100 shrink-0">
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white font-bold shadow-sm">
          <span className="text-lg">K</span>
        </div>
        {!collapsed && (
          <div className="ml-3 min-w-0">
            <div className="text-sm font-semibold text-slate-800 truncate">Kaburlu Admin</div>
            <div className="text-[11px] text-slate-500 truncate">{user?.name || 'Super Admin'}</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navGroups.map((group, gi) => (
          <div key={group.title} className={gi > 0 ? 'mt-5' : ''}>
            {!collapsed && (
              <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                {group.title}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = currentTab === item.key
                const Icon = item.icon
                return (
                  <Link key={item.key} href={item.href} legacyBehavior>
                    <a
                      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-brand-50 text-brand'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-brand rounded-r-full" />
                      )}
                      {Icon && (
                        <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-brand' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      )}
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </a>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 p-3 shrink-0">
        {collapsed ? (
          <button
            onClick={onLogout}
            className="w-full h-10 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            title="Logout"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onLogout}
            className="w-full px-4 py-2.5 flex items-center justify-center gap-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        )}
      </div>

      {/* Collapse Toggle */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}
    </aside>
  )
}

// Mobile Sidebar
export function MobileSidebarPro({ open, onClose, user, onLogout, currentTab }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl flex flex-col animate-slide-in-left">
        {/* Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white font-bold">
              K
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Kaburlu Admin</div>
              <div className="text-[11px] text-slate-500">{user?.name || 'Super Admin'}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <svg className="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navGroups.map((group, gi) => (
            <div key={group.title} className={gi > 0 ? 'mt-5' : ''}>
              <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = currentTab === item.key
                  const Icon = item.icon
                  return (
                    <Link key={item.key} href={item.href} legacyBehavior>
                      <a
                        onClick={onClose}
                        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-brand-50 text-brand'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-brand rounded-r-full" />
                        )}
                        {Icon && (
                          <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-brand' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        )}
                        <span className="truncate">{item.label}</span>
                      </a>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-100 p-3">
          <button
            onClick={onLogout}
            className="w-full px-4 py-2.5 flex items-center justify-center gap-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </div>
  )
}
