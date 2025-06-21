import React, { useState } from 'react'
import GenerateButton from './components/GenerateButton'
import TabDropdown from './components/TabDropdown'
import ArticlesTab from './components/ArticlesTab'
import PatternsTab from './components/PatternsTab'
import CommunityTab from './components/CommunityTab'
import AccountTab from './components/AccountTab'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('articles')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleAnalysisComplete = (result) => {
    // Trigger a refresh of the articles tab
    setRefreshTrigger(prev => prev + 1)
    console.log('Analysis completed:', result)
  }

  const handleArticleClick = (article) => {
    // Handle article click - could open overlay or navigate
    console.log('Article clicked:', article)
    // This would integrate with your existing overlay system
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'articles':
        return (
          <ArticlesTab 
            key={refreshTrigger} // Force refresh when new analysis completes
            onArticleClick={handleArticleClick} 
          />
        )
      case 'patterns':
        return <PatternsTab />
      case 'community':
        return <CommunityTab />
      case 'account':
        return <AccountTab />
      default:
        return <ArticlesTab onArticleClick={handleArticleClick} />
    }
  }

  return (
    <div className="h-full w-full flex flex-col bg-white overflow-hidden min-w-[280px]">
      <div className="w-full h-full flex flex-col min-w-0 min-h-0" style={{backgroundColor: 'white'}}>

        {/* Tab Dropdown Navigation */}
        <div className="flex-shrink-0 p-2">
          <TabDropdown activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Fixed Generate Button Section - Only show on Discover tab */}
        {activeTab === 'articles' && (
          <div className="flex-shrink-0 px-2 pb-2">
            <GenerateButton onAnalysisComplete={handleAnalysisComplete} />
          </div>
        )}

        {/* Dynamic Tab Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 min-h-0 px-2 pb-2">
          {renderTabContent()}
        </main>

      </div>
    </div>
  )
}

export default App