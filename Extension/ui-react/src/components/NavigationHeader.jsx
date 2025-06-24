import React, { memo } from 'react'
import { Zap, TrendingUp, User, Plus } from 'lucide-react'

const NavigationHeader = memo(({ activeTab, onTabChange, onGenerate }) => {
  
  const navigationTabs = [
    {
      id: 'articles',
      label: 'Discover',
      icon: Zap
    },
    {
      id: 'patterns',
      label: 'Analytics',
      icon: TrendingUp
    }
  ]


  const handleNavTabChange = (tabId) => {
    onTabChange(tabId)
  }

  const toggleTab = () => {
    const currentIndex = navigationTabs.findIndex(tab => tab.id === activeTab)
    const nextIndex = (currentIndex + 1) % navigationTabs.length
    handleNavTabChange(navigationTabs[nextIndex].id)
  }

  const getCurrentTabLabel = () => {
    const currentTab = navigationTabs.find(tab => tab.id === activeTab)
    return currentTab?.label || 'Discover'
  }

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Top row with title and account */}
      <div className="flex items-center justify-between p-4">
        {/* Clickable Heading */}
        <button
          onClick={toggleTab}
          className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded-md transition-colors"
        >
          <h1 className="text-base font-normal text-gray-900">{getCurrentTabLabel()}</h1>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gray-500">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Account Button */}
        <button
          onClick={() => onTabChange('account')}
          className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-all ${
            activeTab === 'account' 
              ? 'bg-purple-100 hover:bg-purple-200' 
              : 'bg-transparent hover:bg-gray-100'
          }`}
        >
          <User 
            size={16} 
            className={activeTab === 'account' ? 'text-purple-600' : 'text-gray-700'} 
            strokeWidth={2}
          />
        </button>
      </div>

    </div>
  )
})

NavigationHeader.displayName = 'NavigationHeader'

export default NavigationHeader