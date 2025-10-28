import React, { memo, useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Check, Plus, TrendingUp, AlertCircle, X } from 'lucide-react'
import { semanticTypography } from '@/styles/typography'
import { cn } from '@/lib/utils'

const AccountTab = memo(() => {
  const [trackedCompanies, setTrackedCompanies] = useState([])
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false)
  const [newCompany, setNewCompany] = useState({ ticker: '', company: '', reason: '' })

  // Load tracked companies from storage
  useEffect(() => {
    const loadData = async () => {
      if (window.extensionServices && window.extensionServices.storage) {
        // Load tracked companies (placeholder for now)
        const savedCompanies = []
        setTrackedCompanies(savedCompanies)
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
      {/* Profile Card */}
      <Card className="bg-transparent border border-gray-200 mb-3">
        <CardContent className="p-5">
          {/* Google Sign In Button */}
          <button
            onClick={() => {
              chrome.tabs.create({ url: 'https://pocketstox.com/auth?source=extension' })
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-900 rounded-md transition-all duration-200 select-none hover:opacity-90 relative overflow-hidden mb-4"
            style={{
              background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
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
              <Check size={14} className="text-gray-900" strokeWidth={2.5} />
              <span className={semanticTypography.secondaryText}>Track companies & document thesis</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={14} className="text-gray-900" strokeWidth={2.5} />
              <span className={semanticTypography.secondaryText}>Sync data across devices</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={14} className="text-gray-900" strokeWidth={2.5} />
              <span className={semanticTypography.secondaryText}>Priority access to features</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tracked Companies Section */}
      <div className="mt-4 mb-3 flex items-center justify-between px-1">
        <h2 className={cn(semanticTypography.cardTitle)}>Tracked Companies</h2>
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
            <h3 className={`${semanticTypography.emptyStateTitle} mb-1`}>No tracked companies yet</h3>
            <p className={semanticTypography.emptyStateDescription}>
              Save companies from articles to track and monitor
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 mb-3">
          {trackedCompanies.map((company, index) => (
            <Card key={index} className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">{company.ticker}</h3>
                      {company.hasAlert && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs">
                          <AlertCircle size={10} />
                          Alert
                        </div>
                      )}
                    </div>
                    <p className={`${semanticTypography.secondaryText} mb-2`}>{company.company}</p>
                  </div>
                  <button
                    onClick={() => setTrackedCompanies(prev => prev.filter((_, i) => i !== index))}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-600 italic">"{company.reason}"</p>
                </div>
                {company.alert && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-orange-700">{company.alert}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Company Modal */}
      {showAddCompanyModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-25 z-40" onClick={() => setShowAddCompanyModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">Track Company</h3>
                  <button onClick={() => setShowAddCompanyModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>
                <div className="space-y-3">
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
                  <button
                    onClick={() => {
                      if (newCompany.ticker && newCompany.company && newCompany.reason) {
                        setTrackedCompanies([...trackedCompanies, { ...newCompany, hasAlert: false }])
                        setNewCompany({ ticker: '', company: '', reason: '' })
                        setShowAddCompanyModal(false)
                      }
                    }}
                    className="w-full py-2.5 px-4 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
                  >
                    Add Company
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

    </div>
  )
})

AccountTab.displayName = 'AccountTab'

export default AccountTab