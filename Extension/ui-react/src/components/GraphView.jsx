import React, { useState, useEffect, useRef, useMemo } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, FileText, Building2, X, Filter } from 'lucide-react'

const GraphView = ({ articles = [] }) => {
  const graphRef = useRef()
  const [selectedNode, setSelectedNode] = useState(null)
  const [dimensions, setDimensions] = useState({ width: 300, height: 500 })
  const [viewMode, setViewMode] = useState('all') // 'all', 'positive', 'negative', 'top-stocks'

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById('graph-container')
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: window.innerHeight - 200
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Transform articles data into graph nodes and links
  const graphData = useMemo(() => {
    const nodes = []
    const links = []
    const stockNodes = new Map()

    // Filter articles based on view mode
    let filteredArticles = articles
    if (viewMode === 'positive') {
      filteredArticles = articles.filter(a => a.sentiment === 'positive')
    } else if (viewMode === 'negative') {
      filteredArticles = articles.filter(a => a.sentiment === 'negative')
    }

    // Create stock nodes first to calculate importance
    filteredArticles.forEach(article => {
      if (article.companies && article.companies.length > 0) {
        article.companies.forEach(company => {
          const stockSymbol = company.symbol || company.ticker || company
          const stockId = `stock-${stockSymbol}`
          
          if (!stockNodes.has(stockId)) {
            stockNodes.set(stockId, {
              id: stockId,
              name: stockSymbol,
              type: 'stock',
              val: 10,
              articleCount: 1,
              sentiments: [article.sentiment || 'neutral']
            })
          } else {
            const node = stockNodes.get(stockId)
            node.articleCount += 1
            node.sentiments.push(article.sentiment || 'neutral')
            node.val = Math.min(10 + node.articleCount * 3, 30)
          }
        })
      }
    })

    // For top-stocks mode, only show top 5 stocks
    let stocksToShow = Array.from(stockNodes.values())
    if (viewMode === 'top-stocks') {
      stocksToShow = stocksToShow
        .sort((a, b) => b.articleCount - a.articleCount)
        .slice(0, 5)
      
      // Filter articles to only those mentioning top stocks
      const topStockSymbols = new Set(stocksToShow.map(s => s.name))
      filteredArticles = articles.filter(article => 
        article.companies?.some(company => {
          const symbol = company.symbol || company.ticker || company
          return topStockSymbols.has(symbol)
        })
      )
    }

    // Add stock nodes to graph
    stocksToShow.forEach(node => nodes.push(node))

    // Create article nodes and links
    filteredArticles.forEach((article, idx) => {
      const articleNode = {
        id: `article-${article.id || idx}`,
        name: article.title,
        type: 'article',
        val: 6,
        article: article,
        sentiment: article.sentiment || 'neutral'
      }
      nodes.push(articleNode)

      // Create links to stocks
      if (article.companies && article.companies.length > 0) {
        article.companies.forEach(company => {
          const stockSymbol = company.symbol || company.ticker || company
          const stockId = `stock-${stockSymbol}`
          
          // Only create link if stock is in our filtered list
          if (stocksToShow.some(s => s.id === stockId)) {
            links.push({
              source: articleNode.id,
              target: stockId,
              value: 0.5
            })
          }
        })
      }
    })

    return { nodes, links }
  }, [articles, viewMode])

  // Custom node rendering
  const nodeCanvasObject = (node, ctx, globalScale) => {
    const label = node.name
    const fontSize = 12 / globalScale
    
    if (node.type === 'article') {
      // Article nodes - smaller and cleaner
      const color = node.sentiment === 'positive' ? '#10b981' : 
                   node.sentiment === 'negative' ? '#ef4444' : '#9ca3af'
      
      // Draw circle
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false)
      ctx.fill()
      
      // Draw border
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2 / globalScale
      ctx.stroke()
      
    } else if (node.type === 'stock') {
      // Stock nodes - more prominent
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.val)
      gradient.addColorStop(0, '#a855f7')
      gradient.addColorStop(1, '#7c3aed')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false)
      ctx.fill()
      
      // White border
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2 / globalScale
      ctx.stroke()
      
      // Stock symbol text
      ctx.fillStyle = 'white'
      ctx.font = `bold ${fontSize * 1.2}px Inter, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, node.x, node.y)
    }
  }

  const handleNodeClick = (node) => {
    if (node.type === 'article' || node.type === 'stock') {
      setSelectedNode(node)
    }
  }

  // Calculate dominant sentiment for stocks
  const getDominantSentiment = (sentiments) => {
    const counts = sentiments.reduce((acc, s) => {
      acc[s] = (acc[s] || 0) + 1
      return acc
    }, {})
    
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
  }

  return (
    <div className="relative h-full bg-gray-50 rounded-lg">
      {/* Filter Controls */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="text-xs bg-transparent border-0 focus:ring-0 pr-6"
              >
                <option value="all">All Articles</option>
                <option value="positive">Positive Only</option>
                <option value="negative">Negative Only</option>
                <option value="top-stocks">Top 5 Stocks</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div id="graph-container" className="absolute inset-0">
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeCanvasObject={nodeCanvasObject}
          width={dimensions.width}
          height={dimensions.height}
          nodeRelSize={1}
          onNodeClick={handleNodeClick}
          linkColor={() => '#e5e7eb'}
          linkWidth={1}
          backgroundColor="#f9fafb"
          linkDirectionalParticles={0} // Remove particles for cleaner look
          enableZoomPanInteraction={true}
          minZoom={0.5}
          maxZoom={3}
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          warmupTicks={50}
          onNodeHover={node => document.body.style.cursor = node ? 'pointer' : 'default'}
          nodeLabel={() => ''} // Disable default labels
        />
      </div>

      {/* Info Panel */}
      {selectedNode && (
        <div className="absolute top-4 right-4 w-72 z-10">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  {selectedNode.type === 'article' ? (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedNode.sentiment === 'positive' ? 'bg-green-100' :
                      selectedNode.sentiment === 'negative' ? 'bg-red-100' :
                      'bg-gray-100'
                    }`}>
                      <FileText className="w-4 h-4 text-gray-600" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                    </div>
                  )}
                  <h3 className="font-semibold text-sm">
                    {selectedNode.type === 'article' ? 'Article' : 'Stock'}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {selectedNode.type === 'article' ? (
                <>
                  <p className="text-xs font-medium text-gray-900 mb-3 line-clamp-3">
                    {selectedNode.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Sentiment:</span>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      selectedNode.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                      selectedNode.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedNode.sentiment}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-purple-600 mb-2">
                    {selectedNode.name}
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mentions:</span>
                      <span className="font-medium">{selectedNode.articleCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sentiment:</span>
                      <span className={`font-medium ${
                        getDominantSentiment(selectedNode.sentiments) === 'positive' ? 'text-green-600' :
                        getDominantSentiment(selectedNode.sentiments) === 'negative' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {getDominantSentiment(selectedNode.sentiments)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Summary */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-gray-600">{graphData.nodes.filter(n => n.type === 'stock').length} Stocks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-gray-600">{graphData.nodes.filter(n => n.type === 'article').length} Articles</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default GraphView