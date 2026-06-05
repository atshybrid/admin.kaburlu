/**
 * Mobile Sidebar — same routes & role gates as ModernSidebar (incl. ePaper).
 */

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { IconX, IconLogout } from '../ui/icons'
import { getFilteredAdminNavigation, isNavHrefActive } from './dashboardNavConfig'

const MOBILE_SECTIONS = [
  { title: 'Main Menu', navKey: 'main' },
  { title: 'ePaper (PDF)', navKey: 'epaper' },
  { title: 'Locations', navKey: 'location' },
  { title: 'Tenant Management', navKey: 'tenants' },
  { title: 'Journalist Union', navKey: 'journalist' },
  { title: 'Political Parties', navKey: 'political' },
  { title: 'Settings', navKey: 'settings' },
]

export default function ModernMobileSidebar({ isOpen, onClose, user, onLogout }) {
  const router = useRouter()
  const filtered = getFilteredAdminNavigation(user)

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
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="absolute inset-y-0 left-0 w-[min(20rem,88vw)] bg-white shadow-2xl flex flex-col max-h-screen"
        data-mobile-admin-nav="v2"
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-gray-100 shrink-0">
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
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <IconX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-3 px-1">
          {MOBILE_SECTIONS.map(({ title, navKey }) => {
            const items = filtered[navKey] || []
            if (!items.length) return null
            return (
              <div key={navKey} className="mb-4">
                <div className="px-4 py-2 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                  {title}
                </div>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon
                    const isActive = isNavHrefActive(router.pathname, item.href)
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
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
                        <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        <div className="shrink-0 p-4 border-t border-gray-100 bg-white">
          <button
            type="button"
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
