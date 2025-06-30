import React, { useState, useRef } from 'react'
import { ChevronDown, Search, Plus } from 'lucide-react'
import NavigationHeader from './components/NavigationHeader'
import ArticlesTab from './components/ArticlesTab'
import PatternsTab from './components/PatternsTab'
import CommunityTab from './components/CommunityTab'
import AccountTab from './components/AccountTab'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import ArticleClusterGraph from './components/ArticleClusterGraph'
import './index.css'

function App() {
  console.log('App component rendering')
  const [activeTab, setActiveTab] = useState('articles')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const articlesTabRef = useRef(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState(null)


  const handleArticleClick = (article) => {
    console.log('Article clicked:', article)
    setSelectedArticle(article)
    setDrawerOpen(true)
  }

  const [selectedCount, setSelectedCount] = useState(0)

  const handleCancelSelection = () => {
    console.log('Cancel button clicked!')
    console.log('articlesTabRef.current:', articlesTabRef.current)
    try {
      if (articlesTabRef.current && articlesTabRef.current.clearSelection) {
        console.log('Calling clearSelection...')
        articlesTabRef.current.clearSelection()
        console.log('clearSelection called successfully')
      } else {
        console.error('clearSelection function not available on ref')
      }
    } catch (error) {
      console.error('Error in handleCancelSelection:', error)
    }
  }

  const handleSelectAll = () => {
    console.log('Select All button clicked!')
    console.log('articlesTabRef.current:', articlesTabRef.current)
    try {
      if (articlesTabRef.current && articlesTabRef.current.selectAll) {
        console.log('Calling selectAll...')
        articlesTabRef.current.selectAll()
        console.log('selectAll called successfully')
      } else {
        console.error('selectAll function not available on ref')
      }
    } catch (error) {
      console.error('Error in handleSelectAll:', error)
    }
  }

  const handleDeleteSelected = () => {
    console.log('Delete button clicked!')
    console.log('articlesTabRef.current:', articlesTabRef.current)
    try {
      if (articlesTabRef.current && articlesTabRef.current.deleteSelected) {
        console.log('Calling deleteSelected...')
        articlesTabRef.current.deleteSelected()
        console.log('deleteSelected called successfully')
      } else {
        console.error('deleteSelected function not available on ref')
      }
    } catch (error) {
      console.error('Error in handleDeleteSelected:', error)
    }
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
            ref={articlesTabRef}
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
        return <ArticlesTab ref={articlesTabRef} onArticleClick={handleArticleClick} onSelectionChange={setSelectedCount} searchQuery={searchQuery} />
    }
  }

  return (
    <>
      <div className="h-screen w-full flex flex-col min-w-[280px] bg-white">
      
      {/* Fixed Navigation Header */}
      <div className="flex-shrink-0">
        <NavigationHeader 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          onGenerate={handleGenerate}
        />
      </div>


      {/* Generate Analysis Button - only show on articles tab */}
      {activeTab === 'articles' && (
        <div className="flex-shrink-0 bg-white px-3 pt-2 pb-1">
          <button
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors"
          >
            <Plus size={14} className="text-purple-600" />
            <span className="text-xs font-medium text-purple-700">Generate Analysis</span>
          </button>
        </div>
      )}

      {/* Search Bar - only show on articles tab */}
      {activeTab === 'articles' && (
        <div className="flex-shrink-0 bg-white px-3 pt-1 pb-2 sticky top-0 z-10">
          {!isSearchExpanded ? (
            /* Search Button */
            <button
              onClick={() => setIsSearchExpanded(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
            >
              <Search size={14} className="text-gray-600" />
              <span className="text-xs font-medium text-gray-700">Search</span>
            </button>
          ) : (
            /* Expanded Search Input */
            <div className="relative bg-gray-50 border border-gray-200 rounded-md">
              <Search size={14} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600" />
              <input
                type="text"
                placeholder="Search articles and tickers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => {
                  if (!searchQuery.trim()) {
                    setIsSearchExpanded(false)
                  }
                }}
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-transparent border-0 focus:outline-none placeholder-gray-500 text-gray-700"
              />
            </div>
          )}
          
          {/* Selection Banner - appears before fade effect */}
          {selectedCount > 0 && activeTab === 'articles' && (
            <div className="pt-4 pb-2 flex items-center justify-between px-4">
              <span className="text-xs text-purple-600 font-medium">
                {selectedCount} selected
              </span>
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleSelectAll}
                  className="text-xs text-gray-600 font-medium hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <button 
                  onClick={handleCancelSelection}
                  className="text-xs text-gray-600 font-medium hover:underline cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteSelected}
                  className="text-xs text-red-600 font-medium hover:underline cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
          
          {/* Fade effect for content scrolling behind */}
          <div className="absolute -bottom-2 left-0 right-0 h-2 bg-gradient-to-b from-white to-transparent pointer-events-none"></div>
        </div>
      )}

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-white scroll-smooth">
        {/* Dynamic Tab Content */}
        <main className="px-3 pt-2 pb-2">
          {renderTabContent()}
        </main>
      </div>
      </div>

      {/* Drawer for Article Details */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="text-base font-semibold text-gray-900">
              {selectedArticle?.title || 'Article Details'}
            </DrawerTitle>
          </DrawerHeader>
          
          <div className="px-6 pb-6 pt-2 space-y-4 overflow-y-auto">
            {/* Stock Relationships Cluster Graph */}
            {selectedArticle && (
              <div>
                <ArticleClusterGraph article={selectedArticle} />
              </div>
            )}
            
            {/* Mock Summary */}
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Summary</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                This article discusses the latest quarterly earnings report showing strong revenue growth 
                driven by increased market demand. Key highlights include a 23% year-over-year increase 
                in revenue and expansion into new markets.
              </p>
            </div>
            
            {/* Mock Key Points */}
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Key Points</h4>
              <ul className="space-y-1">
                <li className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>Revenue increased by 23% YoY to $2.3B</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>Operating margins improved to 18.5%</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>Guidance raised for next quarter</span>
                </li>
              </ul>
            </div>
            
            {/* Mock Sentiment */}
            <div className="flex items-center gap-3">
              <h4 className="text-xs font-semibold text-gray-700">Sentiment:</h4>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Positive
              </span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button className="flex-1 px-3 py-2 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors">
                View Full Analysis
              </button>
              <button className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                Open Article
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default App