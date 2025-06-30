import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, Loader2 } from 'lucide-react'
import { useAPI, useStorage } from '@/hooks/useExtensionAPI'

const GenerateButton = ({ onAnalysisComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [usageCount, setUsageCount] = useState(0)
  const [usageLimit] = useState(5) // Daily limit
  
  const { analyzeArticle, loading: apiLoading } = useAPI()
  const { getUsageCount, saveArticle } = useStorage()

  useEffect(() => {
    // Get current usage count
    const fetchUsageCount = async () => {
      try {
        const count = await getUsageCount()
        setUsageCount(count)
      } catch (error) {
        console.error('Failed to get usage count:', error)
      }
    }
    
    fetchUsageCount()
  }, [getUsageCount])

  const handleAnalyze = async () => {
    if (usageCount >= usageLimit) {
      alert('Daily limit reached. Please upgrade to continue.')
      return
    }

    setIsAnalyzing(true)
    
    try {
      // Call the vanilla JS analyze function
      const result = await analyzeArticle()
      
      if (result && result.companies) {
        // Save to storage
        await saveArticle(result)
        
        // Update usage count
        setUsageCount(prev => prev + 1)
        
        // Notify parent component
        if (onAnalysisComplete) {
          onAnalysisComplete(result)
        }
      }
    } catch (error) {
      console.error('Analysis failed:', error)
      alert('Analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const isDisabled = isAnalyzing || apiLoading || usageCount >= usageLimit

  return (
    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 mb-4 text-center border border-purple-100">
      <h2 className="text-sm font-semibold text-gray-900 mb-1 leading-tight">
        Analyse This Article
      </h2>
      <p className="text-xs text-gray-600 mb-3 font-normal leading-tight">
        Discover stocks mentioned or affected by this article
      </p>
      
      <Button
        onClick={handleAnalyze}
        disabled={isDisabled}
        className="w-full h-10 text-xs font-medium bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 border-0 flex items-center justify-center gap-1"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="animate-spin" size={14} />
            <span className="truncate">Analyzing...</span>
          </>
        ) : (
          <>
            <Zap size={14} />
            <span className="truncate hidden sm:inline">Generate Companies</span>
            <span className="sm:hidden truncate">Generate</span>
          </>
        )}
      </Button>
      
      <div className="flex items-center justify-between text-xs text-gray-600 mt-3">
        <span>Usage Today</span>
        <span className={`font-medium ${usageCount >= usageLimit ? 'text-red-600' : 'text-purple-600'}`}>
          {usageCount}/{usageLimit}
        </span>
      </div>
      
      {usageCount >= usageLimit && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-600 font-medium">
            Daily limit reached. Upgrade to continue analyzing articles.
          </p>
        </div>
      )}
    </div>
  )
}

export default GenerateButton