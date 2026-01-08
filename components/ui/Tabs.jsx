/**
 * Modern Tabs Component (MVP Pattern - View Layer)
 */

import { useState } from 'react'

export default function Tabs({
  tabs = [],
  defaultTab,
  onChange,
  variant = 'line',
  className = ''
}) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.key)

  const handleTabChange = (key) => {
    setActiveTab(key)
    onChange?.(key)
  }

  const variants = {
    line: {
      container: 'border-b border-gray-200',
      tab: 'relative py-3 px-4 text-sm font-medium transition-colors',
      active: 'text-brand after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand after:rounded-full',
      inactive: 'text-gray-500 hover:text-gray-700'
    },
    pills: {
      container: 'bg-gray-100 p-1 rounded-lg',
      tab: 'py-2 px-4 text-sm font-medium rounded-md transition-colors',
      active: 'bg-white text-gray-900 shadow-sm',
      inactive: 'text-gray-500 hover:text-gray-700'
    },
    buttons: {
      container: 'flex gap-2',
      tab: 'py-2 px-4 text-sm font-medium rounded-lg border transition-colors',
      active: 'bg-brand text-white border-brand',
      inactive: 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
    }
  }

  const style = variants[variant] || variants.line

  return (
    <div className={className}>
      <div className={`flex ${style.container}`}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`
              ${style.tab}
              ${activeTab === tab.key ? style.active : style.inactive}
            `}
          >
            <span className="flex items-center gap-2">
              {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`
                  px-1.5 py-0.5 text-xs rounded-full
                  ${activeTab === tab.key
                    ? 'bg-white/20 text-current'
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {tabs.find(t => t.key === activeTab)?.content}
      </div>
    </div>
  )
}

// Simple tab panels without content rendering
export function TabList({ tabs, activeTab, onChange, variant = 'line', className = '' }) {
  const variants = {
    line: {
      container: 'border-b border-gray-200',
      tab: 'relative py-3 px-4 text-sm font-medium transition-colors',
      active: 'text-brand after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand after:rounded-full',
      inactive: 'text-gray-500 hover:text-gray-700'
    },
    pills: {
      container: 'bg-gray-100 p-1 rounded-lg inline-flex',
      tab: 'py-2 px-4 text-sm font-medium rounded-md transition-colors',
      active: 'bg-white text-gray-900 shadow-sm',
      inactive: 'text-gray-500 hover:text-gray-700'
    }
  }

  const style = variants[variant] || variants.line

  return (
    <div className={`flex ${style.container} ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`
            ${style.tab}
            ${activeTab === tab.key ? style.active : style.inactive}
          `}
        >
          {tab.icon && <span className="mr-2">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
