import React, { useState, useEffect, memo } from 'react'
import ArticleCard from './ArticleCard'
import { Card, CardContent } from '@/components/ui/card'
import { FileText } from 'lucide-react'

const ArticlesTabFixed = memo(({ onArticleClick }) => {
  const [articles, setArticles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasInitialized, setHasInitialized] = useState(false)

  useEffect(() => {
    // Only run once when component mounts
    if (hasInitialized) return
    
    let isMounted = true
    let timeoutId = null

    const fetchArticles = async () => {
      try {
        if (isMounted) setIsLoading(true)
        
        // Wait for services to be available
        if (!window.extensionServices?.storage?.getArticles) {
          if (isMounted) {
            timeoutId = setTimeout(fetchArticles, 1000) // Longer delay to prevent spam
          }
          return
        }
        
        const articleData = await window.extensionServices.storage.getArticles()
        
        if (isMounted) {
          setArticles(articleData || [])
          setIsLoading(false)
          setHasInitialized(true) // Mark as initialized to prevent re-runs
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
  }, [hasInitialized]) // Only depend on hasInitialized

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-24"></div>
        ))}
      </div>
    )
  }

  // Empty state
  if (articles.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-300/25">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-gray-100 p-2 mb-3">
            <FileText size={20} className="text-gray-500" />
          </div>
          <h3 className="text-sm font-semibold mb-1">No analyses yet</h3>
          <p className="text-gray-500 text-xs">
            Click "Generate Companies" above to analyse your first article.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {articles.map((article, index) => (
        <ArticleCard
          key={article.id || index}
          article={article}
          onClick={onArticleClick}
        />
      ))}
    </div>
  )
})

ArticlesTabFixed.displayName = 'ArticlesTabFixed'

export default ArticlesTabFixed