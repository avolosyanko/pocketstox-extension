import React, { memo, useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Check, Plus, Layers, PieChart } from 'lucide-react'
import { semanticTypography } from '@/styles/typography'
import { cn } from '@/lib/utils'

const AccountTab = memo(() => {
  const [remainingAnalyses, setRemainingAnalyses] = useState(5)
  const [usageStats, setUsageStats] = useState({ today: 0, total: 0 })
  
  // Load usage statistics and set up auth listener
  useEffect(() => {
    const loadUsageData = async () => {
      try {
        if (window.extensionServices && window.extensionServices.storage) {
          const stats = await window.extensionServices.storage.getUsageStats()
          setUsageStats(stats)
          const remaining = Math.max(0, 5 - (stats.today || 0))
          setRemainingAnalyses(remaining)
        }
      } catch (error) {
        console.error('Failed to load usage data:', error)
      }
    }
    
    loadUsageData()
    
    // Set up interval to refresh usage data periodically
    const interval = setInterval(loadUsageData, 5000) // Refresh every 5 seconds
    
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
        // Refresh component state
        loadUsageData()
      }
    }
    
    // Add message listener
    if (chrome && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(handleMessage)
    }
    
    return () => {
      clearInterval(interval)
      if (chrome && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.removeListener(handleMessage)
      }
    }
  }, [])
  return (
    <div>
      {/* Daily Usage */}
      <Card className="bg-transparent border border-gray-200 mb-3">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
              <Plus size={16} className="text-brand-800" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">Daily Usage</h3>
              <p className={`${semanticTypography.secondaryText}`}>{remainingAnalyses} analyses remaining today</p>
            </div>
          </div>
          {/* Progress bar under both icon and text */}
          <div className="w-full">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-brand-800 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(usageStats.today / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Card */}
      <Card className="bg-transparent border border-gray-200 mb-3">
        <CardContent className="p-5">
          {/* Google Sign In Button */}
          <button
            onClick={() => {
              chrome.tabs.create({ url: 'https://pocketstox.com/auth?source=extension' })
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-brand-800 rounded-md transition-all duration-200 select-none hover:opacity-90 relative overflow-hidden mb-4"
            style={{
              background: "linear-gradient(135deg, #2e1f5b 0%, #1e1b4b 100%)",
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none",
              WebkitTouchCallout: "none",
              WebkitTapHighlightColor: "transparent",
              outline: "none"
            }}>
              {/* Subtle white gradient overlay */}
              <div className="absolute top-0 right-0 w-24 h-24 opacity-10 pointer-events-none"
                style={{
                  background: "radial-gradient(circle at top right, white 0%, transparent 70%)"
                }}
              ></div>
              <svg className="w-4 h-4 relative z-10" viewBox="0 0 24 24">
                <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className={`${semanticTypography.primaryButton} select-none relative z-10`} style={{
                userSelect: "none",
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none",
                WebkitTouchCallout: "none",
                WebkitTapHighlightColor: "transparent",
                pointerEvents: "none"
              }}>Sign in with Google</span>
          </button>

          {/* Sign In Benefits */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Check size={14} className="text-brand-800" strokeWidth={2.5} />
              <span className={semanticTypography.secondaryText}>Priority access at high traffic times</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={14} className="text-brand-800" strokeWidth={2.5} />
              <span className={semanticTypography.secondaryText}>Sync data across all devices</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={14} className="text-brand-800" strokeWidth={2.5} />
              <span className={semanticTypography.secondaryText}>Access extended article history</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Header */}
      <div className="mt-4 mb-3 flex items-center px-1">
        <h2 className={cn(semanticTypography.cardTitle)}>Coming Soon</h2>
      </div>
      
      {/* Pattern Analytics */}
      <Card className="bg-transparent border border-gray-200 mb-3">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <Layers size={16} className="text-gray-500" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">Pattern Detection</h3>
              <p className={`${semanticTypography.secondaryText}`}>Analytics across your entire reading history</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Portfolio Tracking */}
      <Card className="bg-transparent border border-gray-200 mb-3">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <PieChart size={16} className="text-gray-500" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">Portfolio Tracking</h3>
              <p className={`${semanticTypography.secondaryText}`}>Connect your portfolio with Pocketstox</p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
})

AccountTab.displayName = 'AccountTab'

export default AccountTab