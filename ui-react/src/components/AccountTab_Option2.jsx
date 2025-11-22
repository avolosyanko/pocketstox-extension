import React, { memo, useEffect, useState } from 'react'
import { Plus, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStorage } from '@/contexts/ServiceContext'

const AccountTab = memo(({ onArticleClick }) => {
  const storage = useStorage()

  const [trackedCompanies, setTrackedCompanies] = useState([])
  const [hoveredIndex, setHoveredIndex] = useState(null)

  // Status configuration with colors
  const statusOptions = [
    { id: 'watchlist', title: 'Watchlist', icon: '👀', dotColor: 'bg-gray-400' },
    { id: 'researching', title: 'Researching', icon: '🔍', dotColor: 'bg-blue-500' },
    { id: 'conviction', title: 'Conviction', icon: '💎', dotColor: 'bg-purple-500' },
    { id: 'owned', title: 'Owned', icon: '✅', dotColor: 'bg-green-500' }
  ]

  const getStatusConfig = (statusId) => {
    return statusOptions.find(s => s.id === statusId) || statusOptions[0]
  }

  // Load tracked companies from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await storage.getWatchlist?.() || []

        let savedCompanies
        if (result && result.length > 0) {
          savedCompanies = result
        } else {
          // Demo data
          savedCompanies = [
            { ticker: 'META', company: 'Meta Platforms Inc.', reason: 'Reels monetization improving, Reality Labs investments paying off. Strong ad business recovery.', status: 'watchlist', hasAlert: true, notes: [{ text: 'Reels monetization improving, Reality Labs investments paying off. Strong ad business recovery.', timestamp: new Date().toISOString() }] },
            { ticker: 'NFLX', company: 'Netflix Inc.', reason: 'Streaming wars intensifying. Password sharing crackdown and ad tier showing promise.', status: 'watchlist', notes: [{ text: 'Streaming wars intensifying. Password sharing crackdown and ad tier showing promise.', timestamp: new Date().toISOString() }] },
            { ticker: 'RBLX', company: 'Roblox Corporation', reason: 'Gaming platform with strong user engagement. Monetization and user safety concerns to watch.', status: 'researching', notes: [{ text: 'Gaming platform with strong user engagement. Monetization and user safety concerns to watch.', timestamp: new Date().toISOString() }] },
            { ticker: 'NVDA', company: 'NVIDIA Corporation', reason: 'AI chip leader with strong data center growth. Valuation concerns but long-term secular tailwinds.', status: 'conviction', notes: [{ text: 'AI chip leader with strong data center growth.', timestamp: new Date().toISOString() }] },
          ]
        }

        setTrackedCompanies(savedCompanies)
      } catch (error) {
        console.error('Failed to load watchlist:', error)
      }
    }

    loadData()
  }, [storage])

  const handleCompanyClick = (company) => {
    const companyArticle = {
      id: `company-${company.ticker}`,
      title: `${company.ticker} - ${company.company}`,
      content: company.notes?.[0]?.text || 'No notes available',
      url: `https://finance.yahoo.com/quote/${company.ticker}`,
      timestamp: company.notes?.[0]?.timestamp || new Date().toISOString(),
      companies: [company.ticker],
      matches: [{ ticker: company.ticker, company: company.company, score: 1.0 }]
    }

    if (onArticleClick) {
      onArticleClick(companyArticle)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with Add button */}
      <div className="flex-shrink-0 px-6 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
        <h2 className="text-sm font-medium text-gray-500">
          {trackedCompanies.length} {trackedCompanies.length === 1 ? 'company' : 'companies'}
        </h2>
        <button
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
        >
          <Plus size={14} />
          Add company
        </button>
      </div>

      {/* Companies List - Notion Style */}
      {trackedCompanies.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
              <TrendingUp size={24} className="text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No companies yet</h3>
            <p className="text-xs text-gray-500">
              Add companies to start tracking your investments
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2">
            {trackedCompanies.map((company, index) => {
              const statusConfig = getStatusConfig(company.status)
              const isHovered = hoveredIndex === index

              return (
                <div
                  key={`${company.ticker}-${index}`}
                  onClick={() => handleCompanyClick(company)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors",
                    isHovered ? "bg-gray-50" : "hover:bg-gray-50"
                  )}
                >
                  {/* Status Emoji */}
                  <div className="flex-shrink-0 text-lg leading-none">
                    {statusConfig.icon}
                  </div>

                  {/* Company Info */}
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {company.ticker}
                    </span>
                    {company.hasAlert && (
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    )}
                    <span className="text-xs text-gray-500 truncate">
                      {company.company}
                    </span>
                  </div>

                  {/* Status Badge - Shows on hover */}
                  {isHovered && (
                    <div className="flex-shrink-0">
                      <div className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded text-xs",
                        "bg-gray-100 text-gray-600"
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", statusConfig.dotColor)} />
                        <span>{statusConfig.title}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
})

AccountTab.displayName = 'AccountTab'

export default AccountTab
