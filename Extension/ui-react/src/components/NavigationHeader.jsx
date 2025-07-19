import React, { memo, useState, useRef, useEffect } from 'react'
import { Star, User, Menu, X } from 'lucide-react'
import { semanticTypography, componentSpacing } from '@/styles/typography'
import { cn } from '@/lib/utils'

const NavigationHeader = memo(({ activeTab, onTabChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)
  
  const navigationTabs = [
    {
      id: 'articles',
      label: 'Discover',
      icon: Star
    },
    {
      id: 'account',
      label: 'Account',
      icon: User
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  return (
    <div className="bg-white border-b border-gray-200" ref={menuRef}>
      <div className={componentSpacing.navPadding}>
        <div className="flex items-center gap-4">
          {/* Hamburger Menu */}
          <div className="relative">
            <button
              onClick={toggleMenu}
              className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
            >
              {isMenuOpen ? (
                <X size={18} strokeWidth={2} />
              ) : (
                <Menu size={18} strokeWidth={2} />
              )}
            </button>
          </div>
          
          {/* Current Tab Label */}
          <h1 className={cn(semanticTypography.pageTitle, "text-gray-900")}>
            {getActiveTabLabel()}
          </h1>
        </div>
      </div>
      
      {/* Integrated Menu Panel */}
      {isMenuOpen && (
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 py-3 space-y-2">
            {navigationTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('Navigation button clicked:', tab.id)
                    handleNavTabChange(tab.id)
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors duration-200 rounded-md",
                    isActive 
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <Icon size={16} strokeWidth={2} />
                  <span className="text-sm">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
})

NavigationHeader.displayName = 'NavigationHeader'

export default NavigationHeader