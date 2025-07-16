import React, { memo, useEffect, useState, useRef } from 'react'
import { Star, User } from 'lucide-react'

const NavigationHeader = memo(({ activeTab, onTabChange }) => {
  
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

  const [underlineStyle, setUnderlineStyle] = useState({})
  const [jumpTab, setJumpTab] = useState(null)
  const [animationKey, setAnimationKey] = useState(0)
  const animationTimeoutRef = useRef(null)

  const handleNavTabChange = (tabId) => {
    // Clear any existing timeout to prevent conflicts
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
    }
    
    // Only start new animation if it's different from current
    if (jumpTab !== tabId) {
      setJumpTab(tabId)
      setAnimationKey(prev => prev + 1)
      
      // Set timeout to clear animation
      animationTimeoutRef.current = setTimeout(() => {
        setJumpTab(null)
        animationTimeoutRef.current = null
      }, 300)
    }
    
    // Always change the tab regardless of animation state
    onTabChange(tabId)
  }

  useEffect(() => {
    const updateUnderlinePosition = () => {
      const activeIndex = navigationTabs.findIndex(tab => tab.id === activeTab)
      if (activeIndex === -1) return
      
      const totalTabs = navigationTabs.length
      
      // Calculate position based on flex layout - each tab is 50% width
      const tabWidth = 100 / totalTabs // 50% per tab
      const tabStart = tabWidth * activeIndex // Start position of active tab
      const tabCenter = tabStart + (tabWidth / 2) // Center of active tab
      
      const underlineWidth = 25 // Underline width as percentage of tab width
      const underlineLeft = tabCenter - (underlineWidth / 2) // Center the underline under the tab
      
      setUnderlineStyle({
        width: `${underlineWidth}%`,
        left: `${underlineLeft}%`,
        transform: 'none'
      })
    }

    updateUnderlinePosition()
  }, [activeTab])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="bg-white">
      {/* Minimal Navigation Bar */}
      <div className="px-4 pb-2">
        <div className="relative flex items-center justify-center border-b border-gray-100">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                data-tab={tab.id}
                onClick={() => handleNavTabChange(tab.id)}
                className={`
                  relative flex items-center justify-center gap-2 py-3 transition-colors duration-200 text-xs font-normal
                  ${isActive 
                    ? 'text-purple-700'
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
                style={{ width: '50%' }}
              >
                <Icon 
                  key={`${tab.id}-${animationKey}`}
                  size={16} 
                  strokeWidth={isActive ? 1.5 : 1.5}
                  className={jumpTab === tab.id ? 'jump' : ''}
                />
                <span>{tab.label}</span>
              </button>
            )
          })}
          
          {/* Sliding Underline */}
          <div 
            className="absolute bottom-0 h-0.5 bg-purple-600 rounded-full transition-all duration-300"
            style={{
              ...underlineStyle,
              transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)'
            }}
          ></div>
        </div>
      </div>
    </div>
  )
})

NavigationHeader.displayName = 'NavigationHeader'

export default NavigationHeader