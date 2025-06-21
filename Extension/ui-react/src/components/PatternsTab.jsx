import React, { memo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { useStorage } from '@/hooks/useExtensionAPI'

const PatternsTab = memo(() => {
  // Start with sample data to avoid delay
  const [chartData, setChartData] = useState([
    { month: "Jan", tech: 186, finance: 305, healthcare: 237 },
    { month: "Feb", tech: 305, finance: 237, healthcare: 273 },
    { month: "Mar", tech: 237, finance: 73, healthcare: 187 },
    { month: "Apr", tech: 73, finance: 209, healthcare: 214 },
    { month: "May", tech: 209, finance: 214, healthcare: 165 },
    { month: "Jun", tech: 214, finance: 165, healthcare: 189 },
  ])
  const { getArticles } = useStorage()

  useEffect(() => {
    const generatePatternData = async () => {
      try {
        const articles = await getArticles()
        
        if (articles && articles.length > 0) {
          // Generate pattern data from real analyses
          const monthlyData = {}
          const now = new Date()
          
          // Initialize last 6 months
          for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const monthKey = date.toLocaleDateString('en', { month: 'short' })
            monthlyData[monthKey] = { month: monthKey, tech: 0, finance: 0, healthcare: 0 }
          }
          
          // Count stock mentions by sector
          articles.forEach(article => {
            const articleDate = new Date(article.timestamp)
            const monthKey = articleDate.toLocaleDateString('en', { month: 'short' })
            
            if (monthlyData[monthKey] && article.matches) {
              article.matches.forEach(match => {
                // Simple sector classification based on ticker
                const techTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META']
                const financeTickers = ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C']
                const healthcareTickers = ['JNJ', 'PFE', 'UNH', 'ABBV', 'TMO', 'DHR']
                
                if (techTickers.includes(match.ticker)) {
                  monthlyData[monthKey].tech++
                } else if (financeTickers.includes(match.ticker)) {
                  monthlyData[monthKey].finance++
                } else if (healthcareTickers.includes(match.ticker)) {
                  monthlyData[monthKey].healthcare++
                } else {
                  // Default to tech for unknown tickers
                  monthlyData[monthKey].tech++
                }
              })
            }
          })
          
          setChartData(Object.values(monthlyData))
        } else {
          // Keep existing sample data when no analyses exist
          console.log('PatternsTab: No analyses found, keeping sample data')
        }
      } catch (error) {
        console.error('Failed to generate pattern data:', error)
        // Keep existing sample data on error
        console.log('PatternsTab: Error occurred, keeping sample data')
      }
    }

    generatePatternData()
  }, [getArticles])

  const chartConfig = {
    tech: {
      label: "Technology",
      color: "hsl(var(--chart-1))",
    },
    finance: {
      label: "Finance",
      color: "hsl(var(--chart-2))",
    },
    healthcare: {
      label: "Healthcare",
      color: "hsl(var(--chart-3))",
    },
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Stock Sector Patterns</CardTitle>
        <p className="text-xs text-gray-500">
          Your article analysis patterns by sector over time
        </p>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <ChartContainer className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                left: 12,
                right: 12,
                top: 12,
                bottom: 12,
              }}
              stackOffset="expand"
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb" 
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                width={35}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                dataKey="tech"
                type="natural"
                fill="#8b5cf6"
                fillOpacity={0.6}
                stroke="#8b5cf6"
                strokeWidth={1}
                stackId="a"
              />
              <Area
                dataKey="finance"
                type="natural"
                fill="#06b6d4"
                fillOpacity={0.6}
                stroke="#06b6d4"
                strokeWidth={1}
                stackId="a"
              />
              <Area
                dataKey="healthcare"
                type="natural"
                fill="#10b981"
                fillOpacity={0.6}
                stroke="#10b981"
                strokeWidth={1}
                stackId="a"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs mt-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span className="text-gray-600">Technology</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
            <span className="text-gray-600">Finance</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-gray-600">Healthcare</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

PatternsTab.displayName = 'PatternsTab'

export default PatternsTab