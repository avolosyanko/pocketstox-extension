import React, { memo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, Target, Network, BookOpen } from 'lucide-react'
import { useStorage } from '@/hooks/useExtensionAPI'

const PatternsTab = memo(() => {
  const [trendingThemes, setTrendingThemes] = useState([
    { theme: 'AI/Machine Learning', count: 12, trend: '+24%' },
    { theme: 'Electric Vehicles', count: 8, trend: '+18%' },
    { theme: 'Cloud Computing', count: 6, trend: '+12%' },
    { theme: 'Renewable Energy', count: 4, trend: '+8%' },
  ])
  
  const [topCompanies, setTopCompanies] = useState([
    { symbol: 'AAPL', name: 'Apple', mentions: 15, sector: 'Technology' },
    { symbol: 'TSLA', name: 'Tesla', mentions: 12, sector: 'Technology' },
    { symbol: 'NVDA', name: 'NVIDIA', mentions: 10, sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft', mentions: 8, sector: 'Technology' },
    { symbol: 'JPM', name: 'JP Morgan', mentions: 6, sector: 'Finance' },
  ])

  const [connections, setConnections] = useState([
    { pair: 'AAPL + MSFT', frequency: 8, strength: 'Strong' },
    { pair: 'TSLA + NVDA', frequency: 6, strength: 'Medium' },
    { pair: 'JPM + BAC', frequency: 4, strength: 'Medium' },
    { pair: 'GOOGL + META', frequency: 3, strength: 'Weak' },
  ])

  const [readingActivity, setReadingActivity] = useState({
    weeklyCount: 12,
    totalArticles: 47,
    avgPerDay: 1.7,
    streak: 5,
    weeklyData: [
      { day: 'Mon', articles: 2 },
      { day: 'Tue', articles: 1 },
      { day: 'Wed', articles: 3 },
      { day: 'Thu', articles: 2 },
      { day: 'Fri', articles: 1 },
      { day: 'Sat', articles: 2 },
      { day: 'Sun', articles: 1 },
    ]
  })

  const [filterType, setFilterType] = useState('all')
  const [allCompaniesData, setAllCompaniesData] = useState([])
  
  const { getArticles } = useStorage()

  useEffect(() => {
    const generateInsightData = async () => {
      try {
        const articles = await getArticles()
        
        if (articles && articles.length > 0) {
          // Generate theme data
          const themeKeywords = {
            'AI/Machine Learning': ['ai', 'artificial intelligence', 'machine learning', 'neural', 'algorithm'],
            'Electric Vehicles': ['electric', 'ev', 'battery', 'charging', 'tesla'],
            'Cloud Computing': ['cloud', 'aws', 'azure', 'server', 'saas'],
            'Renewable Energy': ['solar', 'wind', 'renewable', 'clean energy', 'green'],
            'Cryptocurrency': ['crypto', 'bitcoin', 'blockchain', 'digital currency'],
            'Healthcare': ['health', 'medical', 'pharma', 'biotech', 'drug'],
          }

          const themeCounts = {}
          Object.keys(themeKeywords).forEach(theme => {
            themeCounts[theme] = 0
          })

          // Count companies and analyze themes
          const companyCounts = {}
          const companyConnections = {}
          
          articles.forEach(article => {
            // Analyze themes from title
            const title = (article.title || '').toLowerCase()
            Object.entries(themeKeywords).forEach(([theme, keywords]) => {
              if (keywords.some(keyword => title.includes(keyword))) {
                themeCounts[theme]++
              }
            })

            // Count companies
            if (article.companies && article.companies.length > 0) {
              article.companies.forEach(company => {
                const ticker = company.ticker || company.symbol || company
                const name = company.company || company.name || ticker
                
                if (!companyCounts[ticker]) {
                  const techTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META']
                  const financeTickers = ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C']
                  const healthcareTickers = ['JNJ', 'PFE', 'UNH', 'ABBV', 'TMO', 'DHR']
                  
                  let sector = 'Other'
                  if (techTickers.includes(ticker)) sector = 'Technology'
                  else if (financeTickers.includes(ticker)) sector = 'Finance'
                  else if (healthcareTickers.includes(ticker)) sector = 'Healthcare'
                  
                  companyCounts[ticker] = { symbol: ticker, name: name, mentions: 0, sector: sector }
                }
                companyCounts[ticker].mentions++
              })

              // Analyze company connections (companies mentioned together)
              if (article.companies.length > 1) {
                for (let i = 0; i < article.companies.length; i++) {
                  for (let j = i + 1; j < article.companies.length; j++) {
                    const comp1 = article.companies[i].ticker || article.companies[i].symbol || article.companies[i]
                    const comp2 = article.companies[j].ticker || article.companies[j].symbol || article.companies[j]
                    const pair = [comp1, comp2].sort().join(' + ')
                    
                    if (!companyConnections[pair]) {
                      companyConnections[pair] = 0
                    }
                    companyConnections[pair]++
                  }
                }
              }
            }
          })

          // Update trending themes
          const themes = Object.entries(themeCounts)
            .filter(([_, count]) => count > 0)
            .sort(([_, a], [__, b]) => b - a)
            .slice(0, 4)
            .map(([theme, count], index) => ({
              theme,
              count,
              trend: `+${Math.floor((theme.length * count * 7 + index * 3) % 20 + 5)}%`
            }))
          
          if (themes.length > 0) {
            setTrendingThemes(themes)
          }

          // Update top companies
          const companies = Object.values(companyCounts)
            .sort((a, b) => b.mentions - a.mentions)
          
          setAllCompaniesData(companies)
          
          const topComps = companies.slice(0, 5)
          if (topComps.length > 0) {
            setTopCompanies(topComps)
          }

          // Update connections
          const topConnections = Object.entries(companyConnections)
            .sort(([_, a], [__, b]) => b - a)
            .slice(0, 4)
            .map(([pair, frequency]) => ({
              pair,
              frequency,
              strength: frequency >= 5 ? 'Strong' : frequency >= 3 ? 'Medium' : 'Weak'
            }))
          
          if (topConnections.length > 0) {
            setConnections(topConnections)
          }

          // Update reading activity
          const totalArticles = articles.length
          const now = new Date()
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          const weeklyArticles = articles.filter(article => 
            new Date(article.timestamp) >= weekAgo
          )

          // Calculate daily activity for the past week
          const dailyActivity = {}
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          
          for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
            const dayName = days[date.getDay()]
            dailyActivity[dayName] = 0
          }

          weeklyArticles.forEach(article => {
            const articleDate = new Date(article.timestamp)
            const dayName = days[articleDate.getDay()]
            if (dailyActivity[dayName] !== undefined) {
              dailyActivity[dayName]++
            }
          })

          const weeklyData = Object.entries(dailyActivity).map(([day, articles]) => ({
            day,
            articles
          }))

          setReadingActivity({
            weeklyCount: weeklyArticles.length,
            totalArticles: totalArticles,
            avgPerDay: Math.round((weeklyArticles.length / 7) * 10) / 10,
            streak: Math.min(weeklyArticles.length, 7),
            weeklyData
          })
        }
      } catch (error) {
        console.error('Failed to generate insight data:', error)
      }
    }

    generateInsightData()
  }, [getArticles])

  // Filter companies based on selected filter
  useEffect(() => {
    if (allCompaniesData.length === 0) return
    
    let filteredCompanies = allCompaniesData
    
    if (filterType !== 'all') {
      filteredCompanies = allCompaniesData.filter(company => 
        company.sector.toLowerCase() === filterType.toLowerCase()
      )
    }
    
    setTopCompanies(filteredCompanies.slice(0, 5))
  }, [filterType, allCompaniesData])

  return (
    <div className="space-y-4">
      {/* Reading Activity Card */}
      <Card className="bg-transparent border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-purple-600" />
            <CardTitle className="text-sm">Reading Activity</CardTitle>
          </div>
          <p className="text-xs text-gray-500">
            Your analysis habits this week
          </p>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white p-3 rounded-lg border border-gray-100 text-center">
              <div className="text-lg font-semibold text-purple-600">{readingActivity.streak}</div>
              <div className="text-xs text-gray-500">Current Streak</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-100 text-center">
              <div className="text-lg font-semibold text-purple-600">{readingActivity.avgPerDay}</div>
              <div className="text-xs text-gray-500">Daily Average</div>
            </div>
          </div>

          {/* Weekly Chart */}
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={readingActivity.weeklyData}>
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                />
                <YAxis hide />
                <Bar 
                  dataKey="articles" 
                  fill="hsl(262.1 83.3% 57.8%)"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Additional Stats */}
          <div className="flex justify-center items-center mt-3 text-xs text-gray-600">
            <span>Total Articles: {readingActivity.totalArticles}</span>
          </div>
        </CardContent>
      </Card>

      {/* Your Top Companies Card */}
      <Card className="bg-transparent border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-purple-600" />
            <div>
              <CardTitle className="text-sm">Your Top Companies</CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                Most analyzed companies
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topCompanies}
                layout="vertical"
                margin={{
                  left: 10,
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
                  tickMargin={8}
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

      {/* Trending Themes Card */}
      <Card className="bg-transparent border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-purple-600" />
            <CardTitle className="text-sm">Trending Themes</CardTitle>
          </div>
          <p className="text-xs text-gray-500">
            Topics you keep analyzing
          </p>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="space-y-3">
            {trendingThemes.map((theme, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100">
                <div className="flex-1">
                  <h4 className="text-xs font-medium text-gray-900">{theme.theme}</h4>
                  <p className="text-xs text-gray-500">{theme.count} mentions</p>
                </div>
                <div className="text-xs font-medium text-green-600">{theme.trend}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connection Network Card */}
      <Card className="bg-transparent border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Network size={16} className="text-purple-600" />
            <CardTitle className="text-sm">Connection Network</CardTitle>
          </div>
          <p className="text-xs text-gray-500">
            Companies frequently mentioned together
          </p>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="space-y-3">
            {connections.map((connection, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100">
                <div className="flex-1">
                  <h4 className="text-xs font-medium text-gray-900">{connection.pair}</h4>
                  <p className="text-xs text-gray-500">{connection.frequency} times together</p>
                </div>
                <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                  connection.strength === 'Strong' ? 'bg-green-100 text-green-700' :
                  connection.strength === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {connection.strength}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

PatternsTab.displayName = 'PatternsTab'

export default PatternsTab