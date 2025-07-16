import React, { useState, useEffect, memo } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Calendar, 
  ExternalLink,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Download,
  Trash2
} from 'lucide-react'

const ArticlesTable = memo(({ onArticleClick }) => {
  const [articles, setArticles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedArticles, setSelectedArticles] = useState(new Set())

  useEffect(() => {
    if (hasInitialized) return
    
    let isMounted = true
    let timeoutId = null

    const fetchArticles = async () => {
      try {
        if (isMounted) setIsLoading(true)
        
        // Wait for services to be available
        if (!window.extensionServices?.storage?.getArticles) {
          if (isMounted) {
            timeoutId = setTimeout(fetchArticles, 1000)
          }
          return
        }
        
        const articleData = await window.extensionServices.storage.getArticles()
        
        if (isMounted) {
          setArticles(articleData || [])
          setIsLoading(false)
          setHasInitialized(true)
        }
      } catch (error) {
        if (isMounted) {
          setArticles([])
          setIsLoading(false)
          setHasInitialized(true)
        }
      }
    }

    fetchArticles()

    return () => {
      isMounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [hasInitialized])

  // Sorting logic
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'desc' ? 'asc' : 'desc'
    }))
  }

  // Filter and sort articles
  const processedArticles = React.useMemo(() => {
    let filtered = articles

    // Apply search filter
    if (searchTerm) {
      filtered = articles.filter(article => 
        article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.matches?.some(match => match.ticker?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortConfig.key) {
        case 'title':
          aValue = a.title || ''
          bValue = b.title || ''
          break
        case 'timestamp':
          aValue = new Date(a.timestamp || 0)
          bValue = new Date(b.timestamp || 0)
          break
        case 'source':
          aValue = a.url ? new URL(a.url).hostname : ''
          bValue = b.url ? new URL(b.url).hostname : ''
          break
        case 'stocks':
          aValue = a.matches?.length || 0
          bValue = b.matches?.length || 0
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [articles, sortConfig, searchTerm])

  // Selection logic
  const toggleSelection = (articleId) => {
    setSelectedArticles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(articleId)) {
        newSet.delete(articleId)
      } else {
        newSet.add(articleId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedArticles.size === processedArticles.length) {
      setSelectedArticles(new Set())
    } else {
      setSelectedArticles(new Set(processedArticles.map(article => article.id)))
    }
  }

  // Format helpers
  const formatDate = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Unknown'
    }
  }

  const getSource = (url) => {
    try {
      return new URL(url).hostname.replace('www.', '').split('.')[0]
    } catch {
      return 'Unknown'
    }
  }

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-4 h-4" />
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />
  }

  // Generate button
  const GenerateButton = () => (
    <Button 
      className="w-full mb-4 text-white"
      style={{ background: 'var(--gradient-primary)' }}
      onMouseEnter={(e) => e.target.style.background = 'var(--gradient-primary-hover)'}
      onMouseLeave={(e) => e.target.style.background = 'var(--gradient-primary)'}
    >
      Generate Analysis
    </Button>
  )

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <GenerateButton />
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="animate-pulse bg-gray-200 rounded h-10 w-full"></div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded h-12 w-full"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Empty state
  if (articles.length === 0) {
    return (
      <div className="space-y-4">
        <GenerateButton />
        <Card className="border-dashed border-2 border-gray-300/25">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-gray-100 p-3 mb-4">
              <FileText size={24} className="text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No analyses yet</h3>
            <p className="text-gray-500 text-sm max-w-sm">
              Click "Generate Analysis" above to analyze your first article.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <GenerateButton />
      
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">Article History</CardTitle>
            <div className="flex items-center gap-2">
              {selectedArticles.size > 0 && (
                <>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Export ({selectedArticles.size})
                  </Button>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete ({selectedArticles.size})
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search articles, sources, or tickers..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Selection info */}
          {selectedArticles.size > 0 && (
            <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-md text-sm">
              {selectedArticles.size} of {processedArticles.length} articles selected
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedArticles.size === processedArticles.length && processedArticles.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center gap-2">
                    Article
                    {getSortIcon('title')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 select-none w-32"
                  onClick={() => handleSort('timestamp')}
                >
                  <div className="flex items-center gap-2">
                    Date
                    {getSortIcon('timestamp')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 select-none w-24"
                  onClick={() => handleSort('source')}
                >
                  <div className="flex items-center gap-2">
                    Source
                    {getSortIcon('source')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 select-none w-40"
                  onClick={() => handleSort('stocks')}
                >
                  <div className="flex items-center gap-2">
                    Stocks
                    {getSortIcon('stocks')}
                  </div>
                </TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedArticles.map((article) => (
                <TableRow 
                  key={article.id}
                  className="cursor-pointer"
                  data-state={selectedArticles.has(article.id) ? "selected" : ""}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedArticles.has(article.id)}
                      onChange={() => toggleSelection(article.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </TableCell>
                  <TableCell 
                    className="font-medium"
                    onClick={() => onArticleClick?.(article)}
                  >
                    <div className="space-y-1">
                      <div className="line-clamp-2 text-sm font-semibold text-gray-900">
                        {article.title || 'Untitled Article'}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {article.id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(article.timestamp)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {getSource(article.url)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {article.matches?.slice(0, 3).map((match, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="text-xs font-mono"
                        >
                          {match.ticker}
                        </Badge>
                      ))}
                      {article.matches?.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{article.matches.length - 3}
                        </Badge>
                      )}
                      {(!article.matches || article.matches.length === 0) && (
                        <span className="text-xs text-gray-400">No stocks</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onArticleClick?.(article)
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {processedArticles.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <div className="text-gray-500 text-sm">
                No articles found matching "{searchTerm}"
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
})

ArticlesTable.displayName = 'ArticlesTable'

export default ArticlesTable