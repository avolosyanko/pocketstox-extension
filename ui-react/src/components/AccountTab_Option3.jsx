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
import { Plus, TrendingUp, HeartOff, ChevronDown, ChevronRight } from 'lucide-react'
import { semanticTypography } from '@/styles/typography'
import { cn } from '@/lib/utils'
import { useStorage, useAuth } from '@/contexts/ServiceContext'

const AccountTab = memo(({ onNavigateToArticle, onTabChange, onArticleClick }) => {
  const storage = useStorage()
  const auth = useAuth()

  const [trackedCompanies, setTrackedCompanies] = useState([])
  const [collapsedSections, setCollapsedSections] = useState(new Set())
  const [expandedCards, setExpandedCards] = useState(new Set())
  const [quickNote, setQuickNote] = useState('')
  const [selectedCompanyForNote, setSelectedCompanyForNote] = useState(null)

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

  const getCompaniesByStatus = useCallback((status) => {
    return trackedCompanies.filter(company => company.status === status)
  }, [trackedCompanies])

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
            { ticker: 'AAPL', company: 'Apple Inc.', reason: 'Services growth and ecosystem lock-in. Vision Pro potential upside.', status: 'owned', notes: [{ text: 'Bought at $175. Services growth story.', timestamp: new Date().toISOString() }] },
          ]
        }

        setTrackedCompanies(savedCompanies)
      } catch (error) {
        console.error('Failed to load watchlist:', error)
      }
    }

    loadData()
  }, [storage])

  // Save quick note
  const handleSaveQuickNote = useCallback(() => {
    if (!quickNote.trim() || !selectedCompanyForNote) return

    const companyIndex = trackedCompanies.findIndex(c => c.ticker === selectedCompanyForNote)
    if (companyIndex === -1) return

    const newNote = {
      text: quickNote.trim(),
      timestamp: new Date().toISOString()
    }

    setTrackedCompanies(prev => prev.map((company, index) => {
      if (index === companyIndex) {
        return {
          ...company,
          notes: [newNote, ...(company.notes || [])]
        }
      }
      return company
    }))

    setQuickNote('')
    setSelectedCompanyForNote(null)
  }, [quickNote, selectedCompanyForNote, trackedCompanies])

  const toggleSection = (sectionId) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const toggleCard = (ticker) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(ticker)) {
        newSet.delete(ticker)
      } else {
        newSet.add(ticker)
      }
      return newSet
    })
  }

  const handleRemoveCompany = useCallback((ticker) => {
    setTrackedCompanies(prev => prev.filter(c => c.ticker !== ticker))
  }, [])

  const handleMoveToStatus = useCallback((ticker, newStatus) => {
    setTrackedCompanies(prev => prev.map(c =>
      c.ticker === ticker ? { ...c, status: newStatus } : c
    ))
  }, [])

  return (
    <div>
      {/* Quick Note Input */}
      {trackedCompanies.length > 0 && (
        <div className="mb-4 bg-gray-50 rounded border border-gray-200 mx-2">
          <div className="p-3">
            <textarea
              placeholder="Write a note..."
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSaveQuickNote()
                }
              }}
              className="w-full px-0 py-1 text-sm border-0 focus:outline-none resize-none placeholder:text-gray-400 bg-transparent"
              rows={2}
            />
          </div>
          <div className="border-t border-gray-200 bg-white">
            <div className="px-3 py-2 flex items-center gap-3">
              <button
                onClick={handleSaveQuickNote}
                disabled={!quickNote.trim() || !selectedCompanyForNote}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-all font-medium",
                  quickNote.trim() && selectedCompanyForNote
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                Save
              </button>
              <select
                value={selectedCompanyForNote || ''}
                onChange={(e) => setSelectedCompanyForNote(e.target.value)}
                className="text-xs border-0 focus:outline-none bg-transparent text-gray-600 cursor-pointer hover:bg-gray-50 rounded px-1 py-1 transition-colors"
              >
                <option value="">Select company...</option>
                {trackedCompanies.map((company) => (
                  <option key={company.ticker} value={company.ticker}>
                    {company.ticker}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-2">
        <h2 className="text-sm font-medium text-gray-700">Companies</h2>
        <button
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      {/* Companies by Section */}
      {trackedCompanies.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-200 bg-white mb-3 mx-2">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-gray-100 p-3 mb-3">
              <TrendingUp size={20} className="text-gray-500" />
            </div>
            <h3 className={`${semanticTypography.emptyStateTitle} mb-1`}>No companies yet</h3>
            <p className={semanticTypography.emptyStateDescription}>
              Add companies to track across your investment pipeline
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1 px-2">
          {statusOptions.map((section) => {
            const sectionCompanies = getCompaniesByStatus(section.id)
            const isCollapsed = collapsedSections.has(section.id)

            if (sectionCompanies.length === 0) return null

            return (
              <div key={section.id}>
                {/* Section Header */}
                <div
                  className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-gray-50 rounded transition-colors"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRight size={14} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={14} className="text-gray-400" />
                    )}
                    <div className={cn("w-2 h-2 rounded-full", section.color)} />
                    <h3 className="text-sm font-medium text-gray-700">{section.title}</h3>
                  </div>
                  <span className="text-xs text-gray-400">{sectionCompanies.length}</span>
                </div>

                {/* Section Companies */}
                {!isCollapsed && (
                  <div className="ml-4 space-y-1 mt-1">
                    {sectionCompanies.map((company) => {
                      const isExpanded = expandedCards.has(company.ticker)
                      const statusConfig = getStatusConfig(company.status)

                      return (
                        <div
                          key={company.ticker}
                          className="bg-white rounded border border-gray-200 overflow-hidden hover:shadow-sm transition-all"
                        >
                          {/* Compact Card View */}
                          <div
                            className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-50"
                            onClick={() => toggleCard(company.ticker)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">{company.ticker}</span>
                                {company.hasAlert && (
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                )}
                                <span className="text-xs text-gray-500 truncate">{company.company}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleCard(company.ticker)
                                }}
                                className="text-gray-400 hover:text-gray-600 p-0.5"
                              >
                                {isExpanded ? (
                                  <ChevronDown size={14} />
                                ) : (
                                  <ChevronRight size={14} />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Card Details */}
                          {isExpanded && (
                            <div className="px-2 pb-2 border-t border-gray-100">
                              <div className="pt-2 space-y-2">
                                <p className="text-sm text-gray-700">{company.company}</p>

                                {company.notes?.[0]?.text && (
                                  <p className="text-xs text-gray-500 leading-relaxed">
                                    {company.notes[0].text}
                                  </p>
                                )}

                                <div className="flex items-center gap-2 pt-1">
                                  <select
                                    value={company.status}
                                    onChange={(e) => {
                                      e.stopPropagation()
                                      handleMoveToStatus(company.ticker, e.target.value)
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className={cn(
                                      "text-xs px-2 py-1 rounded border-0 cursor-pointer transition-colors",
                                      statusConfig.bgLight,
                                      statusConfig.textColor
                                    )}
                                  >
                                    {statusOptions.map((option) => (
                                      <option key={option.id} value={option.id}>
                                        {option.title}
                                      </option>
                                    ))}
                                  </select>

                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <button
                                        className="ml-auto text-gray-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <HeartOff size={12} />
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
                                          onClick={() => handleRemoveCompany(company.ticker)}
                                        >
                                          Remove
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
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
