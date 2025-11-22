import React, { memo, useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Plus, TrendingUp, HeartOff, GripVertical } from 'lucide-react'
import { semanticTypography } from '@/styles/typography'
import { cn } from '@/lib/utils'
import { useStorage, useAuth } from '@/contexts/ServiceContext'

const AccountTab = memo(({ onNavigateToArticle, onTabChange, onArticleClick }) => {
  const storage = useStorage()
  const auth = useAuth()

  const [trackedCompanies, setTrackedCompanies] = useState([])
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  // Status configuration with colors
  const statusOptions = [
    { id: 'watchlist', title: 'Watchlist', color: 'bg-gray-500', textColor: 'text-gray-700', bgLight: 'bg-gray-100' },
    { id: 'researching', title: 'Researching', color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-50' },
    { id: 'conviction', title: 'Conviction', color: 'bg-purple-500', textColor: 'text-purple-700', bgLight: 'bg-purple-50' },
    { id: 'owned', title: 'Owned', color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-50' }
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
          ]
        }

        setTrackedCompanies(savedCompanies)
      } catch (error) {
        console.error('Failed to load watchlist:', error)
      }
    }

    loadData()
  }, [storage])

  // Drag and drop handlers
  const handleDragStart = useCallback((e, index) => {
    setDraggedItem(index)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedItem !== null && draggedItem !== index) {
      setDragOverIndex(index)
    }
  }, [draggedItem])

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null)
    setDragOverIndex(null)
  }, [])

  const handleDrop = useCallback((e, dropIndex) => {
    e.preventDefault()

    if (draggedItem === null || draggedItem === dropIndex) return

    setTrackedCompanies(prev => {
      const newCompanies = [...prev]
      const [removed] = newCompanies.splice(draggedItem, 1)
      newCompanies.splice(dropIndex, 0, removed)
      return newCompanies
    })

    setDraggedItem(null)
    setDragOverIndex(null)
  }, [draggedItem])

  // Cycle company status (click badge to change)
  const handleStatusCycle = useCallback((index) => {
    setTrackedCompanies(prev => prev.map((company, i) => {
      if (i !== index) return company

      const currentIndex = statusOptions.findIndex(s => s.id === company.status)
      const nextIndex = (currentIndex + 1) % statusOptions.length
      return { ...company, status: statusOptions[nextIndex].id }
    }))
  }, [])

  // Remove company
  const handleRemoveCompany = useCallback((index) => {
    setTrackedCompanies(prev => prev.filter((_, i) => i !== index))
  }, [])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-sm font-medium text-gray-700">Companies</h2>
        <button
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      {/* Companies List */}
      {trackedCompanies.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-200 bg-white mb-3 mx-2">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-gray-100 p-3 mb-3">
              <TrendingUp size={20} className="text-gray-500" />
            </div>
            <h3 className={`${semanticTypography.emptyStateTitle} mb-1`}>No companies yet</h3>
            <p className={semanticTypography.emptyStateDescription}>
              Add companies to track and organize them by status
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 px-2">
          {trackedCompanies.map((company, index) => {
            const statusConfig = getStatusConfig(company.status)
            const isDragging = draggedItem === index
            const isDropTarget = dragOverIndex === index

            return (
              <div
                key={`${company.ticker}-${index}`}
                draggable
                className={cn(
                  "bg-white rounded-lg border border-gray-200 p-3 shadow-sm transition-all relative",
                  isDragging && "opacity-50",
                  isDropTarget && "border-blue-400 border-2",
                  "hover:shadow-md cursor-move"
                )}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
              >
                <div className="flex items-start gap-3">
                  {/* Drag handle */}
                  <div className="pt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                    <GripVertical size={16} />
                  </div>

                  {/* Main content */}
                  <div
                    className="flex-1 cursor-pointer min-w-0"
                    onClick={(e) => {
                      if (e.target.closest('button') || e.target.closest('[role="combobox"]')) return

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
                    }}
                  >
                    {/* Header row: Ticker + Status Badge */}
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900">{company.ticker}</h4>
                      {company.hasAlert && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusCycle(index)
                        }}
                        className={cn(
                          "ml-auto px-2 py-0.5 rounded-full text-xs font-medium transition-colors",
                          statusConfig.bgLight,
                          statusConfig.textColor,
                          "hover:opacity-80"
                        )}
                        title="Click to change status"
                      >
                        <div className="flex items-center gap-1.5">
                          <div className={cn("w-1.5 h-1.5 rounded-full", statusConfig.color)} />
                          {statusConfig.title}
                        </div>
                      </button>
                    </div>

                    {/* Company name */}
                    <p className="text-sm text-gray-600 mb-1">{company.company}</p>

                    {/* Notes preview */}
                    {company.notes?.[0]?.text && (
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {company.notes[0].text}
                      </p>
                    )}
                  </div>

                  {/* Remove button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="text-gray-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
                        title="Remove"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <HeartOff size={14} />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove {company.ticker}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove {company.ticker} from your portfolio?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-gray-900 text-white hover:bg-gray-800"
                          onClick={() => handleRemoveCompany(index)}
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
})

AccountTab.displayName = 'AccountTab'

export default AccountTab
