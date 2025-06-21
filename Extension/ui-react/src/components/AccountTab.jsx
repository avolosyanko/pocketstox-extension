import React, { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { User } from 'lucide-react'

const AccountTab = memo(() => {
  return (
    <Card className="border-dashed border-2 border-gray-300/25">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <div className="rounded-full bg-gray-100 p-2 mb-3">
          <User size={20} className="text-gray-500" strokeWidth={2} />
        </div>
        <h3 className="text-sm font-semibold mb-1">Account coming soon</h3>
        <p className="text-gray-500 text-xs">
          Manage your Pocketstox account and subscription here.
        </p>
      </CardContent>
    </Card>
  )
})

AccountTab.displayName = 'AccountTab'

export default AccountTab