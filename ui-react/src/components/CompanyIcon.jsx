import React, { useState, useEffect } from 'react'
import { cn } from '../lib/utils'

// Ticker to local image mapping
const getCompanyImage = (ticker) => {
  const imageMap = {
    'AAPL': 'assets/images/apple.png',
    'AMZN': 'assets/images/amazon.png', 
    'GOOGL': 'assets/images/google.png',
    'GOOG': 'assets/images/google.png',
    'META': 'assets/images/meta.png',
    'MSFT': 'assets/images/microsoft.png',
    'NFLX': 'assets/images/netflix.png',
    'NVDA': 'assets/images/nvidia.png',
    'TSLA': 'assets/images/tesla.png'
  }
  return imageMap[ticker] || null
}

// Color cache to avoid re-extracting colors
const colorCache = new Map()

// Extract dominant color from image with caching and debouncing
const useDominantColor = (imagePath) => {
  const [dominantColor, setDominantColor] = useState(null)
  
  useEffect(() => {
    if (!imagePath) return
    
    // Check cache first
    if (colorCache.has(imagePath)) {
      setDominantColor(colorCache.get(imagePath))
      return
    }
    
    // Debounce the color extraction to avoid too many canvas operations
    const timeoutId = setTimeout(() => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        // Use requestIdleCallback for non-blocking processing with fallback
        const processColor = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)
          
          const imageData = ctx.getImageData(0, 0, img.width, img.height)
          const data = imageData.data
          const colorCount = {}
          
          // Sample every 20th pixel for better performance (was every 10th)
          for (let i = 0; i < data.length; i += 80) {
            const r = data[i]
            const g = data[i + 1] 
            const b = data[i + 2]
            const alpha = data[i + 3]
            
            if (alpha > 128) { // Skip transparent pixels
              const rgb = `${r},${g},${b}`
              colorCount[rgb] = (colorCount[rgb] || 0) + 1
            }
          }
          
          // Find most common color
          let maxCount = 0
          let dominantRgb = '59,130,246' // Default blue
          for (const [rgb, count] of Object.entries(colorCount)) {
            if (count > maxCount) {
              maxCount = count
              dominantRgb = rgb
            }
          }
          
          // Lighten the dominant color for better contrast with logo
          const [r, g, b] = dominantRgb.split(',').map(Number)
          const lightenFactor = 0.85 // Lighten by 85%
          const lighterR = Math.min(255, Math.floor(r + (255 - r) * lightenFactor))
          const lighterG = Math.min(255, Math.floor(g + (255 - g) * lightenFactor))
          const lighterB = Math.min(255, Math.floor(b + (255 - b) * lightenFactor))
          
          const finalColor = `rgb(${lighterR},${lighterG},${lighterB})`
          
          // Cache the result
          colorCache.set(imagePath, finalColor)
          setDominantColor(finalColor)
        }
        
        // Use requestIdleCallback with fallback to setTimeout
        if (window.requestIdleCallback) {
          requestIdleCallback(processColor)
        } else {
          setTimeout(processColor, 0)
        }
      }
      img.onerror = () => {
        const fallbackColor = 'rgb(59,130,246)' // Default blue fallback
        colorCache.set(imagePath, fallbackColor)
        setDominantColor(fallbackColor)
      }
      img.src = imagePath
    }, 50) // 50ms debounce
    
    return () => clearTimeout(timeoutId)
  }, [imagePath])
  
  return dominantColor
}

// Generate random color for icon fallback
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

// Company Icon Component with local images and dynamic colors
const CompanyIcon = React.memo(({ article, size = 'md', className = '' }) => {
  const ticker = getIconText(article)
  const imagePath = getCompanyImage(ticker)
  const dominantColor = useDominantColor(imagePath)
  const fallbackColor = getRandomColor(article.title || article.url || 'default')
  
  // Size variants
  const sizeClasses = {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  }
  
  const iconSizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }
  
  const textSizes = {
    xs: 'text-[7px]',
    sm: 'text-[8px]',
    md: 'text-[10px]',
    lg: 'text-lg'
  }
  
  if (imagePath) {
    return (
      <div 
        className={cn(
          sizeClasses[size], 
          "rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden relative",
          className
        )}
        style={{ 
          backgroundColor: dominantColor || 'rgb(59,130,246)',
          border: 'none',
          outline: 'none'
        }}
      >
        <img
          src={imagePath}
          alt={`${ticker} logo`}
          className={cn(iconSizes[size], "object-contain drop-shadow-sm")}
          style={{
            filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2)) brightness(1.1)'
          }}
          onError={(e) => {
            // Hide image and show ticker if it fails to load
            e.target.style.display = 'none'
            // Show the ticker fallback
            const fallback = e.target.parentElement.querySelector('.ticker-fallback')
            if (fallback) fallback.style.opacity = '1'
          }}
        />
        {/* Show ticker as fallback if image doesn't load */}
        <div className={cn(
          "ticker-fallback absolute inset-0 flex items-center justify-center text-white font-medium opacity-0 transition-opacity",
          textSizes[size]
        )}>
          {ticker}
        </div>
      </div>
    )
  }
  
  // Fallback to colored ticker box for companies without images
  return (
    <div className={cn(
      sizeClasses[size],
      "rounded-md flex items-center justify-center flex-shrink-0 text-white font-medium opacity-90",
      textSizes[size],
      fallbackColor,
      className
    )}>
      {ticker}
    </div>
  )
})

export default CompanyIcon