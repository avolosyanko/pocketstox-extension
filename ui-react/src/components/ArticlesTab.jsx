import React, { useState, useEffect, memo, useImperativeHandle, forwardRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Search, Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { semanticTypography, componentSpacing, spacing } from '@/styles/typography'
import { useAPI, useStorage } from '@/contexts/ServiceContext'

const ArticlesTab = memo(forwardRef(({ onArticleClick, onGenerate, activeTab, searchQuery }, ref) => {
  // Modern service hooks
  const api = useAPI()
  const storage = useStorage()
  
  const [articles, setArticles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedArticle, setExpandedArticle] = useState(null)
  const [identifiedArticle, setIdentifiedArticle] = useState(null)
  const [extractedContent, setExtractedContent] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [detectionState, setDetectionState] = useState('idle')
  const [currentStep, setCurrentStep] = useState(0) // 0: parsing, 1: analysis
  const [isContentExpanded, setIsContentExpanded] = useState(false)
  const [expandedStage, setExpandedStage] = useState(null)
  const [displayedArticles, setDisplayedArticles] = useState([])
  const [loadMoreCount, setLoadMoreCount] = useState(10) // Initial load count
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [parsingCancelled, setParsingCancelled] = useState(false)
  const [parsingTimeoutId, setParsingTimeoutId] = useState(null)
  const [analysisCancelled, setAnalysisCancelled] = useState(false)
  const [currentBrowserTab, setCurrentBrowserTab] = useState(null)
  const [parsedTabInfo, setParsedTabInfo] = useState(null)
  const [faviconLoadErrors, setFaviconLoadErrors] = useState(new Set())
  const [showTemplates, setShowTemplates] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Filter state - extensible for future filter types
  const [filters, setFilters] = useState({
    companySizes: [], // 'small', 'mid', 'large'
    sectors: [],      // 'technology', 'healthcare', 'financials', etc.
    regions: [],      // 'north-america', 'europe', 'asia', etc. (future)
    industries: []    // 'technology', 'healthcare', etc. (future - deprecated, use sectors)
  })

  // Scenario templates
  const scenarioTemplates = [
    {
      id: 'interest-rates',
      title: 'Interest Rate Changes',
      description: 'Interest rates rise/fall',
      content: 'The Federal Reserve announces a significant shift in monetary policy. Interest rates are expected to [rise/fall] by [X]% over the next [timeframe]. This change will impact borrowing costs, mortgage rates, and corporate financing. Sectors like banking, real estate, and consumer discretionary will be most affected. Companies with high debt loads may face increased pressure, while savers could benefit from higher yields.'
    },
    {
      id: 'oil-prices',
      title: 'Oil Price Volatility',
      description: 'Oil prices spike/crash',
      content: 'Global oil markets experience extreme volatility as prices [spike/crash] to $[X] per barrel. The shift is driven by [geopolitical tensions/supply glut/demand shock]. Energy companies, airlines, and transportation sectors face immediate impacts. Consumer spending patterns may shift as gasoline prices [rise/fall], affecting retail and automotive industries. Alternative energy investments could see [increased/decreased] interest.'
    },
    {
      id: 'ev-adoption',
      title: 'EV Market Acceleration',
      description: 'EV adoption accelerates',
      content: 'Electric vehicle adoption accelerates beyond expectations as [new regulations/technology breakthroughs/consumer preference] drive unprecedented demand. Traditional automakers face pressure to transition faster while EV manufacturers ramp up production. Battery and charging infrastructure companies see increased investment. Oil demand projections are revised downward. Automotive supply chains are being restructured to prioritize EV components.'
    },
    {
      id: 'ai-bubble',
      title: 'AI Market Correction',
      description: 'AI bubble bursts',
      content: 'The AI investment bubble shows signs of bursting as [revenue projections fall short/regulatory concerns mount/competition intensifies]. Technology stocks with high AI valuations face steep corrections. Investors become more skeptical of AI promises and focus on actual revenue and profitability. Cloud infrastructure spending may slow. Traditional software companies without clear AI monetization strategies are particularly vulnerable.'
    }
  ]

  // Helper function to truncate text
  const truncateText = (text, maxLength = 20) => {
    if (!text) return text
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  // Filter toggle function - extensible for any filter type
  const toggleFilter = (filterType, value) => {
    setFilters(prev => {
      const currentValues = prev[filterType] || []
      const isSelected = currentValues.includes(value)

      return {
        ...prev,
        [filterType]: isSelected
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value]
      }
    })
  }

  // Get current browser tab info and listen for tab changes
  useEffect(() => {
    const getCurrentTab = async () => {
      try {
        if (chrome && chrome.tabs) {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
          if (tab) {
            const domain = tab.url ? new URL(tab.url).hostname.replace('www.', '') : 'Unknown'
            const newTabInfo = {
              title: tab.title,
              url: tab.url,
              domain: domain,
              favicon: tab.favIconUrl || `https://www.google.com/s2/favicons?sz=16&domain=${domain}`
            }
            setCurrentBrowserTab(newTabInfo)
            // Clear favicon errors for new tab
            setFaviconLoadErrors(prev => {
              const newErrors = new Set(prev)
              Array.from(newErrors).forEach(key => {
                if (key.startsWith('current-')) {
                  newErrors.delete(key)
                }
              })
              return newErrors
            })
          }
        }
      } catch (error) {
        console.error('Failed to get current tab:', error)
        setCurrentBrowserTab({ 
          title: 'Active Tab', 
          domain: 'Unknown',
          favicon: null
        })
      }
    }
    
    // Get initial tab info
    getCurrentTab()
    
    // Listen for tab changes
    const handleTabUpdate = (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.active) {
        getCurrentTab()
      }
    }
    
    const handleTabActivated = () => {
      getCurrentTab()
    }
    
    // Add listeners
    if (chrome && chrome.tabs) {
      chrome.tabs.onUpdated.addListener(handleTabUpdate)
      chrome.tabs.onActivated.addListener(handleTabActivated)
    }
    
    // Cleanup listeners
    return () => {
      if (chrome && chrome.tabs) {
        chrome.tabs.onUpdated.removeListener(handleTabUpdate)
        chrome.tabs.onActivated.removeListener(handleTabActivated)
      }
    }
  }, [])
  
  // Persistent cache for article content
  const [contentCache, setContentCache] = useState(new Map())
  


  const [extractionStages, setExtractionStages] = useState({
    parsing: {
      status: 'waiting',
      title: 'Parse Input Article',
      subtitle: 'Extract active tab content',
      details: {
        description: 'Process and parse article content',
        info: 'Clean and structure the extracted content',
        action: 'View processing details'
      }
    },
    analysis: {
      status: 'waiting',
      title: 'Analysis Generation',
      subtitle: 'Process extracted content',
      details: {
        description: 'Generate AI-powered analysis',
        info: 'Content ready for comprehensive analysis',
        action: 'Start analysis process'
      }
    }
  })

  const handleLoadMore = async () => {
    setIsLoadingMore(true)
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const currentCount = displayedArticles.length
    const nextBatch = articles.slice(currentCount, currentCount + loadMoreCount)
    setDisplayedArticles(prev => [...prev, ...nextBatch])
    setIsLoadingMore(false)
  }


  const handleEditArticle = () => {
    if (identifiedArticle) {
      setEditedTitle(identifiedArticle.title || '')
      setEditedContent(identifiedArticle.content || identifiedArticle.text || '')
      setIsEditing(true)
    }
  }

  const handleCustomEntry = () => {
    // Show template picker first
    setShowTemplates(true)
    setCurrentStep(1)
    setExtractionStages(prev => ({
      ...prev,
      parsing: { ...prev.parsing, status: 'completed' }
    }))
  }

  const handleTemplateSelect = (template) => {
    // Pre-fill with selected template and enter edit mode
    setIdentifiedArticle({
      title: template.title,
      content: template.content
    })
    setEditedTitle(template.title)
    setEditedContent(template.content)
    setShowTemplates(false)
    setIsEditing(true)
  }

  const handleCustomScenario = () => {
    // Skip template and go to blank custom entry
    setIdentifiedArticle({ title: '', content: '' })
    setEditedTitle('')
    setEditedContent('')
    setShowTemplates(false)
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    if (identifiedArticle) {
      setIdentifiedArticle({
        ...identifiedArticle,
        title: editedTitle,
        content: editedContent,
        text: editedContent
      })
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedTitle('')
    setEditedContent('')
  }

  const handleHighlightArticleByUrl = (targetUrl, fallbackTitle = null, fallbackTicker = null) => {
    console.log('handleHighlightArticleByUrl called with:', { targetUrl, fallbackTitle, fallbackTicker })
    console.log('Available articles:', articles.map(a => ({ url: a.url, title: a.title, id: a.id })))
    
    // First try to find by exact URL match
    let targetArticle = articles.find(article => article.url === targetUrl)
    
    // If no URL match, try to find by title
    if (!targetArticle && fallbackTitle) {
      targetArticle = articles.find(article => 
        article.title && article.title.toLowerCase().includes(fallbackTitle.toLowerCase())
      )
    }
    
    // If still no match, try to find by ticker in matches
    if (!targetArticle && fallbackTicker) {
      targetArticle = articles.find(article => 
        article.matches && article.matches.some(match => 
          match.ticker === fallbackTicker
        )
      )
    }
    
    if (targetArticle && onArticleClick) {
      console.log('Opening article:', targetArticle)
      onArticleClick(targetArticle)
    } else {
      console.log('No matching article found, staying on Discovery tab')
    }
  }

  useImperativeHandle(ref, () => {
    console.log('ArticlesTab: useImperativeHandle called, exposing runPipeline and highlightArticleByUrl')
    return {
      runPipeline: handleRunStep,
      highlightArticleByUrl: handleHighlightArticleByUrl
    }
  })

  useEffect(() => {
    let isMounted = true
    let retryCount = 0
    const maxRetries = 10

    const fetchArticles = async (cache = contentCache) => {
      try {
        const articleData = await storage.getArticles()
        
        if (isMounted) {
          // Restore content from cache for all articles on initial load
          const articlesWithContent = (articleData || []).map(article => {
            const cacheKey = `${article.title}-${article.url}`
            const cachedContent = cache.get(cacheKey)

            // If article is missing content but we have it cached, restore it
            if ((!article.content || !article.text) && cachedContent) {
              return {
                ...article,
                content: cachedContent.content,
                text: cachedContent.text
              }
            }
            return article
          })

          // Add placeholder articles for demo purposes if no real articles exist
          const finalArticles = articlesWithContent.length === 0 ? [
            // TODAY - Recent hours
            {
              id: 'placeholder-1',
              title: 'Apple Announces Record Q4 Earnings, Beats Analyst Expectations',
              url: 'https://finance.yahoo.com/news/apple-earnings-q4-2024',
              content: 'Apple Inc. reported record-breaking fourth quarter earnings today, surpassing analyst expectations with revenue of $123.5 billion...',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
              companies: ['AAPL'],
              matches: [
                { ticker: 'AAPL', company: 'Apple Inc.', score: 0.95 }
              ]
            },
            {
              id: 'placeholder-2',
              title: 'Tesla Unveils New AI-Powered Manufacturing Process',
              url: 'https://techcrunch.com/tesla-ai-manufacturing',
              content: 'Tesla has announced a revolutionary AI-powered manufacturing process that could reduce production costs by 30%...',
              timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
              companies: ['TSLA'],
              matches: [
                { ticker: 'TSLA', company: 'Tesla, Inc.', score: 0.92 }
              ]
            },
            {
              id: 'placeholder-3',
              title: 'Google DeepMind Achieves Breakthrough in Quantum Computing',
              url: 'https://techcrunch.com/google-quantum-breakthrough',
              content: 'Google DeepMind researchers have achieved a major breakthrough in quantum error correction, bringing practical quantum computing closer to reality...',
              timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
              companies: ['GOOGL'],
              matches: [
                { ticker: 'GOOGL', company: 'Alphabet Inc.', score: 0.93 }
              ]
            },
            
            // YESTERDAY
            {
              id: 'placeholder-4',
              title: 'Microsoft Azure Revenue Surges 50% Year-Over-Year',
              url: 'https://reuters.com/microsoft-azure-growth',
              content: 'Microsoft reported strong growth in its Azure cloud services division, with revenue increasing 50% compared to last year...',
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
              companies: ['MSFT'],
              matches: [
                { ticker: 'MSFT', company: 'Microsoft Corporation', score: 0.89 }
              ]
            },
            {
              id: 'placeholder-5',
              title: 'NVIDIA Stock Rallies on Strong AI Chip Demand',
              url: 'https://cnbc.com/nvidia-ai-chips',
              content: 'NVIDIA shares jumped 8% after the company reported unprecedented demand for its AI processing chips...',
              timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), // Yesterday
              companies: ['NVDA'],
              matches: [
                { ticker: 'NVDA', company: 'NVIDIA Corporation', score: 0.94 }
              ]
            },
            
            // LAST WEEK
            {
              id: 'placeholder-6',
              title: 'Amazon Expands Same-Day Delivery to 50 New Cities',
              url: 'https://bloomberg.com/amazon-delivery-expansion',
              content: 'Amazon announced a major expansion of its same-day delivery service, now covering 50 additional metropolitan areas...',
              timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
              companies: ['AMZN'],
              matches: [
                { ticker: 'AMZN', company: 'Amazon.com Inc.', score: 0.91 }
              ]
            },
            {
              id: 'placeholder-7',
              title: 'Meta Platforms Reports User Growth Acceleration',
              url: 'https://wsj.com/meta-user-growth',
              content: 'Meta Platforms Inc. reported accelerating user growth across its family of apps, with daily active users reaching 3.2 billion...',
              timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
              companies: ['META'],
              matches: [
                { ticker: 'META', company: 'Meta Platforms Inc.', score: 0.88 }
              ]
            },
            {
              id: 'placeholder-8',
              title: 'Netflix Announces Password Sharing Crackdown Success',
              url: 'https://variety.com/netflix-password-sharing',
              content: 'Netflix reported that its password sharing crackdown has resulted in 6 million new subscribers in the last quarter...',
              timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
              companies: ['NFLX'],
              matches: [
                { ticker: 'NFLX', company: 'Netflix Inc.', score: 0.90 }
              ]
            },
            
            // THIS MONTH (October 2025)
            {
              id: 'placeholder-9',
              title: 'PayPal Launches Cryptocurrency Exchange',
              url: 'https://coindesk.com/paypal-crypto-exchange',
              content: 'PayPal has officially launched its own cryptocurrency exchange, allowing users to trade Bitcoin, Ethereum, and other major cryptocurrencies...',
              timestamp: new Date(2025, 9, 15).toISOString(), // Oct 15, 2025
              companies: ['PYPL'],
              matches: [
                { ticker: 'PYPL', company: 'PayPal Holdings Inc.', score: 0.87 }
              ]
            },
            {
              id: 'placeholder-10',
              title: 'Adobe Unveils AI-Powered Video Editing Suite',
              url: 'https://techcrunch.com/adobe-ai-video',
              content: 'Adobe has announced a revolutionary AI-powered video editing suite that can automatically generate professional-quality videos from simple text prompts...',
              timestamp: new Date(2025, 9, 10).toISOString(), // Oct 10, 2025
              companies: ['ADBE'],
              matches: [
                { ticker: 'ADBE', company: 'Adobe Inc.', score: 0.92 }
              ]
            },
            
            // SEPTEMBER 2025
            {
              id: 'placeholder-11',
              title: 'Salesforce Acquires Leading AI Startup for $8.5 Billion',
              url: 'https://techcrunch.com/salesforce-ai-acquisition',
              content: 'Salesforce has announced the acquisition of an AI startup specializing in customer relationship management automation for $8.5 billion...',
              timestamp: new Date(2025, 8, 28).toISOString(), // Sep 28, 2025
              companies: ['CRM'],
              matches: [
                { ticker: 'CRM', company: 'Salesforce Inc.', score: 0.89 }
              ]
            },
            {
              id: 'placeholder-12',
              title: 'Intel Announces Next-Generation Chip Architecture',
              url: 'https://anandtech.com/intel-new-architecture',
              content: 'Intel has revealed its next-generation chip architecture, promising 40% better performance and 30% lower power consumption...',
              timestamp: new Date(2025, 8, 20).toISOString(), // Sep 20, 2025
              companies: ['INTC'],
              matches: [
                { ticker: 'INTC', company: 'Intel Corporation', score: 0.91 }
              ]
            },
            
            // AUGUST 2025
            {
              id: 'placeholder-13',
              title: 'Spotify Reports Record Podcast Revenue Growth',
              url: 'https://billboard.com/spotify-podcast-revenue',
              content: 'Spotify reported that podcast advertising revenue grew by 150% year-over-year, driven by exclusive content deals and improved targeting...',
              timestamp: new Date(2025, 7, 25).toISOString(), // Aug 25, 2025
              companies: ['SPOT'],
              matches: [
                { ticker: 'SPOT', company: 'Spotify Technology S.A.', score: 0.88 }
              ]
            },
            {
              id: 'placeholder-14',
              title: 'Uber Expands Autonomous Vehicle Fleet to 10 Cities',
              url: 'https://reuters.com/uber-autonomous-expansion',
              content: 'Uber has announced the expansion of its autonomous vehicle fleet to 10 major cities, marking a significant milestone in self-driving technology adoption...',
              timestamp: new Date(2025, 7, 18).toISOString(), // Aug 18, 2025
              companies: ['UBER'],
              matches: [
                { ticker: 'UBER', company: 'Uber Technologies Inc.', score: 0.90 }
              ]
            },
            
            // JULY 2025
            {
              id: 'placeholder-15',
              title: 'Discord Files for IPO with $15 Billion Valuation',
              url: 'https://techcrunch.com/discord-ipo-filing',
              content: 'Discord has officially filed for an initial public offering, seeking a valuation of $15 billion based on its growing user base and revenue...',
              timestamp: new Date(2025, 6, 30).toISOString(), // Jul 30, 2025
              companies: ['DISCORD'],
              matches: [
                { ticker: 'DISCORD', company: 'Discord Inc.', score: 0.86 }
              ]
            }
          ] : articlesWithContent

          setArticles(finalArticles)
          setDisplayedArticles(finalArticles.slice(0, loadMoreCount))
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
  }, [contentCache, storage])

  // Cleanup parsing timeout on component unmount
  useEffect(() => {
    return () => {
      if (parsingTimeoutId) {
        clearTimeout(parsingTimeoutId)
      }
    }
  }, [parsingTimeoutId])

  // Handle manual step progression
  const handleRunStep = useCallback(async () => {
    if (currentStep === 0) {
      // Run Parse Input Article with 3-second loading animation
      setDetectionState('scanning')
      setParsingCancelled(false)
      setExtractionStages(prev => ({
        ...prev,
        parsing: { ...prev.parsing, status: 'active' }
      }))
      
      // Start the 3-second loading animation
      const timeoutId = setTimeout(async () => {
        // Check if parsing was cancelled during the timeout
        if (parsingCancelled) {
          return
        }
        
        // Extract content only (no API call, no token usage)
        try {
          console.log('Starting content extraction...')
          const result = await api.extractContent()
            
            console.log('Content extracted:', result)
            
            if (result && result.title) {
              // Store extracted content for later analysis
              setExtractedContent(result)
              
              // Save current tab info for sticky pill
              setParsedTabInfo(currentBrowserTab)
              
              // Create article preview from extracted content
              const currentUrl = currentBrowserTab?.url || result.url || ""
              const previewArticle = {
                title: result.title,
                content: result.content || result.title || "Article content",
                url: currentUrl,
                domain: currentUrl ? currentUrl.replace(/^https?:\/\//, '').split('/')[0].replace('www.', '') : "unknown",
                pageTitle: result.title,
                favicon: currentUrl ? `https://www.google.com/s2/favicons?sz=16&domain=${currentUrl.replace(/^https?:\/\//, '').split('/')[0]}` : null,
                wordCount: result.content ? result.content.split(' ').length : 0,
                readingTime: result.content ? Math.ceil(result.content.split(' ').length / 200) : 1,
                confidenceScore: 95,
                entities: [],
                detectedAt: new Date(),
                identified: true,
                matches: []
              }
              
              setExtractionStages(prev => ({
                ...prev,
                parsing: { ...prev.parsing, status: 'completed' }
              }))
              setDetectionState('hold')
              setIdentifiedArticle(previewArticle)
              setCurrentStep(1)
              setParsingTimeoutId(null)
            } else {
              throw new Error('No content extracted')
            }
        } catch (error) {
          console.error('Content extraction failed:', error)
          
          // Show error state
          setExtractionStages(prev => ({
            ...prev,
            parsing: { ...prev.parsing, status: 'error' }
          }))
          setDetectionState('error')
          setParsingTimeoutId(null)
          
          // Show error message to user
          alert(`Content extraction failed: ${error.message}`)
        }
      }, 2000) // 2 second delay
      
      setParsingTimeoutId(timeoutId)
    } else if (currentStep === 1) {
      // Run actual analysis with extracted content (this will use a token)
      setDetectionState('scanning')
      setAnalysisCancelled(false)
      setExtractionStages(prev => ({
        ...prev,
        analysis: { ...prev.analysis, status: 'active' }
      }))
      
      // Ensure minimum 3-second loading duration for consistent UX
      const startTime = Date.now()
      
      try {
        if (extractedContent || (editedTitle && editedContent)) {
          console.log('Starting analysis generation...')
          // Use edited values if available (scenario testing), otherwise use extracted content
          const titleToAnalyze = editedTitle || extractedContent?.title || ''
          const contentToAnalyze = editedContent || extractedContent?.content || ''

          // Pass filters to API
          const result = await api.analyzeArticle(titleToAnalyze, contentToAnalyze, filters)
          
          console.log('Analysis result:', result)
          
          // Calculate remaining time to ensure 2-second minimum
          const elapsedTime = Date.now() - startTime
          const remainingTime = Math.max(0, 2000 - elapsedTime)
          
          // Wait for remaining time if needed
          if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime))
          }
          
          // Check if analysis was cancelled during the wait
          if (analysisCancelled) {
            return
          }
          
          if (result) {
            // Update article with analysis results - use edited values for scenario testing
            const analyzedArticle = {
              ...identifiedArticle,
              title: titleToAnalyze,
              content: contentToAnalyze,
              text: contentToAnalyze,
              matches: result.matches || [],
              entities: result.matches ? result.matches.map(m => m.company || m.ticker) : []
            }

            // Cache the content for this article
            const cacheKey = `${analyzedArticle.title}-${analyzedArticle.url}`
            setContentCache(prev => new Map(prev.set(cacheKey, {
              content: analyzedArticle.content,
              text: analyzedArticle.text
            })))

            // Log activity
            const tickers = result.matches ? result.matches.map(m => m.ticker).filter(Boolean) : []
            await storage.logActivity({
              type: 'article_analyzed',
              description: `Analysed article: ${analyzedArticle.title}`,
              metadata: {
                articleTitle: analyzedArticle.title,
                articleUrl: analyzedArticle.url,
                ticker: tickers[0], // Use first ticker if available
                companiesFound: tickers.length
              },
              relatedEntities: tickers
            })

            setExtractionStages(prev => ({
              ...prev,
              analysis: { ...prev.analysis, status: 'completed' }
            }))
            setDetectionState('ready')
            setIdentifiedArticle(analyzedArticle)
            setCurrentStep(2)

            // Refresh articles list to show new analysis
            const updatedArticles = await storage.getArticles()
            
            // Restore content for all articles from cache
            const articlesWithContent = (updatedArticles || []).map(article => {
              const cacheKey = `${article.title}-${article.url}`
              const cachedContent = contentCache.get(cacheKey)
              
              // If article is missing content but we have it cached, restore it
              if ((!article.content || !article.text) && cachedContent) {
                return {
                  ...article,
                  content: cachedContent.content,
                  text: cachedContent.text
                }
              }
              return article
            })
            
            setArticles(articlesWithContent)
            setDisplayedArticles(articlesWithContent?.slice(0, loadMoreCount) || [])
          } else {
            throw new Error('No analysis results returned')
          }
        } else {
          throw new Error('Extension services not available or no extracted content')
        }
      } catch (error) {
        console.error('Analysis generation failed:', error)
        
        // Ensure minimum 2-second loading duration even on error
        const elapsedTime = Date.now() - startTime
        const remainingTime = Math.max(0, 2000 - elapsedTime)
        
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime))
        }
        
        // Show error state
        setExtractionStages(prev => ({
          ...prev,
          analysis: { ...prev.analysis, status: 'error' }
        }))
        setDetectionState('error')
        
        // Show error message to user
        alert(`Analysis generation failed: ${error.message}`)
      }
    }
  }, [api, storage, currentStep, parsingCancelled, extractedContent, analysisCancelled, currentBrowserTab, contentCache, loadMoreCount])


  // Initialize pipeline on component mount
  useEffect(() => {
    // Try to restore pipeline state from sessionStorage
    const savedState = sessionStorage.getItem('pipelineState')
    if (savedState) {
      try {
        const { currentStep, detectionState, extractionStages, identifiedArticle } = JSON.parse(savedState)
        setCurrentStep(currentStep)
        setDetectionState(detectionState)
        setExtractionStages(extractionStages)
        setIdentifiedArticle(identifiedArticle)
      } catch (error) {
        console.error('Failed to restore pipeline state:', error)
        // Start fresh - pipeline is ready to begin parsing
        setCurrentStep(0)
        setDetectionState('hold')
      }
    } else {
      // Start fresh - pipeline is ready to begin parsing
      setCurrentStep(0)
      setDetectionState('hold')
    }
  }, [])


  // Save pipeline state to sessionStorage whenever it changes
  useEffect(() => {
    const pipelineState = {
      currentStep,
      detectionState,
      extractionStages,
      identifiedArticle
    }
    sessionStorage.setItem('pipelineState', JSON.stringify(pipelineState))
  }, [currentStep, detectionState, extractionStages, identifiedArticle])

  // Add keyboard shortcut for Cmd/Ctrl + E
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'e') {
        event.preventDefault()
        if (detectionState === 'hold' && (currentStep === 0 || currentStep === 1)) {
          handleRunStep()
        } else if (detectionState === 'ready') {
          handleReset()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [detectionState, currentStep])

  // Update displayed articles when search changes
  useEffect(() => {
    if (searchQuery && searchQuery.trim()) {
      // When searching, show all articles that match the search
      const searchResults = articles.filter(article => {
        const query = searchQuery.toLowerCase()
        
        // Search in title
        const titleMatch = article.title?.toLowerCase().includes(query)
        
        // Search in domain/source
        const domainMatch = article.url ? 
          article.url.replace(/^https?:\/\//, '').split('/')[0].replace('www.', '').toLowerCase().includes(query) 
          : false
        
        // Search in ticker symbols (keeping existing functionality)
        const tickerMatch = article.companies?.some(company => 
          company.symbol?.toLowerCase().includes(query) ||
          company.ticker?.toLowerCase().includes(query) ||
          company.company?.toLowerCase().includes(query) ||
          (typeof company === 'string' && company.toLowerCase().includes(query))
        )
        
        return titleMatch || domainMatch || tickerMatch
      })
      setDisplayedArticles(searchResults)
    } else {
      // When not searching, show limited articles for pagination
      setDisplayedArticles(articles.slice(0, Math.max(loadMoreCount, displayedArticles.length)))
    }
  }, [searchQuery, articles, loadMoreCount])

  // Lightweight loading skeleton matching ArticleCard structure
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse bg-white border border-gray-200">
            <CardContent className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="flex gap-2 mt-3">
                <div className="h-5 bg-gray-200 rounded w-16"></div>
                <div className="h-5 bg-gray-200 rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const handleCancelParsing = () => {
    if (parsingTimeoutId) {
      clearTimeout(parsingTimeoutId)
      setParsingTimeoutId(null)
    }
    setParsingCancelled(true)
    setDetectionState('hold')
    setExtractionStages(prev => ({
      ...prev,
      parsing: { ...prev.parsing, status: 'waiting' }
    }))
  }

  const handleCancelAnalysis = () => {
    setAnalysisCancelled(true)
    setDetectionState('hold')
    setExtractionStages(prev => ({
      ...prev,
      analysis: { ...prev.analysis, status: 'waiting' }
    }))
  }

  const handleReset = () => {
    // Clear any parsing timeout
    if (parsingTimeoutId) {
      clearTimeout(parsingTimeoutId)
      setParsingTimeoutId(null)
    }
    
    // Clear sessionStorage
    sessionStorage.removeItem('pipelineState')
    
    // Reset all states to initial values
    setCurrentStep(0)
    setDetectionState('hold')
    setIdentifiedArticle(null)
    setIsEditing(false)
    setEditedTitle('')
    setEditedContent('')
    setParsingCancelled(false)
    setAnalysisCancelled(false)
    setParsedTabInfo(null)
    setShowTemplates(false)
    setShowFilters(false)
    setFilters({
      companySizes: [],
      sectors: [],
      regions: [],
      industries: []
    })

    // Reset extraction stages to initial state
    setExtractionStages({
      parsing: { 
        status: 'waiting', 
        title: 'Parse Input Article', 
        subtitle: 'Extracting and structuring article content',
        details: {
          description: 'Process and parse article content',
          info: 'Clean and structure the extracted content',
          action: 'View processing details'
        }
      },
      analysis: { 
        status: 'waiting', 
        title: 'Analysis Generation', 
        subtitle: 'Ready to process content for AI analysis',
        details: {
          description: 'Generate AI-powered analysis',
          info: 'Content ready for comprehensive analysis',
          action: 'Start analysis process'
        }
      }
    })
  }


  // Define empty state component (but don't return early)
  const EmptyState = () => (
    <Card className="border-dashed border-2 border-gray-200 bg-white">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-gray-100 p-3 mb-4">
          <FileText size={24} className="text-gray-400" />
        </div>
        <h3 className={semanticTypography.emptyStateTitle}>No analyses yet</h3>
        <p className={cn(semanticTypography.emptyStateDescription, "max-w-xs")}>
          Visit any article page and click the extension to analyze it.
        </p>
      </CardContent>
    </Card>
  )

  // No search results state  
  if (searchQuery && searchQuery.trim() && displayedArticles.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-200 bg-white">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-gray-100 p-3 mb-4">
            <FileText size={24} className="text-gray-400" />
          </div>
          <h3 className={semanticTypography.emptyStateTitle}>No results found</h3>
          <p className={cn(semanticTypography.emptyStateDescription, "max-w-xs")}>
            No articles match "{searchQuery}". Try searching for different keywords or tickers.
          </p>
        </CardContent>
      </Card>
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    
    // Check if it's today
    const isToday = date.toDateString() === now.toDateString()
    
    if (isToday) {
      // Use relative time for today
      if (diffMins < 1) return 'Just now'
      if (diffMins === 1) return '1 min ago'
      if (diffMins < 60) return `${diffMins} mins ago`
      if (diffHours === 1) return '1 hour ago'
      return `${diffHours} hours ago`
    }
    
    // Use formatted date for all other days
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[date.getMonth()]
    const day = date.getDate()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    
    return `${day} ${month}, ${hours}:${minutes}`
  }

  const groupArticlesByDate = (articles) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)

    const groups = {
      today: [],
      yesterday: [],
      lastWeek: [],
      months: {}
    }

    articles.forEach(article => {
      const articleDate = new Date(article.timestamp)
      const articleDateOnly = new Date(articleDate.getFullYear(), articleDate.getMonth(), articleDate.getDate())
      
      if (articleDateOnly.getTime() === today.getTime()) {
        groups.today.push(article)
      } else if (articleDateOnly.getTime() === yesterday.getTime()) {
        groups.yesterday.push(article)
      } else if (articleDateOnly > lastWeek) {
        groups.lastWeek.push(article)
      } else {
        // Group by month
        const monthKey = articleDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        if (!groups.months[monthKey]) {
          groups.months[monthKey] = []
        }
        groups.months[monthKey].push(article)
      }
    })

    return groups
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

  // Use displayed articles directly (filtering handled in useEffect)
  const filteredArticles = displayedArticles

  // Group filtered articles by date
  const groupedArticles = groupArticlesByDate(filteredArticles)

  // Generate random color for icon
  const getRandomColor = (seed) => {
    // Use article title as seed for consistent colors
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-pink-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-indigo-500',
      'bg-orange-500',
      'bg-teal-500',
      'bg-cyan-500'
    ]
    
    return colors[Math.abs(hash) % colors.length]
  }

  // Get full stock ticker
  const getIconText = (article) => {
    // Try to get ticker from matches array first
    if (article.matches && article.matches.length > 0) {
      const firstMatch = article.matches[0]
      if (firstMatch.ticker) {
        return firstMatch.ticker.toUpperCase()
      }
    }
    
    // Fallback to companies array
    if (article.companies && article.companies.length > 0) {
      const firstCompany = article.companies[0]
      if (typeof firstCompany === 'string') {
        return firstCompany.toUpperCase()
      }
    }
    
    // Final fallback to first letter of title
    return article.title?.charAt(0)?.toUpperCase() || 'A'
  }

  // Render article as list item with Gmail-style design
  const renderArticleItem = (article, isLast = false) => {
    const handleCardClick = () => {
      onArticleClick?.(article)
    }
    
    return (
      <div 
        className="relative cursor-pointer transition-all duration-200 group hover:bg-gray-50 hover:rounded-lg"
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-3 px-3 py-3">
          {/* Ticker rounded square icon */}
          <div className={cn(
            "w-12 h-12 rounded-md flex items-center justify-center text-white font-medium text-[10px] flex-shrink-0",
            getRandomColor(article.title || article.url || 'default')
          )}>
            {getIconText(article)}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 leading-tight">
              {article.title}
            </h3>

            {/* Meta info */}
            <div className="space-y-0.5">
              {article.url && (
                <div className="text-gray-600">
                  <span className="truncate text-xs">{extractDomain(article.url)}</span>
                </div>
              )}
              <div className="text-xs text-gray-500">{formatDate(article.timestamp)}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">

      {/* Actions Section - Combined Pipeline UI - Hide when searching */}
      {(!searchQuery || !searchQuery.trim()) && (
        <div className="mb-3 ml-2 pr-1">
        {/* Stage-focused Pipeline Card */}
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">

          {/* Header bar with title, help icon, and loading spinner */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 text-[10px] font-medium text-white bg-gray-900 rounded-full">Beta</span>
              <span className="text-sm font-medium text-gray-900">Discovery Engine</span>

            </div>

            {/* Loading spinner - shown when parsing or analyzing */}
            {(extractionStages.parsing.status === 'active' || extractionStages.analysis.status === 'active') && (
              <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
            )}
          </div>

          {/* Stage Content - Only show current/relevant stage */}
          {/* STAGE 1: Extract - Show when on step 0 or parsing is active */}
          {currentStep === 0 && !extractionStages.parsing.status.match(/completed/) && (
            <>
              <div className="px-4 pt-4 pb-2">
                <div className="space-y-2">
                  {/* Stage description with step indicator */}
                  <div>
                    <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Step 1 of 2</span>
                    <p className="font-medium text-gray-700 mt-0.5">Extract Content</p>
                    <p className="text-xs text-gray-500">Pull article text from the current page, or enter your own</p>
                  </div>
                  {/* Current tab preview - display only */}
                  {currentBrowserTab && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                      {currentBrowserTab.favicon && !faviconLoadErrors.has(`current-${currentBrowserTab.favicon}`) ? (
                        <img
                          src={currentBrowserTab.favicon}
                          alt=""
                          className="w-4 h-4 rounded-sm flex-shrink-0"
                          onError={() => setFaviconLoadErrors(prev => new Set([...prev, `current-${currentBrowserTab.favicon}`]))}
                        />
                      ) : (
                        <div className="w-4 h-4 bg-gray-300 rounded-sm flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{currentBrowserTab.title || 'Current Tab'}</p>
                        <p className="text-xs text-gray-500 truncate">{currentBrowserTab.url}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Full-width separator */}
              <div className="border-t border-gray-100"></div>

              {/* Action buttons section */}
              <div className="px-4 pt-2 pb-4">
                <button
                  onClick={extractionStages.parsing.status !== 'active' ? handleRunStep : undefined}
                  disabled={extractionStages.parsing.status === 'active'}
                  className="w-full py-2.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:bg-gray-300 disabled:text-gray-500"
                >
                  {extractionStages.parsing.status === 'active' ? 'Extracting...' : 'Extract Tab'}
                </button>
              </div>
            </>
          )}

          {/* STAGE 2: Run - Show after parsing is complete */}
          {(extractionStages.parsing.status === 'completed' && currentStep >= 1 && detectionState !== 'ready') && (
            <div className="px-4 py-4">
              <div className="space-y-2">
                {/* Stage description with step indicator */}
                <div>
                  <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Step 2 of 2</span>
                  <p className="font-medium text-gray-700 mt-0.5">Identify Themes</p>
                  <p className="text-xs text-gray-500">AI will detect companies, sectors and topics mentioned</p>
                </div>

                {/* Template Picker - Show when user clicks Scenario Testing */}
                {showTemplates ? (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-gray-700">Choose a scenario template or create your own:</p>

                    {/* Template Grid */}
                    <div className="space-y-2">
                      {/* Custom option - first */}
                      <button
                        onClick={handleCustomScenario}
                        className="w-full text-left p-3 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-100 hover:border-gray-200"
                      >
                        <p className="text-xs font-medium text-gray-900 mb-0.5">Custom Scenario</p>
                        <p className="text-xs text-gray-600">Write your own scenario from scratch</p>
                      </button>

                      {/* Pre-built templates */}
                      {scenarioTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateSelect(template)}
                          className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100 hover:border-gray-200"
                        >
                          <p className="text-xs font-medium text-gray-900 mb-0.5">{template.title}</p>
                          <p className="text-xs text-gray-600">{template.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Scenario content editor - always editable for scenario testing */}
                {identifiedArticle && !showTemplates && (
                  <div className="space-y-3 p-3 bg-gray-50 rounded-md">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Content</label>
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        rows={8}
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COMPLETE STATE */}
            {detectionState === 'ready' && (
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-700">Article Saved</p>
                  <p className="text-xs text-gray-500">Analysis complete and added to your library</p>
                </div>
              </div>
            )}

            {/* ERROR STATE */}
            {detectionState === 'error' && (
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-700">Error</p>
                  <p className="text-xs text-gray-500">Something went wrong. Try again.</p>
                </div>
                <button
                  onClick={handleRunStep}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

          {/* Filters Section - Collapsible */}
          {currentStep >= 1 && !showTemplates && identifiedArticle && detectionState !== 'ready' && detectionState !== 'error' && (
            <div className="border-t border-b border-gray-100 px-4 py-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-between text-left hover:opacity-70 transition-opacity"
              >
                <span className="text-xs font-medium text-gray-700">Apply Filters</span>
                <svg
                  className={`w-3 h-3 text-gray-400 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showFilters && (
                <div className="mt-3 space-y-3">
                  {/* Company Size Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Company Size</label>
                    <div className="flex overflow-x-auto gap-2 pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      <style jsx>{`
                        div::-webkit-scrollbar {
                          display: none;
                        }
                      `}</style>
                      {[
                        { value: 'small', label: 'Small (<$2B)' },
                        { value: 'mid', label: 'Mid ($2-10B)' },
                        { value: 'large', label: 'Large (>$10B)' }
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => toggleFilter('companySizes', option.value)}
                          className={cn(
                            "px-2.5 py-1.5 text-xs rounded-md border transition-colors flex-shrink-0",
                            filters.companySizes.includes(option.value)
                              ? "bg-gray-900 text-white border-gray-900"
                              : "bg-white text-gray-700 border-gray-100 hover:border-gray-200"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sectors Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Sectors</label>
                    <div className="flex overflow-x-auto gap-2 pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      <style jsx>{`
                        div::-webkit-scrollbar {
                          display: none;
                        }
                      `}</style>
                      {[
                        { value: 'technology', label: 'Technology' },
                        { value: 'healthcare', label: 'Healthcare' },
                        { value: 'financials', label: 'Financials' },
                        { value: 'energy', label: 'Energy' },
                        { value: 'industrials', label: 'Industrials' },
                        { value: 'consumer-discretionary', label: 'Consumer Disc.' },
                        { value: 'consumer-staples', label: 'Consumer Staples' },
                        { value: 'utilities', label: 'Utilities' },
                        { value: 'materials', label: 'Materials' },
                        { value: 'real-estate', label: 'Real Estate' },
                        { value: 'communication', label: 'Communication' }
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => toggleFilter('sectors', option.value)}
                          className={cn(
                            "px-2.5 py-1.5 text-xs rounded-md border transition-colors flex-shrink-0",
                            filters.sectors.includes(option.value)
                              ? "bg-gray-900 text-white border-gray-900"
                              : "bg-white text-gray-700 border-gray-100 hover:border-gray-200"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full-width action buttons at bottom */}
          {detectionState !== 'ready' && detectionState !== 'error' && (
            <div className="px-3 pt-0 pb-3">
              {currentStep === 0 && extractionStages.parsing.status !== 'active' ? (
                <button
                  onClick={handleCustomEntry}
                  className="w-full py-2.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Scenario Testing
                </button>
              ) : currentStep === 0 && extractionStages.parsing.status === 'active' ? (
                <button
                  onClick={handleCancelParsing}
                  className="w-full py-2.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              ) : showTemplates ? (
                <button
                  onClick={handleReset}
                  className="w-full py-2.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Back
                </button>
              ) : extractionStages.analysis.status === 'active' ? (
                <button
                  onClick={handleCancelAnalysis}
                  className="w-full py-2.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleRunStep}
                    className="w-full py-2.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Run
                  </button>
                  <button
                    onClick={handleReset}
                    className="w-full py-2.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      )}

      {/* Dynamic Header - Recents or Search Results */}
      <div className="mt-1 mb-3 flex items-center px-1">
        <h2 className="text-sm font-medium text-gray-900">
          {searchQuery && searchQuery.trim() ? 'Search Results' : 'Recents'}
        </h2>
        {searchQuery && searchQuery.trim() && (
          <span className="ml-2 text-xs text-gray-500">
            {displayedArticles.length} result{displayedArticles.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      
      {/* Show empty state if no articles, otherwise show articles */}
      {displayedArticles.length === 0 && !isLoading ? (
        <EmptyState />
      ) : (
        <>
          
          <div className={componentSpacing.cardGroupSpacing}>
      {/* Today */}
      {groupedArticles.today.length > 0 && (
        <div>
          <div className="mb-3 px-1">
            <h3 className="text-xs text-gray-600">Today</h3>
          </div>
          <div className="bg-white ml-2">
            {groupedArticles.today.map((article, index) => (
              <div key={article.id || article.title}>
                {renderArticleItem(article, index === groupedArticles.today.length - 1)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Yesterday */}
      {groupedArticles.yesterday.length > 0 && (
        <div>
          <div className="mb-3 px-1">
            <h3 className="text-xs text-gray-600">Yesterday</h3>
          </div>
          <div className="bg-white ml-2">
            {groupedArticles.yesterday.map((article, index) => (
              <div key={article.id || article.title}>
                {renderArticleItem(article, index === groupedArticles.yesterday.length - 1)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Week */}
      {groupedArticles.lastWeek.length > 0 && (
        <div>
          <div className="mb-3 px-1">
            <h3 className="text-xs text-gray-600">Last Week</h3>
          </div>
          <div className="bg-white ml-2">
            {groupedArticles.lastWeek.map((article, index) => (
              <div key={article.id || article.title}>
                {renderArticleItem(article, index === groupedArticles.lastWeek.length - 1)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly groups */}
      {Object.entries(groupedArticles.months)
        .sort(([a], [b]) => new Date(b) - new Date(a))
        .map(([monthKey, monthArticles]) => (
          monthArticles.length > 0 && (
            <div key={monthKey}>
              <div className="mb-3 px-1">
                <h3 className="text-xs text-gray-600">{monthKey}</h3>
              </div>
              <div className="bg-white ml-2">
                {monthArticles.map((article, index) => (
                  <div key={article.id || article.title}>
                    {renderArticleItem(article, index === monthArticles.length - 1)}
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
      
      {/* Load More Button */}
      {(!searchQuery || !searchQuery.trim()) && displayedArticles.length < articles.length && (
        <div className="mt-4 mb-3 ml-2">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs text-gray-600 leading-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoadingMore ? (
              <>
                <div className="w-3 h-3 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin"></div>
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
        </>
      )}
    </div>
  )
}))

ArticlesTab.displayName = 'ArticlesTab'

export default ArticlesTab