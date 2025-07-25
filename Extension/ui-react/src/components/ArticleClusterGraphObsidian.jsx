import React, { useEffect, useRef, useMemo, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'

const ArticleClusterGraphObsidian = ({ article }) => {
  const graphRef = useRef()
  const [hoveredNode, setHoveredNode] = useState(null)
  const [linkOpacities] = useState(new Map())
  const [hasError, setHasError] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const initTimeoutRef = useRef(null)

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
    if (graphRef.current && graphData.nodes.length > 0 && !isInitialized) {
      // Clear any existing timeout
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
        initTimeoutRef.current = null
      }
      
      try {
        // Configure force simulation for Obsidian-like behavior
        if (graphRef.current.d3Force) {
          graphRef.current.d3Force('charge').strength(-400)
          graphRef.current.d3Force('link').distance(link => link.distance || 100)
          graphRef.current.d3Force('center').strength(0.5)
        }
        
        // Initialize with a delay to allow DOM to settle
        initTimeoutRef.current = setTimeout(() => {
          try {
            if (graphRef.current && graphRef.current.zoomToFit) {
              // Pause animation during initial positioning
              if (graphRef.current.pauseAnimation) {
                graphRef.current.pauseAnimation()
              }
              
              // Set initial zoom and center
              graphRef.current.zoomToFit(400, 20) // Slower, smoother fit
              
              // Resume animation after positioning
              setTimeout(() => {
                try {
                  if (graphRef.current && graphRef.current.resumeAnimation) {
                    graphRef.current.resumeAnimation()
                    setIsInitialized(true)
                  }
                } catch (error) {
                  console.error('Error resuming graph animation:', error)
                  setIsInitialized(true) // Set initialized anyway
                }
              }, 450)
            }
          } catch (error) {
            console.error('Error initializing graph:', error)
            setIsInitialized(true) // Set initialized anyway
          }
        }, 200) // Allow overlay transition to complete
      } catch (error) {
        console.error('Error configuring graph forces:', error)
        setIsInitialized(true) // Set initialized anyway
      }
    }
    
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
        initTimeoutRef.current = null
      }
    }
  }, [graphData, isInitialized])
  
  // Reset initialization when article changes
  useEffect(() => {
    // Clear any existing timeouts
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current)
      initTimeoutRef.current = null
    }
    setIsInitialized(false)
    setHasError(false)
  }, [article])

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
        initTimeoutRef.current = null
      }
    }
  }, [])


  // Custom node rendering - Obsidian style with hover states
  const nodeCanvasObject = (node, ctx, globalScale) => {
    if (!node || typeof node.x !== 'number' || typeof node.y !== 'number' || 
        isNaN(node.x) || isNaN(node.y) || !isFinite(node.x) || !isFinite(node.y)) {
      return
    }
    
    const label = node.name
    const fontSize = 10 / globalScale
    ctx.font = `${fontSize}px Inter, sans-serif`
    // All nodes are purple by default
    const color = '#8B5CF6'
    
    // Use standard node size
    const nodeSize = node.val
    
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false)
    ctx.fill()
    
    // Black text positioned below the node with hover scaling
    const isHovered = hoveredNode && hoveredNode.id === node.id
    const hoverScale = 1.2
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

  if (hasError) {
    return (
      <div className="relative w-full h-48 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-sm">Unable to load graph</p>
          <button 
            onClick={() => setHasError(false)}
            className="text-xs text-purple-600 hover:text-purple-700 mt-1"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="relative w-full h-48 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Loading indicator */}
      {!isInitialized && (
        <div className="absolute inset-0 bg-gray-50 bg-opacity-75 flex items-center justify-center z-20">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-3 h-3 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
            <span>Loading graph...</span>
          </div>
        </div>
      )}

      {/* Interaction hints */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2 text-xs text-gray-400">
        <span>click</span>
        <span>•</span>
        <span>drag</span>
      </div>

      {(() => {
        try {
          return (
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
              cooldownTicks={isInitialized ? 100 : 300}
              d3AlphaDecay={isInitialized ? 0.02 : 0.05} // Faster initial settling
              d3VelocityDecay={isInitialized ? 0.3 : 0.4} // More damping initially
              nodeLabel={() => ''} // Remove hover labels
              onNodeHover={(node) => {
                try {
                  setHoveredNode(node)
                  document.body.style.cursor = node ? 'pointer' : 'default'
                } catch (error) {
                  console.error('Error in onNodeHover:', error)
                }
              }}
              onNodeClick={(node) => {
                try {
                  if (node && node.type === 'stock') {
                    // Open Yahoo Finance page for the stock ticker
                    const yahooUrl = `https://finance.yahoo.com/quote/${node.name}`
                    window.open(yahooUrl, '_blank')
                  } else if (node && node.type === 'article' && article?.url) {
                    // Open the original article URL
                    window.open(article.url, '_blank')
                  }
                } catch (error) {
                  console.error('Error in onNodeClick:', error)
                }
              }}
              nodePointerAreaPaint={(node, color, ctx) => {
                try {
                  // Create larger invisible hover area
                  ctx.fillStyle = color
                  ctx.beginPath()
                  ctx.arc(node.x, node.y, node.val * 1.5, 0, 2 * Math.PI, false) // 1.5x larger hover area
                  ctx.fill()
                } catch (error) {
                  console.error('Error in nodePointerAreaPaint:', error)
                }
              }}
              onNodeDrag={(node) => {
                try {
                  // Add some dampening for smooth dragging
                  if (node) {
                    node.fx = node.x
                    node.fy = node.y
                  }
                } catch (error) {
                  console.error('Error in onNodeDrag:', error)
                }
              }}
              onNodeDragEnd={(node) => {
                try {
                  // Release fixed position after drag
                  if (node) {
                    node.fx = undefined
                    node.fy = undefined
                  }
                } catch (error) {
                  console.error('Error in onNodeDragEnd:', error)
                }
              }}
            />
          )
        } catch (error) {
          console.error('Error rendering ForceGraph2D:', error)
          setHasError(true)
          return null
        }
      })()}
    </div>
  )
}

export default ArticleClusterGraphObsidian