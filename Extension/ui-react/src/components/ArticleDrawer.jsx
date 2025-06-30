import React from 'react'
import { X, ExternalLink, Calendar, Building2 } from 'lucide-react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'

const ArticleDrawer = ({ article, isOpen, onClose }) => {
  if (!article) return null

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    return date.toLocaleDateString('en-US', options)
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

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-[85vh] max-h-[85vh]">
        <DrawerHeader className="relative">
          <DrawerClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DrawerClose>
          
          <DrawerTitle className="pr-8 text-left">{article.title}</DrawerTitle>
          
          <DrawerDescription className="flex flex-col gap-2 text-left mt-2">
            <div className="flex items-center gap-4 text-xs">
              {article.url && (
                <div className="flex items-center gap-1">
                  {getFaviconUrl(article.url) && (
                    <img 
                      src={getFaviconUrl(article.url)} 
                      alt=""
                      className="w-3 h-3"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                  <span>{extractDomain(article.url)}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(article.timestamp)}</span>
              </div>
            </div>
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 px-4 py-4 overflow-y-auto">
          {/* Companies/Tickers */}
          {article.companies && article.companies.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                Companies Mentioned
              </h3>
              <div className="flex flex-wrap gap-2">
                {article.companies.map((company, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-700"
                  >
                    {company.symbol || company.ticker || company}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Analysis Summary */}
          {article.summary && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Summary</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{article.summary}</p>
            </div>
          )}

          {/* Key Points */}
          {article.keyPoints && article.keyPoints.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Key Points</h3>
              <ul className="space-y-2">
                {article.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sentiment */}
          {article.sentiment && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Sentiment Analysis</h3>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  article.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                  article.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {article.sentiment.charAt(0).toUpperCase() + article.sentiment.slice(1)}
                </span>
              </div>
            </div>
          )}
        </div>

        <DrawerFooter className="border-t">
          {article.url && (
            <Button
              variant="outline"
              onClick={() => window.open(article.url, '_blank')}
              className="w-full"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Original Article
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default ArticleDrawer