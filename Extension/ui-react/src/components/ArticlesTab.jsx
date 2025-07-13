import React, { useState, useEffect, memo, useImperativeHandle, forwardRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const ArticlesTab = memo(forwardRef(({ onSelectionChange, searchQuery = '', onClearSelection, onArticleClick }, ref) => {
  const [articles, setArticles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedArticles, setSelectedArticles] = useState(new Set())
  const [expandedArticle, setExpandedArticle] = useState(null)
  const [showNotification, setShowNotification] = useState(true)

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
    // Get all visible articles (after filtering)
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
      
      setArticles(remainingArticles)
      setSelectedArticles(new Set())
      onSelectionChange?.(0)
      onClearSelection?.()
      
      console.log('ArticlesTab: Successfully deleted', articlesToDelete.length, 'articles')
      
    } catch (error) {
      console.error('ArticlesTab: Error deleting articles:', error)
    }
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

  // Lightweight loading skeleton matching ArticleCard structure
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse bg-gray-50 border border-gray-200">
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

  // Lightweight empty state
  if (articles.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-200 bg-gray-50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-gray-100 p-3 mb-4">
            <FileText size={24} className="text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-700 mb-2">No analyses yet</h3>
          <p className="text-gray-500 text-sm max-w-xs">
            Visit any article page and click the extension to analyze it.
          </p>
        </CardContent>
      </Card>
    )
  }

  // No search results state
  if (searchQuery.trim() && filteredArticles.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-200 bg-gray-50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-gray-100 p-3 mb-4">
            <FileText size={24} className="text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-700 mb-2">No results found</h3>
          <p className="text-gray-500 text-sm max-w-xs">
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

  // Filter articles based on search query
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
      <div key={articleId} className={cn("relative group", !isLast ? "mb-1.5" : "")}>
        <div 
          className={cn(
            "relative rounded-lg cursor-pointer transition-all duration-300 bg-white border",
            selectedArticles.has(articleId) 
              ? "bg-purple-50 border-purple-500" 
              : "border-gray-200"
          )}
          onClick={handleCardClick}
        >
          <div className="py-4 pl-6 pr-4">
          {/* Checkbox - positioned on the left border */}
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
            <h3 className="font-medium text-gray-900 text-xs mb-1 line-clamp-2 leading-tight">
              {article.title}
            </h3>

            {/* Meta info */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
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
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      
      {/* What's New Header */}
      <div className="mb-4">
        <h2 className="text-sm font-medium text-gray-900 px-1">What's New</h2>
      </div>
      
      {/* Notification Banner */}
      {showNotification && (
        <div className="mb-4 p-4 rounded-xl relative bg-cover bg-center bg-no-repeat" style={{backgroundImage: 'url("../assets/images/test8.png")'}}>
          
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white mb-1 select-none">
                Pocketstox Limited Beta UK Launch
              </h3>
              <p className="text-xs text-white/90 leading-relaxed mb-3 select-none">
                Welcome to the exclusive UK beta of Pocketstox! Track, analyze, and discover market insights 
                directly from any financial article. Be among the first to experience next-generation research tools.
              </p>
              
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-white/90 text-xs font-medium hover:text-white transition-colors border border-white/30 rounded-md select-none">
                  Get started
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recents Header */}
      <div className="mb-4">
        <h2 className="text-sm font-medium text-gray-900 px-1">Recents</h2>
      </div>
      
      <div className="space-y-6">
      {/* Today */}
      {groupedArticles.today.length > 0 && (
        <div>
          <h3 className="text-xs font-normal text-gray-500 tracking-wide mb-3 px-1">Today</h3>
          <div>
            {groupedArticles.today.map((article, index) => 
              renderArticleItem(article, index === groupedArticles.today.length - 1)
            )}
          </div>
        </div>
      )}

      {/* Yesterday */}
      {groupedArticles.yesterday.length > 0 && (
        <div>
          <h3 className="text-xs font-normal text-gray-500 tracking-wide mb-3 px-1">Yesterday</h3>
          <div>
            {groupedArticles.yesterday.map((article, index) => 
              renderArticleItem(article, index === groupedArticles.yesterday.length - 1)
            )}
          </div>
        </div>
      )}

      {/* Last Week */}
      {groupedArticles.lastWeek.length > 0 && (
        <div>
          <h3 className="text-xs font-normal text-gray-500 tracking-wide mb-3 px-1">Last Week</h3>
          <div>
            {groupedArticles.lastWeek.map((article, index) => 
              renderArticleItem(article, index === groupedArticles.lastWeek.length - 1)
            )}
          </div>
        </div>
      )}

      {/* Monthly groups */}
      {Object.entries(groupedArticles.months)
        .sort(([a], [b]) => new Date(b) - new Date(a))
        .map(([monthKey, monthArticles]) => (
          monthArticles.length > 0 && (
            <div key={monthKey}>
              <h3 className="text-xs font-normal text-gray-500 tracking-wide mb-3 px-1">{monthKey}</h3>
              <div>
                {monthArticles.map((article, index) => 
                  renderArticleItem(article, index === monthArticles.length - 1)
                )}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  )
}))

ArticlesTab.displayName = 'ArticlesTab'

export default ArticlesTab