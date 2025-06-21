import React, { useState, useEffect, memo } from 'react'
import ArticleCard from './ArticleCard'
import { Card, CardContent } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import { useStorage } from '@/hooks/useExtensionAPI'

const ArticlesTab = memo(({ onArticleClick }) => {
  const [articles, setArticles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { getArticles } = useStorage()

  useEffect(() => {
    let isMounted = true

    const fetchArticles = async () => {
      try {
        console.log('ArticlesTab: Starting to fetch articles...')
        if (isMounted) setIsLoading(true)
        
        // Check if services are available
        if (!window.extensionServices) {
          console.log('ArticlesTab: extensionServices not available yet, waiting...')
          setTimeout(fetchArticles, 100)
          return
        }
        
        console.log('ArticlesTab: Services available, calling getArticles...')
        const articleData = await getArticles()
        console.log('ArticlesTab: Received article data:', articleData)
        
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
  }, [getArticles])

  // Lightweight loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-24"></div>
        ))}
      </div>
    )
  }

  // Lightweight empty state
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

ArticlesTab.displayName = 'ArticlesTab'

export default ArticlesTab