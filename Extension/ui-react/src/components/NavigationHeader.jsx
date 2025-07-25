import React, { memo, useState, useRef, useEffect } from 'react'
import { Star, User, Menu, X, HelpCircle } from 'lucide-react'
import { semanticTypography, componentSpacing } from '@/styles/typography'
import { cn } from '@/lib/utils'

const NavigationHeader = memo(({ activeTab, onTabChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)
  
  const navigationTabs = [
    {
      id: 'articles',
      label: 'Discover',
      description: 'Market awareness for your reading',
      icon: Star
    },
    {
      id: 'account',
      label: 'Account',
      description: 'Manage your profile and preferences',
      icon: User
    }
  ]

  const menuActions = [
    {
      id: 'help',
      label: 'Getting Started',
      description: 'Learn how to use Pocketstox',
      icon: HelpCircle,
      action: () => window.open('https://pocketstox.com/help', '_blank')
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

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside both the header and menu panel
      const isClickOutsideHeader = menuRef.current && !menuRef.current.contains(event.target)
      const isClickOutsideMenu = !event.target.closest('.navigation-menu-panel')
      
      if (isClickOutsideHeader && isClickOutsideMenu) {
        setIsMenuOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  return (
    <>
      <div className="bg-white border-b border-gray-200" ref={menuRef}>
        <div className={componentSpacing.navPadding}>
          <div className="flex items-center gap-4">
            {/* Hamburger Menu */}
            <button
              onClick={toggleMenu}
              className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
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
            <h1 className={cn(semanticTypography.cardTitle, "text-gray-900")}>
              {getActiveTabLabel()}
            </h1>
          </div>
        </div>
      </div>
      
      {/* Menu Panel - Fixed overlay */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-25 z-40" style={{top: '44px'}}></div>
          {/* Menu Panel */}
          <div className="navigation-menu-panel fixed top-[44px] left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
          <div className="px-4 py-4 space-y-4">
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
                        "w-full flex items-start gap-3 px-3 py-3 text-left rounded-lg transition-colors",
                        isActive 
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                      )}
                    >
                      <Icon size={18} strokeWidth={2} className="flex-shrink-0 mt-1" />
                      <div className="min-w-0 flex-1">
                        <div className={cn("text-sm font-medium", isActive ? "text-purple-700" : "text-gray-900")}>
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
                      className="w-full flex items-start gap-3 px-3 py-3 text-left rounded-lg transition-colors border border-transparent text-gray-700 hover:bg-gray-50"
                    >
                      <Icon size={18} strokeWidth={2} className="flex-shrink-0 mt-1" />
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