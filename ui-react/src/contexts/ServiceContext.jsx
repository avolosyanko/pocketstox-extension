import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'

// Service adapters - modernized versions of your existing adapters
class AuthServiceAdapter {
  async signIn() {
    try {
      // Call your existing auth service
      if (typeof AuthService !== 'undefined' && AuthService.signIn) {
        return await AuthService.signIn()
      }
      
      // Fallback for development
      console.warn('AuthService not found, using mock data')
      return { name: 'Test User', email: 'test@example.com', id: '123' }
    } catch (error) {
      console.error('Auth sign in failed:', error)
      throw error
    }
  }

  async signOut() {
    try {
      if (typeof AuthService !== 'undefined' && AuthService.signOut) {
        return await AuthService.signOut()
      }
      return true
    } catch (error) {
      console.error('Auth sign out failed:', error)
      throw error
    }
  }

  async getUser() {
    try {
      if (typeof AuthService !== 'undefined' && AuthService.getUser) {
        return await AuthService.getUser()
      }
      return null
    } catch (error) {
      console.error('Get user failed:', error)
      return null
    }
  }
}

class APIServiceAdapter {
  async analyzeArticle(title, content) {
    try {
      // Check if global function is available
      if (typeof window.analyzeArticle === 'function') {
        return await window.analyzeArticle(title, content)
      }
      
      // Fallback for development
      console.warn('analyzeArticle not found, using mock data')
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate delay
      
      return {
        title: title || 'Mock Article Analysis',
        companies: [
          { symbol: 'AAPL', sentiment: 'positive' },
          { symbol: 'GOOGL', sentiment: 'neutral' },
          { symbol: 'TSLA', sentiment: 'positive' }
        ],
        matches: [
          { ticker: 'AAPL', company: 'Apple Inc.', score: 0.95 },
          { ticker: 'GOOGL', company: 'Alphabet Inc.', score: 0.87 }
        ],
        timestamp: new Date().toISOString(),
        source: 'Mock Source',
        snippet: 'This is a mock analysis result for development purposes.'
      }
    } catch (error) {
      console.error('Article analysis failed:', error)
      throw error
    }
  }

  async extractContent() {
    try {
      // Get active tab content
      if (chrome && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        
        // Mock extraction for development
        return {
          title: tab.title || 'Sample Article Title',
          content: 'Sample article content extracted from the current page...',
          url: tab.url
        }
      }
      
      return {
        title: 'Sample Article Title',
        content: 'Sample article content...',
        url: 'https://example.com'
      }
    } catch (error) {
      console.error('Content extraction failed:', error)
      throw error
    }
  }

  async getTrendingStocks() {
    try {
      // Add your existing trending stocks logic here
      return [
        { symbol: 'NVDA', name: 'NVIDIA Corp', trending: true },
        { symbol: 'TSLA', name: 'Tesla Inc', trending: true },
        { symbol: 'AAPL', name: 'Apple Inc', trending: false }
      ]
    } catch (error) {
      console.error('Get trending stocks failed:', error)
      throw error
    }
  }
}

class StorageServiceAdapter {
  async getArticles() {
    try {
      // Use chrome storage API
      if (chrome && chrome.storage) {
        const result = await chrome.storage.local.get(['pocketstox_analyses'])
        return result.pocketstox_analyses || []
      }
      
      // Fallback for development
      return [
        {
          id: '1',
          title: 'Apple Reports Strong Q4 Earnings',
          companies: [
            { symbol: 'AAPL', sentiment: 'positive' },
            { symbol: 'AMZN', sentiment: 'neutral' }
          ],
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          source: 'TechCrunch',
          snippet: 'Apple reported better than expected earnings...',
          matches: [
            { ticker: 'AAPL', company: 'Apple Inc.', score: 0.95 }
          ]
        },
        {
          id: '2', 
          title: 'Tesla Announces New Gigafactory',
          companies: [
            { symbol: 'TSLA', sentiment: 'positive' }
          ],
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          source: 'Reuters',
          snippet: 'Tesla announced plans for a new Gigafactory...',
          matches: [
            { ticker: 'TSLA', company: 'Tesla, Inc.', score: 0.92 }
          ]
        }
      ]
    } catch (error) {
      console.error('Get articles failed:', error)
      return []
    }
  }

  async saveArticle(article) {
    try {
      if (chrome && chrome.storage) {
        const articles = await this.getArticles()
        const newArticles = [article, ...articles]
        await chrome.storage.local.set({ pocketstox_analyses: newArticles })
        return { success: true, id: article.id || Date.now().toString() }
      }
      
      console.log('Mock saving article:', article)
      return { success: true, id: Date.now().toString() }
    } catch (error) {
      console.error('Save article failed:', error)
      throw error
    }
  }

  async deleteArticle(id) {
    try {
      if (chrome && chrome.storage) {
        const articles = await this.getArticles()
        const filtered = articles.filter(article => (article.id || article.title) !== id)
        await chrome.storage.local.set({ pocketstox_analyses: filtered })
        return { success: true }
      }
      
      console.log('Mock deleting article:', id)
      return { success: true }
    } catch (error) {
      console.error('Delete article failed:', error)
      throw error
    }
  }

  async getUsageStats() {
    try {
      if (chrome && chrome.storage) {
        const result = await chrome.storage.local.get(['pocketstox_usage'])
        const usage = result.pocketstox_usage || { count: 0, date: new Date().toDateString() }
        
        // Check if it's a new day
        const today = new Date().toDateString()
        if (usage.date !== today) {
          return { today: 0, total: usage.count }
        }
        
        return { today: usage.count, total: usage.count }
      }
      
      return { today: 2, total: 15 }
    } catch (error) {
      console.error('Get usage stats failed:', error)
      return { today: 0, total: 0 }
    }
  }

  async addToWatchlist(item) {
    try {
      if (chrome && chrome.storage) {
        const result = await chrome.storage.local.get(['pocketstox_watchlist'])
        const watchlist = result.pocketstox_watchlist || []
        const newWatchlist = [...watchlist, { ...item, addedAt: new Date().toISOString() }]
        await chrome.storage.local.set({ pocketstox_watchlist: newWatchlist })
        return { success: true }
      }
      
      console.log('Mock adding to watchlist:', item)
      return { success: true }
    } catch (error) {
      console.error('Add to watchlist failed:', error)
      throw error
    }
  }

  async getWatchlist() {
    try {
      if (chrome && chrome.storage) {
        const result = await chrome.storage.local.get(['pocketstox_watchlist'])
        return result.pocketstox_watchlist || []
      }
      
      // Mock data for development
      return []
    } catch (error) {
      console.error('Get watchlist failed:', error)
      return []
    }
  }

  async removeFromWatchlist(ticker) {
    try {
      if (chrome && chrome.storage) {
        const result = await chrome.storage.local.get(['pocketstox_watchlist'])
        const watchlist = result.pocketstox_watchlist || []
        const newWatchlist = watchlist.filter(item => item.ticker !== ticker)
        await chrome.storage.local.set({ pocketstox_watchlist: newWatchlist })
        return { success: true }
      }
      
      console.log('Mock removing from watchlist:', ticker)
      return { success: true }
    } catch (error) {
      console.error('Remove from watchlist failed:', error)
      throw error
    }
  }

  async setAccount(accountData) {
    try {
      if (chrome && chrome.storage) {
        await chrome.storage.local.set({ pocketstox_account: accountData })
        return { success: true }
      }
      
      console.log('Mock setting account:', accountData)
      return { success: true }
    } catch (error) {
      console.error('Set account failed:', error)
      throw error
    }
  }

  async getAccount() {
    try {
      if (chrome && chrome.storage) {
        const result = await chrome.storage.local.get(['pocketstox_account'])
        return result.pocketstox_account || null
      }

      return null
    } catch (error) {
      console.error('Get account failed:', error)
      return null
    }
  }

  async getActivityLog() {
    try {
      if (chrome && chrome.storage) {
        const result = await chrome.storage.local.get(['pocketstox_activity_log'])
        return result.pocketstox_activity_log || []
      }

      return []
    } catch (error) {
      console.error('Get activity log failed:', error)
      return []
    }
  }

  async logActivity(activityData) {
    try {
      if (chrome && chrome.storage) {
        const activities = await this.getActivityLog()

        const activity = {
          id: activityData.id || Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
          type: activityData.type,
          timestamp: activityData.timestamp || new Date().toISOString(),
          description: activityData.description,
          metadata: activityData.metadata || {},
          relatedEntities: activityData.relatedEntities || []
        }

        const newActivities = [activity, ...activities]

        // Keep only the most recent 500 activities
        if (newActivities.length > 500) {
          newActivities.splice(500)
        }

        await chrome.storage.local.set({ pocketstox_activity_log: newActivities })
        return activity
      }

      console.log('Mock logging activity:', activityData)
      return activityData
    } catch (error) {
      console.error('Log activity failed:', error)
      throw error
    }
  }
}

// Create the service context
const ServiceContext = createContext(null)

// Custom hook to use services with error handling
export const useServices = () => {
  const context = useContext(ServiceContext)
  if (!context) {
    throw new Error('useServices must be used within a ServiceProvider')
  }
  return context
}

// Service provider component
export const ServiceProvider = ({ children }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Create services once with useMemo for performance
  const services = useMemo(() => ({
    auth: new AuthServiceAdapter(),
    api: new APIServiceAdapter(),
    storage: new StorageServiceAdapter()
  }), [])

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Wait a moment for extension context to be ready
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Services are ready
        setLoading(false)
      } catch (err) {
        console.error('Service initialization failed:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    initializeServices()
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Initializing services...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-sm text-red-600 mb-2">Service initialization failed</p>
          <p className="text-xs text-gray-500">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-3 py-1 text-xs bg-gray-900 text-white rounded hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  )
}

// Additional hooks for specific services
export const useAuth = () => {
  const { auth } = useServices()
  return auth
}

export const useAPI = () => {
  const { api } = useServices()
  return api
}

export const useStorage = () => {
  const { storage } = useServices()
  return storage
}

export default ServiceContext