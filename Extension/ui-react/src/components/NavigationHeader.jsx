import React, { memo } from 'react'
import { Star, Layers, User } from 'lucide-react'

const NavigationHeader = memo(({ activeTab, onTabChange, onGenerate }) => {
  
  const navigationTabs = [
    {
      id: 'articles',
      label: 'Discover',
      icon: Star
    },
    {
      id: 'patterns',
      label: 'Patterns',
      icon: Layers
    },
    {
      id: 'account',
      label: 'Account',
      icon: User
    }
  ]

  const handleNavTabChange = (tabId) => {
    onTabChange(tabId)
  }

  return (
    <div className="bg-white">
      {/* Minimal Navigation Bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-center border-b border-gray-100">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => handleNavTabChange(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-3 text-xs font-normal transition-all duration-150
                  ${isActive 
                    ? 'text-purple-700' 
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <Icon size={16} strokeWidth={isActive ? 1.5 : 1.5} />
                <span>{tab.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{background: "linear-gradient(135deg, rgb(147, 51, 234) 0%, rgb(124, 58, 237) 100%)"}}></div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
})

NavigationHeader.displayName = 'NavigationHeader'

export default NavigationHeader