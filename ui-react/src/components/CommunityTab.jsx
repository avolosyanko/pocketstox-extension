import React, { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Briefcase } from 'lucide-react'
import { semanticTypography } from '@/styles/typography'

const CommunityTab = memo(() => {
  return (
    <Card className="border-dashed border-2 border-gray-300/25">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <div className="rounded-full bg-gray-100 p-2 mb-3">
          <Briefcase size={20} className="text-gray-500" />
        </div>
        <h3 className={`${semanticTypography.emptyStateTitle} mb-1`}>Portfolio coming soon</h3>
        <p className={semanticTypography.emptyStateDescription}>
          Track your investments and portfolio performance here.
        </p>
      </CardContent>
    </Card>
  )
})

CommunityTab.displayName = 'CommunityTab'

export default CommunityTab