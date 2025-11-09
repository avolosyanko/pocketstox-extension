import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ServiceProvider, useAPI, useStorage } from './contexts/ServiceContext'
import NavigationHeader from './components/NavigationHeader'
import ArticlesTab from './components/ArticlesTab'
import CommunityTab from './components/CommunityTab'
import AccountTab from './components/AccountTab'
import { FileText, ThumbsUp, ThumbsDown, Plus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { semanticTypography, componentSpacing } from '@/styles/typography'
import './index.css'

function AppContent() {
  console.log('App component rendering')
  const [activeTab, setActiveTab] = useState('articles')
  
  // Search state management
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  
  // Clear search when switching tabs
  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    if (tabId !== 'articles') {
      setSearchQuery('')
      setShowSearch(false)
    }
  }
  
  // Use modern service hooks
  const api = useAPI()
  const storage = useStorage()
  const articlesTabRef = useRef(null)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [articleFeedback, setArticleFeedback] = useState({})
  const [showFeedbackThanks, setShowFeedbackThanks] = useState({})
  const [addedToWatchlist, setAddedToWatchlist] = useState({})

  // Format date function - consistent with ArticlesTab
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    
    // Check if it's today
    const isToday = date.toDateString() === now.toDateString()
    
    if (isToday) {
      // Use relative time for today
      if (diffMins < 1) return 'Just now'
      if (diffMins === 1) return '1 min ago'
      if (diffMins < 60) return `${diffMins} mins ago`
      if (diffHours === 1) return '1 hour ago'
      return `${diffHours} hours ago`
    }
    
    // Use formatted date for all other days
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[date.getMonth()]
    const day = date.getDate()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    
    return `${day} ${month}, ${hours}:${minutes}`
  }


  const handleArticleClick = (article) => {
    try {
      console.log('Article clicked:', article)
      console.log('Article content fields:', {
        content: article.content,
        text: article.text,
        pageTitle: article.pageTitle,
        allKeys: Object.keys(article)
      })
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
        case 'runPipeline':
          console.log('Running pipeline from keyboard shortcut');
          // Switch to articles tab if not already there
          if (activeTab !== 'articles') {
            setActiveTab('articles');
          }
          // Trigger the pipeline by calling handleRunStep through ref
          setTimeout(() => {
            if (articlesTabRef.current && articlesTabRef.current.runPipeline) {
              articlesTabRef.current.runPipeline();
            }
          }, 100);
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
  }, [activeTab]);

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

  const handleGenerate = useCallback(async () => {
    try {
      console.log('Generate analysis clicked')
      await api.analyzeArticle()
      console.log('Analysis started')
    } catch (error) {
      console.error('Failed to generate analysis:', error)
    }
  }, [api])

  const handleAddToWatchlist = useCallback(async (ticker, company, articleTitle) => {
    try {
      const watchlistItem = {
        ticker: ticker,
        company: company,
        reason: `Added from article: "${articleTitle}"`,
        hasAlert: false
      }

      // Store in extension storage using modern service
      await storage.addToWatchlist(watchlistItem)

      // Update UI state
      setAddedToWatchlist(prev => ({
        ...prev,
        [ticker]: true
      }))

      console.log('Added to watchlist:', ticker)
    } catch (error) {
      console.error('Failed to add to watchlist:', error)
    }
  }, [storage])

  const handleNavigateToArticle = (articleUrl, fallbackTitle = null, fallbackTicker = null) => {
    console.log('handleNavigateToArticle called with:', { articleUrl, fallbackTitle, fallbackTicker })
    // Switch to articles (discover) tab
    setActiveTab('articles')
    
    // Trigger article highlighting/opening via ArticlesTab ref
    setTimeout(() => {
      if (articlesTabRef.current && articlesTabRef.current.highlightArticleByUrl) {
        articlesTabRef.current.highlightArticleByUrl(articleUrl, fallbackTitle, fallbackTicker)
      }
    }, 100)
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
            activeTab={activeTab}
            searchQuery={searchQuery}
          />
        )
      case 'community':
        return <CommunityTab />
      case 'account':
        return <AccountTab onNavigateToArticle={handleNavigateToArticle} onTabChange={handleTabChange} />
      default:
        return <ArticlesTab ref={articlesTabRef} onArticleClick={handleArticleClick} onSelectionChange={setSelectedCount} onGenerate={handleGenerate} activeTab={activeTab} searchQuery={searchQuery} />
    }
  }

  return (
    <>
      <div className="h-screen w-full flex flex-col min-w-[280px] bg-white">
      
      {/* Fixed Navigation Header */}
      <div className="flex-shrink-0">
        <NavigationHeader 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showSearch={showSearch}
          onToggleSearch={setShowSearch}
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
              <div className={componentSpacing.navPadding}>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setOverlayOpen(false)}
                    className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    ←
                  </button>
                  <div className="flex-1 min-w-0">
                    <h1 className={cn(semanticTypography.cardTitle)}>
                      Pocketstox
                    </h1>
                  </div>
                </div>
              </div>
            </div>


            {/* Analysis Content */}
            <div className="flex-1 overflow-y-auto">
              <div className={componentSpacing.contentPadding}>

                {/* Related Stock Section (Singular) */}
                <div className="mb-6">
                  <div className="mb-3 px-1">
                    <h2 className={cn(semanticTypography.cardTitle)}>Related Stock</h2>
                  </div>

                  <div className="ml-2">
                    {selectedArticle.matches && selectedArticle.matches.length > 0 ? (
                      <div className="bg-white rounded-lg border border-gray-200">
                        {selectedArticle.matches.slice(0, 1).map((match, index) => {
                        const confidence = match.score || Math.random() * 0.4 + 0.6;

                        return (
                          <div key={index}>
                            <div
                              className="relative cursor-pointer transition-all duration-300 group hover:bg-gray-50 border-transparent rounded-lg"
                              onClick={() => window.open(`https://finance.yahoo.com/quote/${match.ticker}`, '_blank')}
                            >
                              <div className="px-4 py-3">
                                <div className="flex-1 min-w-0">
                                  {/* Stock Ticker */}
                                  <div className="flex items-center justify-between mb-1">
                                    <h3 className={cn(semanticTypography.cardTitle, "font-medium")}>
                                      {match.ticker}
                                    </h3>
                                    <div className="px-2 py-0.5 bg-gray-100 text-gray-900 rounded-full text-xs font-medium">
                                      {(confidence * 100).toFixed(0)}%
                                    </div>
                                  </div>

                                  {/* Company name */}
                                  <p className={cn(semanticTypography.secondaryText, "mb-1")}>
                                    {match.company || match.ticker}
                                  </p>

                                  {/* Source */}
                                  <div className={cn("flex items-center gap-2", semanticTypography.metadata)}>
                                    <span>Source: Financial news vectorstore</span>
                                  </div>

                                  {/* Action buttons */}
                                  <div className="mt-3 flex items-center gap-3">
                                    {addedToWatchlist[match.ticker] ? (
                                      <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                                        <Check size={12} strokeWidth={2} />
                                        <span>Added to watchlist</span>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleAddToWatchlist(match.ticker, match.company || match.ticker, selectedArticle.title)
                                        }}
                                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                                      >
                                        <Plus size={12} strokeWidth={2} />
                                        <span>Watchlist</span>
                                      </button>
                                    )}

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        window.open('https://pocketstox.com/how-it-works', '_blank')
                                      }}
                                      className="text-xs text-gray-600 hover:text-gray-900 underline hover:no-underline transition-colors"
                                    >
                                      How this works?
                                    </button>
                                  </div>

                                  {/* Feedback Section */}
                                  {showFeedbackThanks[selectedArticle.id || selectedArticle.title] === 'thanks' ? (
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                      <div className="text-xs text-green-700 text-center">
                                        Thanks for your feedback.
                                      </div>
                                    </div>
                                  ) : showFeedbackThanks[selectedArticle.id || selectedArticle.title] === 'hidden' ? null : (
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-600">Was this helpful?</span>
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              const articleId = selectedArticle.id || selectedArticle.title
                                              setArticleFeedback(prev => ({
                                                ...prev,
                                                [articleId]: 'up'
                                              }))
                                              setShowFeedbackThanks(prev => ({
                                                ...prev,
                                                [articleId]: 'thanks'
                                              }))
                                              setTimeout(() => {
                                                setShowFeedbackThanks(prev => ({
                                                  ...prev,
                                                  [articleId]: 'hidden'
                                                }))
                                              }, 2000)
                                            }}
                                            className="p-1.5 rounded-md transition-all text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                          >
                                            <ThumbsUp size={14} />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              const articleId = selectedArticle.id || selectedArticle.title
                                              setArticleFeedback(prev => ({
                                                ...prev,
                                                [articleId]: 'down'
                                              }))
                                              setShowFeedbackThanks(prev => ({
                                                ...prev,
                                                [articleId]: 'thanks'
                                              }))
                                              setTimeout(() => {
                                                setShowFeedbackThanks(prev => ({
                                                  ...prev,
                                                  [articleId]: 'hidden'
                                                }))
                                              }, 2000)
                                            }}
                                            className="p-1.5 rounded-md transition-all text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                          >
                                            <ThumbsDown size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="border-dashed border-2 border-gray-200 bg-white rounded-lg">
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="rounded-full bg-gray-100 p-3 mb-4">
                          <FileText size={24} className="text-gray-400" />
                        </div>
                        <h3 className={semanticTypography.emptyStateTitle}>No stock matches found</h3>
                        <p className={cn(semanticTypography.emptyStateDescription, "max-w-xs")}>
                          This article may not contain specific company mentions
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                </div>

                {/* Sources Section */}
                <div className="mb-6">
                  <div className="mb-3 px-1">
                    <h2 className={cn(semanticTypography.cardTitle)}>Sources</h2>
                  </div>

                  <div className="ml-2">
                    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                      {/* Document Excerpt */}
                      <div>
                        <div className="text-sm font-medium text-gray-900 mb-1">Document Excerpt:</div>
                        <div className="bg-gray-50 px-3 py-2 rounded text-xs text-gray-600 italic">
                          {(() => {
                            const content = selectedArticle.content || selectedArticle.text || '';
                            if (!content) return 'No source content available';
                            return content.length > 150 ? `${content.substring(0, 150)}...` : content;
                          })()}
                        </div>
                      </div>

                      {/* Document Details */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Document Type:</span>
                          <span className="text-gray-900 font-medium">Financial Article</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Source:</span>
                          <span className="text-gray-900 font-medium">
                            {selectedArticle.url ?
                              selectedArticle.url.replace(/^https?:\/\//, '').split('/')[0].replace('www.', '') :
                              'Unknown'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Publication Date:</span>
                          <span className="text-gray-900 font-medium">
                            {selectedArticle.timestamp ?
                              new Date(selectedArticle.timestamp).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) :
                              'Unknown'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Content Length:</span>
                          <span className="text-gray-900 font-medium">
                            {(() => {
                              const content = selectedArticle.content || selectedArticle.text || '';
                              const wordCount = content.trim().split(/\s+/).length;
                              return `${wordCount} word${wordCount !== 1 ? 's' : ''}`;
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Section */}
                <div className="mb-6">
                  <div className="mb-3 px-1">
                    <h2 className={cn(semanticTypography.cardTitle)}>Input</h2>
                  </div>

                  <div className="ml-2">
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                      {/* Article Title */}
                      <div className="text-sm font-semibold text-gray-900 mb-2">
                        {selectedArticle.title || 'Untitled Article'}
                      </div>
                      <div className="text-xs text-gray-600">
                        {(() => {
                          const content = selectedArticle.content || selectedArticle.text || '';
                          if (!content) return 'No content available';
                          return 'No content available';
                        })()}
                      </div>

                      {/* Article Meta Info */}
                      <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
                        {selectedArticle.url && (
                          <>
                            <img
                              src={`https://www.google.com/s2/favicons?sz=16&domain=${selectedArticle.url.replace(/^https?:\/\//, '').split('/')[0]}`}
                              alt=""
                              className="w-3 h-3"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                            <span>{selectedArticle.url.replace(/^https?:\/\//, '').split('/')[0].replace('www.', '')}</span>
                          </>
                        )}
                        <span className="text-gray-400">•</span>
                        <span>
                          {selectedArticle.timestamp ?
                            new Date(selectedArticle.timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) :
                            'Recent'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

function App() {
  return (
    <ServiceProvider>
      <AppContent />
    </ServiceProvider>
  )
}

export default App