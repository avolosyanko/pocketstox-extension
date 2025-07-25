import React, { useState, useRef, useEffect } from 'react'
import NavigationHeader from './components/NavigationHeader'
import ArticlesTab from './components/ArticlesTab'
import CommunityTab from './components/CommunityTab'
import AccountTab from './components/AccountTab'
import ArticleClusterGraphObsidian from './components/ArticleClusterGraphObsidian'
import { semanticTypography, componentSpacing } from '@/styles/typography'
import './index.css'

function App() {
  console.log('App component rendering')
  const [activeTab, setActiveTab] = useState('articles')
  const articlesTabRef = useRef(null)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState(null)


  const handleArticleClick = (article) => {
    try {
      console.log('Article clicked:', article)
      if (!article) {
        console.error('Article is null or undefined')
        return
      }
      
      // If overlay is already open with same article, close it
      if (overlayOpen && selectedArticle && 
          (selectedArticle.id === article.id || selectedArticle.title === article.title)) {
        setOverlayOpen(false)
        setSelectedArticle(null)
        return
      }
      
      // Close current overlay and open new one
      if (overlayOpen) {
        setOverlayOpen(false)
        // Small delay to allow cleanup before opening new overlay
        setTimeout(() => {
          setSelectedArticle(article)
          setOverlayOpen(true)
        }, 100)
      } else {
        setSelectedArticle(article)
        setOverlayOpen(true)
      }
    } catch (error) {
      console.error('Error handling article click:', error)
      // Reset state if error occurs
      setOverlayOpen(false)
      setSelectedArticle(null)
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

  // Handle Escape key for overlay
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && overlayOpen) {
        setOverlayOpen(false)
      }
    }

    if (overlayOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [overlayOpen])

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
        <div className="flex-shrink-0 bg-white px-3 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between px-1">
            <span className={`${semanticTypography.secondaryText} font-semibold`}>
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
                  className={`${semanticTypography.secondaryText} text-red-600 hover:text-red-700 cursor-pointer select-none transition-colors`}
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

      {/* Full Coverage Overlay for Article Analysis */}
      {overlayOpen && selectedArticle && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40" 
            onClick={() => setOverlayOpen(false)}
          />
          
          {/* Full Coverage Overlay Content */}
          <div className="fixed inset-0 z-50 flex flex-col bg-white">
            {/* Custom Header Bar */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200">
              <div className="px-4 py-3 flex items-center gap-3">
                <button
                  onClick={() => setOverlayOpen(false)}
                  className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  ←
                </button>
                <div className="flex-1 min-w-0">
                  <h1 className="text-sm font-semibold text-gray-900 line-clamp-1">
                    {selectedArticle.title}
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    {selectedArticle.url && (
                      <>
                        <span>{selectedArticle.url.replace(/^https?:\/\//, '').split('/')[0].replace('www.', '')}</span>
                        <span>•</span>
                      </>
                    )}
                    <span>
                      {selectedArticle.timestamp ? 
                        new Date(selectedArticle.timestamp).toLocaleDateString() : 
                        'Recent'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-4 space-y-6">
                {/* Enhanced Stock Suggestions Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Stock Suggestions</h3>
                  <div className="flex items-center gap-2">
                    <select className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white">
                      <option>Relevance</option>
                      <option>Confidence</option>
                      <option>Alphabetical</option>
                    </select>
                  </div>
                </div>

                {/* Enhanced Stock Cards Grid */}
                <div className="grid gap-3">
                  {selectedArticle.matches && selectedArticle.matches.length > 0 ? (
                    selectedArticle.matches.slice(0, 6).map((match, index) => {
                      const confidence = match.score || Math.random() * 0.4 + 0.6; // Mock confidence if not available
                      const confidenceLevel = confidence > 0.8 ? 'high' : confidence > 0.6 ? 'medium' : 'low';
                      const mockPrice = (Math.random() * 200 + 50).toFixed(2);
                      const mockChange = (Math.random() * 10 - 5).toFixed(2);
                      const isPositive = parseFloat(mockChange) > 0;
                      
                      return (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer group">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">
                                  {match.ticker}
                                </h4>
                                <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  confidenceLevel === 'high' ? 'bg-green-100 text-green-700' :
                                  confidenceLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {(confidence * 100).toFixed(0)}%
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 truncate">
                                {match.company || match.ticker}
                              </p>
                            </div>
                            <div className="text-right ml-3">
                              <div className="text-sm font-semibold text-gray-900">${mockPrice}</div>
                              <div className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {isPositive ? '+' : ''}{mockChange}
                              </div>
                            </div>
                          </div>
                          
                          {/* Confidence Bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                              <span>Relevance Score</span>
                              <span>{(confidence * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full ${
                                  confidenceLevel === 'high' ? 'bg-green-500' :
                                  confidenceLevel === 'medium' ? 'bg-yellow-500' :
                                  'bg-gray-400'
                                }`}
                                style={{ width: `${confidence * 100}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Key Insights */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Exchange</span>
                              <span className="text-gray-900 font-medium">{match.exchange || 'NASDAQ'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Sector Impact</span>
                              <span className={`font-medium ${
                                selectedArticle.sentiment === 'positive' ? 'text-green-600' :
                                selectedArticle.sentiment === 'negative' ? 'text-red-600' :
                                'text-gray-600'
                              }`}>
                                {selectedArticle.sentiment?.charAt(0).toUpperCase() + selectedArticle.sentiment?.slice(1) || 'Neutral'}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons - Show on Hover */}
                          <div className="mt-3 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex gap-2">
                              <button className="flex-1 px-3 py-1.5 text-xs font-medium text-purple-600 border border-purple-200 rounded-md hover:bg-purple-50 transition-colors">
                                View Details
                              </button>
                              <button className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                                Add to List
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                            <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <p className="text-sm text-gray-600 font-medium mb-1">No stock matches found</p>
                        <p className="text-xs text-gray-500">This article may not contain specific company mentions</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Summary Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Market Impact Analysis</h3>
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-purple-600">
                          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">AI-Generated Insights</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {selectedArticle.content && selectedArticle.content.length > 200 
                            ? selectedArticle.content.substring(0, 250) + '...'
                            : selectedArticle.content || 'This analysis examines the potential market impact of the article content, identifying key companies and sectors that may be affected by the discussed events or trends.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactive Graph Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Relationship Network</h3>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="min-h-[200px]">
                      {(() => {
                        try {
                          return <ArticleClusterGraphObsidian key={selectedArticle?.id || selectedArticle?.title} article={selectedArticle} />
                        } catch (error) {
                          console.error('Error rendering ArticleClusterGraphObsidian:', error)
                          return (
                            <div className="flex items-center justify-center h-48 text-gray-500 bg-gray-50">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                    <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                                <p className="text-sm text-gray-600 font-medium mb-1">Graph temporarily unavailable</p>
                                <p className="text-xs text-gray-500">Stock relationships are being processed</p>
                              </div>
                            </div>
                          )
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Action Footer */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-3">
              <div className="space-y-3">
                {/* Quick Stats Bar */}
                <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{selectedArticle.matches ? selectedArticle.matches.length : 0} stocks identified</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Analyzed {selectedArticle.timestamp ? new Date(selectedArticle.timestamp).toLocaleDateString() : 'today'}</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => selectedArticle.url && window.open(selectedArticle.url, '_blank')}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="15,3 21,3 21,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Read Article
                  </button>
                  <button className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Save Analysis
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default App