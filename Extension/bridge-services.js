// Bridge Services - Connects React UI to existing vanilla JS services
// This file creates adapters to make your existing services work with the React UI

// Import existing services
import './src/services/storage.js'
import './src/services/auth.js' 
import './src/services/api.js'

// Service Adapters - these wrap your existing services for React compatibility
class ServiceBridge {
  constructor() {
    this.initializeServices()
  }

  initializeServices() {
    // Wait for DOM and services to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupBridge())
    } else {
      this.setupBridge()
    }
  }

  setupBridge() {
    // Create global extension services object for React to access
    window.extensionServices = {
      auth: new AuthServiceAdapter(),
      api: new APIServiceAdapter(),
      storage: new StorageServiceAdapter()
    }

    // Setup event listeners
    this.setupEventListeners()
    
    console.log('Extension services bridge initialized')
  }

  setupEventListeners() {
    // Listen for React events
    window.addEventListener('reactEvent', (event) => {
      console.log('React event received:', event.detail)
      this.handleReactEvent(event.detail)
    })
  }

  handleReactEvent(eventData) {
    const { type, data } = eventData
    
    switch (type) {
      case 'ANALYSIS_STARTED':
        // Handle analysis start
        break
      case 'USER_ACTION':
        // Handle user actions
        break
      default:
        console.log('Unhandled React event:', type, data)
    }
  }

  // Send events to React
  notifyReact(type, data) {
    const event = new CustomEvent('extensionEvent', {
      detail: { type, data }
    })
    window.dispatchEvent(event)
  }
}

// Auth Service Adapter
class AuthServiceAdapter {
  async signIn() {
    try {
      // Call your existing auth service
      // This should match the signature of your existing AuthService.signIn()
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

// API Service Adapter
class APIServiceAdapter {
  async analyzeArticle() {
    try {
      // Call your existing API service
      if (typeof APIService !== 'undefined' && APIService.analyzeCurrentPage) {
        const result = await APIService.analyzeCurrentPage()
        
        // Notify React of successful analysis
        window.serviceBridge?.notifyReact('ANALYSIS_COMPLETE', result)
        
        return result
      }
      
      // Fallback for development
      console.warn('APIService not found, using mock data')
      const mockResult = {
        title: 'Mock Article Analysis',
        companies: [
          { symbol: 'AAPL', sentiment: 'positive' },
          { symbol: 'GOOGL', sentiment: 'neutral' },
          { symbol: 'TSLA', sentiment: 'positive' }
        ],
        timestamp: new Date().toISOString(),
        source: 'Mock Source',
        snippet: 'This is a mock analysis result for development purposes.'
      }
      
      return mockResult
    } catch (error) {
      console.error('Article analysis failed:', error)
      throw error
    }
  }

  async getTrendingStocks() {
    try {
      if (typeof APIService !== 'undefined' && APIService.getTrendingStocks) {
        return await APIService.getTrendingStocks()
      }
      
      // Mock data for development
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

// Storage Service Adapter
class StorageServiceAdapter {
  async getArticles() {
    try {
      if (typeof StorageService !== 'undefined' && StorageService.getArticles) {
        return await StorageService.getArticles()
      }
      
      // Mock data for development
      return [
        {
          id: '1',
          title: 'Apple Reports Strong Q4 Earnings',
          companies: [
            { symbol: 'AAPL', sentiment: 'positive' },
            { symbol: 'AMZN', sentiment: 'neutral' }
          ],
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          source: 'TechCrunch',
          snippet: 'Apple reported better than expected earnings...'
        },
        {
          id: '2', 
          title: 'Tesla Announces New Gigafactory',
          companies: [
            { symbol: 'TSLA', sentiment: 'positive' }
          ],
          timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          source: 'Reuters',
          snippet: 'Tesla announced plans for a new Gigafactory...'
        }
      ]
    } catch (error) {
      console.error('Get articles failed:', error)
      return []
    }
  }

  async saveArticle(article) {
    try {
      if (typeof StorageService !== 'undefined' && StorageService.saveArticle) {
        return await StorageService.saveArticle(article)
      }
      
      // Mock save for development
      console.log('Mock saving article:', article)
      return { success: true, id: Date.now().toString() }
    } catch (error) {
      console.error('Save article failed:', error)
      throw error
    }
  }

  async deleteArticle(id) {
    try {
      if (typeof StorageService !== 'undefined' && StorageService.deleteArticle) {
        return await StorageService.deleteArticle(id)
      }
      
      console.log('Mock deleting article:', id)
      return { success: true }
    } catch (error) {
      console.error('Delete article failed:', error)
      throw error
    }
  }

  async getUsageCount() {
    try {
      if (typeof StorageService !== 'undefined' && StorageService.getUsageCount) {
        return await StorageService.getUsageCount()
      }
      
      // Mock usage count for development
      return 2
    } catch (error) {
      console.error('Get usage count failed:', error)
      return 0
    }
  }
}

// Initialize the bridge
window.serviceBridge = new ServiceBridge()

export default ServiceBridge