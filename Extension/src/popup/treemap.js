class StockTreemap {
    constructor(container, data, options = {}) {
        this.container = container;
        this.data = data;
        this.options = {
            maxItems: options.maxItems || 10,
            colors: options.colors || [
                '#9333ea', '#7c3aed', '#a855f7', '#c084fc', 
                '#ddd6fe', '#e9d5ff', '#f3e8ff', '#8b5cf6'
            ],
            gap: 2, // Gap between tiles in pixels
            ...options
        };
        this.init();
    }

    init() {
        this.container.innerHTML = '';
        this.container.style.position = 'relative';
        this.container.style.width = '100%';
        this.container.style.height = '280px';
        this.container.style.overflow = 'hidden';
        this.container.style.backgroundColor = '#f9fafb';
        this.container.style.borderRadius = '10px';
        this.container.style.border = 'none';

        this.processData();
        this.render();
    }

    processData() {
        // Sort by count descending
        let sortedData = [...this.data].sort((a, b) => b.count - a.count);
        
        // Take top items and group the rest as "OTHER"
        if (sortedData.length > this.options.maxItems) {
            const topItems = sortedData.slice(0, this.options.maxItems);
            const otherItems = sortedData.slice(this.options.maxItems);
            const otherCount = otherItems.reduce((sum, item) => sum + item.count, 0);
            
            if (otherCount > 0) {
                topItems.push({
                    ticker: 'OTHER',
                    company: `${otherItems.length} other stocks`,
                    count: otherCount,
                    isOther: true
                });
            }
            
            sortedData = topItems;
        }

        this.processedData = sortedData;
        this.totalValue = sortedData.reduce((sum, item) => sum + item.count, 0);
    }

    render() {
        const containerRect = this.container.getBoundingClientRect();
        const width = containerRect.width > 0 ? containerRect.width : 388;
        const height = 280;

        // Calculate treemap layout
        const tiles = this.calculateTreemap(this.processedData, 0, 0, width, height);
        
        tiles.forEach((tile, index) => {
            this.createTile(tile, index);
        });
    }

    calculateTreemap(data, x, y, width, height) {
        const tiles = [];
        const gap = this.options.gap;
        
        if (data.length === 0) return tiles;
        
        // For 6 or fewer items, create a balanced grid layout
        if (data.length <= 6) {
            // Determine grid dimensions
            let cols, rows;
            if (data.length <= 2) {
                cols = data.length;
                rows = 1;
            } else if (data.length <= 4) {
                cols = 2;
                rows = 2;
            } else {
                cols = 3;
                rows = 2;
            }
            
            // Group items into rows
            const itemsPerRow = Math.ceil(data.length / rows);
            const rowGroups = [];
            
            for (let i = 0; i < rows; i++) {
                const startIdx = i * itemsPerRow;
                const endIdx = Math.min(startIdx + itemsPerRow, data.length);
                if (startIdx < data.length) {
                    rowGroups.push(data.slice(startIdx, endIdx));
                }
            }
            
            // Calculate row heights based on total values
            const rowTotals = rowGroups.map(row => 
                row.reduce((sum, item) => sum + item.count, 0)
            );
            const totalValue = rowTotals.reduce((sum, val) => sum + val, 0);
            
            // Layout each row
            let currentY = y;
            
            rowGroups.forEach((rowItems, rowIndex) => {
                const rowHeight = (height - gap * (rowGroups.length - 1)) * (rowTotals[rowIndex] / totalValue);
                const rowTotal = rowTotals[rowIndex];
                
                // Layout items within the row
                let currentX = x;
                
                rowItems.forEach((item, colIndex) => {
                    const itemWidth = (width - gap * (rowItems.length - 1)) * (item.count / rowTotal);
                    
                    tiles.push({
                        ...item,
                        x: currentX,
                        y: currentY,
                        width: itemWidth,
                        height: rowHeight
                    });
                    
                    currentX += itemWidth + gap;
                });
                
                currentY += rowHeight + gap;
            });
            
            return tiles;
        }
        
        // For more than 6 items, use a different algorithm
        // This is a simple slice-and-dice approach
        const itemsPerRow = 3;
        const numRows = Math.ceil(data.length / itemsPerRow);
        const effectiveHeight = (height - gap * (numRows - 1)) / numRows;
        
        let currentY = y;
        for (let row = 0; row < numRows; row++) {
            const startIdx = row * itemsPerRow;
            const endIdx = Math.min(startIdx + itemsPerRow, data.length);
            const rowItems = data.slice(startIdx, endIdx);
            const rowTotal = rowItems.reduce((sum, item) => sum + item.count, 0);
            
            let currentX = x;
            rowItems.forEach((item, colIndex) => {
                const itemWidth = (width - gap * (rowItems.length - 1)) * (item.count / rowTotal);
                
                tiles.push({
                    ...item,
                    x: currentX,
                    y: currentY,
                    width: itemWidth,
                    height: effectiveHeight
                });
                
                currentX += itemWidth + gap;
            });
            
            currentY += effectiveHeight + gap;
        }
        
        return tiles;
    }

    createTile(tile, index) {
        const tileElement = document.createElement('div');
        tileElement.className = 'treemap-tile';
        
        const colorIndex = index % this.options.colors.length;
        const backgroundColor = this.options.colors[colorIndex];
        
        // Round positions and dimensions
        const x = Math.round(tile.x);
        const y = Math.round(tile.y);
        const width = Math.round(tile.width);
        const height = Math.round(tile.height);
        
        tileElement.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: ${width}px;
            height: ${height}px;
            background-color: ${backgroundColor};
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            color: white;
            font-weight: 500;
            overflow: hidden;
            border-radius: 4px;
        `;

        // Determine font sizes based on tile size
        const area = width * height;
        let content = '';
        
        if (area > 3000) {
            // Large tiles - show everything
            const tickerSize = Math.min(20, Math.sqrt(area) / 5);
            const detailSize = Math.max(11, tickerSize - 6);
            content = `
                <div style="font-size: ${tickerSize}px; font-weight: 600; margin-bottom: 4px;">
                    ${tile.ticker}
                </div>
                <div style="font-size: ${detailSize}px; opacity: 0.9;">
                    ${tile.count} mention${tile.count > 1 ? 's' : ''}
                </div>
            `;
        } else if (area > 1500) {
            // Medium tiles - show ticker and count
            const tickerSize = Math.min(16, Math.sqrt(area) / 6);
            content = `
                <div style="font-size: ${tickerSize}px; font-weight: 600;">
                    ${tile.ticker}
                </div>
                <div style="font-size: 10px; opacity: 0.8;">
                    ${tile.count} mention${tile.count > 1 ? 's' : ''}
                </div>
            `;
        } else {
            // Small tiles - just ticker
            const tickerSize = Math.min(14, Math.sqrt(area) / 7);
            content = `
                <div style="font-size: ${tickerSize}px; font-weight: 600;">
                    ${tile.ticker}
                </div>
            `;
        }

        tileElement.innerHTML = content;

        // Hover effects
        tileElement.addEventListener('mouseenter', () => {
            tileElement.style.transform = 'translateZ(0) scale(0.98)';
            tileElement.style.zIndex = '10';
            tileElement.style.filter = 'brightness(1.1)';
            tileElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        });

        tileElement.addEventListener('mouseleave', () => {
            tileElement.style.transform = 'translateZ(0) scale(1)';
            tileElement.style.zIndex = '1';
            tileElement.style.filter = 'brightness(1)';
            tileElement.style.boxShadow = 'none';
        });

        // Click handler
        if (!tile.isOther) {
            tileElement.addEventListener('click', () => {
                chrome.tabs.create({
                    url: `https://finance.yahoo.com/quote/${tile.ticker}`
                });
            });
        } else {
            tileElement.style.cursor = 'default';
            tileElement.style.opacity = '0.7';
        }

        this.container.appendChild(tileElement);
    }
}

export default StockTreemap;