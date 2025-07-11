import React, { memo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Zap, TrendingUp, PieChart, UserRound } from 'lucide-react'

const TabDropdown = memo(({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'articles',
      label: 'Discover',
      icon: Zap
    },
    {
      id: 'patterns',
      label: 'Signals',
      icon: TrendingUp
    },
    {
      id: 'community',
      label: 'Portfolio',
      icon: PieChart
    },
    {
      id: 'account',
      label: 'Account',
      icon: UserRound
    }
  ]

  const activeTabData = tabs.find(tab => tab.id === activeTab)
  const ActiveIcon = activeTabData?.icon || Zap

  return (
    <Select value={activeTab} onValueChange={onTabChange}>
      <SelectTrigger className="w-full h-9 text-sm border-gray-200 focus:ring-0 focus:ring-offset-0 focus:border-gray-200">
        <div className="flex items-center gap-2">
          <ActiveIcon size={14} className="text-gray-600" strokeWidth={2} />
          <span>{activeTabData?.label}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {tabs.map((tab) => {
          const IconComponent = tab.icon
          return (
            <SelectItem key={tab.id} value={tab.id}>
              <div className="flex items-center gap-2">
                <IconComponent size={14} className="text-gray-600" strokeWidth={2} />
                <span>{tab.label}</span>
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
})

TabDropdown.displayName = 'TabDropdown'

export default TabDropdown