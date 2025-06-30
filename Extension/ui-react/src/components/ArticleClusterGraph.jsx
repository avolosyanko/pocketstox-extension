import React, { useEffect, useRef, useMemo } from 'react'
import ForceGraph2D from 'react-force-graph-2d'

const ArticleClusterGraph = ({ article }) => {
  const graphRef = useRef()

  // Generate mock similarity data for stock suggestions
  const graphData = useMemo(() => {
    if (!article) return { nodes: [], links: [] }

    const nodes = []
    const links = []

    // Central article node
    const articleNode = {
      id: 'article-center',
      name: article.title,
      type: 'article',
      val: 12,
      fx: 0, // Fixed at center
      fy: 0
    }
    nodes.push(articleNode)

    // Mock related stocks with similarity scores
    const mockStocks = [
      { symbol: 'AAPL', similarity: 0.85 },
      { symbol: 'MSFT', similarity: 0.72 },
      { symbol: 'GOOGL', similarity: 0.68 },
      { symbol: 'NVDA', similarity: 0.61 },
      { symbol: 'TSLA', similarity: 0.45 },
      { symbol: 'META', similarity: 0.38 }
    ]

    // If article has companies, prioritize them
    if (article.companies && article.companies.length > 0) {
      article.companies.forEach((company, idx) => {
        const symbol = company.symbol || company.ticker || company
        const stockNode = {
          id: `stock-${symbol}`,
          name: symbol,
          type: 'stock',
          val: 8,
          similarity: 0.9 - (idx * 0.1), // Higher similarity for mentioned stocks
          isMentioned: true
        }
        nodes.push(stockNode)

        // Create link with strength based on similarity
        links.push({
          source: 'article-center',
          target: stockNode.id,
          distance: 30 + (1 - stockNode.similarity) * 40 // Closer = higher similarity
        })
      })
    }

    // Add mock suggested stocks (not mentioned in article)
    mockStocks.slice(0, 4).forEach(stock => {
      // Skip if already added from article companies
      if (!nodes.find(n => n.name === stock.symbol)) {
        const stockNode = {
          id: `stock-${stock.symbol}`,
          name: stock.symbol,
          type: 'stock',
          val: 6,
          similarity: stock.similarity,
          isMentioned: false
        }
        nodes.push(stockNode)

        links.push({
          source: 'article-center',
          target: stockNode.id,
          distance: 30 + (1 - stock.similarity) * 50
        })
      }
    })

    return { nodes, links }
  }, [article])

  // Custom node rendering
  const nodeCanvasObject = (node, ctx, globalScale) => {
    // Check if node has valid coordinates
    if (!node || typeof node.x !== 'number' || typeof node.y !== 'number' || 
        isNaN(node.x) || isNaN(node.y) || !isFinite(node.x) || !isFinite(node.y)) {
      return
    }
    
    const fontSize = 10 / globalScale
    
    if (node.type === 'article') {
      // Central article node
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.val)
      gradient.addColorStop(0, '#8b5cf6')
      gradient.addColorStop(1, '#7c3aed')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false)
      ctx.fill()
      
      // White border
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2 / globalScale
      ctx.stroke()
      
      // Article icon
      ctx.fillStyle = 'white'
      ctx.font = `${fontSize * 1.5}px Inter, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('📄', node.x, node.y)
      
    } else if (node.type === 'stock') {
      // Stock nodes
      const alpha = node.isMentioned ? 1 : 0.7
      const color = node.isMentioned ? '#a855f7' : '#c084fc'
      
      ctx.fillStyle = color
      ctx.globalAlpha = alpha
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false)
      ctx.fill()
      
      // Border
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5 / globalScale
      ctx.stroke()
      ctx.globalAlpha = 1
      
      // Stock symbol
      ctx.fillStyle = 'white'
      ctx.font = `bold ${fontSize}px Inter, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(node.name, node.x, node.y)
      
      // Similarity score below (only if zoomed in enough)
      if (globalScale > 0.8) {
        ctx.fillStyle = '#6b7280'
        ctx.font = `${fontSize * 0.7}px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        const score = node.similarity ? (node.similarity * 100).toFixed(0) + '%' : ''
        ctx.fillText(score, node.x, node.y + node.val + 2)
      }
    }
  }

  return (
    <div className="relative w-full h-48 bg-gray-50 rounded-lg border overflow-hidden">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeCanvasObject={nodeCanvasObject}
        width={300}
        height={192}
        nodeRelSize={1}
        backgroundColor="#f9fafb"
        linkColor={() => '#e5e7eb'}
        linkWidth={1}
        enableZoomPanInteraction={false}
        enableNodeDrag={false}
        enableNavigationControls={false}
        showNavInfo={false}
        cooldownTicks={50}
        d3AlphaDecay={0.05}
        d3VelocityDecay={0.4}
        linkDirectionalParticles={0}
        nodeLabel={() => ''} // Disable tooltips
        onNodeHover={() => {}} // Disable hover effects
        onNodeClick={() => {}} // Disable clicking
      />
      
      {/* Legend */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-600">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-600"></div>
            <span>Mentioned</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-400"></div>
            <span>Suggested</span>
          </div>
        </div>
      </div>
      
      {/* Title */}
      <div className="absolute top-2 left-2 text-xs font-medium text-gray-700">
        Stock Relationships
      </div>
    </div>
  )
}

export default ArticleClusterGraph