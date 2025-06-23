import React, { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { User, ChevronRight, LogOut, Settings, Shield, CreditCard, ExternalLink } from 'lucide-react'

const AccountTab = memo(() => {
  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <Card className="bg-white">
        <CardContent className="p-5">
          <div className="flex flex-col items-center text-center">
            {/* Profile Avatar */}
            <div className="mb-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 border-2 border-purple-300 flex items-center justify-center">
                <User size={24} className="text-purple-600" strokeWidth={2} />
              </div>
            </div>
            
            {/* User Info */}
            <h2 className="text-sm font-semibold text-gray-900 mb-1">John Doe</h2>
            <p className="text-xs text-gray-500 mb-4">john.doe@gmail.com</p>
            
            {/* Sign Out Button */}
            <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors">
              <LogOut size={14} className="text-gray-600" />
              <span className="text-xs font-medium text-gray-700">Sign out</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Settings Sections */}
      <div className="space-y-2">
        {/* Profile Settings */}
        <Card className="bg-white hover:bg-gray-50 transition-colors cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <User size={16} className="text-purple-600" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-medium text-gray-900">Profile settings</h3>
                <p className="text-xs text-gray-500">Manage your name and bio</p>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card className="bg-white hover:bg-gray-50 transition-colors cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Settings size={16} className="text-purple-600" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-medium text-gray-900">App settings</h3>
                <p className="text-xs text-gray-500">Manage app preferences</p>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className="bg-white hover:bg-gray-50 transition-colors cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Shield size={16} className="text-purple-600" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-medium text-gray-900">Privacy settings</h3>
                <p className="text-xs text-gray-500">Manage privacy preferences</p>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Plan and Billing */}
        <Card className="bg-white hover:bg-gray-50 transition-colors cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <CreditCard size={16} className="text-purple-600" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-medium text-gray-900">Plan and billing</h3>
                <p className="text-xs text-gray-500">Manage subscription and payment</p>
              </div>
              <ExternalLink size={14} className="text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
})

AccountTab.displayName = 'AccountTab'

export default AccountTab