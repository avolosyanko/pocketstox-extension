import React, { memo, useState, useRef, useEffect } from 'react'
import { Star, Heart, Menu, X, Info, LogIn, Search } from 'lucide-react'
import { semanticTypography, componentSpacing } from '@/styles/typography'
import { cn } from '@/lib/utils'

const NavigationHeader = memo(({ activeTab, onTabChange, searchQuery, onSearchChange, showSearch, onToggleSearch }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const searchInputRef = useRef(null)
  
  const navigationTabs = [
    {
      id: 'articles',
      label: 'Discover',
      description: 'Market awareness for your reading',
      icon: Star
    },
    {
      id: 'account',
      label: 'Following',
      description: 'Companies you follow and research',
      icon: Heart
    }
  ]

  const menuActions = [
    {
      id: 'signin',
      label: 'Sign In',
      description: 'Connect your Pocketstox account',
      icon: LogIn,
      action: () => {
        if (chrome && chrome.tabs) {
          chrome.tabs.create({ url: 'https://pocketstox.com/auth?source=extension' })
        }
      }
    },
    {
      id: 'help',
      label: 'Getting Started',
      description: 'Learn how to use Pocketstox',
      icon: Info,
      action: () => window.open('https://pocketstox.com/getting-started', '_blank')
    }
  ]

  const handleNavTabChange = (tabId) => {
    onTabChange(tabId)
    setIsMenuOpen(false)
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const getActiveTabLabel = () => {
    const activeTabData = navigationTabs.find(tab => tab.id === activeTab)
    return activeTabData ? activeTabData.label : 'Discover'
  }

  // Focus search input when opened
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])

  // Close menu and search when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside both the header and menu panel
      const isClickOutsideHeader = menuRef.current && !menuRef.current.contains(event.target)
      const isClickOutsideMenu = !event.target.closest('.navigation-menu-panel')
      
      if (isClickOutsideHeader && isClickOutsideMenu) {
        setIsMenuOpen(false)
        if (showSearch && onToggleSearch) {
          onToggleSearch(false)
        }
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
        if (showSearch && onToggleSearch) {
          onToggleSearch(false)
        }
      }
    }

    if (isMenuOpen || showSearch) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen, showSearch, onToggleSearch])

  return (
    <>
      <div className="bg-white border-b border-gray-200" ref={menuRef}>
        <div className={componentSpacing.navPadding}>
          {/* Regular Header - hidden when search is active */}
          {!showSearch && (
            <div className="flex items-center gap-4">
              {/* Hamburger Menu */}
              <button
                onClick={toggleMenu}
                className="flex items-center justify-center w-8 h-8 text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMenuOpen}
                aria-haspopup="true"
              >
                {isMenuOpen ? (
                  <X size={18} strokeWidth={2} />
                ) : (
                  <Menu size={18} strokeWidth={2} />
                )}
              </button>
              
              {/* Current Tab Label */}
              <h1 className={cn(semanticTypography.cardTitle, "text-gray-900 flex-1")}>
                {getActiveTabLabel()}
              </h1>

              {/* Search Icon - only show on Discover tab */}
              {activeTab === 'articles' && (
                <button
                  onClick={() => onToggleSearch && onToggleSearch(!showSearch)}
                  className="flex items-center justify-center w-8 h-8 text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
                  aria-label="Toggle search"
                >
                  <Search size={17} strokeWidth={2} />
                </button>
              )}
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
                {/* Close button */}
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
      </div>
      
      {/* Menu Panel - Fixed overlay */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/80 z-40" style={{top: '44px'}}></div>
          {/* Menu Panel */}
          <div className="navigation-menu-panel fixed top-[44px] left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
          <div className="px-4 py-3.5 space-y-3.5">
            {/* Navigation Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-3">
                Navigation
              </h3>
              <div className="space-y-1">
                {navigationTabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleNavTabChange(tab.id)}
                      className={cn(
                        "w-full flex items-start gap-2.5 px-3 py-2.5 text-left rounded-lg transition-colors",
                        isActive
                          ? 'bg-gray-50 border border-gray-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      )}
                    >
                      <Icon size={18} strokeWidth={1.5} className="flex-shrink-0 mt-1 text-gray-900" />
                      <div className="min-w-0 flex-1">
                        <div className={cn("text-sm font-medium", isActive ? "text-gray-900" : "text-gray-900")}>
                          {tab.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {tab.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            
            {/* Quick Actions Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-3">
                Quick Actions
              </h3>
              <div className="space-y-1">
                {menuActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.id}
                      onClick={() => {
                        action.action()
                        setIsMenuOpen(false)
                      }}
                      className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left rounded-lg transition-colors border border-transparent hover:bg-gray-50"
                    >
                      <Icon size={18} strokeWidth={1.5} className="flex-shrink-0 mt-1 text-gray-900" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {action.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {action.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            
          </div>
        </div>
        </>
      )}
    </>
  )
})

NavigationHeader.displayName = 'NavigationHeader'

export default NavigationHeader