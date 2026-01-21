import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ServiceProvider, useAPI, useStorage } from './contexts/ServiceContext'
import NavigationHeader from './components/NavigationHeader'
import ArticlesTab from './components/ArticlesTab'
import CompanyIcon from './components/CompanyIcon'
import { FileText, ThumbsUp, ThumbsDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { semanticTypography, componentSpacing } from '@/styles/typography'
import './index.css'

// Collapsible Section Component (Linear-style)
const CollapsibleSection = ({ title, defaultExpanded = false, children, rightElement }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="border-b border-gray-100 py-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-1 hover:opacity-70 transition-all px-4"
      >
        <span className="text-xs font-medium text-gray-700">{title}</span>
        <svg
          className="w-2 h-2 text-gray-400"
          fill="currentColor"
          viewBox="0 0 6 6"
        >
          {isExpanded ? (
            <path d="M0 1.5l3 3 3-3H0z" />
          ) : (
            <path d="M1.5 0l3 3-3 3V0z" />
          )}
        </svg>
        <div className="flex-1" />
        {rightElement}
      </button>
      {isExpanded && (
        <div className="mt-3 px-4">
          {children}
        </div>
      )}
    </div>
  )
}

// Property Row Component (Linear-style)
const PropertyRow = ({ label, children }) => (
  <div className="flex items-center py-1.5">
    <span className="text-xs text-gray-400 w-32 flex-shrink-0">{label}</span>
    <div className="text-xs text-gray-900 flex items-center">{children}</div>
  </div>
)

function AppContent() {
  console.log('App component rendering')
  const [activeTab, setActiveTab] = useState('articles')
  
  
  // Search state management
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  
  // Use modern service hooks
  const api = useAPI()
  const storage = useStorage()
  const articlesTabRef = useRef(null)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [articleFeedback, setArticleFeedback] = useState({})
  const [showFeedbackThanks, setShowFeedbackThanks] = useState({})
  const [articles, setArticles] = useState([])

  // Fetch articles for timeline feature
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const articleData = await storage.getArticles()
        setArticles(articleData || [])
      } catch (error) {
        console.error('Failed to fetch articles:', error)
        setArticles([])
      }
    }
    fetchArticles()
  }, [storage, overlayOpen])

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

  // Handle Escape key for overlays
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (overlayOpen) {
          setOverlayOpen(false)
        }
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
  }

  return (
    <>
      <div className="h-screen w-full flex flex-col min-w-[280px] bg-white">
      
      {/* Fixed Navigation Header */}
      <div className="flex-shrink-0 sticky top-0 z-30 bg-white">
        <NavigationHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
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
      <div className="relative flex-1 overflow-x-hidden overflow-y-auto scroll-smooth scrollbar-hide">
        {/* Gradient Background - scrolls with content */}
        <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-[#f0f4f8] via-[#f0f4f8]/50 to-transparent pointer-events-none"></div>

        {/* Dynamic Tab Content */}
        <main className={`relative ${componentSpacing.contentPadding}`}>
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
              <div className="px-3 py-1.5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setOverlayOpen(false)}
                    className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    ←
                  </button>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xs font-medium text-gray-900">
                      {selectedArticle?.id?.startsWith('company-') ? 'Notes' : 'Discover'}
                    </h1>
                  </div>
                </div>
              </div>
            </div>


            {/* Analysis Content */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <div className="py-4">

                {/* Check if this is a company (starts with 'company-') vs regular article */}
                {selectedArticle?.id?.startsWith('company-') ? (
                  // Company Note-Taking Interface
                  <>
                    {/* Company Header */}
                    <div className="mb-6">
                      <div className="mb-3 px-1">
                        <h2 className={cn(semanticTypography.cardTitle)}>Company Notes</h2>
                      </div>

                      <div className="ml-2">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className={cn(semanticTypography.cardTitle, "font-medium")}>
                              {selectedArticle.matches?.[0]?.ticker || 'TICKER'}
                            </h3>
                            <button
                              onClick={() => window.open(`https://finance.yahoo.com/quote/${selectedArticle.matches?.[0]?.ticker}`, '_blank')}
                              className="text-xs text-gray-600 hover:text-gray-900 underline hover:no-underline transition-colors"
                            >
                              View on Yahoo Finance
                            </button>
                          </div>
                          <p className={cn(semanticTypography.secondaryText)}>
                            {selectedArticle.matches?.[0]?.company || 'Company Name'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* All Notes Section */}
                    <div className="mb-6">
                      <div className="mb-3 px-1">
                        <h2 className={cn(semanticTypography.cardTitle)}>All Notes</h2>
                      </div>

                      <div className="ml-2 space-y-3">
                        {/* Note: In a real implementation, you'd fetch all notes for this company */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-xs text-gray-500">
                              {selectedArticle.timestamp ? 
                                new Date(selectedArticle.timestamp).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 
                                'Recent'
                              }
                            </span>
                            <button className="text-xs text-gray-400 hover:text-gray-600">
                              Edit
                            </button>
                          </div>
                          <p className="text-sm text-gray-900">
                            {selectedArticle.content || 'No notes available'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Add New Note Section */}
                    <div className="mb-6">
                      <div className="mb-3 px-1">
                        <h2 className={cn(semanticTypography.cardTitle)}>Add New Note</h2>
                      </div>

                      <div className="ml-2">
                        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                          <textarea
                            placeholder="Add your thoughts about this investment..."
                            className="w-full px-0 py-2 text-sm border-0 focus:outline-none resize-none placeholder:text-gray-400 bg-transparent"
                            rows={6}
                          />
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <span className="text-xs text-gray-500">
                              Note will be saved automatically
                            </span>
                            <button className="px-3 py-1.5 text-sm bg-gray-900 text-white hover:bg-gray-800 rounded-md transition-colors">
                              Save Note
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  // Regular Article Analysis Interface - Linear Style
                  <>
                    {selectedArticle?.matches && selectedArticle.matches.length > 0 ? (
                      <>
                        {selectedArticle.matches.slice(0, 1).map((match, index) => {
                          const confidence = match.score || Math.random() * 0.4 + 0.6;

                          return (
                            <div key={index}>
                              {/* Company Header */}
                              <div className="pt-4 px-4 pb-3">
                                {/* Logo and Name Row */}
                                <div className="flex items-center gap-3 mb-3">
                                  {/* Company Logo */}
                                  <CompanyIcon article={selectedArticle} size="lg" className="rounded-lg flex-shrink-0" />

                                  {/* Company Name and Badge */}
                                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 font-medium">
                                      {match.company || match.ticker} <span className="text-gray-500 font-normal">({match.ticker})</span>
                                    </p>
                                    <div className="inline-flex items-center px-3 py-1 bg-gray-900 rounded-md self-start">
                                      <span className="text-xs text-white">
                                        {(confidence * 100).toFixed(0)}% Match Confidence
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Properties Grid */}
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-400 w-16">Exchange</span>
                                    <span className="text-gray-900">{match.exchange || 'NASDAQ'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-400 w-16">Industry</span>
                                    <span className="text-gray-900">{match.industry || 'Technology'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-400 w-16">SIC Code</span>
                                    <span className="text-gray-900">{match.sic_code || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-2 col-span-2">
                                    <span className="text-gray-400 w-16">Yahoo</span>
                                    <a
                                      href={`https://finance.yahoo.com/quote/${match.ticker}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center text-gray-900 hover:text-blue-600 transition-colors"
                                    >
                                      <svg className="w-3 h-3 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                      Open
                                    </a>
                                  </div>
                                </div>
                              </div>

                              {/* Separator */}
                              <div className="border-b border-gray-100"></div>

                              {/* Sections - NO padding, borders touch edges */}
                              <div className="mb-6">
                                {/* Tags Section */}
                                <CollapsibleSection title="Tags" defaultExpanded={false}>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedArticle?.tags && Array.isArray(selectedArticle.tags) && selectedArticle.tags.length > 0 ? (
                                      selectedArticle.tags.map((tag, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md"
                                        >
                                          {tag}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-xs text-gray-400 italic">No tags added</span>
                                    )}
                                  </div>
                                </CollapsibleSection>

                                {/* Matched Sections */}
                                <CollapsibleSection title="Matched Sections" defaultExpanded={true}>
                                  <div className="space-y-4">
                                    {/* Section Match */}
                                    <div className="space-y-2">
                                      <div>
                                        <span className="text-xs font-medium text-gray-900">
                                          {match.section || 'Item 7 - Management Discussion & Analysis'}
                                        </span>
                                      </div>
                                      {match.subsection && (
                                        <div className="text-xs text-gray-600 ml-2">
                                          {match.subsection}
                                        </div>
                                      )}
                                      <div className="bg-gray-50 px-3 py-2 rounded text-xs text-gray-600 leading-relaxed italic">
                                        {match.excerpt || '"...our revenue growth accelerated to 15% year-over-year, driven primarily by increased adoption of our cloud services platform. Operating margins improved to 28%, reflecting operational efficiencies and economies of scale..."'}
                                      </div>
                                      {match.section_url && (
                                        <a
                                          href={match.section_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center text-xs text-gray-600 hover:text-gray-900 transition-colors"
                                        >
                                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                          </svg>
                                          Jump to section
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </CollapsibleSection>

                                {/* Article Details Section */}
                                <CollapsibleSection title="Article Details" defaultExpanded={false}>
                                  <PropertyRow label="Title">
                                    {selectedArticle.title || 'Untitled Article'}
                                  </PropertyRow>
                                  <PropertyRow label="Published">
                                    {selectedArticle.timestamp ?
                                      new Date(selectedArticle.timestamp).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      }) :
                                      'Recent'
                                    }
                                  </PropertyRow>
                                  <PropertyRow label="Content Length">
                                    {(() => {
                                      const content = selectedArticle.content || selectedArticle.text || '';
                                      const wordCount = content.trim().split(/\s+/).length;
                                      return `${wordCount} word${wordCount !== 1 ? 's' : ''}`;
                                    })()}
                                  </PropertyRow>
                                  <PropertyRow label="Excerpt">
                                    <div className="bg-gray-50 px-3 py-2 rounded text-xs text-gray-600 leading-relaxed mt-1">
                                      {(() => {
                                        const content = selectedArticle.content || selectedArticle.text || '';
                                        if (!content) return 'No content available';
                                        return content.length > 400 ? `${content.substring(0, 400)}...` : content;
                                      })()}
                                    </div>
                                  </PropertyRow>
                                </CollapsibleSection>

                                {/* Timeline Section - Previous Mentions */}
                                <CollapsibleSection
                                  title="Timeline"
                                  defaultExpanded={false}
                                  rightElement={
                                    <span className="text-xs text-gray-500">
                                      {(() => {
                                        if (!articles || !Array.isArray(articles)) return '0 previous mentions';
                                        const ticker = match.ticker;
                                        const relatedArticles = articles.filter(article =>
                                          article.matches && article.matches.some(m => m.ticker === ticker) &&
                                          article.id !== selectedArticle.id
                                        );
                                        return `${relatedArticles.length} previous mention${relatedArticles.length !== 1 ? 's' : ''}`;
                                      })()}
                                    </span>
                                  }
                                >
                                  <div className="space-y-3">
                                    {(() => {
                                      if (!articles || !Array.isArray(articles)) {
                                        return (
                                          <p className="text-xs text-gray-400 italic">No previous mentions found</p>
                                        );
                                      }

                                      const ticker = match.ticker;
                                      const relatedArticles = articles
                                        .filter(article =>
                                          article.matches && article.matches.some(m => m.ticker === ticker) &&
                                          article.id !== selectedArticle.id
                                        )
                                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                                        .slice(0, 10); // Show max 10 previous mentions

                                      if (relatedArticles.length === 0) {
                                        return (
                                          <p className="text-xs text-gray-400 italic">No previous mentions found</p>
                                        );
                                      }

                                      return relatedArticles.map((article, idx) => (
                                        <div
                                          key={article.id || idx}
                                          className="flex gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 -mx-3 px-3 py-2 rounded transition-colors"
                                          onClick={() => {
                                            setOverlayOpen(false);
                                            setTimeout(() => {
                                              setSelectedArticle(article);
                                              setOverlayOpen(true);
                                            }, 100);
                                          }}
                                        >
                                          {/* Timeline dot */}
                                          <div className="flex flex-col items-center pt-1">
                                            <div className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0"></div>
                                            {idx < relatedArticles.length - 1 && (
                                              <div className="w-px h-full bg-gray-200 mt-1"></div>
                                            )}
                                          </div>

                                          {/* Content */}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                              <h4 className="text-xs font-medium text-gray-900 line-clamp-2 leading-tight">
                                                {article.title}
                                              </h4>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                              {article.timestamp ?
                                                new Date(article.timestamp).toLocaleDateString('en-US', {
                                                  month: 'short',
                                                  day: 'numeric',
                                                  year: 'numeric',
                                                  hour: '2-digit',
                                                  minute: '2-digit'
                                                }) :
                                                'Recent'
                                              }
                                            </p>
                                          </div>
                                        </div>
                                      ));
                                    })()}
                                  </div>
                                </CollapsibleSection>
                              </div>
                            </div>
                          )
                        })}
                      </>
                    ) : (
                      <div className="max-w-2xl mx-auto">
                        <div className="py-12 text-center">
                          <div className="rounded-full bg-gray-100 p-4 mb-4 inline-block">
                            <FileText size={32} className="text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No stock matches found</h3>
                          <p className="text-sm text-gray-600 max-w-sm mx-auto">
                            This article may not contain specific company mentions or our AI couldn't identify relevant stocks with confidence.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

              </div>
            </div>

            {/* Fixed Feedback Section - Bottom of Panel */}
            {selectedArticle?.matches && selectedArticle.matches.length > 0 && (
              <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3">
                {showFeedbackThanks[selectedArticle.id || selectedArticle.title] === 'thanks' ? (
                  <div className="text-center py-1">
                    <p className="text-xs text-green-600">Thanks for your feedback!</p>
                  </div>
                ) : showFeedbackThanks[selectedArticle.id || selectedArticle.title] === 'hidden' ? null : (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Was this helpful?</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
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
                        onClick={() => {
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
                )}
              </div>
            )}
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