import React, { memo, useRef, useEffect, useState } from 'react'
import { Search, X, Info } from 'lucide-react'
import { componentSpacing } from '@/styles/typography'

const NavigationHeader = memo(({ activeTab, onTabChange, searchQuery, onSearchChange, showSearch, onToggleSearch }) => {
  const searchInputRef = useRef(null)
  const tabRefs = useRef({})
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  const navigationTabs = [
    { id: 'articles', label: 'Discover' }
  ]

  // Update indicator position when active tab changes
  useEffect(() => {
    const activeTabRef = tabRefs.current[activeTab]
    if (activeTabRef) {
      const rect = activeTabRef.getBoundingClientRect()
      const parentRect = activeTabRef.parentElement.parentElement.parentElement.getBoundingClientRect()
      setIndicatorStyle({
        left: rect.left - parentRect.left + 8, // +8 for px-2 padding on tabs
        width: rect.width - 16 // -16 for px-2 on both sides of tabs
      })
    }
  }, [activeTab])

  // Focus search input when opened
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])

  // Close search when pressing Escape
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showSearch && onToggleSearch) {
        onToggleSearch(false)
      }
    }

    if (showSearch) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showSearch, onToggleSearch])

  return (
    <div className="bg-white">
      <div className="px-3 py-1.5">
        {/* Regular Header - hidden when search is active */}
        {!showSearch && (
          <div className="flex items-center justify-between">
            {/* Simple Tab Bar with underline indicator */}
            <div className="flex items-center">
              {navigationTabs.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    ref={(el) => tabRefs.current[tab.id] = el}
                    onClick={() => onTabChange(tab.id)}
                    className={`relative px-2 py-1.5 text-xs font-medium transition-colors duration-200 ${
                      isActive
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-0.5">
              {/* Search Icon - only show on Discover tab */}
              {activeTab === 'articles' && (
                <button
                  onClick={() => onToggleSearch && onToggleSearch(!showSearch)}
                  className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
                  aria-label="Toggle search"
                >
                  <Search size={16} strokeWidth={1.75} />
                </button>
              )}
              
              {/* How to use PocketStox help icon - always visible and rightmost */}
              <button
                onClick={() => {
                  window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')
                }}
                className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
                aria-label="How to use PocketStox"
              >
                <Info size={16} strokeWidth={1.75} />
              </button>
            </div>
          </div>
        )}

        {/* Full-Width Search Bar - covers entire header when active */}
        {showSearch && activeTab === 'articles' && (
          <div className="flex items-center h-8">
            <div className="relative bg-gray-100 rounded-lg transition-colors duration-200 flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by title, domain, or ticker..."
                value={searchQuery || ''}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-transparent border-0 focus:outline-none placeholder:text-xs placeholder:text-gray-600 rounded-lg"
              />
              <button
                onClick={() => onToggleSearch && onToggleSearch(false)}
                className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close search"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Combined border line with active indicator */}
      {!showSearch ? (
        <div className="h-px bg-gray-200 relative">
          <div
            className="absolute top-0 h-0.5 bg-gray-900 -translate-y-px transition-all duration-200"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`
            }}
          />
        </div>
      ) : (
        <div className="h-px bg-gray-200" />
      )}
    </div>
  )
})

NavigationHeader.displayName = 'NavigationHeader'

export default NavigationHeader
