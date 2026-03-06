import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ServiceProvider, useAPI, useStorage } from './contexts/ServiceContext'
import NavigationHeader from './components/NavigationHeader'
import ArticlesTab from './components/ArticlesTab'
import CompanyIcon from './components/CompanyIcon'
import { FileText, ThumbsUp, ThumbsDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { semanticTypography, componentSpacing } from '@/styles/typography'
import './index.css'

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

  // Expanded passages state - tracks which company has all passages shown
  const [expandedPassages, setExpandedPassages] = useState({})

  // Inference chain state - tracks added steps per company
  const [inferenceSteps, setInferenceSteps] = useState({}) // { ticker: [{ id, text, isEditing }] }
  const [showAddStepPicker, setShowAddStepPicker] = useState({}) // { ticker: boolean }
  const [pendingRecalc, setPendingRecalc] = useState({}) // { ticker: boolean }
  const [editWarning, setEditWarning] = useState(null) // { ticker, stepId, action: 'edit' | 'delete' }

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
  const [currentFilters, setCurrentFilters] = useState(null)

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
        onFiltersChange={setCurrentFilters}
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
        <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-[#f0f4f8] via-[#f0f4f8]/50 to-transparent pointer-events-none"></div>

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
            <div className="flex-1 overflow-y-auto scrollbar-hide relative">
              <div className="relative py-4">

                {/* Check if this is a company (starts with 'company-') vs regular article */}
                {selectedArticle?.id?.startsWith('company-') ? (
                  // Company Note-Taking Interface
                  <>
                    {/* YOUR THESIS Section */}
                    <div className="mb-6">
                      <div className="mb-3 px-1">
                        <h2 className={cn(semanticTypography.cardTitle, "uppercase tracking-wide text-gray-500")}>Thesis</h2>
                      </div>

                      <div className="ml-2">
                        <div className="bg-gray-50/80 border border-gray-200/60 rounded-lg p-4 backdrop-blur-sm">
                          <p className="text-sm text-gray-700 mb-3">
                            {selectedArticle.thesis || 'Reshoring of semiconductor packaging will accelerate after CHIPS Act implementation'}
                          </p>

                          {/* Filter Pills */}
                          {(() => {
                            const filters = selectedArticle.filters || currentFilters;
                            const filterPills = [];

                            if (filters) {
                              // Company sizes
                              if (filters.companySizes && filters.companySizes.length > 0) {
                                const sizeLabels = {
                                  small: 'Small (<$2B)',
                                  mid: 'Mid ($2-10B)',
                                  large: 'Large (>$10B)'
                                };
                                filters.companySizes.forEach(size => {
                                  filterPills.push(sizeLabels[size] || size);
                                });
                              }

                              // Sectors
                              if (filters.sectors && filters.sectors.length > 0) {
                                filters.sectors.forEach(sector => {
                                  filterPills.push(sector.charAt(0).toUpperCase() + sector.slice(1));
                                });
                              }

                              // Blocklist
                              if (filters.blocklist && filters.blocklist.length > 0) {
                                filters.blocklist.forEach(ticker => {
                                  filterPills.push(`Ignore: ${ticker}`);
                                });
                              }
                            }

                            return (
                              <div className="flex flex-wrap gap-2">
                                {filterPills.length > 0 ? (
                                  filterPills.map((pill, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2.5 py-1.5 text-xs text-purple-700 border border-purple-200 rounded-md bg-purple-50"
                                    >
                                      {pill}
                                    </span>
                                  ))
                                ) : (
                                  <span className="px-2.5 py-1.5 text-xs text-purple-700 border border-purple-200 rounded-md bg-purple-50">
                                    No Filters
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>


                    {/* EXPOSURE MAP Header */}
                    <div className="mb-3 px-1">
                      <h2 className={cn(semanticTypography.cardTitle, "uppercase tracking-wide text-gray-500")}>
                        Exposure Map - {selectedArticle.matches?.length || 0} {selectedArticle.matches?.length === 1 ? 'Company' : 'Companies'}
                      </h2>
                    </div>

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
                            <button className="px-3 py-1.5 text-sm bg-[#4A4458] text-white hover:bg-[#3d3a4a] rounded-md transition-colors">
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
                        {/* YOUR THESIS Section */}
                        {selectedArticle.thesis && (
                          <div className="mb-6 px-4 pt-4">
                            <div className="mb-2">
                              <h2 className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Thesis</h2>
                            </div>

                            <div className="bg-gray-50/80 border border-gray-200/60 rounded-lg p-3 backdrop-blur-sm">
                              <p className="text-xs text-gray-700 mb-2">
                                {selectedArticle.thesis}
                              </p>

                              {/* Filter Pills */}
                              {(() => {
                                const filters = selectedArticle.filters || currentFilters;
                                const filterPills = [];

                                if (filters) {
                                  // Company sizes
                                  if (filters.companySizes && filters.companySizes.length > 0) {
                                    const sizeLabels = {
                                      small: 'Small (<$2B)',
                                      mid: 'Mid ($2-10B)',
                                      large: 'Large (>$10B)'
                                    };
                                    filters.companySizes.forEach(size => {
                                      filterPills.push(sizeLabels[size] || size);
                                    });
                                  }

                                  // Sectors
                                  if (filters.sectors && filters.sectors.length > 0) {
                                    filters.sectors.forEach(sector => {
                                      filterPills.push(sector.charAt(0).toUpperCase() + sector.slice(1));
                                    });
                                  }

                                  // Blocklist
                                  if (filters.blocklist && filters.blocklist.length > 0) {
                                    filters.blocklist.forEach(ticker => {
                                      filterPills.push(`Ignore: ${ticker}`);
                                    });
                                  }
                                }

                                return (
                                  <div className="flex flex-wrap gap-1.5">
                                    {filterPills.length > 0 ? (
                                      filterPills.map((pill, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-1 text-[10px] text-purple-700 border border-purple-200 rounded-md bg-purple-50"
                                        >
                                          {pill}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="px-2 py-1 text-[10px] text-purple-700 border border-purple-200 rounded-md bg-purple-50">
                                        No Filters
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}


                        {/* EXPOSURE MAP Header */}
                        <div className="mb-3 px-4">
                          <h2 className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                            Exposure Map
                          </h2>
                        </div>

                        <div className="px-4 space-y-3">
                          {(() => {
                            // Show only the first match
                            const match = selectedArticle.matches[0];
                            const index = 0;
                            const confidence = match.score || Math.random() * 0.4 + 0.6;
                            const scorePercentage = (confidence * 100).toFixed(0);

                            return (
                              <div key={index} className="border border-gray-200 rounded-lg bg-white">
                                {/* Content */}
                                <div>
                                  <div key={index}>

                              {/* REASONING CHAIN Section */}
                              <div className="px-3 py-4 bg-white">
                                <h3 className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-3">Reasoning Chain</h3>

                                <div className="space-y-0">
                                  {/* Thesis/Query */}
                                  <div className="flex items-start gap-3">
                                    <div className="flex flex-col items-center" style={{ width: '12px' }}>
                                      <div className="w-2.5 h-2.5 rounded-full bg-black flex-shrink-0"></div>
                                      <div className="w-px bg-black" style={{ height: '20px' }}></div>
                                    </div>
                                    <div className="flex-1 pt-0">
                                      <p className="text-xs text-gray-900 leading-relaxed font-medium">
                                        Thesis
                                      </p>
                                    </div>
                                  </div>

                                  {/* Inference Steps */}
                                  {inferenceSteps[match.ticker]?.map((step, stepIdx) => {
                                    const isLastStep = stepIdx === inferenceSteps[match.ticker].length - 1;
                                    const showWarning = editWarning?.stepId === step.id && editWarning?.ticker === match.ticker;
                                    return (
                                    <div key={step.id}>
                                      <div className="flex items-start gap-3">
                                        <div className="flex flex-col items-center" style={{ width: '12px' }}>
                                          <div className="w-2.5 h-2.5 rounded-full bg-black flex-shrink-0"></div>
                                          {/* Connector line - taller to accommodate text and warning if present */}
                                          <div className="w-px bg-black" style={{ height: showWarning ? '220px' : '120px' }}></div>
                                        </div>
                                        <div className="flex-1 pt-0">
                                          {step.isEditing ? (
                                            /* Editing mode */
                                            <div className="space-y-2">
                                              <input
                                                type="text"
                                                defaultValue={step.text}
                                                autoFocus
                                                className="w-full px-2 py-1 text-xs border border-purple-400 rounded focus:outline-none focus:ring-1 focus:ring-purple-400 italic text-gray-600"
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    // Save and remove subsequent steps if needed
                                                    setInferenceSteps(prev => ({
                                                      ...prev,
                                                      [match.ticker]: prev[match.ticker]
                                                        .map(s => s.id === step.id ? { ...s, text: e.target.value, isEditing: false } : s)
                                                        .filter((s, idx) => idx <= stepIdx)
                                                    }));
                                                    setPendingRecalc(prev => ({ ...prev, [match.ticker]: true }));
                                                  } else if (e.key === 'Escape') {
                                                    setInferenceSteps(prev => ({
                                                      ...prev,
                                                      [match.ticker]: prev[match.ticker].map(s =>
                                                        s.id === step.id ? { ...s, isEditing: false } : s
                                                      )
                                                    }));
                                                  }
                                                }}
                                                onBlur={(e) => {
                                                  // Cancel editing without saving
                                                  setInferenceSteps(prev => ({
                                                    ...prev,
                                                    [match.ticker]: prev[match.ticker].map(s =>
                                                      s.id === step.id ? { ...s, isEditing: false } : s
                                                    )
                                                  }));
                                                }}
                                              />
                                              <div className="flex items-center gap-2">
                                                <button
                                                  onClick={() => {
                                                    // Save and remove subsequent steps if needed
                                                    const input = document.querySelector('input[type="text"]:focus');
                                                    const newText = input?.value || step.text;
                                                    setInferenceSteps(prev => ({
                                                      ...prev,
                                                      [match.ticker]: prev[match.ticker]
                                                        .map(s => s.id === step.id ? { ...s, text: newText, isEditing: false } : s)
                                                        .filter((s, idx) => idx <= stepIdx)
                                                    }));
                                                    setPendingRecalc(prev => ({ ...prev, [match.ticker]: true }));
                                                  }}
                                                  className="px-2 py-1 text-[10px] bg-[#4A4458] text-white hover:bg-[#3d3a4a] rounded transition-colors"
                                                >
                                                  Save
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setInferenceSteps(prev => ({
                                                      ...prev,
                                                      [match.ticker]: prev[match.ticker].map(s =>
                                                        s.id === step.id ? { ...s, isEditing: false } : s
                                                      )
                                                    }));
                                                  }}
                                                  className="px-2 py-1 text-[10px] text-gray-600 hover:text-gray-900 transition-colors"
                                                >
                                                  Cancel
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            /* Display mode */
                                            <div className="space-y-2">
                                              <div className="flex-1">
                                                <p className="text-xs text-gray-700 leading-relaxed">
                                                  {step.text}
                                                </p>
                                                <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] text-gray-500 bg-gray-100 rounded">
                                                  Inferred Step {stepIdx + 1}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <button
                                                  onClick={() => {
                                                    // Check if this is step 1 and step 2 exists
                                                    if (stepIdx === 0 && inferenceSteps[match.ticker].length > 1) {
                                                      setEditWarning({ ticker: match.ticker, stepId: step.id, action: 'edit' });
                                                    } else {
                                                      setInferenceSteps(prev => ({
                                                        ...prev,
                                                        [match.ticker]: prev[match.ticker].map(s =>
                                                          s.id === step.id ? { ...s, isEditing: true } : s
                                                        )
                                                      }));
                                                    }
                                                  }}
                                                  className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                  Edit
                                                </button>
                                                <span className="text-gray-300">·</span>
                                                <button
                                                  onClick={() => {
                                                    // Check if this is step 1 and step 2 exists
                                                    if (stepIdx === 0 && inferenceSteps[match.ticker].length > 1) {
                                                      setEditWarning({ ticker: match.ticker, stepId: step.id, action: 'delete' });
                                                    } else {
                                                      setInferenceSteps(prev => ({
                                                        ...prev,
                                                        [match.ticker]: prev[match.ticker].filter(s => s.id !== step.id)
                                                      }));
                                                      setPendingRecalc(prev => ({ ...prev, [match.ticker]: true }));
                                                    }
                                                  }}
                                                  className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                  Delete
                                                </button>
                                              </div>
                                            </div>
                                          )}

                                          {/* Inline Warning */}
                                          {showWarning && (
                                            <div className="mt-3 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-4">
                                              <h3 className="text-xs font-semibold text-amber-900 mb-1.5">
                                                {editWarning.action === 'edit' ? 'Editing this step will remove Step 2' : 'Deleting this step will remove Step 2'}
                                              </h3>
                                              <p className="text-[11px] text-amber-800 mb-3 leading-relaxed">
                                                Step 2 was inferred from Step 1 and may no longer be valid after your {editWarning.action}. The chain will re-search from this point.
                                              </p>
                                              <div className="flex items-center gap-2">
                                                <button
                                                  onClick={() => {
                                                    const { ticker, stepId, action } = editWarning;
                                                    if (action === 'edit') {
                                                      // Enter edit mode and remove step 2
                                                      setInferenceSteps(prev => ({
                                                        ...prev,
                                                        [ticker]: prev[ticker]
                                                          .filter((s, idx) => idx === 0) // Keep only step 1
                                                          .map(s => s.id === stepId ? { ...s, isEditing: true } : s)
                                                      }));
                                                      setPendingRecalc(prev => ({ ...prev, [ticker]: true }));
                                                    } else {
                                                      // Delete step 1 and all subsequent steps
                                                      setInferenceSteps(prev => ({
                                                        ...prev,
                                                        [ticker]: []
                                                      }));
                                                      setPendingRecalc(prev => ({ ...prev, [ticker]: true }));
                                                    }
                                                    setEditWarning(null);
                                                  }}
                                                  className="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 rounded-md transition-colors"
                                                >
                                                  {editWarning.action === 'edit' ? 'Edit anyway' : 'Delete anyway'}
                                                </button>
                                                <button
                                                  onClick={() => setEditWarning(null)}
                                                  className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 hover:border-gray-400 rounded-md transition-colors"
                                                >
                                                  Cancel
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    );
                                  })}

                                  {/* Add Step Button - Greyed out plus node (always after inference steps, before filing) */}
                                  {/* Only show if less than 2 inference steps */}
                                  {(inferenceSteps[match.ticker] || []).length < 2 && !showAddStepPicker[match.ticker] ? (
                                    <div
                                      className="flex items-start gap-3 group cursor-pointer"
                                      onClick={() => setShowAddStepPicker(prev => ({ ...prev, [match.ticker]: true }))}
                                      style={{ marginTop: (inferenceSteps[match.ticker] || []).length > 0 ? '-100px' : '0' }}
                                    >
                                      <div className="flex flex-col items-center" style={{ width: '12px' }}>
                                        {/* Add upward connector if there are inference steps above */}
                                        {(inferenceSteps[match.ticker] || []).length > 0 && (
                                          <div className="w-px bg-black" style={{ height: '100px' }}></div>
                                        )}
                                        <div className="w-3 h-3 rounded-full border border-black/30 flex items-center justify-center flex-shrink-0 group-hover:border-black/50 transition-colors">
                                          <svg className="w-2 h-2 text-black/30 group-hover:text-black/50 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                          </svg>
                                        </div>
                                        <div className="w-px bg-black" style={{ height: '20px' }}></div>
                                      </div>
                                      <div className="flex-1" style={{ marginTop: (inferenceSteps[match.ticker] || []).length > 0 ? '100px' : '0' }}>
                                        <p className="text-xs text-gray-400 group-hover:text-gray-500 font-normal transition-colors">
                                          Add inference step
                                        </p>
                                      </div>
                                    </div>
                                  ) : (inferenceSteps[match.ticker] || []).length < 2 && showAddStepPicker[match.ticker] ? (
                                    /* Picker - inline with continuous vertical line */
                                    <div className="flex items-start gap-3" style={{ marginTop: (inferenceSteps[match.ticker] || []).length > 0 ? '-100px' : '-30px' }}>
                                      {/* Continuous vertical line on left - same width as node for alignment */}
                                      <div className="flex flex-col items-center" style={{ width: '12px' }}>
                                        <div className="w-px bg-black" style={{ minHeight: (inferenceSteps[match.ticker] || []).length > 0 ? '416px' : '346px' }}></div>
                                      </div>

                                      {/* Picker content on right */}
                                      <div className="flex-1" style={{ marginTop: (inferenceSteps[match.ticker] || []).length > 0 ? '100px' : '30px' }}>
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center gap-1.5 text-gray-400">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                            <h3 className="text-[10px] font-bold uppercase tracking-wider">
                                              Downstream Effects
                                            </h3>
                                          </div>
                                          <button
                                            onClick={() => setShowAddStepPicker(prev => ({ ...prev, [match.ticker]: false }))}
                                            className="text-gray-300 hover:text-gray-500 transition-colors"
                                          >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        </div>

                                          {/* AI Suggestions - smaller, grey backgrounds */}
                                          <div className="space-y-2">
                                            {[
                                              'Advanced packaging fabs require precision laser systems for chiplet bonding',
                                              'Domestic fab construction accelerates across Sun Belt states',
                                              'Demand for specialty process chemicals rises with new fab openings'
                                            ].map((suggestion, idx) => (
                                              <button
                                                key={idx}
                                                onClick={() => {
                                                  // Check if we already have 2 steps
                                                  if ((inferenceSteps[match.ticker] || []).length >= 2) return;

                                                  const newStep = {
                                                    id: Date.now(),
                                                    text: suggestion,
                                                    isEditing: false
                                                  };
                                                  setInferenceSteps(prev => ({
                                                    ...prev,
                                                    [match.ticker]: [...(prev[match.ticker] || []), newStep]
                                                  }));
                                                  setShowAddStepPicker(prev => ({ ...prev, [match.ticker]: false }));
                                                  setPendingRecalc(prev => ({ ...prev, [match.ticker]: true }));
                                                }}
                                                className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                                              >
                                                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                  <svg className="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                  </svg>
                                                </div>
                                                <span className="text-xs text-gray-700 leading-relaxed">
                                                  {suggestion}
                                                </span>
                                              </button>
                                            ))}
                                          </div>

                                          {/* Add your own - simple text */}
                                          <button
                                            onClick={() => {
                                              // Check if we already have 2 steps
                                              if ((inferenceSteps[match.ticker] || []).length >= 2) return;

                                              // Toggle to input mode or handle custom input
                                              const customText = prompt("Describe the downstream effect:");
                                              if (customText && customText.trim()) {
                                                const newStep = {
                                                  id: Date.now(),
                                                  text: customText.trim(),
                                                  isEditing: false
                                                };
                                                setInferenceSteps(prev => ({
                                                  ...prev,
                                                  [match.ticker]: [...(prev[match.ticker] || []), newStep]
                                                }));
                                                setShowAddStepPicker(prev => ({ ...prev, [match.ticker]: false }));
                                                setPendingRecalc(prev => ({ ...prev, [match.ticker]: true }));
                                              }
                                            }}
                                            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-purple-500 transition-colors mt-2 mb-4"
                                          >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                            </svg>
                                            <span>add your own</span>
                                          </button>
                                        </div>
                                      </div>
                                  ) : null}

                                  {/* Filing Source */}
                                  <div className="flex items-start gap-3">
                                    <div className="flex flex-col items-center" style={{ width: '12px' }}>
                                      <div className="w-2.5 h-2.5 rounded-full bg-purple-600 flex-shrink-0"></div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs pt-0">
                                      <span className="font-medium text-gray-900">Citation</span>
                                      <span className="text-gray-300">·</span>
                                      <span className="text-gray-400">{match.filing || '2023 Annual Report'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Separator */}
                              <div className="border-b border-gray-200"></div>

                              {/* Re-search Banner - Shows when chain is updated */}
                              {pendingRecalc[match.ticker] && (
                                <div className="p-3 bg-[#1a1a1a] text-white rounded-lg mx-3 mt-3">
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <h3 className="text-xs font-semibold mb-0.5">Chain updated</h3>
                                      <p className="text-[10px] text-gray-400">Corpus match is from your previous search</p>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setPendingRecalc(prev => ({ ...prev, [match.ticker]: false }));
                                        // TODO: Trigger actual re-search logic here
                                      }}
                                      className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors whitespace-nowrap"
                                    >
                                      Re-search →
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Company Recommendation - After Reasoning Chain */}
                              <div className={cn("p-3 bg-white", pendingRecalc[match.ticker] && "opacity-40")}>
                                <h3 className={cn("text-[10px] font-medium uppercase tracking-wider mb-3", pendingRecalc[match.ticker] ? "text-gray-300" : "text-gray-400")}>
                                  Corpus Match {pendingRecalc[match.ticker] && <span className="text-[9px] ml-2">previous result</span>}
                                </h3>
                                <div className="flex items-center gap-2.5">
                                  {/* Circular Progress Ring */}
                                  <div className="relative flex-shrink-0">
                                    <svg className="w-9 h-9 transform -rotate-90">
                                      {/* Background circle */}
                                      <circle
                                        cx="18"
                                        cy="18"
                                        r="15"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        fill="none"
                                        className="text-gray-200"
                                      />
                                      {/* Progress circle */}
                                      <circle
                                        cx="18"
                                        cy="18"
                                        r="15"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        fill="none"
                                        strokeDasharray={`${2 * Math.PI * 15}`}
                                        strokeDashoffset={`${2 * Math.PI * 15 * (1 - confidence)}`}
                                        className="text-purple-600"
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                    {/* Score text in center */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="text-xs font-bold text-gray-900">{scorePercentage}</span>
                                    </div>
                                  </div>

                                  {/* Company Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="text-base font-bold text-gray-900">{match.ticker}</span>
                                      <span className="text-xs text-gray-400">{match.company || match.ticker}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[10px] text-gray-400">
                                        {match.chunkCount || 7} passages
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Separator */}
                              <div className="border-b border-gray-200"></div>

                              {/* Sections - NO padding, borders touch edges */}
                              <div className={cn("mb-3", pendingRecalc[match.ticker] && "opacity-40")}>
                                {/* Matched Sections */}
                                <div className="pt-4 pb-0">
                                  <div className="px-3 mb-4 flex items-center gap-2">
                                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Matched Sections</span>
                                    {(match.chunkCount || 7) > 0 && (
                                      <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1.5 bg-purple-600 text-white text-[10px] font-semibold rounded-full">
                                        {match.chunkCount || 7}
                                      </span>
                                    )}
                                  </div>
                                  <div className="px-3 space-y-[18px]">
                                    {/* Show passages based on expanded state */}
                                    {(() => {
                                      const isExpanded = expandedPassages[`${match.ticker}-${index}`];
                                      const passageCount = match.chunkCount || 7;
                                      const passagesToShow = isExpanded ? passageCount : 1;

                                      return Array.from({ length: passagesToShow }).map((_, passageIndex) => {
                                        // Vary the sources for different passages
                                        const sources = [
                                          { section: 'Risk Factors', filing: '2023 Annual Report' },
                                          { section: 'Business Overview', filing: '2023 Annual Report' },
                                          { section: 'MD&A', filing: '2023 Annual Report' },
                                          { section: 'Item 1A', filing: '2024 Q2 10-Q' },
                                          { section: 'Operations Review', filing: '2023 Annual Report' },
                                          { section: 'Market Analysis', filing: '2024 Q1 10-Q' },
                                          { section: 'Technology Discussion', filing: '2023 Annual Report' }
                                        ];
                                        const source = sources[passageIndex % sources.length];

                                        return (
                                        <div key={passageIndex} className="space-y-2">
                                      {/* Source information with arrow */}
                                      <a
                                        href={match.section_url || `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${match.ticker}&type=10-K&dateb=&owner=exclude&count=40`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between gap-2 text-[10px] text-gray-500 hover:text-gray-700 transition-colors group"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold">§</span>
                                          <span className="font-medium text-gray-600">{source.section}</span>
                                          <span className="text-gray-300">·</span>
                                          <span>{source.filing}</span>
                                        </div>
                                        <svg className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
                                        </svg>
                                      </a>

                                      {/* Excerpt with phrase highlighting */}
                                      <div className="block relative bg-gray-50 border-l-4 border-purple-300 px-3 py-2.5 text-xs text-gray-700 leading-relaxed">
                                        {(() => {
                                          const excerpt = match.excerpt || 'Our operations increasingly depend on advanced packaging capabilities and US-based manufacturing facilities as domestic semiconductor production expands under the CHIPS Act. We have invested significantly in cleanroom infrastructure and substrate supply partnerships to meet anticipated demand.';

                                          // Mock phrase highlighting - in production, this would use cosine similarity
                                          // to find the hottest matching phrases from the thesis
                                          const highlightPhrases = match.highlightPhrases || [
                                            'advanced packaging capabilities',
                                            'CHIPS Act',
                                            'cleanroom infrastructure'
                                          ];

                                          let highlightedExcerpt = excerpt;
                                          highlightPhrases.forEach(phrase => {
                                            const regex = new RegExp(`(${phrase})`, 'gi');
                                            highlightedExcerpt = highlightedExcerpt.replace(
                                              regex,
                                              '<span class="text-purple-700 bg-purple-100 px-0.5 rounded">$1</span>'
                                            );
                                          });

                                          return <span dangerouslySetInnerHTML={{ __html: highlightedExcerpt }} />;
                                        })()}
                                      </div>
                                    </div>
                                        );
                                      });
                                    })()}
                                  </div>

                                  {/* View All Button - Bottom of card */}
                                  {!pendingRecalc[match.ticker] && (match.chunkCount || 7) > 1 && (
                                    <div className="px-3 mt-3">
                                      <button
                                        onClick={() => {
                                          const matchKey = `${match.ticker}-${index}`;
                                          setExpandedPassages(prev => ({
                                            ...prev,
                                            [matchKey]: !prev[matchKey]
                                          }));
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs text-gray-600 leading-4 bg-[#f0f4f8] hover:bg-[#e5edf5] rounded-lg transition-colors"
                                      >
                                        {expandedPassages[`${match.ticker}-${index}`] ? 'View Less' : 'View All'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                                </div>
                              </div>
                            </div>
                            );
                          })()}
                        </div>
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