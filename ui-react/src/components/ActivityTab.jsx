import React, { useState, useEffect, memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Star, Trash2, Edit, PlusCircle, Activity as ActivityIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { semanticTypography, componentSpacing } from '@/styles/typography'
import { useStorage } from '@/contexts/ServiceContext'

const ActivityTab = memo(({ activeTab }) => {
  const storage = useStorage()

  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState(null) // For company filter
  const [companies, setCompanies] = useState([]) // List of companies for filter

  // Fetch activities on mount
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const activityLog = await storage.getActivityLog()
        setActivities(activityLog || [])

        // Extract unique companies from activities for filter
        const uniqueCompanies = new Set()
        activityLog.forEach(activity => {
          if (activity.metadata?.ticker) {
            uniqueCompanies.add(activity.metadata.ticker)
          }
          if (activity.relatedEntities) {
            activity.relatedEntities.forEach(entity => uniqueCompanies.add(entity))
          }
        })
        setCompanies(Array.from(uniqueCompanies).sort())

        setIsLoading(false)
      } catch (error) {
        console.error('Failed to fetch activities:', error)
        setActivities([])
        setIsLoading(false)
      }
    }

    if (activeTab === 'activity') {
      fetchActivities()
    }
  }, [storage, activeTab])

  // Format date/time - same as ArticlesTab
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    // Check if it's today
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      // Use relative time for today
      if (diffMins < 1) return 'Just now'
      if (diffMins === 1) return '1 min ago'
      if (diffMins < 60) return `${diffMins} mins ago`
      if (diffHours === 1) return '1 hour ago'
      return `${diffHours} hours ago`
    }

    // Use "Xd ago" for recent days
    if (diffDays === 1) return '1d ago'
    if (diffDays < 7) return `${diffDays}d ago`

    // Use formatted date for older items
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[date.getMonth()]
    const day = date.getDate()

    return `${day} ${month}`
  }

  // Group activities by date - same as ArticlesTab
  const groupActivitiesByDate = (activities) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)

    const groups = {
      today: [],
      yesterday: [],
      lastWeek: [],
      months: {}
    }

    activities.forEach(activity => {
      const activityDate = new Date(activity.timestamp)
      const activityDateOnly = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate())

      if (activityDateOnly.getTime() === today.getTime()) {
        groups.today.push(activity)
      } else if (activityDateOnly.getTime() === yesterday.getTime()) {
        groups.yesterday.push(activity)
      } else if (activityDateOnly > lastWeek) {
        groups.lastWeek.push(activity)
      } else {
        // Group by month
        const monthKey = activityDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        if (!groups.months[monthKey]) {
          groups.months[monthKey] = []
        }
        groups.months[monthKey].push(activity)
      }
    })

    return groups
  }

  // Get icon for activity type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'article_analyzed':
        return <FileText size={16} className="text-gray-700" />
      case 'watchlist_added':
        return <Star size={16} className="text-yellow-600" />
      case 'watchlist_removed':
        return <Star size={16} className="text-gray-400" />
      case 'note_created':
        return <PlusCircle size={16} className="text-green-600" />
      case 'note_updated':
        return <Edit size={16} className="text-blue-600" />
      case 'article_deleted':
      case 'bulk_delete':
        return <Trash2 size={16} className="text-red-600" />
      default:
        return <ActivityIcon size={16} className="text-gray-600" />
    }
  }

  // Filter activities by selected company
  const filteredActivities = selectedCompany
    ? activities.filter(activity =>
        activity.metadata?.ticker === selectedCompany ||
        activity.relatedEntities?.includes(selectedCompany)
      )
    : activities

  // Group filtered activities by date
  const groupedActivities = groupActivitiesByDate(filteredActivities)

  // Render activity item
  const renderActivityItem = (activity, isLast = false) => {
    return (
      <div
        className="relative transition-all duration-300 hover:bg-gray-50 border-transparent rounded-lg"
      >
        <div className="px-3.5 py-2.5 pl-6">
          {/* Icon - positioned on the left */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <div className="w-8 h-8 flex items-center justify-center">
              {getActivityIcon(activity.type)}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Description */}
            <p className={cn(semanticTypography.caption, "mb-1 font-medium text-gray-900")}>
              {activity.description}
            </p>

            {/* Metadata */}
            <div className={cn("flex items-center gap-2", semanticTypography.metadata)}>
              {activity.metadata?.ticker && (
                <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                  {activity.metadata.ticker}
                </span>
              )}
              {activity.metadata?.companyName && !activity.metadata?.ticker && (
                <span className="text-gray-600 text-xs">
                  {activity.metadata.companyName}
                </span>
              )}
              <span className="text-gray-500 text-xs">{formatDate(activity.timestamp)}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse bg-white border border-gray-200">
            <CardContent className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Empty state
  const EmptyState = () => (
    <Card className="border-dashed border-2 border-gray-200 bg-white">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-gray-100 p-3 mb-4">
          <ActivityIcon size={24} className="text-gray-400" />
        </div>
        <h3 className={semanticTypography.emptyStateTitle}>No activity yet</h3>
        <p className={cn(semanticTypography.emptyStateDescription, "max-w-xs")}>
          Start analyzing articles and tracking companies to see your activity here.
        </p>
      </CardContent>
    </Card>
  )

  // If no activities after filtering
  if (filteredActivities.length === 0) {
    if (selectedCompany) {
      return (
        <div>
          {/* Company filter chips */}
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCompany(null)}
              className="px-2.5 py-1 text-xs bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
            >
              All
            </button>
            {companies.map(company => (
              <button
                key={company}
                onClick={() => setSelectedCompany(company)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-full transition-colors",
                  selectedCompany === company
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {company}
              </button>
            ))}
          </div>

          <Card className="border-dashed border-2 border-gray-200 bg-white">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-gray-100 p-3 mb-4">
                <ActivityIcon size={24} className="text-gray-400" />
              </div>
              <h3 className={semanticTypography.emptyStateTitle}>No activity for {selectedCompany}</h3>
              <p className={cn(semanticTypography.emptyStateDescription, "max-w-xs")}>
                No recorded activity for this company yet.
              </p>
            </CardContent>
          </Card>
        </div>
      )
    }

    return <EmptyState />
  }

  return (
    <div className="h-full flex flex-col">
      {/* Company filter chips - only show if there are companies */}
      {companies.length > 0 && (
        <div className="mb-4 ml-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCompany(null)}
              className={cn(
                "px-2.5 py-1 text-xs rounded-full transition-colors",
                !selectedCompany
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              All
            </button>
            {companies.map(company => (
              <button
                key={company}
                onClick={() => setSelectedCompany(company)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-full transition-colors",
                  selectedCompany === company
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {company}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Activity timeline */}
      <div className={componentSpacing.cardGroupSpacing}>
        {/* Today */}
        {groupedActivities.today.length > 0 && (
          <div>
            <div className="mb-3 px-1">
              <h3 className="text-xs text-gray-600">Today</h3>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 ml-2">
              {groupedActivities.today.map((activity, index) => (
                <div key={activity.id}>
                  {renderActivityItem(activity, false)}
                  {index < groupedActivities.today.length - 1 && (
                    <div className="border-b border-gray-100 mx-6" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Yesterday */}
        {groupedActivities.yesterday.length > 0 && (
          <div>
            <div className="mb-3 px-1">
              <h3 className="text-xs text-gray-600">Yesterday</h3>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 ml-2">
              {groupedActivities.yesterday.map((activity, index) => (
                <div key={activity.id}>
                  {renderActivityItem(activity, false)}
                  {index < groupedActivities.yesterday.length - 1 && (
                    <div className="border-b border-gray-100 mx-6" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last Week */}
        {groupedActivities.lastWeek.length > 0 && (
          <div>
            <div className="mb-3 px-1">
              <h3 className="text-xs text-gray-600">Last Week</h3>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 ml-2">
              {groupedActivities.lastWeek.map((activity, index) => (
                <div key={activity.id}>
                  {renderActivityItem(activity, false)}
                  {index < groupedActivities.lastWeek.length - 1 && (
                    <div className="border-b border-gray-100 mx-6" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly groups */}
        {Object.entries(groupedActivities.months)
          .sort(([a], [b]) => new Date(b) - new Date(a))
          .map(([monthKey, monthActivities]) => (
            monthActivities.length > 0 && (
              <div key={monthKey}>
                <div className="mb-3 px-1">
                  <h3 className="text-xs text-gray-600">{monthKey}</h3>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 ml-2">
                  {monthActivities.map((activity, index) => (
                    <div key={activity.id}>
                      {renderActivityItem(activity, false)}
                      {index < monthActivities.length - 1 && (
                        <div className="border-b border-gray-100 mx-6" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
      </div>
    </div>
  )
})

ActivityTab.displayName = 'ActivityTab'

export default ActivityTab
