import { useState, useEffect, useCallback } from 'react'

// Communication bridge between React UI and vanilla JS extension services
export const useExtensionAPI = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Get vanilla JS service functions from global scope
  const getVanillaService = useCallback((serviceName) => {
    return new Promise((resolve, reject) => {
      if (window.extensionServices && window.extensionServices[serviceName]) {
        resolve(window.extensionServices[serviceName])
      } else {
        // Wait for services to load
        const checkServices = setInterval(() => {
          if (window.extensionServices && window.extensionServices[serviceName]) {
            clearInterval(checkServices)
            resolve(window.extensionServices[serviceName])
          }
        }, 100)
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkServices)
          reject(new Error(`Service ${serviceName} not available`))
        }, 5000)
      }
    })
  }, [])

  // Call vanilla JS functions with loading states
  const callService = useCallback(async (serviceName, method, ...args) => {
    setLoading(true)
    setError(null)
    
    try {
      const service = await getVanillaService(serviceName)
      const result = await service[method](...args)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [getVanillaService])

  return {
    loading,
    error,
    callService,
  }
}

// Specific hooks for different services
export const useAuth = () => {
  const { callService, loading, error } = useExtensionAPI()
  
  return {
    signIn: (...args) => callService('auth', 'signIn', ...args),
    signOut: (...args) => callService('auth', 'signOut', ...args),
    getUser: (...args) => callService('auth', 'getUser', ...args),
    loading,
    error
  }
}

export const useAPI = () => {
  const { callService, loading, error } = useExtensionAPI()
  
  return {
    analyzeArticle: (...args) => callService('api', 'analyzeArticle', ...args),
    getTrendingStocks: (...args) => callService('api', 'getTrendingStocks', ...args),
    loading,
    error
  }
}

export const useStorage = () => {
  const { callService, loading, error } = useExtensionAPI()
  
  return {
    getArticles: (...args) => callService('storage', 'getArticles', ...args),
    saveArticle: (...args) => callService('storage', 'saveArticle', ...args),
    deleteArticle: (...args) => callService('storage', 'deleteArticle', ...args),
    getUsageCount: (...args) => callService('storage', 'getUsageCount', ...args),
    loading,
    error
  }
}

// Custom hook for listening to extension events
export const useExtensionEvents = (eventType, callback) => {
  useEffect(() => {
    const handleEvent = (event) => {
      if (event.detail && event.detail.type === eventType) {
        callback(event.detail.data)
      }
    }
    
    window.addEventListener('extensionEvent', handleEvent)
    
    return () => {
      window.removeEventListener('extensionEvent', handleEvent)
    }
  }, [eventType, callback])
}

// Utility to emit events to vanilla JS
export const emitExtensionEvent = (type, data) => {
  const event = new CustomEvent('reactEvent', {
    detail: { type, data }
  })
  window.dispatchEvent(event)
}