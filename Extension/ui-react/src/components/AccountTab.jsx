import React, { memo, useEffect, useState } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Check, Plus, TrendingUp, AlertCircle, HeartOff, ChevronDown, Edit3 } from 'lucide-react'
import { semanticTypography } from '@/styles/typography'
import { cn } from '@/lib/utils'

const AccountTab = memo(({ onNavigateToArticle, onTabChange }) => {
  const [trackedCompanies, setTrackedCompanies] = useState([])
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false)
  const [newCompany, setNewCompany] = useState({ ticker: '', company: '', reason: '' })
  const [viewingNotes, setViewingNotes] = useState(null)
  const [collapsedCards, setCollapsedCards] = useState(new Set())
  const [quickNote, setQuickNote] = useState('')
  const [selectedCompanyForNote, setSelectedCompanyForNote] = useState(null)

  const toggleCardCollapse = (index) => {
    setCollapsedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const handleSaveQuickNote = () => {
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
  }

  // Load tracked companies from storage
  useEffect(() => {
    const loadData = async () => {
      if (window.extensionServices && window.extensionServices.storage) {
        // Load tracked companies (placeholder for now)
        const savedCompanies = [
          {
            ticker: 'AAPL',
            company: 'Apple Inc.',
            notes: [
              { text: 'Strong ecosystem and services growth. iPhone 15 cycle looking promising with AI integration coming.', timestamp: new Date().toISOString() }
            ],
            hasAlert: false
          },
          {
            ticker: 'NVDA',
            company: 'NVIDIA Corporation',
            notes: [
              { text: 'Dominant position in AI chips. Data center revenue accelerating as enterprises build out AI infrastructure.', timestamp: new Date().toISOString() },
              { text: 'Stock split announced. H100 demand remains strong with new customers onboarding.', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
              { text: 'Initial investment based on AI chip leadership and gaming GPU dominance.', timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: true,
            alert: {
              text: 'Earnings call scheduled for next week',
              discoveryCard: {
                articleTitle: 'NVIDIA Q3 2024 Earnings Preview: AI Chip Demand Expected to Drive Results',
                articleUrl: 'https://finance.yahoo.com/news/nvidia-earnings-preview-q3-2024',
                match: {
                  ticker: 'NVDA',
                  company: 'NVIDIA Corporation',
                  score: 0.92,
                  reasoning: 'Strong mention of AI chip demand and data center revenue growth, directly relevant to NVIDIA\'s core business'
                },
                sourceExcerpt: 'NVIDIA\'s data center business continues to see unprecedented demand as enterprises invest heavily in AI infrastructure...',
                userNote: 'Initial investment based on AI chip leadership and gaming GPU dominance.',
                addedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
              }
            }
          },
          {
            ticker: 'MSFT',
            company: 'Microsoft Corporation',
            notes: [
              { text: 'Azure cloud growth and Copilot AI rollout across Office suite. Strong enterprise positioning.', timestamp: new Date().toISOString() }
            ],
            hasAlert: false
          },
          {
            ticker: 'GOOGL',
            company: 'Alphabet Inc.',
            notes: [
              { text: 'Search dominance and growing cloud business. Bard AI integration could expand moat.', timestamp: new Date().toISOString() }
            ],
            hasAlert: false
          },
          {
            ticker: 'TSLA',
            company: 'Tesla, Inc.',
            notes: [
              { text: 'EV market leader with vertical integration. Cybertruck ramp and energy storage growth drivers.', timestamp: new Date().toISOString() }
            ],
            hasAlert: false
          },
          {
            ticker: 'META',
            company: 'Meta Platforms Inc.',
            notes: [
              { text: 'Reels monetization improving, Reality Labs investments paying off. Strong ad business recovery.', timestamp: new Date().toISOString() },
              { text: 'Q3 earnings beat expectations. User growth accelerating in emerging markets.', timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: true,
            alert: {
              text: 'New VR headset launch announced',
              discoveryCard: {
                articleTitle: 'Meta Announces Next-Generation VR Headset with Advanced Features',
                articleUrl: 'https://techcrunch.com/2024/10/30/meta-announces-new-vr-headset',
                match: {
                  ticker: 'META',
                  company: 'Meta Platforms Inc.',
                  score: 0.94,
                  reasoning: 'Major product announcement in VR/AR space, directly impacts Reality Labs division and long-term metaverse strategy'
                },
                sourceExcerpt: 'Meta\'s latest VR headset features advanced hand tracking and mixed reality capabilities, positioning the company as a leader in the emerging metaverse market...',
                userNote: 'Reels monetization improving, Reality Labs investments paying off. Strong ad business recovery.',
                addedAt: new Date().toISOString()
              }
            }
          }
        ]
        setTrackedCompanies(savedCompanies)
        // Start all cards in collapsed state
        setCollapsedCards(new Set(savedCompanies.map((_, index) => index)))
        // Set default selected company to first one
        if (savedCompanies.length > 0) {
          setSelectedCompanyForNote(savedCompanies[0].ticker)
        }
      }
    }
    loadData()
  }, [])
  // Set up auth listener
  useEffect(() => {
    // Listen for auth messages from landing page
    const handleMessage = (message, sender, sendResponse) => {
      if (message.type === 'AUTH_SUCCESS' && message.source === 'pocketstox-landing') {
        // Handle successful authentication
        const { user, session } = message.data
        console.log('Auth successful:', user)
        // Store auth data in extension storage
        if (window.extensionServices && window.extensionServices.storage) {
          window.extensionServices.storage.setAccount({
            email: user.email,
            userId: user.id,
            authToken: session.access_token,
            isPremium: user.app_metadata?.subscription_status === 'active',
            lastSignIn: new Date().toISOString()
          })
        }
      }
    }

    // Add message listener
    if (chrome && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(handleMessage)
    }

    return () => {
      if (chrome && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.removeListener(handleMessage)
      }
    }
  }, [])
  return (
    <div>

      {/* Quick Note Section */}
      {trackedCompanies.length > 0 && (
        <Card className="bg-white border border-gray-200 mb-3 rounded-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="p-3 bg-gray-50">
              <textarea
                placeholder="Add a note about your investments..."
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSaveQuickNote()
                  }
                }}
                className="w-full px-0 py-2 text-sm border-0 focus:outline-none resize-none placeholder:text-gray-400 bg-transparent"
                rows={9}
              />
            </div>
            <div className="border-t border-gray-200">
              <div className="p-3 flex items-center gap-3">
                <button
                  onClick={handleSaveQuickNote}
                  disabled={!quickNote.trim() || !selectedCompanyForNote}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md transition-all font-medium",
                    quickNote.trim() && selectedCompanyForNote
                      ? "bg-gray-900 text-white hover:bg-gray-800 shadow-sm"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                >
                  Save note
                </button>
                <span className="text-xs text-gray-500">Enter</span>
              </div>
            </div>
            <div className="border-t border-gray-200">
              <div className="p-3 flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">Add to</span>
                <div className="border-l border-gray-200 h-4 mx-1"></div>
                <select
                  value={selectedCompanyForNote || ''}
                  onChange={(e) => setSelectedCompanyForNote(e.target.value)}
                  className="text-sm border-0 focus:outline-none bg-transparent text-gray-900 font-medium cursor-pointer hover:bg-gray-50 rounded px-2 py-1 transition-colors"
                >
                  {trackedCompanies.map((company, index) => (
                    <option key={index} value={company.ticker}>
                      {company.ticker}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Following Section */}
      <div className="mt-4 mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-medium text-gray-900">Companies</h2>
        <button
          onClick={() => setShowAddCompanyModal(true)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {trackedCompanies.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-200 bg-white mb-3">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-gray-100 p-3 mb-3">
              <TrendingUp size={20} className="text-gray-500" />
            </div>
            <h3 className={`${semanticTypography.emptyStateTitle} mb-1`}>Not following any companies yet</h3>
            <p className={semanticTypography.emptyStateDescription}>
              Add companies to follow and monitor
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 mb-3">
          {trackedCompanies
            .sort((a, b) => {
              // Sort by alert status first (alerts at top)
              if (a.hasAlert && !b.hasAlert) return -1
              if (!a.hasAlert && b.hasAlert) return 1
              // Then sort alphabetically by ticker
              return a.ticker.localeCompare(b.ticker)
            })
            .map((company, index) => (
            <Card key={index} className="bg-white border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleCardCollapse(index)}>
              <CardContent className="p-4">
                <div className={cn(
                  "flex items-start justify-between",
                  !collapsedCards.has(index) ? "mb-2" : ""
                )}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">{company.ticker}</h3>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="text-gray-400 hover:text-gray-600"
                            title="Remove"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <HeartOff size={14} />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Unfollow {company.ticker}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to unfollow {company.ticker}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-gray-900 text-white hover:bg-gray-800"
                              onClick={() => setTrackedCompanies(prev => prev.filter((_, i) => i !== index))}
                            >
                              Unfollow
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      {company.hasAlert && (
                        <div className="flex items-center justify-center p-1 bg-purple-100 text-purple-800 rounded-full">
                          <AlertCircle size={12} />
                        </div>
                      )}
                    </div>
                    <p className={semanticTypography.secondaryText}>{company.company}</p>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleCardCollapse(index)}
                      className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                      title={collapsedCards.has(index) ? "Expand" : "Collapse"}
                    >
                      <ChevronDown 
                        size={16} 
                        className={cn(
                          "transition-transform duration-200",
                          !collapsedCards.has(index) ? "rotate-180" : ""
                        )}
                      />
                    </button>
                  </div>
                </div>
                {company.alert && (
                  <div className={cn(
                    "pt-1",
                    !collapsedCards.has(index) ? "mt-1" : "mt-1"
                  )}>
                    {typeof company.alert === 'object' && company.alert.discoveryCard ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onNavigateToArticle && company.alert.discoveryCard.articleUrl) {
                            onNavigateToArticle(
                              company.alert.discoveryCard.articleUrl,
                              company.alert.discoveryCard.articleTitle,
                              company.alert.discoveryCard.match.ticker
                            )
                          }
                        }}
                        className="text-xs text-purple-500 hover:text-purple-700 underline hover:no-underline transition-colors text-left"
                        title="View original article in Discovery tab"
                      >
                        {company.alert.text}
                      </button>
                    ) : (
                      <p className="text-xs text-purple-500">
                        {typeof company.alert === 'object' ? company.alert.text : company.alert}
                      </p>
                    )}
                  </div>
                )}
                {!collapsedCards.has(index) && (
                  <div className="bg-gray-50 rounded p-2 mt-2">
                    <p className="text-xs text-gray-600 italic">"{company.notes?.[0]?.text || company.reason}"</p>
                    {company.notes && company.notes.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setViewingNotes(company)
                        }}
                        className="text-xs text-gray-500 hover:text-gray-900 mt-1 underline"
                      >
                        View {company.notes.length - 1} previous note{company.notes.length > 2 ? 's' : ''}
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Notes History Dialog */}
      <Dialog open={viewingNotes !== null} onOpenChange={(open) => !open && setViewingNotes(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewingNotes?.ticker} - Note History</DialogTitle>
            <DialogDescription>
              {viewingNotes?.company}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {viewingNotes?.notes?.map((note, index) => (
              <div key={index} className="border-l-2 border-gray-200 pl-3 py-1">
                <p className="text-xs text-gray-500 mb-1">
                  {new Date(note.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <p className="text-sm text-gray-700">{note.text}</p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingNotes(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Company Dialog */}
      <Dialog open={showAddCompanyModal} onOpenChange={setShowAddCompanyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Follow Company</DialogTitle>
            <DialogDescription>
              Add a company to track and document your research
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ticker</label>
              <input
                type="text"
                placeholder="e.g. AAPL"
                value={newCompany.ticker}
                onChange={(e) => setNewCompany({...newCompany, ticker: e.target.value.toUpperCase()})}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                placeholder="e.g. Apple Inc."
                value={newCompany.company}
                onChange={(e) => setNewCompany({...newCompany, company: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Why are you interested?</label>
              <textarea
                placeholder="Document your investment thesis..."
                value={newCompany.reason}
                onChange={(e) => setNewCompany({...newCompany, reason: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewCompany({ ticker: '', company: '', reason: '' })
                setShowAddCompanyModal(false)
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-gray-900 text-white hover:bg-gray-800"
              onClick={() => {
                if (newCompany.ticker && newCompany.company && newCompany.reason) {
                  const newNote = {
                    text: newCompany.reason,
                    timestamp: new Date().toISOString()
                  }
                  const newCompanies = [...trackedCompanies, {
                    ticker: newCompany.ticker,
                    company: newCompany.company,
                    notes: [newNote],
                    hasAlert: false
                  }]
                  setTrackedCompanies(newCompanies)
                  // Add the new company index to collapsed cards
                  setCollapsedCards(prev => new Set([...prev, newCompanies.length - 1]))
                  // Set new company as default selected for notes if none selected
                  if (!selectedCompanyForNote) {
                    setSelectedCompanyForNote(newCompany.ticker)
                  }
                  setNewCompany({ ticker: '', company: '', reason: '' })
                  setShowAddCompanyModal(false)
                }
              }}
            >
              Follow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  )
})

AccountTab.displayName = 'AccountTab'

export default AccountTab