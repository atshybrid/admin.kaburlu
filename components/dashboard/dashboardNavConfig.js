/**
 * Shared admin navigation for desktop (ModernSidebar) and mobile (ModernMobileSidebar).
 * Single source of truth for routes, labels, and role gates.
 */

import {
  IconHome,
  IconFileText,
  IconUsers,
  IconUser,
  IconFolder,
  IconGlobe,
  IconMapPin,
  IconBuilding,
  IconCreditCard,
  IconShield,
  IconLayers,
  IconNewspaper,
  IconArticles,
} from '../ui/icons'

export const adminNavigation = {
  main: [
    { key: 'overview', href: '/admin', label: 'Overview', icon: IconHome, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN'] },
    { key: 'articles', href: '/admin/articles', label: 'All Articles', icon: IconFileText, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN', 'TENANT_ADMIN', 'TENANTADMIN', 'REPORTER', 'DESK_EDITOR', 'DESKEDITOR', 'NEWSDESK'] },
    { key: 'create-article', href: '/admin/articles/create', label: 'Create Article', icon: IconNewspaper, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN', 'TENANT_ADMIN', 'TENANTADMIN', 'REPORTER', 'DESK_EDITOR', 'DESKEDITOR', 'NEWSDESK'] },
    { key: 'users', href: '/admin/users', label: 'Users', icon: IconUsers, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN'] },
    { key: 'desk-editors', href: '/admin/desk-editors', label: 'Desk Editor Analytics', icon: IconUsers, roles: ['SUPER_ADMIN', 'SUPERADMIN'] },
    { key: 'news-banners', href: '/admin/news-banners', label: 'News Banners', icon: IconLayers, roles: ['SUPER_ADMIN', 'SUPERADMIN'] },
    { key: 'categories', href: '/admin/categories', label: 'Categories', icon: IconFolder, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN'] },
    { key: 'languages', href: '/admin/languages', label: 'Languages', icon: IconGlobe, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN'] },
    { key: 'roles', href: '/admin/roles', label: 'Roles', icon: IconShield, roles: ['SUPER_ADMIN', 'SUPERADMIN'] },
    { key: 'profile', href: '/admin/profile', label: 'My Profile', icon: IconUser, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN', 'TENANT_ADMIN', 'TENANTADMIN', 'REPORTER', 'DESK_EDITOR', 'DESKEDITOR', 'NEWSDESK'] },
  ],
  epaper: [
    { key: 'epaper-overview', href: '/admin/epaper', label: 'ePaper Overview', icon: IconNewspaper, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'DESK_EDITOR', 'DESKEDITOR', 'NEWSDESK'] },
    { key: 'epaper-design', href: '/admin/epaper/design', label: 'Epaper Design', icon: IconLayers, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'DESK_EDITOR', 'DESKEDITOR', 'NEWSDESK'] },
    { key: 'epaper-header', href: '/admin/epaper/header-library', label: 'Epaper Header', icon: IconLayers, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'DESK_EDITOR', 'DESKEDITOR', 'NEWSDESK'] },
    { key: 'epaper-block-style', href: '/admin/epaper/block-style', label: 'Epaper Block style', icon: IconArticles, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'DESK_EDITOR', 'DESKEDITOR', 'NEWSDESK'] },
    { key: 'epaper-main-page-top', href: '/admin/epaper/main-page-top-blocks', label: 'Main page top blocks', icon: IconLayers, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'DESK_EDITOR', 'DESKEDITOR', 'NEWSDESK'] },
    { key: 'epaper-editions', href: '/admin/epaper/editions', label: 'Editions', icon: IconLayers, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'DESK_EDITOR', 'DESKEDITOR', 'NEWSDESK'] },
    { key: 'epaper-upload', href: '/admin/epaper/upload', label: 'Upload Issues', icon: IconFileText, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'DESK_EDITOR', 'DESKEDITOR', 'NEWSDESK'] },
    { key: 'epaper-issues', href: '/admin/epaper/issues', label: 'Issues', icon: IconFolder, roles: ['SUPER_ADMIN', 'SUPERADMIN', 'DESK_EDITOR', 'DESKEDITOR', 'NEWSDESK'] },
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
  political: [
    {
      key: 'political-parties',
      href: '/admin/political-parties',
      label: 'Political Parties',
      icon: IconGlobe,
      roles: ['SUPER_ADMIN', 'SUPERADMIN'],
    },
    {
      key: 'news-surveys',
      href: '/admin/news-surveys',
      label: 'News Surveys',
      icon: IconFileText,
      roles: ['SUPER_ADMIN', 'SUPERADMIN'],
    },
    {
      key: 'union-surveys',
      href: '/admin/union-surveys',
      label: 'Union Surveys',
      icon: IconNewspaper,
      roles: ['SUPER_ADMIN', 'SUPERADMIN'],
    },
  ],
  settings: [
    { key: 'global-razorpay', href: '/admin/settings/razorpay', label: 'Global Razorpay', icon: IconCreditCard, roles: ['SUPER_ADMIN', 'SUPERADMIN'] },
  ],
}

export function normalizeRole(user) {
  const role = user?.role || user?.roleName || user?.userRole || user?.role?.name || ''
  const roleName = typeof role === 'string' ? role : (role?.name || '')
  return String(roleName).toUpperCase().replace(/[_\s-]/g, '')
}

export function hasAccess(item, userRole) {
  if (!item.roles || item.roles.length === 0) return true
  const normalizedRole = normalizeRole({ role: userRole })
  return item.roles.some(role => role.replace(/[_\s-]/g, '').toUpperCase() === normalizedRole)
}

export function getFilteredAdminNavigation(user) {
  const userRole = normalizeRole(user)
  return {
    main: adminNavigation.main.filter(item => hasAccess(item, userRole)),
    epaper: adminNavigation.epaper.filter(item => hasAccess(item, userRole)),
    location: adminNavigation.location.filter(item => hasAccess(item, userRole)),
    tenants: adminNavigation.tenants.filter(item => hasAccess(item, userRole)),
    journalist: adminNavigation.journalist.filter(item => hasAccess(item, userRole)),
    political: adminNavigation.political.filter(item => hasAccess(item, userRole)),
    settings: adminNavigation.settings.filter(item => hasAccess(item, userRole)),
  }
}

/** Active link: exact match, or sub-route — except /admin and /admin/epaper stay exact-only */
export function isNavHrefActive(pathname, href) {
  if (pathname === href) return true
  if (href === '/admin' || href === '/admin/epaper') return false
  return pathname.startsWith(`${href}/`)
}
