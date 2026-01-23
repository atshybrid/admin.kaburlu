/**
 * Role Utilities - Centralized role management and access control
 */

/**
 * Normalize role string to uppercase without special characters
 * @param {Object|string} user - User object or role string
 * @returns {string} Normalized role
 */
export function normalizeRole(user) {
  if (!user) return ''
  
  const role = user?.role || user?.roleName || user?.userRole || user?.role?.name || user
  const roleName = typeof role === 'string' ? role : (role?.name || '')
  return String(roleName).toUpperCase().replace(/[_\s-]/g, '')
}

/**
 * Check if user is Super Admin
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isSuperAdmin(user) {
  const role = normalizeRole(user)
  return role === 'SUPERADMIN' || role === 'ADMIN'
}

/**
 * Check if user is Tenant Admin
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isTenantAdmin(user) {
  const role = normalizeRole(user)
  return role === 'TENANTADMIN'
}

/**
 * Check if user is Reporter
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isReporter(user) {
  const role = normalizeRole(user)
  return role === 'REPORTER'
}

/**
 * Check if user is Desk Editor
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isDeskEditor(user) {
  const role = normalizeRole(user)
  return role === 'DESKEDITOR' || role === 'NEWSDESK'
}

/**
 * Check if user has access to admin features
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function hasAdminAccess(user) {
  return isSuperAdmin(user) || isTenantAdmin(user)
}

/**
 * Check if user has access to article management
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function hasArticleAccess(user) {
  return isSuperAdmin(user) || isTenantAdmin(user) || isReporter(user)
}

/**
 * Get user's tenant ID
 * Tenant Admins and Reporters have their own tenant ID
 * Super Admins don't have a fixed tenant
 * @param {Object} user - User object
 * @returns {string|null} Tenant ID
 */
export function getUserTenantId(user) {
  if (!user) return null
  
  // Try different possible tenant ID locations
  return (
    user.tenantId ||
    user.tenant_id ||
    user.tenant?.id ||
    user.organization?.id ||
    null
  )
}

/**
 * Get appropriate dashboard route based on user role
 * @param {Object} user - User object
 * @returns {string} Dashboard route
 */
export function getDashboardRoute(user) {
  if (isSuperAdmin(user)) {
    return '/admin'
  }
  
  if (isDeskEditor(user)) {
    return '/admin/epaper/editions'
  }
  
  if (isTenantAdmin(user) || isReporter(user)) {
    return '/admin/articles'
  }
  
  return '/'
}

/**
 * Role definitions for navigation filtering
 */
export const ROLES = {
  SUPER_ADMIN: 'SUPERADMIN',
  TENANT_ADMIN: 'TENANTADMIN',
  REPORTER: 'REPORTER',
  DESK_EDITOR: 'DESKEDITOR',
  NEWS_DESK: 'NEWSDESK',
}

/**
 * Check if user role matches any of the allowed roles
 * @param {Object} user - User object
 * @param {Array<string>} allowedRoles - Array of allowed role names
 * @returns {boolean}
 */
export function hasRole(user, allowedRoles = []) {
  if (!allowedRoles || allowedRoles.length === 0) return true
  
  const userRole = normalizeRole(user)
  return allowedRoles.some(role => 
    normalizeRole({ role }) === userRole
  )
}

/**
 * Get user display name
 * @param {Object} user - User object
 * @returns {string}
 */
export function getUserDisplayName(user) {
  return user?.fullName || user?.name || user?.email || 'User'
}

/**
 * Get role display name
 * @param {Object} user - User object
 * @returns {string}
 */
export function getRoleDisplayName(user) {
  const role = normalizeRole(user)
  
  const roleNames = {
    'SUPERADMIN': 'Super Admin',
    'ADMIN': 'Admin',
    'TENANTADMIN': 'Tenant Admin',
    'REPORTER': 'Reporter',
    'DESKEDITOR': 'Desk Editor',
    'NEWSDESK': 'News Desk'
  }
  
  return roleNames[role] || role || 'User'
}
