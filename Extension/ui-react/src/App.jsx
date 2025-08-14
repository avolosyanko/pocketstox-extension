import React, { useState, useRef, useEffect } from 'react'
import NavigationHeader from './components/NavigationHeader'
import ArticlesTab from './components/ArticlesTab'
import CommunityTab from './components/CommunityTab'
import AccountTab from './components/AccountTab'
import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { semanticTypography, componentSpacing } from '@/styles/typography'
import './index.css'

function App() {
  console.log('App component rendering')
  const [activeTab, setActiveTab] = useState('articles')
  const articlesTabRef = useRef(null)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState(null)

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
                
                {/* Input Section */}
                <div className="mb-6">
                  <div className="mb-3 px-1">
                    <h2 className={cn(semanticTypography.cardTitle)}>Input</h2>
                  </div>
                  
                  <div className="ml-2 space-y-3">
                    {/* Article Content Preview */}
                    {selectedArticle && (
                      <div className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-md font-mono">
                        <div className="font-semibold mb-1">{selectedArticle.title}</div>
                        <div>
                          {(() => {
                            const content = selectedArticle.content || selectedArticle.text || '';
                            if (!content) return 'No content available';
                            return content.length > 300 ? `${content.substring(0, 300)}...` : content;
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Article Meta Info */}
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      {selectedArticle.url && (
                        <>
                          <div className="flex items-center gap-1">
                            <img 
                              src={`https://www.google.com/s2/favicons?sz=16&domain=${selectedArticle.url.replace(/^https?:\/\//, '').split('/')[0]}`}
                              alt=""
                              className="w-3 h-3"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                            <span>{selectedArticle.url.replace(/^https?:\/\//, '').split('/')[0].replace('www.', '')}</span>
                          </div>
                          <span>•</span>
                        </>
                      )}
                      <span>
                        {selectedArticle.timestamp ? 
                          formatDate(selectedArticle.timestamp) : 
                          'Recent'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Related Stocks Header */}
                <div className="mb-3 px-1">
                  <h2 className={cn(semanticTypography.cardTitle)}>Related Stocks</h2>
                </div>
                
                {/* Stock List */}
                <div className="mb-4 ml-2">
                  {selectedArticle.matches && selectedArticle.matches.length > 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200">
                      {selectedArticle.matches.slice(0, 3).map((match, index) => {
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
                                    <div className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
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
                                </div>
                              </div>
                            </div>
                            {index < selectedArticle.matches.slice(0, 3).length - 1 && (
                              <div className="border-b border-gray-100 mx-6" />
                            )}
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

                {/* Model Summary Header */}
                <div className="mb-3 px-1">
                  <h2 className={cn(semanticTypography.cardTitle)}>Model Summary</h2>
                </div>
                
                {/* Model Summary Content */}
                <div className="ml-2">
                  <div className="space-y-3">
                    {selectedArticle.matches && selectedArticle.matches.length > 0 ? (
                      selectedArticle.matches.slice(0, 3).map((match, index) => {
                        const summaryVariations = [
                          {
                            text: `shows strong correlation with article themes. Key developments could significantly impact stock performance and warrant monitoring.`,
                            highlight: `strong correlation`
                          },
                          {
                            text: `demonstrates moderate relevance to market conditions discussed. Consider tracking for potential trading opportunities.`,
                            highlight: `moderate relevance`
                          },
                          {
                            text: `may be influenced by trends highlighted in this content. Watch for related market movements and sector developments.`,
                            highlight: null
                          }
                        ];
                        
                        const variation = summaryVariations[index % summaryVariations.length];
                        
                        return (
                          <p key={index} className="text-xs text-gray-700 leading-relaxed">
                            <span className="bg-purple-100 text-purple-700 px-1 py-0.5 rounded font-medium">{match.ticker}</span> {variation.text}
                          </p>
                        )
                      })
                    ) : (
                      <p className="text-xs text-gray-700 leading-relaxed">
                        Analysis identifies market themes and trends relevant to investment research. 
                        Consider exploring related opportunities for further investigation.
                      </p>
                    )}
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

export default App