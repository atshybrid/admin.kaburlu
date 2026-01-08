/**
 * Mobile Sidebar Component (MVP Pattern - View Layer)
 * Slide-over navigation for mobile devices
 */

import Link from 'next/link'
import { useEffect } from 'react'
import {
  IconX,
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
  IconLogout
} from '../ui/Icons'

const navigation = [
  { section: 'Main', items: [
    { key: 'overview', href: '/dashboard', label: 'Overview', icon: IconHome },
    { key: 'articles', href: '/dashboard/articles', label: 'Articles', icon: IconFileText },
    { key: 'reporters', href: '/dashboard/reporters', label: 'Reporters', icon: IconUser },
    { key: 'categories', href: '/dashboard/categories', label: 'Categories', icon: IconFolder },
    { key: 'languages', href: '/dashboard/languages', label: 'Languages', icon: IconGlobe },
    { key: 'users', href: '/dashboard/users', label: 'Users', icon: IconUsers },
  ]},
  { section: 'Locations', items: [
    { key: 'states', href: '/dashboard/states', label: 'States', icon: IconMapPin },
    { key: 'districts', href: '/dashboard/districts', label: 'Districts', icon: IconMapPin },
    { key: 'assembly', href: '/dashboard/assembly', label: 'Assembly', icon: IconMapPin },
    { key: 'mandals', href: '/dashboard/mandals', label: 'Mandals', icon: IconMapPin },
  ]},
  { section: 'Tenants', items: [
    { key: 'tenants', href: '/dashboard/tenants', label: 'All Tenants', icon: IconBuilding },
    { key: 'tenant-idcard-settings', href: '/dashboard/tenant-idcard-settings', label: 'ID Card Settings', icon: IconKey },
    { key: 'tenant-razorpay-settings', href: '/dashboard/tenant-razorpay-settings', label: 'Razorpay', icon: IconCreditCard },
    { key: 'tenant-domain-settings', href: '/dashboard/tenant-domain-settings', label: 'Domains', icon: IconGlobe },
  ]},
  { section: 'Settings', items: [
    { key: 'roles', href: '/dashboard/roles', label: 'Roles', icon: IconShield },
    { key: 'global-razorpay-settings', href: '/dashboard/global-razorpay-settings', label: 'Global Settings', icon: IconSettings },
  ]}
]

export default function ModernMobileSidebar({ isOpen, onClose, user, onLogout, currentTab }) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl">
        {/* Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand/80 flex items-center justify-center text-white font-bold shadow-lg">
              K
            </div>
            <div>
              <div className="text-base font-bold text-gray-900">Kaburlu</div>
              <div className="text-[11px] text-gray-500">Admin</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <IconX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 h-[calc(100vh-64px-80px)]">
          {navigation.map((group) => (
            <div key={group.section} className="mb-4">
              <div className="px-4 py-2 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                {group.section}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = currentTab === item.key
                  return (
                    <Link key={item.key} href={item.href} legacyBehavior>
                      <a
                        onClick={onClose}
                        className={`
                          flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium
                          transition-colors
                          ${isActive
                            ? 'bg-brand text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                          }
                        `}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                        <span>{item.label}</span>
                      </a>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
          <button
            onClick={() => { onLogout(); onClose() }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
          >
            <IconLogout className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  )
}
