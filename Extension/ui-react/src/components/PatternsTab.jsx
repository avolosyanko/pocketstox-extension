import React, { memo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  
  const [topStocksData, setTopStocksData] = useState([
    { symbol: 'AAPL', name: 'Apple', mentions: 15, sector: 'Technology' },
    { symbol: 'TSLA', name: 'Tesla', mentions: 12, sector: 'Technology' },
    { symbol: 'NVDA', name: 'NVIDIA', mentions: 10, sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft', mentions: 8, sector: 'Technology' },
    { symbol: 'JPM', name: 'JP Morgan', mentions: 6, sector: 'Finance' },
  ])
  
  const [allStocksData, setAllStocksData] = useState([])
  const [filterType, setFilterType] = useState('all')
  
  const { getArticles } = useStorage()

  useEffect(() => {
    const generatePatternData = async () => {
      try {
        const articles = await getArticles()
        
        if (articles && articles.length > 0) {
          // Generate pattern data from real analyses
          const monthlyData = {}
          const stockCounts = {}
          const now = new Date()
          
          // Initialize last 6 months
          for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const monthKey = date.toLocaleDateString('en', { month: 'short' })
            monthlyData[monthKey] = { month: monthKey, tech: 0, finance: 0, healthcare: 0 }
          }
          
          // Count stock mentions by sector and individual stock
          articles.forEach(article => {
            const articleDate = new Date(article.timestamp)
            const monthKey = articleDate.toLocaleDateString('en', { month: 'short' })
            
            if (article.companies && article.companies.length > 0) {
              article.companies.forEach(company => {
                const ticker = company.ticker || company.symbol || company
                const name = company.company || company.name || ticker
                
                // Count individual stock mentions
                if (!stockCounts[ticker]) {
                  // Determine sector
                  const techTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META']
                  const financeTickers = ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C']
                  const healthcareTickers = ['JNJ', 'PFE', 'UNH', 'ABBV', 'TMO', 'DHR']
                  
                  let sector = 'Other'
                  if (techTickers.includes(ticker)) sector = 'Technology'
                  else if (financeTickers.includes(ticker)) sector = 'Finance'
                  else if (healthcareTickers.includes(ticker)) sector = 'Healthcare'
                  
                  stockCounts[ticker] = { symbol: ticker, name: name, mentions: 0, sector: sector }
                }
                stockCounts[ticker].mentions++
                
                // Count by sector
                if (monthlyData[monthKey]) {
                  const techTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META']
                  const financeTickers = ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C']
                  const healthcareTickers = ['JNJ', 'PFE', 'UNH', 'ABBV', 'TMO', 'DHR']
                  
                  if (techTickers.includes(ticker)) {
                    monthlyData[monthKey].tech++
                  } else if (financeTickers.includes(ticker)) {
                    monthlyData[monthKey].finance++
                  } else if (healthcareTickers.includes(ticker)) {
                    monthlyData[monthKey].healthcare++
                  } else {
                    // Default to tech for unknown tickers
                    monthlyData[monthKey].tech++
                  }
                }
              })
            }
          })
          
          setChartData(Object.values(monthlyData))
          
          // Store all stocks data
          const allStocks = Object.values(stockCounts)
            .sort((a, b) => b.mentions - a.mentions)
          
          setAllStocksData(allStocks)
          
          // Get top 5 most mentioned stocks (no need to reverse for vertical layout)
          const topStocks = allStocks.slice(0, 5)
          
          if (topStocks.length > 0) {
            setTopStocksData(topStocks)
          }
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
  
  // Filter stocks based on selected filter
  useEffect(() => {
    if (allStocksData.length === 0) return
    
    let filteredStocks = allStocksData
    
    if (filterType !== 'all') {
      filteredStocks = allStocksData.filter(stock => 
        stock.sector.toLowerCase() === filterType.toLowerCase()
      )
    }
    
    // Get top 5 from filtered results (no need to reverse for vertical layout)
    setTopStocksData(filteredStocks.slice(0, 5))
  }, [filterType, allStocksData])

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
    <div className="space-y-4">
      {/* Sector Patterns Chart */}
      <Card className="bg-gray-50 border border-gray-200">
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
    
    {/* Top Mentioned Stocks Chart */}
    <Card className="bg-gray-50 border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Discover Patterns</CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Top stocks from your analyzed articles
            </p>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sectors</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topStocksData}
              layout="vertical"
              margin={{
                left: 40,
                right: 20,
                top: 5,
                bottom: 5,
              }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="symbol"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fontSize: 12, fill: '#374151' }}
                width={50}
              />
              <Bar 
                dataKey="mentions" 
                fill="hsl(262.1 83.3% 57.8%)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
    </div>
  )
})

PatternsTab.displayName = 'PatternsTab'

export default PatternsTab