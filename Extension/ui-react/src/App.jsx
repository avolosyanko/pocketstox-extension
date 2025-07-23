import React, { useState, useRef, useEffect } from 'react'
import NavigationHeader from './components/NavigationHeader'
import ArticlesTab from './components/ArticlesTab'
import CommunityTab from './components/CommunityTab'
import AccountTab from './components/AccountTab'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import ArticleClusterGraphObsidian from './components/ArticleClusterGraphObsidian'
import { semanticTypography, getTypographyClass, componentSpacing } from '@/styles/typography'
import './index.css'

function App() {
  console.log('App component rendering')
  const [activeTab, setActiveTab] = useState('articles')
  const articlesTabRef = useRef(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState(null)


  const handleArticleClick = (article) => {
    try {
      console.log('Article clicked:', article)
      if (!article) {
        console.error('Article is null or undefined')
        return
      }
      setSelectedArticle(article)
      setDrawerOpen(true)
    } catch (error) {
      console.error('Error handling article click:', error)
    }
  }

  const [selectedCount, setSelectedCount] = useState(0)

  // Listen for messages from background script
  useEffect(() => {
    const handleMessage = (message) => {
      console.log('App received message:', message);
      switch (message.action) {
        case 'closeSidePanel':
          console.log('Closing side panel with window.close()');
          window.close();
          break;
        default:
          break;
      }
    };

    // Listen for messages from background script
    if (chrome?.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(handleMessage);
      
      return () => {
        chrome.runtime.onMessage.removeListener(handleMessage);
      };
    }
  }, []);

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
            onGenerate={handleGenerate}
          />
        )
      case 'community':
        return <CommunityTab />
      case 'account':
        return <AccountTab />
      default:
        return <ArticlesTab ref={articlesTabRef} onArticleClick={handleArticleClick} onSelectionChange={setSelectedCount} onGenerate={handleGenerate} />
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



      {/* Selection Banner - only show on articles tab */}
      {activeTab === 'articles' && selectedCount > 0 && (
        <div className="flex-shrink-0 bg-white px-3 pt-1 pb-3">
          <div className="flex items-center justify-between px-1">
            <span className={getTypographyClass('keyMetric', { size: 'large' })}>
                {selectedCount} selected
              </span>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleSelectAll}
                  className={`${semanticTypography.secondaryText} hover:text-gray-900 cursor-pointer select-none transition-colors`}
                >
                  Select All
                </button>
                <button 
                  onClick={handleCancelSelection}
                  className={`${semanticTypography.secondaryText} hover:text-gray-900 cursor-pointer select-none transition-colors`}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteSelected}
                  className={`${getTypographyClass('errorMessage', { color: 'error' })} hover:text-red-700 cursor-pointer select-none transition-colors`}
                >
                  Delete
                </button>
              </div>
            </div>
        </div>
      )}

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-25 scroll-smooth">
        {/* Dynamic Tab Content */}
        <main className={componentSpacing.contentPadding}>
          {renderTabContent()}
        </main>
      </div>
      </div>

      {/* Drawer for Article Details */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className={semanticTypography.drawerTitle}>
              {selectedArticle?.title || 'Article Details'}
            </DrawerTitle>
          </DrawerHeader>
          
          <div className="px-6 pb-6 pt-2 space-y-4 overflow-y-auto">
            {/* Stock Relationships Cluster Graph */}
            {selectedArticle && (
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-2">Relevance Scores</h4>
                <div className="min-h-[200px]">
                  {(() => {
                    try {
                      return <ArticleClusterGraphObsidian article={selectedArticle} />
                    } catch (error) {
                      console.error('Error rendering ArticleClusterGraphObsidian:', error)
                      return (
                        <div className="flex items-center justify-center h-48 text-gray-500">
                          <p>Unable to load graph visualization</p>
                        </div>
                      )
                    }
                  })()}
                </div>
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
              <h4 className={`${semanticTypography.cardTitle} mb-2`}>Key Points</h4>
              <ul className="space-y-1">
                <li className={`flex items-start gap-2 ${semanticTypography.secondaryText}`}>
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>Revenue increased by 23% YoY to $2.3B</span>
                </li>
                <li className={`flex items-start gap-2 ${semanticTypography.secondaryText}`}>
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>Operating margins improved to 18.5%</span>
                </li>
                <li className={`flex items-start gap-2 ${semanticTypography.secondaryText}`}>
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>Guidance raised for next quarter</span>
                </li>
              </ul>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button className={`flex-1 px-3 py-2 ${semanticTypography.secondaryButton} text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors`}>
                View Full Analysis
              </button>
              <button className={`flex-1 px-3 py-2 ${semanticTypography.secondaryButton} text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors`}>
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