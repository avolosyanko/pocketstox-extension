import React, { useState, useEffect, memo, useImperativeHandle, forwardRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText, X, Sparkles, Search, Edit2, Save, XCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { semanticTypography, componentSpacing, spacing } from '@/styles/typography'

const ArticlesTab = memo(forwardRef(({ onSelectionChange, onClearSelection, onArticleClick, onGenerate }, ref) => {
  const [articles, setArticles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedArticles, setSelectedArticles] = useState(new Set())
  const [expandedArticle, setExpandedArticle] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [identifiedArticle, setIdentifiedArticle] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [detectionState, setDetectionState] = useState('idle')
  const [currentStep, setCurrentStep] = useState(0) // 0: url check, 1: parsing, 2: analysis
  const [isContentExpanded, setIsContentExpanded] = useState(false)
  const [expandedStage, setExpandedStage] = useState(null)
  const [displayedArticles, setDisplayedArticles] = useState([])
  const [loadMoreCount, setLoadMoreCount] = useState(10) // Initial load count
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [remainingAnalyses, setRemainingAnalyses] = useState(5)
  const [hoveredStage, setHoveredStage] = useState(null)

  // Helper function to get tooltip text for each stage
  const getStageTooltip = (stageKey) => {
    switch (stageKey) {
      case 'parsing':
        return 'Reads and extracts the article content from the page, including headline, body text, and key details needed for analysis'
      case 'validation':
        return 'Checks the extracted content for quality, completeness, and suitability for analysis processing'
      case 'analysis':
        return 'Uses AI to analyze the article content and generate insights about stock market impact, sentiment, and key takeaways'
      default:
        return ''
    }
  }

  const [extractionStages, setExtractionStages] = useState({
    parsing: { 
      status: 'waiting', 
      title: 'Parse Input Article', 
      subtitle: 'Extracting and structuring article content',
      details: {
        description: 'Process and parse article content',
        info: 'Clean and structure the extracted content',
        action: 'View processing details'
      }
    },
    validation: { 
      status: 'waiting', 
      title: 'Content Validation', 
      subtitle: 'Verifying content quality and completeness',
      details: {
        description: 'Validate extracted content meets requirements',
        info: 'Ensure content is suitable for analysis',
        action: 'Run validation checks'
      }
    },
    analysis: { 
      status: 'waiting', 
      title: 'Analysis Generation', 
      subtitle: 'Ready to process content for AI analysis',
      details: {
        description: 'Generate AI-powered analysis',
        info: 'Content ready for comprehensive analysis',
        action: 'Start analysis process'
      }
    }
  })

  const handleLoadMore = async () => {
    setIsLoadingMore(true)
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const currentCount = displayedArticles.length
    const nextBatch = articles.slice(currentCount, currentCount + loadMoreCount)
    setDisplayedArticles(prev => [...prev, ...nextBatch])
    setIsLoadingMore(false)
  }

  const handleClearSelection = () => {
    console.log('ArticlesTab: handleClearSelection called')
    console.log('ArticlesTab: Current selectedArticles size:', selectedArticles.size)
    setSelectedArticles(new Set())
    onSelectionChange?.(0)
    onClearSelection?.()
    console.log('ArticlesTab: Selection cleared')
  }

  const handleSelectAll = () => {
    console.log('ArticlesTab: handleSelectAll called')
    // Get ALL articles (including those not yet loaded), then filter if search is active
    const filteredArticles = articles.filter(article => {
      if (!searchQuery.trim()) return true
      
      const query = searchQuery.toLowerCase()
      
      // Search in title
      const titleMatch = article.title?.toLowerCase().includes(query)
      
      // Search in tickers/companies
      const tickerMatch = article.companies?.some(company => 
        company.symbol?.toLowerCase().includes(query) ||
        company.ticker?.toLowerCase().includes(query) ||
        company.company?.toLowerCase().includes(query) ||
        (typeof company === 'string' && company.toLowerCase().includes(query))
      )
      
      return titleMatch || tickerMatch
    })
    
    const allArticleIds = new Set(filteredArticles.map(article => article.id || article.title))
    console.log('ArticlesTab: Selecting all articles, count:', allArticleIds.size)
    setSelectedArticles(allArticleIds)
    onSelectionChange?.(allArticleIds.size)
    console.log('ArticlesTab: All articles selected')
  }

  const handleDeleteSelected = async () => {
    console.log('ArticlesTab: handleDeleteSelected called')
    console.log('ArticlesTab: Selected articles to delete:', selectedArticles.size)
    
    try {
      // Find articles to delete based on selected IDs
      const articlesToDelete = articles.filter(article => {
        const articleId = article.id || article.title
        return selectedArticles.has(articleId)
      })
      
      console.log('ArticlesTab: Articles to delete:', articlesToDelete.map(a => a.title))
      
      // Delete each article from storage
      for (const article of articlesToDelete) {
        if (window.extensionServices && window.extensionServices.storage) {
          await window.extensionServices.storage.deleteArticle(article.id || article.title)
          console.log('ArticlesTab: Deleted article:', article.title)
        }
      }
      
      // Update local state - remove deleted articles
      const remainingArticles = articles.filter(article => {
        const articleId = article.id || article.title
        return !selectedArticles.has(articleId)
      })
      
      const remainingDisplayedArticles = displayedArticles.filter(article => {
        const articleId = article.id || article.title
        return !selectedArticles.has(articleId)
      })
      
      setArticles(remainingArticles)
      setDisplayedArticles(remainingDisplayedArticles)
      setSelectedArticles(new Set())
      onSelectionChange?.(0)
      onClearSelection?.()
      
      console.log('ArticlesTab: Successfully deleted', articlesToDelete.length, 'articles')
      
    } catch (error) {
      console.error('ArticlesTab: Error deleting articles:', error)
    }
  }

  const handleEditArticle = () => {
    if (identifiedArticle) {
      setEditedTitle(identifiedArticle.title || '')
      setEditedContent(identifiedArticle.content || identifiedArticle.text || '')
      setIsEditing(true)
    }
  }

  const handleSaveEdit = () => {
    if (identifiedArticle) {
      setIdentifiedArticle({
        ...identifiedArticle,
        title: editedTitle,
        content: editedContent,
        text: editedContent
      })
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedTitle('')
    setEditedContent('')
  }

  useImperativeHandle(ref, () => {
    console.log('ArticlesTab: useImperativeHandle called, exposing clearSelection, selectAll, and deleteSelected')
    return {
      clearSelection: handleClearSelection,
      selectAll: handleSelectAll,
      deleteSelected: handleDeleteSelected
    }
  })

  useEffect(() => {
    let isMounted = true
    let retryCount = 0
    const maxRetries = 10

    const fetchArticles = async () => {
      try {
        // Check if services are available with retry limit
        if (!window.extensionServices) {
          if (retryCount < maxRetries) {
            retryCount++
            setTimeout(fetchArticles, 100)
            return
          } else {
            if (isMounted) {
              setArticles([])
              setIsLoading(false)
            }
            return
          }
        }
        
        const articleData = await window.extensionServices.storage.getArticles()
        
        // Add mock sentiment data for demonstration
        const articlesWithMockData = (articleData || []).map((article, idx) => ({
          ...article,
          sentiment: idx % 3 === 0 ? 'positive' : idx % 3 === 1 ? 'negative' : 'neutral'
        }))
        
        if (isMounted) {
          setArticles(articlesWithMockData)
          setDisplayedArticles(articlesWithMockData.slice(0, loadMoreCount))
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Failed to fetch articles:', error)
        if (isMounted) {
          setArticles([])
          setIsLoading(false)
        }
      }
    }

    fetchArticles()

    return () => {
      isMounted = false
    }
  }, [])

  // Handle manual step progression
  const handleRunStep = () => {
    if (currentStep === 0) {
      // Run Parse Input Article
      setDetectionState('scanning')
      setExtractionStages(prev => ({
        ...prev,
        parsing: { ...prev.parsing, status: 'active' }
      }))
      
      // Mock article identification
      const mockIdentifiedArticle = {
        title: "Tesla Reports Strong Q4 Earnings Beat",
        content: "Tesla Inc. reported fourth-quarter earnings that exceeded Wall Street expectations, driven by strong vehicle deliveries and improved margins. The company delivered 484,507 vehicles in Q4, up 20% year-over-year, while automotive gross margins improved to 18.9%. CEO Elon Musk highlighted the company's progress in autonomous driving technology and energy storage solutions during the earnings call. The electric vehicle manufacturer also announced plans for expanding production capacity and reducing costs through manufacturing improvements.",
        url: "https://example.com/tesla-q4-earnings",
        domain: "example.com",
        pageTitle: "Tesla Q4 2024 Earnings: Strong Performance Despite Market Challenges",
        favicon: "https://www.google.com/s2/favicons?sz=16&domain=example.com",
        wordCount: 142,
        readingTime: 1,
        confidenceScore: 92,
        entities: ['Tesla', 'Elon Musk', 'Q4 2024'],
        detectedAt: new Date(),
        identified: true
      }
      
      // Simulate parsing completion
      setTimeout(() => {
        setExtractionStages(prev => ({
          ...prev,
          parsing: { ...prev.parsing, status: 'completed', subtitle: 'Article parsed and structured successfully' }
        }))
        setDetectionState('hold')
        setIdentifiedArticle(mockIdentifiedArticle)
        setCurrentStep(1)
      }, 2000)
    } else if (currentStep === 1) {
      // Run Content Validation
      setDetectionState('scanning')
      setExtractionStages(prev => ({
        ...prev,
        validation: { ...prev.validation, status: 'active' }
      }))
      
      // Simulate validation completion
      setTimeout(() => {
        setExtractionStages(prev => ({
          ...prev,
          validation: { ...prev.validation, status: 'completed', subtitle: 'Content validation passed successfully' }
        }))
        setDetectionState('hold')
        setCurrentStep(2)
      }, 2000)
    } else if (currentStep === 2) {
      // Run Analysis Generation
      setDetectionState('scanning')
      setExtractionStages(prev => ({
        ...prev,
        analysis: { ...prev.analysis, status: 'active' }
      }))
      
      // Simulate analysis completion
      setTimeout(() => {
        setExtractionStages(prev => ({
          ...prev,
          analysis: { ...prev.analysis, status: 'completed', subtitle: 'Analysis generated successfully' }
        }))
        setDetectionState('ready')
        setCurrentStep(3)
      }, 2000)
    }
  }


  // Initialize pipeline on component mount
  useEffect(() => {
    // Try to restore pipeline state from sessionStorage
    const savedState = sessionStorage.getItem('pipelineState')
    if (savedState) {
      try {
        const { currentStep, detectionState, extractionStages, identifiedArticle } = JSON.parse(savedState)
        setCurrentStep(currentStep)
        setDetectionState(detectionState)
        setExtractionStages(extractionStages)
        setIdentifiedArticle(identifiedArticle)
      } catch (error) {
        console.error('Failed to restore pipeline state:', error)
        // Start fresh - pipeline is ready to begin parsing
        setCurrentStep(0)
        setDetectionState('hold')
      }
    } else {
      // Start fresh - pipeline is ready to begin parsing
      setCurrentStep(0)
      setDetectionState('hold')
    }
  }, [])


  // Save pipeline state to sessionStorage whenever it changes
  useEffect(() => {
    const pipelineState = {
      currentStep,
      detectionState,
      extractionStages,
      identifiedArticle
    }
    sessionStorage.setItem('pipelineState', JSON.stringify(pipelineState))
  }, [currentStep, detectionState, extractionStages, identifiedArticle])

  // Update displayed articles when search changes
  useEffect(() => {
    if (searchQuery.trim()) {
      // When searching, show all articles that match the search
      const searchResults = articles.filter(article => {
        const query = searchQuery.toLowerCase()
        const titleMatch = article.title?.toLowerCase().includes(query)
        const tickerMatch = article.companies?.some(company => 
          company.symbol?.toLowerCase().includes(query) ||
          company.ticker?.toLowerCase().includes(query) ||
          company.company?.toLowerCase().includes(query) ||
          (typeof company === 'string' && company.toLowerCase().includes(query))
        )
        return titleMatch || tickerMatch
      })
      setDisplayedArticles(searchResults)
    } else {
      // When not searching, show limited articles for pagination
      setDisplayedArticles(articles.slice(0, Math.max(loadMoreCount, displayedArticles.length)))
    }
  }, [searchQuery, articles, loadMoreCount])

  // Lightweight loading skeleton matching ArticleCard structure
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse bg-white border border-gray-200">
            <CardContent className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="flex gap-2 mt-3">
                <div className="h-5 bg-gray-200 rounded w-16"></div>
                <div className="h-5 bg-gray-200 rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const handleReset = () => {
    // Clear sessionStorage
    sessionStorage.removeItem('pipelineState')
    
    // Reset all states to initial values
    setCurrentStep(0)
    setDetectionState('hold')
    setIdentifiedArticle(null)
    setIsEditing(false)
    setEditedTitle('')
    setEditedContent('')
    
    // Reset extraction stages to initial state
    setExtractionStages({
      parsing: { 
        status: 'waiting', 
        title: 'Parse Input Article', 
        subtitle: 'Extracting and structuring article content',
        details: {
          description: 'Process and parse article content',
          info: 'Clean and structure the extracted content',
          action: 'View processing details'
        }
      },
      validation: { 
        status: 'waiting', 
        title: 'Content Validation', 
        subtitle: 'Verifying content quality and completeness',
        details: {
          description: 'Validate extracted content meets requirements',
          info: 'Ensure content is suitable for analysis',
          action: 'Run validation checks'
        }
      },
      analysis: { 
        status: 'waiting', 
        title: 'Analysis Generation', 
        subtitle: 'Ready to process content for AI analysis',
        details: {
          description: 'Generate AI-powered analysis',
          info: 'Content ready for comprehensive analysis',
          action: 'Start analysis process'
        }
      }
    })
  }

  const handleSelectArticle = (articleId) => {
    const newSelected = new Set(selectedArticles)
    if (newSelected.has(articleId)) {
      newSelected.delete(articleId)
    } else {
      newSelected.add(articleId)
    }
    
    setSelectedArticles(newSelected)
    onSelectionChange?.(newSelected.size)
  }

  // Define empty state component (but don't return early)
  const EmptyState = () => (
    <Card className="border-dashed border-2 border-gray-200 bg-white">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-gray-100 p-3 mb-4">
          <FileText size={24} className="text-gray-400" />
        </div>
        <h3 className={semanticTypography.emptyStateTitle}>No analyses yet</h3>
        <p className={cn(semanticTypography.emptyStateDescription, "max-w-xs")}>
          Visit any article page and click the extension to analyze it.
        </p>
      </CardContent>
    </Card>
  )

  // No search results state
  if (searchQuery.trim() && filteredArticles.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-200 bg-white">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-gray-100 p-3 mb-4">
            <FileText size={24} className="text-gray-400" />
          </div>
          <h3 className={semanticTypography.emptyStateTitle}>No results found</h3>
          <p className={cn(semanticTypography.emptyStateDescription, "max-w-xs")}>
            No articles match "{searchQuery}". Try searching for different keywords or tickers.
          </p>
        </CardContent>
      </Card>
    )
  }

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

  const groupArticlesByDate = (articles) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)

    const groups = {
      today: [],
      yesterday: [],
      lastWeek: [],
      months: {}
    }

    articles.forEach(article => {
      const articleDate = new Date(article.timestamp)
      const articleDateOnly = new Date(articleDate.getFullYear(), articleDate.getMonth(), articleDate.getDate())
      
      if (articleDateOnly.getTime() === today.getTime()) {
        groups.today.push(article)
      } else if (articleDateOnly.getTime() === yesterday.getTime()) {
        groups.yesterday.push(article)
      } else if (articleDateOnly > lastWeek) {
        groups.lastWeek.push(article)
      } else {
        // Group by month
        const monthKey = articleDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        if (!groups.months[monthKey]) {
          groups.months[monthKey] = []
        }
        groups.months[monthKey].push(article)
      }
    })

    return groups
  }

  const extractDomain = (url) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return 'Unknown'
    }
  }

  const getFaviconUrl = (url) => {
    try {
      const urlObj = new URL(url)
      return `https://www.google.com/s2/favicons?sz=16&domain=${urlObj.hostname}`
    } catch {
      return null
    }
  }

  // Use displayed articles directly (filtering handled in useEffect)
  const filteredArticles = displayedArticles

  // Group filtered articles by date
  const groupedArticles = groupArticlesByDate(filteredArticles)

  // Render article as list item with vertical lines
  const renderArticleItem = (article, isLast = false) => {
    const articleId = article.id || article.title
    
    const handleCardClick = (e) => {
      // Don't trigger if clicking on checkbox
      if (e.target.closest('[data-checkbox]')) return
      
      onArticleClick?.(article)
    }
    
    return (
      <div 
        className={cn(
          "relative cursor-pointer transition-all duration-300 group",
          selectedArticles.has(articleId) 
            ? "bg-purple-50" 
            : "hover:bg-gray-50"
        )}
        onClick={handleCardClick}
      >
          <div className={cn(componentSpacing.cardPadding, "pl-6")}>
          {/* Checkbox - positioned over the line */}
          <div 
            data-checkbox
            className={cn(
              "absolute -left-1 top-1/2 -translate-y-1/2 z-10 transition-opacity duration-200",
              selectedArticles.size > 0 
                ? 'opacity-100' 
                : 'opacity-0 group-hover:opacity-100'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={selectedArticles.has(articleId)}
              onCheckedChange={() => handleSelectArticle(articleId)}
              className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 data-[state=checked]:text-white bg-white border-gray-300 h-4 w-4 [&_svg]:h-3 [&_svg]:w-3"
            />
          </div>
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className={cn(semanticTypography.caption, "mb-1 line-clamp-2 font-medium")}>
              {article.title}
            </h3>

            {/* Meta info */}
            <div className={cn("flex items-center gap-2", semanticTypography.metadata)}>
              {article.url && (
                <>
                  <div className="flex items-center gap-1">
                    {getFaviconUrl(article.url) && (
                      <img 
                        src={getFaviconUrl(article.url)} 
                        alt=""
                        className="w-2.5 h-2.5"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    )}
                    <span>{extractDomain(article.url)}</span>
                  </div>
                  <span>•</span>
                </>
              )}
              <span>{formatDate(article.timestamp)}</span>
            </div>

          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      
      {/* Actions Header */}
      <div className="mb-3 flex items-center px-1">
        <h2 className={cn(semanticTypography.cardTitle)}>Actions</h2>
      </div>
      
      {/* Actions Section - Combined Pipeline UI */}
      <div className="mb-4 ml-2 pr-1 space-y-3">
        {/* Pipeline Window */}
        <div className="border border-gray-200 rounded-lg bg-white">
          {/* Dynamic Header Bar - Purple for active/hold, Green for ready/completed, Red for error */}
          <div className="flex items-center justify-between px-4 py-3 rounded-t-lg text-white"
          style={{
            backgroundColor: (() => {
              switch(detectionState) {
                case 'hold': return '#9333EA' // Purple-600
                case 'error': return '#EF4444' // Red
                case 'scanning': return '#9333EA' // Purple-600 (active/loading)
                case 'ready': return '#22C55E' // Green (completed)
                case 'idle': return '#9333EA' // Purple-600 (idle/waiting)
                default: return '#22C55E' // Green (default)
              }
            })()
          }}>
            <div className="flex items-center gap-2">
              {/* Dynamic icon based on current state */}
              {detectionState === 'scanning' && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {detectionState === 'hold' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 4h4v16H6V4zM14 4h4v16h-4V4z" fill="white"/>
                </svg>
              )}
              {detectionState === 'error' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
              {(detectionState === 'idle' || detectionState === 'ready') && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              <span className="text-sm font-medium">
                {detectionState === 'idle' && 'Ready'}
                {detectionState === 'scanning' && 'Processing'}
                {detectionState === 'hold' && 'On Hold'}
                {detectionState === 'ready' && 'Complete'}
                {detectionState === 'error' && 'Error'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleReset}
                disabled={detectionState === 'scanning'}
                className="text-xs px-3 py-1 bg-white/20 text-white rounded-md hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Pipeline Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Content Extraction Pipeline</h3>
          </div>
          
          {/* Pipeline Stages - Clean Timeline */}
          <div className="p-4 rounded-b-lg">
            <div className="relative">
              {Object.entries(extractionStages).map(([key, stage], index) => {
                const isActive = stage.status === 'active'
                const isCompleted = stage.status === 'completed'
                const isReady = stage.status === 'ready'
                const isError = stage.status === 'error'
                const isWaiting = stage.status === 'waiting'
                const isLast = index === Object.keys(extractionStages).length - 1
                
                return (
                  <div key={key} className="relative">
                    {/* Vertical Line */}
                    {!isLast && (
                      <div 
                        className={cn(
                          "absolute left-7 w-0.5 top-8",
                          isCompleted && "bg-green-500",
                          isActive && "bg-purple-600",
                          isReady && "bg-green-500",
                          isError && "bg-red-500",
                          isWaiting && "bg-gray-300"
                        )}
                        style={{
                          height: 'calc(100% + 0.5rem)'  // Extend to connect with next circle
                        }}
                      ></div>
                    )}
                    
                    <div className="flex items-start gap-4 p-3 relative">
                      {/* Stage Icon */}
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 transition-colors",
                        isCompleted && "bg-green-500",
                        isActive && "bg-purple-600",
                        isReady && "bg-green-500",
                        isError && "bg-red-500",
                        isWaiting && "bg-gray-300",
                        // Show pause icon for next step when on hold
                        detectionState === 'hold' && index === currentStep && "cursor-pointer hover:brightness-110"
                      )}
                      onClick={detectionState === 'hold' && index === currentStep ? handleRunStep : undefined}
                      style={{
                        cursor: detectionState === 'hold' && index === currentStep ? 'pointer' : 'default',
                        backgroundColor: detectionState === 'hold' && index === currentStep ? '#9333EA' : undefined
                      }}
                      >
                        {isCompleted && (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                        {isActive && (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {isReady && (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                        {isError && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        )}
                        {/* Show pause icon when on hold and this is the next step */}
                        {detectionState === 'hold' && index === currentStep && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M6 4h4v16H6V4zM14 4h4v16h-4V4z" fill="white"/>
                          </svg>
                        )}
                        {isWaiting && !(detectionState === 'hold' && index === currentStep) && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="8" stroke="#6B7280" strokeWidth="2"/>
                          </svg>
                        )}
                      </div>
                      
                      {/* Stage Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={cn(
                            "text-sm font-medium",
                            isCompleted && "text-green-600",
                            isActive && "text-purple-600",
                            isReady && "text-green-600",
                            isError && "text-red-600",
                            isWaiting && "text-gray-600"
                          )}>
                            {stage.title}
                          </h4>
                          <div className="relative">
                            <Info 
                              size={12} 
                              className="text-gray-400 flex-shrink-0"
                              onMouseEnter={() => setHoveredStage(key)}
                              onMouseLeave={() => setHoveredStage(null)}
                            />
                            {hoveredStage === key && (
                              <div className="absolute top-full right-0 mt-1 p-2 bg-gray-900 text-white text-xs rounded w-40 z-50 leading-tight">
                                {getStageTooltip(key)}
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">
                          {stage.subtitle}
                        </p>
                        <p className={cn(
                          "text-xs",
                          isCompleted && "text-green-500",
                          isActive && "text-purple-600",
                          isReady && "text-green-500",
                          isError && "text-red-500",
                          isWaiting && "text-gray-500"
                        )}>
                          {isCompleted && (key === 'parsing' ? 'Article parsed and structured successfully' : 
                                         key === 'analysis' ? 'Content meets minimum requirements' : 
                                         'Ready for API submission')}
                          {isActive && 'Processing...'}
                          {isReady && 'Ready for API submission'}
                          {isError && 'Failed to process'}
                          {isWaiting && (key === 'analysis' ? `${remainingAnalyses} analyses remaining` : 'Waiting')}
                        </p>
                      </div>
                    </div>
                    
                    
                    {/* Extracted Content - Show after Parse Input Article */}
                    {key === 'parsing' && identifiedArticle && extractionStages.parsing.status === 'completed' && (
                      <div className="mt-1 mb-2 ml-12">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                              <input
                                type="text"
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Content</label>
                              <textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                rows={8}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                              <button
                                onClick={handleSaveEdit}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                              >
                                <Save size={12} />
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                              >
                                <XCircle size={12} />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-md font-mono relative group">
                            <div className="font-semibold mb-1">{identifiedArticle.title}</div>
                            <div>{identifiedArticle.content}</div>
                            <button
                              onClick={handleEditArticle}
                              className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Edit2 size={12} />
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Recents Header */}
      <div className="mb-3 flex items-center px-1">
        <h2 className={cn(semanticTypography.cardTitle)}>Recents</h2>
      </div>
      
      {/* Show empty state if no articles, otherwise show articles */}
      {displayedArticles.length === 0 && !isLoading ? (
        <EmptyState />
      ) : (
        <>
          {/* Search Bar - always visible */}
          <div className="mb-4 px-1">
            <div className="relative bg-gray-50 rounded-lg transition-colors duration-200">
              <Search size={14} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles and tickers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 ${semanticTypography.primaryText} bg-transparent border-0 focus:outline-none placeholder-gray-400 rounded-lg`}
              />
            </div>
          </div>
          
          <div className={componentSpacing.cardGroupSpacing}>
      {/* Today */}
      {groupedArticles.today.length > 0 && (
        <div>
          <div className="mb-4 px-1">
            <h3 className={cn(semanticTypography.groupTitle)}>Today</h3>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 ml-2">
            {groupedArticles.today.map((article, index) => (
              <div key={article.id || article.title}>
                {renderArticleItem(article, false)}
                {index < groupedArticles.today.length - 1 && (
                  <div className="border-b border-gray-100 mx-6" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Yesterday */}
      {groupedArticles.yesterday.length > 0 && (
        <div>
          <h3 className={cn(semanticTypography.groupTitle, "mb-4 px-1")}>Yesterday</h3>
          <div className="bg-white rounded-lg border border-gray-200 ml-2">
            {groupedArticles.yesterday.map((article, index) => (
              <div key={article.id || article.title}>
                {renderArticleItem(article, false)}
                {index < groupedArticles.yesterday.length - 1 && (
                  <div className="border-b border-gray-100 mx-6" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Week */}
      {groupedArticles.lastWeek.length > 0 && (
        <div>
          <h3 className={cn(semanticTypography.groupTitle, "mb-4 px-1")}>Last Week</h3>
          <div className="bg-white rounded-lg border border-gray-200 ml-2">
            {groupedArticles.lastWeek.map((article, index) => (
              <div key={article.id || article.title}>
                {renderArticleItem(article, false)}
                {index < groupedArticles.lastWeek.length - 1 && (
                  <div className="border-b border-gray-100 mx-6" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly groups */}
      {Object.entries(groupedArticles.months)
        .sort(([a], [b]) => new Date(b) - new Date(a))
        .map(([monthKey, monthArticles]) => (
          monthArticles.length > 0 && (
            <div key={monthKey}>
              <h3 className={cn(semanticTypography.groupTitle, "mb-4 px-1")}>{monthKey}</h3>
              <div className="bg-white rounded-lg border border-gray-200 ml-2">
                {monthArticles.map((article, index) => (
                  <div key={article.id || article.title}>
                    {renderArticleItem(article, false)}
                    {index < monthArticles.length - 1 && (
                      <div className="border-b border-gray-100 mx-6" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
      
      {/* Load More Button */}
      {!searchQuery.trim() && displayedArticles.length < articles.length && (
        <div className="mt-4 mb-3 ml-2">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 ${semanticTypography.primaryText} bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoadingMore ? (
              <>
                <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
        </>
      )}
    </div>
  )
}))

ArticlesTab.displayName = 'ArticlesTab'

export default ArticlesTab