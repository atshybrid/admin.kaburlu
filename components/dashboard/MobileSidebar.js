import Link from 'next/link'
import { useEffect } from 'react'
import { IconMenu, IconUsers, IconFolder, IconLang, IconGeo, IconTenant, IconSettings, IconKey } from '../ui/icons'

export default function MobileSidebar({ open, onClose, onLogout }) {
  const primary = [
    { key: 'overview', href: '/dashboard', label: 'Overview', icon: IconMenu },
    { key: 'users', href: '/dashboard/users', label: 'Users', icon: IconUsers },
    { key: 'categories', href: '/dashboard/categories', label: 'Categories', icon: IconFolder },
    { key: 'languages', href: '/dashboard/languages', label: 'Languages', icon: IconLang },
  ]
  const location = [
    { key: 'states', href: '/dashboard/states', label: 'States', icon: IconGeo },
    { key: 'districts', href: '/dashboard/districts', label: 'Districts', icon: IconGeo },
    { key: 'assembly', href: '/dashboard/assembly', label: 'Assembly Constituency', icon: IconGeo },
    { key: 'mandals', href: '/dashboard/mandals', label: 'Mandals', icon: IconGeo },
  ]
  const tenant = [
    { key: 'tenants', href: '/dashboard/tenants', label: 'Tenants', icon: IconTenant },
    { key: 'tenant-idcard-settings', href: '/dashboard/tenant-idcard-settings', label: 'Tenant ID Card Settings', icon: IconKey },
    { key: 'tenant-razorpay-settings', href: '/dashboard/tenant-razorpay-settings', label: 'Tenant Razorpay Settings', icon: IconKey },
  ]
  const settings = [
    { key: 'roles', href: '/dashboard/roles', label: 'Roles', icon: IconUsers },
    { key: 'global-razorpay-settings', href: '/dashboard/global-razorpay-settings', label: 'Global Razorpay Settings', icon: IconSettings },
  ]

  function Group({ title, items }) {
    return (
      <div className="mt-4 first:mt-2">
        <div className="px-5 mb-1 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">{title}</div>
        <div>
          {items.map(i => (
            <Link key={i.key} href={i.href} legacyBehavior>
              <a className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-600 hover:text-brand hover:bg-brand/5 rounded-md">
                {i.icon && i.icon({ className: 'w-5 h-5 text-gray-400 group-hover:text-brand' })}
                <span className="truncate">{i.label}</span>
              </a>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [open])

  return (
    <div className={`fixed inset-0 z-40 md:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      {/* overlay */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      {/* drawer */}
      <div className={`absolute top-0 left-0 h-full w-72 bg-white border-r shadow-xl transform transition-transform ${open ? 'translate-x-0' : '-translate-x-full'} flex flex-col`} role="dialog" aria-modal="true">
        <div className="h-16 px-4 flex items-center border-b justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-brand/15 flex items-center justify-center text-brand font-bold">K</div>
            <div>
              <div className="text-sm font-semibold">Kaburlu Admin</div>
              <div className="text-[11px] text-gray-500">Super Admin</div>
            </div>
          </div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose} aria-label="Close navigation">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto" onClick={onClose}>
          <Group title="Main" items={primary} />
          <Group title="Location" items={location} />
          <Group title="Tenants" items={tenant} />
          <Group title="Settings" items={settings} />
        </nav>
        <div className="p-4 border-t">
          <button onClick={onLogout} className="w-full text-sm px-3 py-2 rounded bg-red-500 text-white hover:bg-red-600">Logout</button>
        </div>
      </div>
    </div>
  )
}
