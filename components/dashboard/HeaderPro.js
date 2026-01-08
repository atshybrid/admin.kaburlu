/**
 * Dashboard Header Component
 * Modern header with search, notifications, and user menu
 */

import { useState } from 'react'
import { SearchInput, Button, Dropdown, Badge } from '../ui/primitives'

export default function HeaderPro({ user, onOpenNav, onLogout }) {
  const [searchOpen, setSearchOpen] = useState(false)

  const userMenuItems = [
    { label: 'Profile Settings', onClick: () => {} },
    { label: 'Account', onClick: () => {} },
    { label: 'Logout', onClick: onLogout, danger: true },
  ]

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Left: Mobile menu + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenNav}
          className="md:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <svg className="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <span className="text-slate-500">Dashboard</span>
          <svg className="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
          <span className="text-slate-900 font-medium">Overview</span>
        </div>
      </div>

      {/* Center: Search */}
      <div className="hidden md:block flex-1 max-w-md mx-4">
        <SearchInput 
          placeholder="Search articles, tenants, users..." 
          className="w-full"
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Mobile Search Toggle */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <svg className="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <svg className="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Quick Actions */}
        <Button variant="primary" size="sm" className="hidden sm:inline-flex">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New
        </Button>

        {/* User Menu */}
        <Dropdown
          trigger={
            <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white text-sm font-medium">
                {(user?.name || 'SA').charAt(0).toUpperCase()}
              </div>
              <svg className="w-4 h-4 text-slate-400 hidden sm:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          }
          items={userMenuItems}
        />
      </div>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div className="md:hidden absolute left-0 right-0 top-full bg-white border-b border-slate-200 p-4 shadow-lg">
          <SearchInput 
            placeholder="Search..." 
            className="w-full"
            autoFocus
          />
        </div>
      )}
    </header>
  )
}
