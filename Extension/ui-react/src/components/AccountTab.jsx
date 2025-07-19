import React, { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { User, Check, BarChart3 } from 'lucide-react'
import { semanticTypography } from '@/styles/typography'

const AccountTab = memo(() => {
  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <Card className="bg-transparent border border-gray-200">
        <CardContent className="p-5">
          {/* Profile Section */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <User size={16} className="text-purple-600" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-medium text-gray-900">Anonymous User</h2>
              <p className={semanticTypography.metadata}>Not signed in</p>
            </div>
          </div>
          
          {/* Separator */}
          <div className="w-full h-px bg-gray-200 mb-4"></div>
          
          {/* Google Sign In Button */}
          <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-purple-600 rounded-md transition-all duration-200 mb-4 select-none" style={{
            background: "linear-gradient(135deg, rgb(147, 51, 234) 0%, rgb(124, 58, 237) 100%)",
            userSelect: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
            WebkitTouchCallout: "none",
            WebkitTapHighlightColor: "transparent",
            outline: "none"
          }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className={`${semanticTypography.primaryButton} select-none`} style={{
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
              <Check size={14} className="text-purple-600" strokeWidth={2.5} />
              <span className={semanticTypography.secondaryText}>Priority access at high traffic times</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={14} className="text-purple-600" strokeWidth={2.5} />
              <span className={semanticTypography.secondaryText}>Sync data across all devices</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={14} className="text-purple-600" strokeWidth={2.5} />
              <span className={semanticTypography.secondaryText}>Access extended article history</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Usage */}
      <Card className="bg-transparent border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <BarChart3 size={16} className="text-purple-600" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">Daily Usage</h3>
              <p className={`${semanticTypography.secondaryText}`}>5 analyses remaining today</p>
            </div>
          </div>
          {/* Progress bar under both icon and text */}
          <div className="w-full">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-purple-600 h-1.5 rounded-full w-0"></div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
})

AccountTab.displayName = 'AccountTab'

export default AccountTab