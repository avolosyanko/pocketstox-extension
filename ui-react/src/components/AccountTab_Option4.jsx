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
import { Plus, TrendingUp, HeartOff, ChevronDown, ChevronUp } from 'lucide-react'
import { semanticTypography } from '@/styles/typography'
import { cn } from '@/lib/utils'
import { useStorage, useAuth } from '@/contexts/ServiceContext'

const AccountTab = memo(({ onNavigateToArticle, onTabChange, onArticleClick }) => {
  const storage = useStorage()
  const auth = useAuth()

  const [trackedCompanies, setTrackedCompanies] = useState([])
  const [quickNote, setQuickNote] = useState('')
  const [selectedCompanyForNote, setSelectedCompanyForNote] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortColumn, setSortColumn] = useState('ticker')
  const [sortDirection, setSortDirection] = useState('asc')

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
            { ticker: 'META', company: 'Meta Platforms Inc.', reason: 'Reels monetization improving, Reality Labs investments paying off. Strong ad business recovery.', status: 'watchlist', hasAlert: true, notes: [{ text: 'Reels monetization improving, Reality Labs investments paying off.', timestamp: new Date().toISOString() }] },
            { ticker: 'NFLX', company: 'Netflix Inc.', reason: 'Streaming wars intensifying. Password sharing crackdown and ad tier showing promise.', status: 'watchlist', notes: [{ text: 'Streaming wars intensifying. Password sharing crackdown.', timestamp: new Date().toISOString() }] },
            { ticker: 'RBLX', company: 'Roblox Corporation', reason: 'Gaming platform with strong user engagement. Monetization and user safety concerns to watch.', status: 'researching', notes: [{ text: 'Gaming platform with strong user engagement.', timestamp: new Date().toISOString() }] },
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

  // Filter and sort
  const filteredAndSortedCompanies = trackedCompanies
    .filter(company => filterStatus === 'all' || company.status === filterStatus)
    .sort((a, b) => {
      let aVal, bVal

      switch (sortColumn) {
        case 'ticker':
          aVal = a.ticker
          bVal = b.ticker
          break
        case 'company':
          aVal = a.company
          bVal = b.company
          break
        case 'status':
          aVal = statusOptions.findIndex(s => s.id === a.status)
          bVal = statusOptions.findIndex(s => s.id === b.status)
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const handleRemoveCompany = useCallback((ticker) => {
    setTrackedCompanies(prev => prev.filter(c => c.ticker !== ticker))
  }, [])

  const handleMoveToStatus = useCallback((ticker, newStatus) => {
    setTrackedCompanies(prev => prev.map(c =>
      c.ticker === ticker ? { ...c, status: newStatus } : c
    ))
  }, [])

  const SortIcon = ({ column }) => {
    if (sortColumn !== column) return null
    return sortDirection === 'asc' ? (
      <ChevronUp size={12} className="inline ml-1" />
    ) : (
      <ChevronDown size={12} className="inline ml-1" />
    )
  }

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

      {/* Header with Filter and Add */}
      <div className="flex items-center justify-between mb-3 px-2">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-xs px-2 py-1 border border-gray-300 rounded cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <option value="all">All Companies ({trackedCompanies.length})</option>
          {statusOptions.map((status) => {
            const count = trackedCompanies.filter(c => c.status === status.id).length
            return (
              <option key={status.id} value={status.id}>
                {status.title} ({count})
              </option>
            )
          })}
        </select>
        <button
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      {/* Table */}
      {filteredAndSortedCompanies.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-200 bg-white mb-3 mx-2">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-gray-100 p-3 mb-3">
              <TrendingUp size={20} className="text-gray-500" />
            </div>
            <h3 className={`${semanticTypography.emptyStateTitle} mb-1`}>No companies found</h3>
            <p className={semanticTypography.emptyStateDescription}>
              {filterStatus === 'all' ? 'Add companies to get started' : 'No companies in this category'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mx-2 border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  className="text-left px-2 py-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('ticker')}
                >
                  Ticker <SortIcon column="ticker" />
                </th>
                <th
                  className="text-left px-2 py-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors hidden sm:table-cell"
                  onClick={() => handleSort('company')}
                >
                  Company <SortIcon column="company" />
                </th>
                <th
                  className="text-left px-2 py-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  Status <SortIcon column="status" />
                </th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedCompanies.map((company, index) => {
                const statusConfig = getStatusConfig(company.status)

                return (
                  <tr
                    key={company.ticker}
                    className={cn(
                      "border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer",
                      index === filteredAndSortedCompanies.length - 1 && "border-b-0"
                    )}
                    onClick={() => {
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
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-900">{company.ticker}</span>
                        {company.hasAlert && (
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-1 sm:hidden">{company.company}</div>
                      {company.notes?.[0]?.text && (
                        <div className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                          {company.notes[0].text}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2 hidden sm:table-cell">
                      <div className="text-gray-700">{company.company}</div>
                      {company.notes?.[0]?.text && (
                        <div className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                          {company.notes[0].text}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={company.status}
                        onChange={(e) => handleMoveToStatus(company.ticker, e.target.value)}
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded border-0 cursor-pointer transition-colors w-full",
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
                    </td>
                    <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="text-gray-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
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
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
})

AccountTab.displayName = 'AccountTab'

export default AccountTab
