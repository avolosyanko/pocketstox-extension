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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Check, Plus, TrendingUp, AlertCircle, HeartOff, ChevronDown, ChevronRight, Edit3, Maximize2, MoreVertical } from 'lucide-react'
import { semanticTypography } from '@/styles/typography'
import { cn } from '@/lib/utils'
import { useStorage, useAuth } from '@/contexts/ServiceContext'

const AccountTab = memo(({ onNavigateToArticle, onTabChange, onArticleClick }) => {
  // Modern service hooks
  const storage = useStorage()
  const auth = useAuth()
  
  const [trackedCompanies, setTrackedCompanies] = useState([])
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false)
  const [newCompany, setNewCompany] = useState({ ticker: '', company: '', reason: '', status: 'watchlist' })
  const [viewingNotes, setViewingNotes] = useState(null)
  const [collapsedCards, setCollapsedCards] = useState(new Set())
  const [quickNote, setQuickNote] = useState('')
  const [selectedCompanyForNote, setSelectedCompanyForNote] = useState(null)
  const [showNotesOverlay, setShowNotesOverlay] = useState(false)
  const [overlayNote, setOverlayNote] = useState('')
  const [collapsedSections, setCollapsedSections] = useState(new Set(['owned', 'conviction', 'researching', 'watchlist']))

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

  const handleSaveOverlayNote = useCallback(() => {
    if (!overlayNote.trim() || !selectedCompanyForNote) return
    
    const companyIndex = trackedCompanies.findIndex(c => c.ticker === selectedCompanyForNote)
    if (companyIndex === -1) return

    const newNote = {
      text: overlayNote.trim(),
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

    setOverlayNote('')
    setShowNotesOverlay(false)
  }, [overlayNote, selectedCompanyForNote, trackedCompanies])

  const handleStatusChange = useCallback((companyIndex, newStatus) => {
    setTrackedCompanies(prev => prev.map((company, index) => {
      if (index === companyIndex) {
        return { ...company, status: newStatus }
      }
      return company
    }))
  }, [])

  const getCompaniesByStatus = useCallback((status) => {
    return trackedCompanies
      .map((company, index) => ({ ...company, originalIndex: index }))
      .filter(company => company.status === status)
  }, [trackedCompanies])

  const kanbanSections = [
    { id: 'owned', title: 'Owned', description: 'Companies you currently own' },
    { id: 'conviction', title: 'Conviction', description: 'High confidence investment candidates' },
    { id: 'researching', title: 'Researching', description: 'Companies under active research' },
    { id: 'watchlist', title: 'Watchlist', description: 'Companies to monitor' }
  ]

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

  // Load tracked companies from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to get saved companies from storage
        const result = await storage.getWatchlist?.() || []
        
        // For demo purposes, always use placeholder data (change this in production)
        const savedCompanies = [
          // OWNED COMPANIES
          {
            ticker: 'AAPL',
            company: 'Apple Inc.',
            status: 'owned',
            notes: [
              { text: 'Strong ecosystem and services growth. iPhone 15 cycle looking promising with AI integration coming.', timestamp: new Date().toISOString() }
            ],
            hasAlert: false
          },
          {
            ticker: 'NVDA',
            company: 'NVIDIA Corporation',
            status: 'owned',
            notes: [
              { text: 'Dominant position in AI chips. Data center revenue accelerating as enterprises build out AI infrastructure.', timestamp: new Date().toISOString() },
              { text: 'Stock split announced. H100 demand remains strong with new customers onboarding.', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }
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
            ticker: 'AMZN',
            company: 'Amazon.com Inc.',
            status: 'owned',
            notes: [
              { text: 'AWS continues to dominate cloud market. E-commerce margins improving with automation.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: false
          },
          
          // CONVICTION COMPANIES
          {
            ticker: 'MSFT',
            company: 'Microsoft Corporation',
            status: 'conviction',
            notes: [
              { text: 'Azure cloud growth and Copilot AI rollout across Office suite. Strong enterprise positioning.', timestamp: new Date().toISOString() }
            ],
            hasAlert: false
          },
          {
            ticker: 'GOOGL',
            company: 'Alphabet Inc.',
            status: 'conviction',
            notes: [
              { text: 'Search dominance and growing cloud business. Bard AI integration could expand moat.', timestamp: new Date().toISOString() }
            ],
            hasAlert: false
          },
          {
            ticker: 'CRM',
            company: 'Salesforce Inc.',
            status: 'conviction',
            notes: [
              { text: 'Leading CRM platform with strong AI integration plans. Enterprise software moat remains strong.', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: false
          },
          {
            ticker: 'ADBE',
            company: 'Adobe Inc.',
            status: 'conviction',
            notes: [
              { text: 'Creative software monopoly with AI-powered tools. Subscription model provides stable revenue.', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: true,
            alert: {
              text: 'New AI features announced',
              discoveryCard: {
                articleTitle: 'Adobe Unveils Next-Generation AI Tools for Creative Suite',
                articleUrl: 'https://news.adobe.com/ai-creative-suite-2024',
                match: {
                  ticker: 'ADBE',
                  company: 'Adobe Inc.',
                  score: 0.89,
                  reasoning: 'Major AI enhancement to creative tools, strengthening competitive moat'
                },
                sourceExcerpt: 'Adobe\'s latest AI integration brings advanced automation to creative workflows...',
                userNote: 'Creative software monopoly with AI-powered tools.',
                addedAt: new Date().toISOString()
              }
            }
          },
          
          // RESEARCHING COMPANIES
          {
            ticker: 'TSLA',
            company: 'Tesla, Inc.',
            status: 'researching',
            notes: [
              { text: 'EV market leader with vertical integration. Cybertruck ramp and energy storage growth drivers.', timestamp: new Date().toISOString() }
            ],
            hasAlert: false
          },
          {
            ticker: 'PLTR',
            company: 'Palantir Technologies Inc.',
            status: 'researching',
            notes: [
              { text: 'Government contracts strong but commercial growth uncertain. AI platform has potential but execution risk.', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: false
          },
          {
            ticker: 'SNOW',
            company: 'Snowflake Inc.',
            status: 'researching',
            notes: [
              { text: 'Data cloud platform with strong growth but expensive valuation. Competition from AWS/Azure increasing.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: false
          },
          {
            ticker: 'SQ',
            company: 'Block Inc.',
            status: 'researching',
            notes: [
              { text: 'Square payment ecosystem plus Bitcoin exposure. Fintech regulatory risks need monitoring.', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: false
          },
          
          // WATCHLIST COMPANIES
          {
            ticker: 'META',
            company: 'Meta Platforms Inc.',
            status: 'watchlist',
            notes: [
              { text: 'Reels monetization improving, Reality Labs investments paying off. Strong ad business recovery.', timestamp: new Date().toISOString() },
              { text: 'VR/AR bet still unproven but showing promise. Regulatory overhang remains.', timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() }
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
                userNote: 'Reels monetization improving, Reality Labs investments paying off.',
                addedAt: new Date().toISOString()
              }
            }
          },
          {
            ticker: 'NFLX',
            company: 'Netflix Inc.',
            status: 'watchlist',
            notes: [
              { text: 'Streaming wars intensifying. Password sharing crackdown and ad tier showing promise.', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: false
          },
          {
            ticker: 'RBLX',
            company: 'Roblox Corporation',
            status: 'watchlist',
            notes: [
              { text: 'Gaming platform with strong user engagement. Monetization and user safety concerns to watch.', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: false
          },
          {
            ticker: 'COIN',
            company: 'Coinbase Global Inc.',
            status: 'watchlist',
            notes: [
              { text: 'Crypto exchange leader but highly volatile. Regulatory clarity needed for long-term thesis.', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: false
          },
          {
            ticker: 'U',
            company: 'Unity Software Inc.',
            status: 'watchlist',
            notes: [
              { text: 'Game development platform struggling with monetization changes. Potential turnaround story.', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: false
          },
          
          // MORE OWNED COMPANIES
          {
            ticker: 'BRK.B',
            company: 'Berkshire Hathaway Inc.',
            status: 'owned',
            notes: [
              { text: 'Berkshire continues to outperform with strong operating earnings. Cash pile growing for future opportunities.', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: false
          },
          {
            ticker: 'JPM',
            company: 'JPMorgan Chase & Co.',
            status: 'owned',
            notes: [
              { text: 'Leading bank with strong capital position. Interest rate environment favorable for net interest income.', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: false
          },
          
          // MORE CONVICTION COMPANIES  
          {
            ticker: 'V',
            company: 'Visa Inc.',
            status: 'conviction',
            notes: [
              { text: 'Payment network duopoly with strong moats. Digital payments growth accelerating globally.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: false
          },
          {
            ticker: 'UNH',
            company: 'UnitedHealth Group Inc.',
            status: 'conviction',
            notes: [
              { text: 'Healthcare leader with Optum growth driving margins. Aging demographics provide tailwinds.', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: false
          },
          {
            ticker: 'SHOP',
            company: 'Shopify Inc.',
            status: 'conviction',
            notes: [
              { text: 'E-commerce platform with strong SMB adoption. AI features and international expansion driving growth.', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: true,
            alert: {
              text: 'Q4 earnings beat estimates',
              discoveryCard: {
                articleTitle: 'Shopify Reports Strong Q4 Growth Driven by AI-Powered Commerce Tools',
                articleUrl: 'https://investors.shopify.com/q4-2024-earnings',
                match: {
                  ticker: 'SHOP',
                  company: 'Shopify Inc.',
                  score: 0.91,
                  reasoning: 'Strong earnings performance with AI-driven merchant growth'
                },
                sourceExcerpt: 'Shopify\'s latest AI-powered commerce tools drove record merchant adoption and revenue growth...',
                userNote: 'E-commerce platform with strong SMB adoption.',
                addedAt: new Date().toISOString()
              }
            }
          },
          
          // MORE RESEARCHING COMPANIES
          {
            ticker: 'ROKU',
            company: 'Roku Inc.',
            status: 'researching',
            notes: [
              { text: 'Streaming platform leader but facing intense competition. Advertising revenue model under pressure.', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: false
          },
          {
            ticker: 'CRWD',
            company: 'CrowdStrike Holdings Inc.',
            status: 'researching',
            notes: [
              { text: 'Cybersecurity leader with strong endpoint protection. High growth but expensive valuation.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: false
          },
          {
            ticker: 'ZM',
            company: 'Zoom Video Communications Inc.',
            status: 'researching',
            notes: [
              { text: 'Video conferencing platform post-pandemic normalization. Enterprise focus and AI features key for growth.', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: false
          },
          {
            ticker: 'DKNG',
            company: 'DraftKings Inc.',
            status: 'researching',
            notes: [
              { text: 'Sports betting leader with strong brand. Regulatory expansion opportunities vs profitability timeline.', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: false
          },
          
          // MORE WATCHLIST COMPANIES
          {
            ticker: 'PYPL',
            company: 'PayPal Holdings Inc.',
            status: 'watchlist',
            notes: [
              { text: 'Digital payments pioneer facing increased competition. Venmo growth vs core PayPal wallet decline.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: false
          },
          {
            ticker: 'SPOT',
            company: 'Spotify Technology S.A.',
            status: 'watchlist',
            notes: [
              { text: 'Music streaming leader with podcast investments. Path to profitability improving with premium growth.', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: false
          },
          {
            ticker: 'UBER',
            company: 'Uber Technologies Inc.',
            status: 'watchlist',
            notes: [
              { text: 'Rideshare and delivery platform achieving profitability. Autonomous vehicle partnerships to monitor.', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: false
          },
          {
            ticker: 'TWLO',
            company: 'Twilio Inc.',
            status: 'watchlist',
            notes: [
              { text: 'Communication platform APIs with strong developer adoption. Growth slowing, need efficiency improvements.', timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: false
          },
          {
            ticker: 'PINS',
            company: 'Pinterest Inc.',
            status: 'watchlist',
            notes: [
              { text: 'Visual discovery platform with strong user engagement. Monetization improvements in international markets.', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: false
          },
          {
            ticker: 'SNAP',
            company: 'Snap Inc.',
            status: 'watchlist',
            notes: [
              { text: 'Social media platform with AR focus. User growth slowing, competition from TikTok intensifying.', timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() }
            ],
            hasAlert: false
          }
        ]
        setTrackedCompanies(savedCompanies)
        // Start all cards in collapsed state
        setCollapsedCards(new Set(savedCompanies.map((_, index) => index)))
        // Set default selected company to first one
        if (savedCompanies.length > 0) {
          setSelectedCompanyForNote(savedCompanies[0].ticker)
        }
      } catch (error) {
        console.error('Failed to load tracked companies:', error)
      }
    }
    loadData()
  }, [storage])
  // Set up auth listener
  useEffect(() => {
    // Listen for auth messages from landing page
    const handleMessage = (message, sender, sendResponse) => {
      if (message.type === 'AUTH_SUCCESS' && message.source === 'pocketstox-landing') {
        // Handle successful authentication
        const { user, session } = message.data
        console.log('Auth successful:', user)
        // Store auth data in extension storage using modern service
        storage.setAccount?.({
          email: user.email,
          userId: user.id,
          authToken: session.access_token,
          isPremium: user.app_metadata?.subscription_status === 'active',
          lastSignIn: new Date().toISOString()
        })
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
            <div className="p-3 bg-gray-50 relative">
              <button
                onClick={() => {
                  setOverlayNote(quickNote)
                  setShowNotesOverlay(true)
                }}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Expand"
              >
                <Maximize2 size={14} />
              </button>
              <textarea
                placeholder="Write a note"
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSaveQuickNote()
                  }
                }}
                className="w-full px-0 py-2 text-sm border-0 focus:outline-none resize-none placeholder:text-gray-400 bg-transparent pr-8"
                rows={3}
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
                  Save Note
                </button>
                <div className="border-l border-gray-200 h-4 mx-2"></div>
                <div className="relative">
                  <select
                    value={selectedCompanyForNote || ''}
                    onChange={(e) => setSelectedCompanyForNote(e.target.value)}
                    className="text-sm border-0 focus:outline-none bg-transparent text-gray-900 font-medium cursor-pointer hover:bg-gray-50 rounded px-2 py-1 pr-5 transition-colors appearance-none"
                  >
                    {trackedCompanies.map((company, index) => (
                      <option key={index} value={company.ticker}>
                        {company.ticker}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Kanban */}
      <div className="mt-4 mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-medium text-gray-900">Portfolio</h2>
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
            <h3 className={`${semanticTypography.emptyStateTitle} mb-1`}>No companies in your portfolio yet</h3>
            <p className={semanticTypography.emptyStateDescription}>
              Add companies to track across your investment pipeline
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 mb-3">
          {kanbanSections.map((section) => {
            const sectionCompanies = getCompaniesByStatus(section.id)
            return (
              <div key={section.id} className="bg-white rounded-lg border border-gray-200">
                <div 
                  className="p-3 border-b border-gray-100 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-4 h-4">
                        {collapsedSections.has(section.id) ? (
                          <ChevronRight size={14} className="text-gray-500" />
                        ) : (
                          <ChevronDown size={14} className="text-gray-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
                        <p className="text-xs text-gray-500">{section.description}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                      {sectionCompanies.length}
                    </div>
                  </div>
                </div>
                {!collapsedSections.has(section.id) && (
                  sectionCompanies.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">
                      No companies in {section.title.toLowerCase()}
                    </div>
                  ) : (
                    <div>
                      {sectionCompanies.map((company, index) => (
                        <div key={company.ticker}>
                          <div 
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={(e) => {
                              // Don't trigger if clicking on action buttons
                              if (e.target.closest('[data-action-button]')) return
                              
                              // Create article-like object for company details
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
                            <div className="px-3.5 py-2.5">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="text-sm font-medium text-gray-900">{company.ticker}</h4>
                                    {company.hasAlert && (
                                      <div className="flex items-center justify-center p-1 bg-purple-100 text-purple-800 rounded-lg">
                                        <AlertCircle size={12} />
                                      </div>
                                    )}
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-gray-600 truncate">{company.company}</span>
                                    </div>
                                    {company.notes?.[0]?.text && (
                                      <p className="text-xs text-gray-500 line-clamp-2">
                                        {company.notes[0].text}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                  <div className="relative">
                                    <select
                                      data-action-button
                                      value={company.status}
                                      onChange={(e) => {
                                        e.stopPropagation()
                                        handleStatusChange(company.originalIndex, e.target.value)
                                      }}
                                      className="text-xs border-0 focus:outline-none bg-transparent text-gray-600 cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 pr-4 transition-colors appearance-none"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <option value="owned">Owned</option>
                                      <option value="conviction">Conviction</option>
                                      <option value="researching">Researching</option>
                                      <option value="watchlist">Watchlist</option>
                                    </select>
                                    <ChevronDown size={10} className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                                  </div>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <button
                                        data-action-button
                                        className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
                                        title="Remove"
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
                                          onClick={() => setTrackedCompanies(prev => prev.filter((_, i) => i !== company.originalIndex))}
                                        >
                                          Remove
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </div>
                          </div>
                          {index < sectionCompanies.length - 1 && (
                            <div className="border-b border-gray-100 mx-3.5" />
                          )}
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )
          })}
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

      {/* Notes Overlay */}
      {showNotesOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Investment Notes</h2>
                <div className="relative">
                  <select
                    value={selectedCompanyForNote || ''}
                    onChange={(e) => setSelectedCompanyForNote(e.target.value)}
                    className="text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white text-gray-900 font-medium cursor-pointer rounded px-3 py-1.5 pr-8 transition-colors appearance-none"
                  >
                    {trackedCompanies.map((company, index) => (
                      <option key={index} value={company.ticker}>
                        {company.ticker} - {company.company}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <button
                onClick={() => setShowNotesOverlay(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
              >
                ×
              </button>
            </div>
            <div className="flex-1 p-4">
              <textarea
                placeholder="Write detailed notes about your investment research, analysis, and thoughts..."
                value={overlayNote}
                onChange={(e) => setOverlayNote(e.target.value)}
                className="w-full h-full text-sm border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                style={{ minHeight: '300px' }}
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowNotesOverlay(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOverlayNote}
                disabled={!overlayNote.trim() || !selectedCompanyForNote}
                className={cn(
                  "px-4 py-2 text-sm rounded-md transition-all font-medium",
                  overlayNote.trim() && selectedCompanyForNote
                    ? "bg-gray-900 text-white hover:bg-gray-800 shadow-sm"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Company Dialog */}
      <Dialog open={showAddCompanyModal} onOpenChange={setShowAddCompanyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Company</DialogTitle>
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
              Add Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  )
})

AccountTab.displayName = 'AccountTab'

export default AccountTab