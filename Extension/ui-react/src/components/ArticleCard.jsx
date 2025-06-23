import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// Badge component defined inline
import { ExternalLink, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

// Create Badge component since we haven't defined it yet
const CustomBadge = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
  const badgeVariants = {
    default: "bg-primary/10 text-primary hover:bg-primary/20",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    success: "bg-green-100 text-green-800 hover:bg-green-200",
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  )
})
CustomBadge.displayName = "Badge"

const ArticleCard = ({ article, onClick, isSelected }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStockColor = (stock) => {
    // Color coding based on sentiment or stock type
    if (stock.sentiment === 'positive') return 'success'
    if (stock.sentiment === 'negative') return 'destructive'
    return 'default'
  }

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30 hover:scale-[1.02] group",
        isSelected && "border-purple-500 bg-purple-50/50"
      )}
      onClick={() => onClick?.(article)}
    >
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </CardTitle>
          <ExternalLink size={14} className="text-gray-500 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar size={12} />
          <span>{formatDate(article.timestamp)}</span>
          {article.source && (
            <>
              <span>•</span>
              <span className="font-medium">{article.source}</span>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {article.snippet && (
          <CardDescription className="text-sm leading-relaxed line-clamp-3">
            {article.snippet}
          </CardDescription>
        )}
        
        {article.companies && article.companies.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Mentioned Stocks
            </p>
            <div className="flex flex-wrap gap-2">
              {article.companies.slice(0, 6).map((stock, index) => (
                <CustomBadge
                  key={index}
                  variant={getStockColor(stock)}
                  className="font-mono text-xs hover:scale-105 transition-transform"
                >
                  {stock.symbol || stock.ticker || stock}
                </CustomBadge>
              ))}
              {article.companies.length > 6 && (
                <CustomBadge variant="outline" className="text-xs">
                  +{article.companies.length - 6} more
                </CustomBadge>
              )}
            </div>
          </div>
        )}
        
        {article.sentiment && (
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <span className="text-xs text-gray-500">Market Sentiment</span>
            <CustomBadge 
              variant={article.sentiment === 'positive' ? 'success' : article.sentiment === 'negative' ? 'destructive' : 'secondary'}
              className="text-xs capitalize"
            >
              {article.sentiment}
            </CustomBadge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ArticleCard