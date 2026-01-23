/**
 * Modern Dashboard Header Component (MVP Pattern - View Layer)
 */

import { useState, useRef, useEffect } from 'react'
import {
  IconMenu,
  IconSearch,
  IconBell,
  IconSettings,
  IconUser,
  IconLogout,
  IconChevronDown
} from '../ui/icons'

export default function ModernHeader({ user, onOpenNav, onLogout, title = 'Dashboard' }) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-gray-200 bg-white/90 backdrop-blur-md">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onOpenNav}
            className="lg:hidden p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            aria-label="Open menu"
          >
            <IconMenu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Page Title */}
          <div>
            <h1 className="text-lg lg:text-xl font-semibold text-gray-900">{title}</h1>
            <p className="hidden sm:block text-xs text-gray-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Search */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-48 lg:w-64 pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
              />
            </div>
          </div>

          {/* Mobile search button */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <IconSearch className="w-5 h-5 text-gray-600" />
          </button>

          {/* Status indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-700">System Healthy</span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <IconBell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 pl-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-700">{user?.name || 'Admin'}</p>
                <p className="text-[10px] text-gray-500">Super Admin</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand to-brand/80 flex items-center justify-center text-white font-semibold shadow-md">
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <IconChevronDown className={`hidden sm:block w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500">{user?.email || 'admin@kaburlumedia.com'}</p>
                </div>
                <div className="py-2">
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <IconUser className="w-4 h-4 text-gray-400" />
                    <span>Profile</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <IconSettings className="w-4 h-4 text-gray-400" />
                    <span>Settings</span>
                  </button>
                </div>
                <div className="border-t border-gray-100 py-2">
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <IconLogout className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      {showSearch && (
        <div className="md:hidden absolute top-full left-0 right-0 p-4 bg-white border-b border-gray-200 shadow-sm">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  )
}
