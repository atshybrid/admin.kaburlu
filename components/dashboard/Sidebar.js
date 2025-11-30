import Link from 'next/link'
import { IconMenu, IconUsers, IconFolder, IconLang, IconArticles, IconGeo, IconTenant, IconSettings, IconKey } from '../ui/icons'

export default function Sidebar({ user, onLogout, currentTab = 'overview' }) {
  const primary = [
    { key: 'overview', href: '/dashboard', label: 'Overview', icon: IconMenu },
    { key: 'reporters', href: '/dashboard/reporters', label: 'Reporters', icon: IconUsers },
    { key: 'categories', href: '/dashboard/categories', label: 'Categories', icon: IconFolder },
    { key: 'languages', href: '/dashboard/languages', label: 'Languages', icon: IconLang },
    { key: 'users', href: '/dashboard/users', label: 'Users', icon: IconUsers },
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

  function NavGroup({ title, items }) {
    return (
      <div className="mt-6 first:mt-2">
        <div className="px-5 mb-2 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">{title}</div>
        <div className="space-y-1">
          {items.map(i => (
            <Link key={i.key} href={i.href} legacyBehavior>
              <a className={`sidebar-item flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${currentTab===i.key ? 'sidebar-item-active' : 'text-gray-600 hover:text-brand'}`}>
                {i.icon && i.icon({ className: `w-5 h-5 ${currentTab===i.key ? 'text-brand' : 'text-gray-400 group-hover:text-brand'}` })}
                <span className="truncate">{i.label}</span>
              </a>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <aside className="hidden md:flex md:flex-col w-60 shrink-0 h-screen sidebar-container">
      <div className="h-16 px-5 flex items-center border-b border-gray-200">
        <div className="relative w-9 h-9 rounded-lg bg-brand/15 flex items-center justify-center text-brand font-bold">
          <span>K</span>
          <span className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-brand text-white text-[10px] flex items-center justify-center shadow-sm">SA</span>
        </div>
        <div className="ml-3">
          <div className="text-sm font-semibold tracking-wide text-gray-800">Kaburlu Admin</div>
          <div className="text-[11px] text-gray-500">{user?.name || 'Super Admin'}</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-2 pb-6">
        <NavGroup title="Main" items={primary} />
        <NavGroup title="Location" items={location} />
        <NavGroup title="Tenants" items={tenant} />
        <NavGroup title="Settings" items={settings} />
      </nav>
      <div className="px-5 pb-5 mt-auto">
        <button onClick={onLogout} className="btn-danger w-full text-sm">Logout</button>
      </div>
    </aside>
  )
}
