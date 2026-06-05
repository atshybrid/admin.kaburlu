/**
 * Modern Sidebar Component (MVP Pattern - View Layer)
 * Redesigned with better visuals and organization
 */

import Link from 'next/link'
import { useRouter } from 'next/router'
import { IconLogout, IconChevronDown } from '../ui/icons'
import { useState } from 'react'
import { getFilteredAdminNavigation, isNavHrefActive } from './dashboardNavConfig'

function NavGroup({ title, items, collapsed, onToggle }) {
  const router = useRouter()
  const isExpanded = !collapsed

  return (
    <div className="py-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2 text-[11px] font-semibold tracking-wider text-gray-400 uppercase hover:text-gray-600 transition-colors"
      >
        <span>{title}</span>
        <IconChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
      </button>
      {isExpanded && (
        <div className="mt-1 space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = isNavHrefActive(router.pathname, item.href)
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`
                  group flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium
                  transition-all duration-150
                  ${isActive
                    ? 'bg-gradient-to-r from-brand to-brand/90 text-white shadow-md shadow-brand/25'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ModernSidebar({ user, onLogout }) {
  const [collapsed, setCollapsed] = useState({
    main: false,
    epaper: false,
    location: false,
    tenants: false,
    journalist: false,
    political: false,
    settings: false,
  })

  const toggleSection = (section) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const filteredNavigation = getFilteredAdminNavigation(user)

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 h-screen bg-white border-r border-gray-200">
      {/* Logo & Brand */}
      <div className="h-16 px-5 flex items-center border-b border-gray-100">
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand/80 flex items-center justify-center text-white font-bold shadow-lg shadow-brand/30">
          <span className="text-lg">K</span>
        </div>
        <div className="ml-3">
          <div className="text-base font-bold text-gray-900">Kaburlu</div>
          <div className="text-[11px] text-gray-500 font-medium">Admin Dashboard</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        {filteredNavigation.main.length > 0 && (
          <NavGroup
            title="Main Menu"
            items={filteredNavigation.main}
            collapsed={collapsed.main}
            onToggle={() => toggleSection('main')}
          />
        )}
        {filteredNavigation.epaper.length > 0 && (
          <NavGroup
            title="ePaper (PDF)"
            items={filteredNavigation.epaper}
            collapsed={collapsed.epaper}
            onToggle={() => toggleSection('epaper')}
          />
        )}
        {filteredNavigation.location.length > 0 && (
          <NavGroup
            title="Locations"
            items={filteredNavigation.location}
            collapsed={collapsed.location}
            onToggle={() => toggleSection('location')}
          />
        )}
        {filteredNavigation.tenants.length > 0 && (
          <NavGroup
            title="Tenant Management"
            items={filteredNavigation.tenants}
            collapsed={collapsed.tenants}
            onToggle={() => toggleSection('tenants')}
          />
        )}
        {filteredNavigation.journalist.length > 0 && (
          <NavGroup
            title="Journalist Union"
            items={filteredNavigation.journalist}
            collapsed={collapsed.journalist}
            onToggle={() => toggleSection('journalist')}
          />
        )}
        {filteredNavigation.political.length > 0 && (
          <NavGroup
            title="India Political Parties"
            items={filteredNavigation.political}
            collapsed={collapsed.political}
            onToggle={() => toggleSection('political')}
          />
        )}
        {filteredNavigation.settings.length > 0 && (
          <NavGroup
            title="Settings"
            items={filteredNavigation.settings}
            collapsed={collapsed.settings}
            onToggle={() => toggleSection('settings')}
          />
        )}
      </nav>

      {/* User & Logout */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-gray-50">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand/20 to-brand/10 flex items-center justify-center">
            <span className="text-brand font-semibold">{(user?.name || 'A').charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Admin'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email || 'Super Admin'}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
        >
          <IconLogout className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
