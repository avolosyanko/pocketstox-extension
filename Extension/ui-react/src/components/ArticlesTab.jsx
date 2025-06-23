import React, { useState, useEffect, memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText, Calendar, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

const ArticlesTab = memo(({ onArticleClick, onSelectionChange, searchQuery = '' }) => {
  const [articles, setArticles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedArticles, setSelectedArticles] = useState(new Set())

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
        
        if (isMounted) {
          setArticles(articleData || [])
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
          <Card key={i} className="animate-pulse bg-white">
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

  const handleSelectArticle = (index) => {
    const newSelected = new Set(selectedArticles)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    
    setSelectedArticles(newSelected)
    onSelectionChange?.(newSelected.size)
  }

  // TODO: Re-add actions functionality later

  // Lightweight empty state
  if (articles.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-200 bg-white">
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
      <Card className="border-dashed border-2 border-gray-200 bg-white">
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
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  return (
    <div className="space-y-3">
      {/* Articles list */}
      <div className="space-y-3">
        {filteredArticles.map((article, index) => (
            <Card 
              key={article.id || index} 
              className={cn(
                "border transition-all cursor-pointer hover:shadow-sm",
                selectedArticles.has(index) 
                  ? "bg-purple-50 border-purple-500 shadow-sm" 
                  : "bg-white border-gray-200 hover:border-gray-300"
              )}
              onClick={() => onArticleClick?.(article)}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                {/* Checkbox */}
<div className="pt-1" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedArticles.has(index)}
                    onCheckedChange={() => handleSelectArticle(index)}
                    className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <h3 className="font-medium text-gray-900 text-xs mb-2 line-clamp-2 leading-relaxed">
                    {article.title}
                  </h3>

                  {/* Meta info */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{formatDate(article.timestamp)}</span>
                    </div>
                    {article.url && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          {getFaviconUrl(article.url) && (
                            <img 
                              src={getFaviconUrl(article.url)} 
                              alt=""
                              className="w-3 h-3"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          )}
                          <a 
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-gray-700 flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>{extractDomain(article.url)}</span>
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Stocks */}
                  {article.companies && article.companies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {article.companies.slice(0, 5).map((stock, idx) => (
                        <span
                          key={idx}
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                            selectedArticles.has(index)
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-700"
                          )}
                        >
                          {stock.symbol || stock.ticker || stock}
                        </span>
                      ))}
                      {article.companies.length > 5 && (
                        <span className={cn(
                          "text-xs",
                          selectedArticles.has(index) ? "text-purple-500" : "text-gray-500"
                        )}>
                          +{article.companies.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
})

ArticlesTab.displayName = 'ArticlesTab'

export default ArticlesTab