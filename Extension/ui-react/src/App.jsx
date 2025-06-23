import React, { useState } from 'react'
import { ChevronDown, Search, Plus } from 'lucide-react'
import NavigationHeader from './components/NavigationHeader'
import ArticlesTab from './components/ArticlesTab'
import PatternsTab from './components/PatternsTab'
import CommunityTab from './components/CommunityTab'
import AccountTab from './components/AccountTab'
import './index.css'

function App() {
  console.log('App component rendering')
  const [activeTab, setActiveTab] = useState('articles')
  const [showActionsDropdown, setShowActionsDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')


  const handleArticleClick = (article) => {
    // Handle article click - could open overlay or navigate
    console.log('Article clicked:', article)
    // This would integrate with your existing overlay system
  }

  const [selectedCount, setSelectedCount] = useState(0)
  const [articlesTabActions, setArticlesTabActions] = useState(null)
  
  console.log('Current state:', { 
    selectedCount, 
    articlesTabActions: articlesTabActions ? 'Actions Available' : 'No Actions', 
    showActionsDropdown,
    actionsKeys: articlesTabActions ? Object.keys(articlesTabActions) : 'none'
  })

  const handleSelectAll = () => {
    console.log('handleSelectAll called', articlesTabActions)
    articlesTabActions?.selectAll()
    setShowActionsDropdown(false)
  }

  const handleExportCSV = () => {
    console.log('handleExportCSV called', articlesTabActions)
    articlesTabActions?.exportToCSV()
    setShowActionsDropdown(false)
  }

  const handleCancel = () => {
    console.log('handleCancel called', articlesTabActions)
    articlesTabActions?.clearSelection()
    setShowActionsDropdown(false)
  }

  const handleDelete = () => {
    console.log('handleDelete called', articlesTabActions)
    articlesTabActions?.deleteSelected()
    setShowActionsDropdown(false)
  }

  const handleGenerate = async () => {
    try {
      console.log('Generate analysis clicked')
      if (window.extensionServices && window.extensionServices.api) {
        await window.extensionServices.api.analyzeArticle()
        console.log('Analysis started')
      } else {
        console.log('Extension services not available')
      }
    } catch (error) {
      console.error('Failed to generate analysis:', error)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'articles':
        return (
          <ArticlesTab 
            onArticleClick={handleArticleClick}
            onSelectionChange={setSelectedCount}
            searchQuery={searchQuery}
          />
        )
      case 'patterns':
        return <PatternsTab />
      case 'community':
        return <CommunityTab />
      case 'account':
        return <AccountTab />
      default:
        return <ArticlesTab onArticleClick={handleArticleClick} onSelectionChange={setSelectedCount} searchQuery={searchQuery} />
    }
  }

  return (
    <div className="h-screen w-full flex flex-col min-w-[280px] bg-white">
      
      {/* Fixed Navigation Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200">
        <NavigationHeader activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Generate Button - only show on articles tab */}
      {activeTab === 'articles' && (
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-3 py-2">
          <button
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2.5 px-4 rounded-md transition-colors"
          >
            <Plus size={16} />
            Generate Analysis
          </button>
        </div>
      )}

      {/* Search Bar - only show on articles tab */}
      {activeTab === 'articles' && (
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-3 py-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles and tickers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-0 focus:border-gray-300"
            />
          </div>
        </div>
      )}

      {/* Fixed Selection Banner */}
      {selectedCount > 0 && activeTab === 'articles' && (
        <div className="flex-shrink-0 bg-purple-100 border-b border-purple-200 p-3 flex items-center justify-between px-4">
          <span className="text-xs text-purple-700 font-medium">
            {selectedCount} selected
          </span>
          <div className="relative">
            <button 
              onClick={() => setShowActionsDropdown(!showActionsDropdown)}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1"
            >
              Actions
              <ChevronDown size={12} />
            </button>
            
            {showActionsDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[140px]">
                <button 
                  onClick={handleSelectAll}
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 first:rounded-t-md"
                >
                  Select All
                </button>
                <button 
                  onClick={handleExportCSV}
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Export to CSV
                </button>
                <button 
                  onClick={handleCancel}
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 last:rounded-b-md"
                >
                  Delete
                </button>
              </div>
            )}
            
            {showActionsDropdown && (
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowActionsDropdown(false)}
              />
            )}
          </div>
        </div>
      )}

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-white">
        {/* Dynamic Tab Content */}
        <main className="px-2 pt-2 pb-2">
          {renderTabContent()}
        </main>
      </div>
    </div>
  )
}

export default App