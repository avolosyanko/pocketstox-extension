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
import { Check, Plus, TrendingUp, AlertCircle, HeartOff, ChevronDown, ChevronRight, Edit3, MoreVertical, GripVertical } from 'lucide-react'
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
  const [collapsedSections, setCollapsedSections] = useState(new Set(['researching', 'conviction', 'owned']))
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverSection, setDragOverSection] = useState(null)
  const [expandTimeout, setExpandTimeout] = useState(null)
  const [dragOverPosition, setDragOverPosition] = useState(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

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



  const handleStatusChange = useCallback((companyIndex, newStatus) => {
    setTrackedCompanies(prev => prev.map((company, index) => {
      if (index === companyIndex) {
        return { ...company, status: newStatus }
      }
      return company
    }))
  }, [])

  const handleDragStart = useCallback((e, company, originalIndex) => {
    setDraggedItem({ company, originalIndex })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '')
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDragEnter = useCallback((e, sectionId) => {
    e.preventDefault()
    setDragOverSection(sectionId)
    
    // Auto-expand collapsed sections after hovering for 800ms
    if (collapsedSections.has(sectionId)) {
      if (expandTimeout) {
        clearTimeout(expandTimeout)
      }
      const timeout = setTimeout(() => {
        setCollapsedSections(prev => {
          const newSet = new Set(prev)
          newSet.delete(sectionId)
          return newSet
        })
      }, 800)
      setExpandTimeout(timeout)
    }
  }, [collapsedSections, expandTimeout])

  const handleDragLeave = useCallback((e) => {
    // Only clear if we're leaving the drop zone, not entering a child element
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverSection(null)
      setDragOverPosition(null)
      if (expandTimeout) {
        clearTimeout(expandTimeout)
        setExpandTimeout(null)
      }
    }
  }, [expandTimeout])

  const handleCardDragOver = useCallback((e, sectionId, cardIndex) => {
    e.preventDefault()
    if (!draggedItem) return
    
    // Get mouse position relative to the card
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseY = e.clientY
    const cardTop = rect.top
    const cardHeight = rect.height
    const relativeY = mouseY - cardTop
    const isTopHalf = relativeY < cardHeight / 2
    
    // Determine insertion position
    const insertPosition = isTopHalf ? cardIndex : cardIndex + 1
    setDragOverPosition(`${sectionId}-${insertPosition}`)
    setDragOverSection(sectionId)
  }, [draggedItem])

  const handleDrop = useCallback((e, targetStatus, insertPosition = null) => {
    e.preventDefault()
    e.stopPropagation() // Prevent triggering onClick events
    
    if (!draggedItem) return
    
    const sourceStatus = draggedItem.company.status
    const targetCompaniesInSection = trackedCompanies
      .filter(company => company.status === targetStatus)
      .sort((a, b) => (a.position || 0) - (b.position || 0))
    
    // Determine the new position
    let newPosition
    if (insertPosition !== null) {
      newPosition = insertPosition
    } else if (targetStatus === sourceStatus) {
      // If dropping on same section header, move to end
      newPosition = targetCompaniesInSection.length - 1
    } else {
      // If dropping on different section header, add to end
      newPosition = targetCompaniesInSection.length
    }
    
    console.log('Drop:', {
      draggedCompany: draggedItem.company.ticker,
      sourceStatus,
      targetStatus,
      insertPosition,
      newPosition,
      targetSectionLength: targetCompaniesInSection.length
    })
    
    setTrackedCompanies(prev => {
      const updated = prev.map((company, index) => {
        if (index === draggedItem.originalIndex) {
          return { ...company, status: targetStatus, position: newPosition }
        }
        return company
      })
      
      // Reorder positions within the target section
      const companiesInTargetSection = updated.filter(c => c.status === targetStatus)
      const otherCompanies = updated.filter(c => c.status !== targetStatus)
      
      // Find the dragged company and separate it from others
      const draggedCompanyIndex = companiesInTargetSection.findIndex(c => 
        updated.findIndex(u => u === c) === draggedItem.originalIndex
      )
      const draggedCompany = companiesInTargetSection[draggedCompanyIndex]
      const otherCompaniesInSection = companiesInTargetSection.filter((_, index) => index !== draggedCompanyIndex)
      
      // Sort other companies by their current positions (excluding the dragged one)
      otherCompaniesInSection.sort((a, b) => (a.position || 0) - (b.position || 0))
      
      // Insert the dragged company at the correct position
      const reorderedCompanies = [...otherCompaniesInSection]
      const actualInsertPosition = Math.min(newPosition, reorderedCompanies.length)
      reorderedCompanies.splice(actualInsertPosition, 0, draggedCompany)
      
      // Reassign positions sequentially
      reorderedCompanies.forEach((company, index) => {
        company.position = index
      })
      
      // Also reorder the source section if it's different
      if (sourceStatus !== targetStatus) {
        const companiesInSourceSection = otherCompanies.filter(c => c.status === sourceStatus)
        companiesInSourceSection.sort((a, b) => (a.position || 0) - (b.position || 0))
        companiesInSourceSection.forEach((company, index) => {
          company.position = index
        })
      }
      
      return [...otherCompanies, ...companiesInTargetSection]
    })
    
    setDraggedItem(null)
    setDragOverSection(null)
    setDragOverPosition(null)
    if (expandTimeout) {
      clearTimeout(expandTimeout)
      setExpandTimeout(null)
    }
  }, [draggedItem, expandTimeout, trackedCompanies])

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null)
    setDragOverSection(null)
    setDragOverPosition(null)
    if (expandTimeout) {
      clearTimeout(expandTimeout)
      setExpandTimeout(null)
    }
  }, [expandTimeout])

  const getCompaniesByStatus = useCallback((status) => {
    return trackedCompanies
      .map((company, index) => ({ ...company, originalIndex: index }))
      .filter(company => company.status === status)
      .sort((a, b) => (a.position || 0) - (b.position || 0))
  }, [trackedCompanies])

  const kanbanSections = [
    { id: 'watchlist', title: 'Watchlist', description: 'Companies to monitor' },
    { id: 'researching', title: 'Researching', description: 'Companies under active research' },
    { id: 'conviction', title: 'Conviction', description: 'High confidence investment candidates' },
    { id: 'owned', title: 'Owned', description: 'Companies you currently own' }
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
        
        // Use real data if available, otherwise fallback to demo data
        let savedCompanies
        if (result && result.length > 0) {
          savedCompanies = result
        } else {
          // Fallback demo data for first-time users
          savedCompanies = [
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
        }
        
        // Assign positions to companies within their sections
        const companiesWithPositions = savedCompanies.map((company, index) => ({
          ...company,
          position: company.position !== undefined ? company.position : index
        }))
        
        // Normalize positions within each section
        const statusGroups = {}
        companiesWithPositions.forEach(company => {
          if (!statusGroups[company.status]) statusGroups[company.status] = []
          statusGroups[company.status].push(company)
        })
        
        Object.keys(statusGroups).forEach(status => {
          statusGroups[status].forEach((company, index) => {
            company.position = index
          })
        })
        
        setTrackedCompanies(companiesWithPositions)
        setIsInitialLoad(false)
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

  // Save tracked companies to storage whenever they change
  useEffect(() => {
    const saveData = async () => {
      if (trackedCompanies.length > 0 && storage.setWatchlist) {
        try {
          await storage.setWatchlist(trackedCompanies)
          console.log('Saved tracked companies to storage:', trackedCompanies.length, 'companies')
        } catch (error) {
          console.error('Failed to save tracked companies:', error)
        }
      }
    }
    
    // Only save after initial load to avoid overwriting real data with demo data
    if (!isInitialLoad && trackedCompanies.length > 0) {
      saveData()
    }
  }, [trackedCompanies, storage, isInitialLoad])
  // Set up auth listener and external popup message handler
  useEffect(() => {
    // Listen for auth messages from landing page and external popup saves
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
  }, [storage, trackedCompanies])
  
  return (
    <div>

        {/* Quick Note Section */}
      {trackedCompanies.length > 0 && (
        <div className="mb-4 bg-gray-50 rounded border border-gray-200">
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
              rows={9}
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
                {trackedCompanies.map((company, index) => (
                  <option key={index} value={company.ticker}>
                    {company.ticker}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Header */}
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-700 px-2">Companies</h2>
        <button
          onClick={() => setShowAddCompanyModal(true)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      {trackedCompanies.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-200 bg-white mb-3 ml-2">
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
        <div className="space-y-1">
          {kanbanSections.map((section) => {
            const sectionCompanies = getCompaniesByStatus(section.id)
            return (
              <div key={section.id}>
                <div 
                  className={cn(
                    "px-2 py-1.5 cursor-pointer hover:bg-gray-50 rounded transition-colors flex items-center justify-between group",
                    dragOverSection === section.id && "bg-gray-100"
                  )}
                  onClick={() => toggleSection(section.id)}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, section.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, section.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-4 h-4">
                      {collapsedSections.has(section.id) ? (
                        <ChevronRight size={12} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={12} className="text-gray-400" />
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-gray-700">{section.title}</h3>
                  </div>
                  <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {sectionCompanies.length}
                  </div>
                </div>
                {!collapsedSections.has(section.id) && (
                  <div
                    className="ml-2 space-y-2 min-h-[8px] py-2"
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, section.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, section.id)}
                  >
                    {sectionCompanies.length === 0 ? (
                      <div className="py-2 px-4 text-xs text-gray-400">
                        No companies in {section.title.toLowerCase()}
                      </div>
                    ) : (
                      <>
                        {sectionCompanies.map((company, index) => (
                          <div key={`${company.ticker}-${company.originalIndex}`} className="relative">
                            {/* Insertion indicator */}
                            {(dragOverPosition === `${section.id}-${index}` || 
                              (dragOverPosition === `${section.id}-${index + 1}` && index === sectionCompanies.length - 1)) && (
                              <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-400 rounded z-10" />
                            )}
                            {dragOverPosition === `${section.id}-${index + 1}` && index < sectionCompanies.length - 1 && (
                              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-400 rounded z-10" />
                            )}
                            
                            {/* The actual card */}
                            <div
                              draggable
                              className={cn(
                                "bg-white rounded-lg border border-gray-200 p-3 shadow-sm transition-all cursor-move relative",
                                draggedItem?.originalIndex === company.originalIndex && "opacity-50",
                                "hover:shadow-md"
                              )}
                              onDragStart={(e) => handleDragStart(e, company, company.originalIndex)}
                              onDragEnd={handleDragEnd}
                              onDragOver={(e) => handleCardDragOver(e, section.id, index)}
                              onDrop={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect()
                                const mouseY = e.clientY
                                const cardTop = rect.top
                                const cardHeight = rect.height
                                const relativeY = mouseY - cardTop
                                const isTopHalf = relativeY < cardHeight / 2
                                const insertPosition = isTopHalf ? index : index + 1
                                handleDrop(e, section.id, insertPosition)
                              }}
                            >
                          <div className="flex items-start justify-between">
                            <div 
                              className="flex-1 cursor-pointer"
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
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-sm font-semibold text-gray-900">{company.ticker}</h4>
                                {company.hasAlert && (
                                  <div className="flex items-center justify-center w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{company.company}</p>
                              {company.notes?.[0]?.text && (
                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                  {company.notes[0].text}
                                </p>
                              )}
                            </div>
                            <div className="flex items-start gap-1 ml-3">
                              <div 
                                className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                                title="Drag to move"
                              >
                                <GripVertical size={14} />
                              </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button
                                    data-action-button
                                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
                                    title="Remove"
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
                        ))}
                        
                        {/* Empty drop zone for end of list */}
                        <div
                          className={cn(
                            "h-4 transition-all",
                            dragOverPosition === `${section.id}-${sectionCompanies.length}` && "h-8 bg-blue-100 border-2 border-dashed border-blue-300 rounded"
                          )}
                          onDragOver={handleDragOver}
                          onDragEnter={(e) => {
                            e.preventDefault()
                            setDragOverPosition(`${section.id}-${sectionCompanies.length}`)
                            setDragOverSection(section.id)
                          }}
                          onDragLeave={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget)) {
                              setDragOverPosition(null)
                            }
                          }}
                          onDrop={(e) => handleDrop(e, section.id, sectionCompanies.length)}
                        />
                      </>
                    )}
                  </div>
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
                  const existingInWatchlist = trackedCompanies.filter(c => c.status === 'watchlist').length
                  const newCompanies = [...trackedCompanies, {
                    ticker: newCompany.ticker,
                    company: newCompany.company,
                    status: 'watchlist',
                    position: existingInWatchlist,
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