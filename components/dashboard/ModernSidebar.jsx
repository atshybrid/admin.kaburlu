/**
 * Modern Sidebar Component (MVP Pattern - View Layer)
 * Redesigned with better visuals and organization
 */

import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  IconHome,
  IconFileText,
  IconUsers,
  IconUser,
  IconFolder,
  IconGlobe,
  IconMapPin,
  IconBuilding,
  IconSettings,
  IconKey,
  IconCreditCard,
  IconShield,
  IconLogout,
  IconLayers,
  IconChevronDown,
  IconNewspaper
} from '../ui/icons'
import { useState } from 'react'

const navigation = {
  main: [
    { key: 'overview', href: '/admin', label: 'Overview', icon: IconHome, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN'] },
    { key: 'articles', href: '/admin/articles', label: 'All Articles', icon: IconFileText, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN', 'TENANT_ADMIN', 'TENANTADMIN', 'REPORTER', 'DESK_EDITOR', 'DESKEDITOR', 'NEWSDESK'] },
    { key: 'create-article', href: '/admin/articles/create', label: 'Create Article', icon: IconNewspaper, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN', 'TENANT_ADMIN', 'TENANTADMIN', 'REPORTER', 'DESK_EDITOR', 'DESKEDITOR', 'NEWSDESK'] },
    { key: 'users', href: '/admin/users', label: 'Users', icon: IconUsers, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN'] },
    { key: 'desk-editors', href: '/admin/desk-editors', label: 'Desk Editor Analytics', icon: IconUsers, roles: ['SUPER_ADMIN', 'SUPERADMIN'] },
    { key: 'categories', href: '/admin/categories', label: 'Categories', icon: IconFolder, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN'] },
    { key: 'languages', href: '/admin/languages', label: 'Languages', icon: IconGlobe, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN'] },
    { key: 'roles', href: '/admin/roles', label: 'Roles', icon: IconShield, roles: ['SUPER_ADMIN', 'SUPERADMIN'] },
    { key: 'profile', href: '/admin/profile', label: 'My Profile', icon: IconUser, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN', 'TENANT_ADMIN', 'TENANTADMIN', 'REPORTER', 'DESK_EDITOR', 'DESKEDITOR', 'NEWSDESK'] },
  ],
  epaper: [
    { key: 'epaper-overview', href: '/admin/epaper', label: 'ePaper Overview', icon: IconNewspaper, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'DESK_EDITOR', 'DESKEDITOR'] },
    { key: 'epaper-design', href: '/admin/epaper/design', label: 'Epaper Design', icon: IconLayers, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'DESK_EDITOR', 'DESKEDITOR'] },
    { key: 'epaper-editions', href: '/admin/epaper/editions', label: 'Editions', icon: IconLayers, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'DESK_EDITOR', 'DESKEDITOR'] },
    { key: 'epaper-upload', href: '/admin/epaper/upload', label: 'Upload Issues', icon: IconFileText, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'DESK_EDITOR', 'DESKEDITOR'] },
    { key: 'epaper-issues', href: '/admin/epaper/issues', label: 'Issues', icon: IconFolder, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'DESK_EDITOR', 'DESKEDITOR'] },
    { key: 'epaper-training', href: '/admin/epaper/training', label: 'ML Training Data', icon: IconLayers, roles: ['SUPER_ADMIN', 'SUPERADMIN'] },
  ],
  location: [
    { key: 'states', href: '/admin/locations/states', label: 'States', icon: IconMapPin, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN'] },
    { key: 'districts', href: '/admin/locations/districts', label: 'Districts', icon: IconMapPin, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN'] },
    { key: 'assembly', href: '/admin/locations/constituencies', label: 'Assembly Constituencies', icon: IconMapPin, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN'] },
    { key: 'mandals', href: '/admin/locations/mandals', label: 'Mandals', icon: IconMapPin, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN'] },
  ],
  tenants: [
    { key: 'tenants', href: '/admin/tenants', label: 'All Tenants', icon: IconBuilding, roles: ['SUPER_ADMIN', 'SUPERADMIN'] },
  ],
  journalist: [
    { key: 'journalist-union', href: '/admin/journalist-union', label: 'Journalist Union', icon: IconNewspaper, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN'] },
  ],
  settings: [
    { key: 'global-razorpay', href: '/admin/settings/razorpay', label: 'Global Razorpay', icon: IconCreditCard, roles: ['SUPER_ADMIN', 'SUPERADMIN'] },
  ]
}

function normalizeRole(user) {
  const role = user?.role || user?.roleName || user?.userRole || user?.role?.name || ''
  const roleName = typeof role === 'string' ? role : (role?.name || '')
  return String(roleName).toUpperCase().replace(/[_\s-]/g, '')
}

function hasAccess(item, userRole) {
  if (!item.roles || item.roles.length === 0) return true
  const normalizedRole = normalizeRole({ role: userRole })
  return item.roles.some(role => role.replace(/[_\s-]/g, '').toUpperCase() === normalizedRole)
}

function NavGroup({ title, items, currentTab, collapsed, onToggle }) {
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
            const isActive = currentTab === item.key
            return (
              <Link key={item.key} href={item.href} legacyBehavior>
                <a
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
                </a>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ModernSidebar({ user, onLogout, currentTab = 'overview' }) {
  const [collapsed, setCollapsed] = useState({
    main: false,
    epaper: false,
    location: false,
    tenants: false,
    settings: false
  })

  const toggleSection = (section) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Filter navigation based on user role
  const userRole = normalizeRole(user)
  const filteredNavigation = {
    main: navigation.main.filter(item => hasAccess(item, userRole)),
    epaper: navigation.epaper.filter(item => hasAccess(item, userRole)),
    location: navigation.location.filter(item => hasAccess(item, userRole)),
    tenants: navigation.tenants.filter(item => hasAccess(item, userRole)),
    journalist: navigation.journalist.filter(item => hasAccess(item, userRole)),
    settings: navigation.settings.filter(item => hasAccess(item, userRole))
  }

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
            currentTab={currentTab}
            collapsed={collapsed.main}
            onToggle={() => toggleSection('main')}
          />
        )}
        {filteredNavigation.epaper.length > 0 && (
          <NavGroup
            title="ePaper (PDF)"
            items={filteredNavigation.epaper}
            currentTab={currentTab}
            collapsed={collapsed.epaper}
            onToggle={() => toggleSection('epaper')}
          />
        )}
        {filteredNavigation.location.length > 0 && (
          <NavGroup
            title="Locations"
            items={filteredNavigation.location}
            currentTab={currentTab}
            collapsed={collapsed.location}
            onToggle={() => toggleSection('location')}
          />
        )}
        {filteredNavigation.tenants.length > 0 && (
          <NavGroup
            title="Tenant Management"
            items={filteredNavigation.tenants}
            currentTab={currentTab}
            collapsed={collapsed.tenants}
            onToggle={() => toggleSection('tenants')}
          />
        )}
        {filteredNavigation.journalist.length > 0 && (
          <NavGroup
            title="Journalist Union"
            items={filteredNavigation.journalist}
            currentTab={currentTab}
            collapsed={collapsed.journalist}
            onToggle={() => toggleSection('journalist')}
          />
        )}
        {filteredNavigation.settings.length > 0 && (
          <NavGroup
            title="Settings"
            items={filteredNavigation.settings}
            currentTab={currentTab}
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
