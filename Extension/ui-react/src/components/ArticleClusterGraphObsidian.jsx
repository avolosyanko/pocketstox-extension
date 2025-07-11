import React, { useEffect, useRef, useMemo, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'

const ArticleClusterGraphObsidian = ({ article }) => {
  const graphRef = useRef()
  const [hoveredNode, setHoveredNode] = useState(null)
  const [hoverScale, setHoverScale] = useState(1)
  const [linkOpacities, setLinkOpacities] = useState(new Map())

  // Generate graph data similar to Obsidian's style
  const graphData = useMemo(() => {
    if (!article) return { nodes: [], links: [] }

    const nodes = []
    const links = []

    // Central article node (larger, purple)
    const articleNode = {
      id: 'article-center',
      name: 'Article', // Represents the article
      type: 'article',
      val: 20,
    }
    nodes.push(articleNode)

    // Create stock nodes based on article companies and mock suggestions
    const stockData = []
    
    // Add mentioned companies with higher similarity
    if (article.companies && article.companies.length > 0) {
      article.companies.forEach((company, idx) => {
        const symbol = company.symbol || company.ticker || company
        stockData.push({
          symbol,
          similarity: 0.9 - (idx * 0.05),
          isMentioned: true
        })
      })
    }

    // Add some mock suggested stocks
    const mockSuggestions = [
      { symbol: 'AAPL', similarity: 0.75 },
      { symbol: 'MSFT', similarity: 0.68 },
      { symbol: 'GOOGL', similarity: 0.62 },
      { symbol: 'NVDA', similarity: 0.55 },
    ]

    // Add suggestions that aren't already mentioned
    mockSuggestions.forEach(stock => {
      if (!stockData.find(s => s.symbol === stock.symbol)) {
        stockData.push({
          symbol: stock.symbol,
          similarity: stock.similarity,
          isMentioned: false
        })
      }
    })

    // Create nodes and links for stocks
    stockData.slice(0, 8).forEach((stock) => {
      const stockNode = {
        id: `stock-${stock.symbol}`,
        name: stock.symbol,
        type: 'stock',
        val: stock.isMentioned ? 12 : 8,
        similarity: stock.similarity,
        isMentioned: stock.isMentioned
      }
      nodes.push(stockNode)

      // Create link to center
      links.push({
        source: 'article-center',
        target: stockNode.id,
        distance: 80 + (1 - stock.similarity) * 40
      })
    })

    return { nodes, links }
  }, [article])

  // Configure graph physics and ensure proper positioning
  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0) {
      // Configure force simulation for Obsidian-like behavior
      graphRef.current.d3Force('charge').strength(-400)
      graphRef.current.d3Force('link').distance(link => link.distance || 100)
      graphRef.current.d3Force('center').strength(0.5)
      
      // Short delay to ensure nodes are positioned before fitting
      setTimeout(() => {
        if (graphRef.current) {
          graphRef.current.zoomToFit(0, 25) // 0ms = instant fit once nodes are ready
        }
      }, 50) // Minimal delay to prevent out-of-view issue
    }
  }, [graphData])

  // Smooth hover animation effect
  useEffect(() => {
    if (hoveredNode) {
      // Animate scale up
      const animateScale = () => {
        setHoverScale(prev => {
          const target = 1.15 // More subtle growth
          const diff = target - prev
          const newScale = prev + diff * 0.15 // Smooth easing
          return Math.abs(diff) < 0.01 ? target : newScale
        })
      }
      
      const scaleInterval = setInterval(animateScale, 16) // 60fps
      
      // Animate connected links
      const animateLinks = () => {
        if (graphRef.current) {
          const links = graphRef.current.graphData().links
          const newOpacities = new Map()
          
          links.forEach(link => {
            const isConnected = 
              (link.source.id || link.source) === hoveredNode.id ||
              (link.target.id || link.target) === hoveredNode.id
            
            if (isConnected) {
              const currentOpacity = linkOpacities.get(link) || 0
              const target = 1
              const diff = target - currentOpacity
              const newOpacity = currentOpacity + diff * 0.1
              newOpacities.set(link, Math.abs(diff) < 0.01 ? target : newOpacity)
            } else {
              newOpacities.set(link, 0)
            }
          })
          
          setLinkOpacities(newOpacities)
        }
      }
      
      const linkInterval = setInterval(animateLinks, 16)
      
      return () => {
        clearInterval(scaleInterval)
        clearInterval(linkInterval)
      }
    } else {
      // Animate scale down and links fade out
      const animateScaleDown = () => {
        setHoverScale(prev => {
          const target = 1
          const diff = target - prev
          const newScale = prev + diff * 0.15
          return Math.abs(diff) < 0.01 ? target : newScale
        })
      }
      
      const fadeLinks = () => {
        setLinkOpacities(prev => {
          const newOpacities = new Map()
          prev.forEach((opacity, link) => {
            const newOpacity = opacity * 0.85 // Fade out
            newOpacities.set(link, newOpacity < 0.01 ? 0 : newOpacity)
          })
          return newOpacities
        })
      }
      
      const scaleInterval = setInterval(animateScaleDown, 16)
      const linkInterval = setInterval(fadeLinks, 16)
      
      const timeout = setTimeout(() => {
        clearInterval(scaleInterval)
        clearInterval(linkInterval)
        setHoverScale(1)
        setLinkOpacities(new Map())
      }, 300)
      
      return () => {
        clearInterval(scaleInterval)
        clearInterval(linkInterval)
        clearTimeout(timeout)
      }
    }
  }, [hoveredNode, linkOpacities])

  // Custom node rendering - Obsidian style with hover states
  const nodeCanvasObject = (node, ctx, globalScale) => {
    if (!node || typeof node.x !== 'number' || typeof node.y !== 'number' || 
        isNaN(node.x) || isNaN(node.y) || !isFinite(node.x) || !isFinite(node.y)) {
      return
    }
    
    const label = node.name
    const fontSize = 10 / globalScale
    ctx.font = `${fontSize}px Inter, sans-serif`
    const isHovered = hoveredNode && hoveredNode.id === node.id
    
    // All nodes are purple by default, darker purple when hovered
    const color = isHovered ? '#7C3AED' : '#8B5CF6'
    
    // Apply hover scale effect
    const nodeSize = isHovered ? node.val * hoverScale : node.val
    
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false)
    ctx.fill()
    
    // Black text positioned below the node with hover scaling
    const textScale = isHovered ? hoverScale * 0.5 + 0.5 : 1 // Even more subtle text scaling
    const scaledFontSize = fontSize * textScale
    
    ctx.fillStyle = 'black'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.font = `${scaledFontSize}px Inter, sans-serif`
    
    // Position text below the node circle (accounting for scale)
    const textY = node.y + nodeSize + 4
    ctx.fillText(label, node.x, textY)
    
    // Add similarity score for stock nodes
    if (node.type === 'stock' && node.similarity) {
      ctx.fillStyle = '#6B7280' // Gray color for similarity score
      ctx.font = `${scaledFontSize * 0.8}px Inter, sans-serif` // Slightly smaller font, also scaled
      const similarityText = node.similarity.toFixed(2)
      const similarityY = textY + scaledFontSize + 2 // Position below the label
      ctx.fillText(similarityText, node.x, similarityY)
    }
  }

  return (
    <div 
      className="relative w-full h-48 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Interaction hints */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2 text-xs text-gray-400">
        <span>click</span>
        <span>•</span>
        <span>drag</span>
      </div>

      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeCanvasObject={nodeCanvasObject}
        width={300}
        height={192}
        nodeRelSize={2} // Increase hover detection area
        backgroundColor="#f9fafb"
        linkColor={(link) => {
          const opacity = linkOpacities.get(link) || 0
          if (opacity > 0) {
            // Interpolate between gray and purple based on opacity
            const r = Math.round(229 + (124 - 229) * opacity) // E5 -> 7C
            const g = Math.round(231 + (58 - 231) * opacity)   // E7 -> 3A
            const b = Math.round(235 + (237 - 235) * opacity)  // EB -> ED
            return `rgb(${r}, ${g}, ${b})`
          }
          return '#E5E7EB'
        }}
        linkWidth={1.5}
        enableZoomInteraction={true}
        enablePointerInteraction={true}
        enablePanInteraction={true}
        enableNodeDrag={true}
        showNavInfo={false}
        cooldownTicks={100}
        d3AlphaDecay={0.02} // Slower decay for nice jiggling
        d3VelocityDecay={0.3} // Less velocity decay for more bounce
        nodeLabel={() => ''} // Remove hover labels
        onNodeHover={(node) => {
          setHoveredNode(node)
          document.body.style.cursor = node ? 'pointer' : 'default'
        }}
        onNodeClick={(node) => {
          if (node && node.type === 'stock') {
            // Open Yahoo Finance page for the stock ticker
            const yahooUrl = `https://finance.yahoo.com/quote/${node.name}`
            window.open(yahooUrl, '_blank')
          } else if (node && node.type === 'article' && article?.url) {
            // Open the original article URL
            window.open(article.url, '_blank')
          }
        }}
        nodePointerAreaPaint={(node, color, ctx) => {
          // Create larger invisible hover area
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(node.x, node.y, node.val * 1.5, 0, 2 * Math.PI, false) // 1.5x larger hover area
          ctx.fill()
        }}
        onNodeDrag={(node) => {
          // Add some dampening for smooth dragging
          if (node) {
            node.fx = node.x
            node.fy = node.y
          }
        }}
        onNodeDragEnd={(node) => {
          // Release fixed position after drag
          if (node) {
            node.fx = undefined
            node.fy = undefined
          }
        }}
      />
    </div>
  )
}

export default ArticleClusterGraphObsidian