import React from 'react'
import { FileText, Briefcase } from 'lucide-react'

const FixedTabNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'articles', label: 'History', shortLabel: 'H', icon: FileText },
    { id: 'community', label: 'Portfolio', shortLabel: 'F', icon: Briefcase }
  ]

  return (
    <div className="grid w-full grid-cols-2 mb-3 bg-gray-100/50 p-0.5 h-7 rounded-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center justify-center text-xs font-medium min-w-0 px-0.5 rounded-md transition-all duration-200
              ${isActive 
                ? 'bg-white text-gray-900' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }
            `}
          >
            <Icon size={10} className="flex-shrink-0" />
            <span className="tab-full-text truncate text-xs ml-0.5">{tab.label}</span>
            <span className="tab-short-text text-xs hidden">{tab.shortLabel}</span>
          </button>
        )
      })}
    </div>
  )
}

export default FixedTabNavigation