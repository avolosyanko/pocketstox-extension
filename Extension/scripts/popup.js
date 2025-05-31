console.log('popup.js loaded');

let analyses = [];
let expandedCardId = null;

class StockTreemap {
    constructor(container, data, options = {}) {
        this.container = container;
        this.data = data;
        this.options = {
            maxItems: options.maxItems || 12,
            minArea: options.minArea || 400,
            colors: options.colors || [
                '#9333ea', '#7c3aed', '#a855f7', '#c084fc', 
                '#ddd6fe', '#e9d5ff', '#f3e8ff', '#8b5cf6'
            ],
            ...options
        };
        this.init();
    }

    init() {
        this.container.innerHTML = '';
        this.container.style.position = 'relative';
        this.container.style.width = '100%';
        this.container.style.height = '300px';
        this.container.style.border = '1px solid #e5e7eb';
        this.container.style.borderRadius = '8px';
        this.container.style.overflow = 'hidden';
        this.container.style.backgroundColor = '#f9fafb';

        this.processData();
        this.render();
    }

    processData() {
        let sortedData = [...this.data].sort((a, b) => b.count - a.count);
        
        if (sortedData.length > this.options.maxItems) {
            const topItems = sortedData.slice(0, this.options.maxItems - 1);
            const otherItems = sortedData.slice(this.options.maxItems - 1);
            const otherCount = otherItems.reduce((sum, item) => sum + item.count, 0);
            
            if (otherCount > 0) {
                topItems.push({
                    ticker: 'OTHER',
                    company: `${otherItems.length} other companies`,
                    count: otherCount,
                    avgScore: otherItems.reduce((sum, item) => sum + item.avgScore, 0) / otherItems.length,
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
        const width = 348;
        const height = 300;

        const tiles = this.calculateTiles(width, height);
        
        tiles.forEach((tile, index) => {
            this.createTile(tile, index);
        });
    }

    calculateTiles(containerWidth, containerHeight) {
        const tiles = [];
        const totalArea = containerWidth * containerHeight;
        
        let currentY = 0;
        let currentRowHeight = 0;
        let currentRowWidth = 0;
        let currentRowItems = [];
        
        this.processedData.forEach((item, index) => {
            const area = (item.count / this.totalValue) * totalArea;
            const aspectRatio = containerWidth / containerHeight;
            
            let width = Math.sqrt(area * aspectRatio);
            let height = area / width;
            
            const minDimension = 40;
            if (width < minDimension) {
                width = minDimension;
                height = area / width;
            }
            if (height < minDimension) {
                height = minDimension;
                width = area / height;
            }

            currentRowItems.push({
                ...item,
                width: Math.floor(width),
                height: Math.floor(height),
                area: area
            });

            currentRowWidth += width;
            currentRowHeight = Math.max(currentRowHeight, height);

            if (currentRowWidth >= containerWidth * 0.9 || index === this.processedData.length - 1) {
                const scaleFactor = containerWidth / currentRowWidth;
                let currentX = 0;

                currentRowItems.forEach(rowItem => {
                    const scaledWidth = Math.floor(rowItem.width * scaleFactor);
                    const scaledHeight = Math.floor(currentRowHeight);

                    tiles.push({
                        ...rowItem,
                        x: currentX,
                        y: currentY,
                        width: scaledWidth,
                        height: scaledHeight
                    });

                    currentX += scaledWidth;
                });

                currentY += currentRowHeight;
                currentRowHeight = 0;
                currentRowWidth = 0;
                currentRowItems = [];
            }
        });

        return tiles;
    }

    createTile(tile, index) {
        const tileElement = document.createElement('div');
        tileElement.className = 'treemap-tile';
        
        const area = tile.width * tile.height;
        const fontSize = Math.min(14, Math.max(10, Math.sqrt(area) / 8));
        const tickerFontSize = Math.min(16, fontSize + 2);
        
        const colorIndex = index % this.options.colors.length;
        const backgroundColor = this.options.colors[colorIndex];
        
        tileElement.style.cssText = `
            position: absolute;
            left: ${tile.x}px;
            top: ${tile.y}px;
            width: ${tile.width}px;
            height: ${tile.height}px;
            background-color: ${backgroundColor};
            border: 1px solid rgba(255, 255, 255, 0.3);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 4px;
            box-sizing: border-box;
            cursor: pointer;
            transition: all 0.2s ease;
            color: white;
            font-weight: 500;
            overflow: hidden;
        `;

        tileElement.addEventListener('mouseenter', () => {
            tileElement.style.transform = 'scale(1.02)';
            tileElement.style.zIndex = '10';
            tileElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });

        tileElement.addEventListener('mouseleave', () => {
            tileElement.style.transform = 'scale(1)';
            tileElement.style.zIndex = '1';
            tileElement.style.boxShadow = 'none';
        });

        let content = '';
        if (area > 1000) {
            content = `
                <div style="font-size: ${tickerFontSize}px; font-weight: 600; line-height: 1.1; margin-bottom: 2px;">
                    ${tile.ticker}
                </div>
                <div style="font-size: ${fontSize - 1}px; font-weight: 400; line-height: 1.1; margin-bottom: 2px; opacity: 0.9;">
                    ${tile.count} mention${tile.count > 1 ? 's' : ''}
                </div>
                <div style="font-size: ${fontSize - 2}px; font-weight: 400; line-height: 1.1; opacity: 0.8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%;">
                    ${tile.company.length > 20 ? tile.company.substring(0, 20) + '...' : tile.company}
                </div>
            `;
        } else if (area > 600) {
            content = `
                <div style="font-size: ${tickerFontSize}px; font-weight: 600; line-height: 1.1; margin-bottom: 1px;">
                    ${tile.ticker}
                </div>
                <div style="font-size: ${fontSize - 1}px; font-weight: 400; line-height: 1.1; opacity: 0.9;">
                    ${tile.count}
                </div>
            `;
        } else {
            content = `
                <div style="font-size: ${Math.min(tickerFontSize, 12)}px; font-weight: 600; line-height: 1.1;">
                    ${tile.ticker}
                </div>
            `;
        }

        tileElement.innerHTML = content;

        if (!tile.isOther) {
            tileElement.addEventListener('click', () => {
                chrome.tabs.create({
                    url: `https://finance.yahoo.com/quote/${tile.ticker}`
                });
            });
        } else {
            tileElement.style.cursor = 'default';
            tileElement.addEventListener('click', (e) => {
                e.preventDefault();
            });
        }

        this.container.appendChild(tileElement);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    const scrapeButton = document.getElementById('scrape');
    const emptyState = document.getElementById('empty-state');
    const loadingState = document.getElementById('loading-state');
    const articlesContainer = document.getElementById('articles-container');
    const trendingContainer = document.getElementById('trending-container');
    const trendingEmpty = document.getElementById('trending-empty');
    const trendingCount = document.getElementById('trending-count');
    const timeFilter = document.getElementById('time-filter');
    
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    let currentArticleUrl = '';
    let currentArticleTitle = '';
    
    init();
    
    function init() {
        console.log('Initializing popup');
        
        chrome.storage.local.get(['pocketstox_analyses'], (result) => {
            if (result.pocketstox_analyses) {
                analyses = result.pocketstox_analyses;
                loadArticles();
                loadTrending();
            }
        });
        
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                currentArticleUrl = tabs[0].url;
                currentArticleTitle = tabs[0].title;
            }
        });

        setupEventListeners();
    }
    
    function setupEventListeners() {
        console.log('Setting up event listeners');
        
        if (scrapeButton) {
            scrapeButton.addEventListener('click', handleScrapeClick);
            console.log('Scrape button listener added');
        } else {
            console.error('Scrape button not found!');
        }
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                switchTab(targetTab);
            });
        });
        
        if (timeFilter) {
            timeFilter.addEventListener('change', () => {
                loadTrending();
            });
        }
    }
    
    function switchTab(tabName) {
        tabButtons.forEach(btn => {
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        tabPanels.forEach(panel => {
            if (panel.id === `${tabName}-panel`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });
    }
    
    function handleScrapeClick() {
        console.log('Scrape button clicked!');

        showLoadingState();
        
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            console.log('Current tab:', tabs[0]);
            
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                files: ['scripts/Readability.min.js']
            }).then(() => {
                console.log('Readability loaded, now loading content script');
                return chrome.scripting.executeScript({
                    target: {tabId: tabs[0].id},
                    files: ['scripts/content.js']
                });
            }).then(() => {
                console.log('Content script executed');
            }).catch(error => {
                console.error('Script execution error:', error);
                hideLoadingState();
                alert('Failed to analyze page. Please try again.');
            });
        });
    }
    
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('Message received:', message.action);
        
        if (message.action === 'contentExtracted') {
            const { title, content } = message;
            
            console.log('Content extracted:', {
                titleLength: title ? title.length : 0,
                contentLength: content ? content.length : 0
            });
            
            sendToAPI(title, content);
        }
    });
    
    function sendToAPI(title, content) {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (CONFIG.apiKey) {
            headers['X-Api-Key'] = CONFIG.apiKey;
        }
        
        const payload = {
            title: title || '',
            content: content || ''
        };
        
        console.log('Sending to API:', CONFIG.apiUrl);
        
        fetch(CONFIG.apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        })
        .then(async (response) => {
            console.log('Response Status:', response.status);
            const responseText = await response.text();
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            try {
                return JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                throw new Error('Invalid response format');
            }
        })
        .then(async (data) => {
            console.log('API Response:', data);
            
            const analysis = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                title: title || currentArticleTitle,
                url: currentArticleUrl,
                matches: data.matches || []
            };
            
            analyses.unshift(analysis);
            
            chrome.storage.local.set({ pocketstox_analyses: analyses });
            
            expandedCardId = analysis.id;
            
            loadArticles();
            loadTrending();
            
            hideLoadingState();
        })
        .catch(error => {
            console.error('API Error:', error);
            hideLoadingState();
            alert(`Analysis failed: ${error.message}`);
        });
    }
    
    function showLoadingState() {
        scrapeButton.disabled = true;
        scrapeButton.classList.add('loading');
        const spinner = scrapeButton.querySelector('.loading-spinner');
        if (spinner) {
            spinner.style.display = 'block';
        }
        
        if (analyses.length === 0) {
            emptyState.style.display = 'none';
            loadingState.style.display = 'block';
        }
    }
    
    function hideLoadingState() {
        scrapeButton.disabled = false;
        scrapeButton.classList.remove('loading');
        const spinner = scrapeButton.querySelector('.loading-spinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
        loadingState.style.display = 'none';
    }
    
    function loadArticles() {
        if (analyses.length === 0) {
            articlesContainer.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }
        
        emptyState.style.display = 'none';
        articlesContainer.style.display = 'flex';
        articlesContainer.innerHTML = '';
        
        analyses.forEach(analysis => {
            const articleCard = createArticleCard(analysis);
            articlesContainer.appendChild(articleCard);
        });
    }
    
    function createArticleCard(analysis) {
        const card = document.createElement('div');
        card.className = 'article-card';
        card.setAttribute('data-card-id', analysis.id);
        
        const date = new Date(analysis.timestamp);
        const formattedDate = formatDate(date);
        
        const isExpanded = expandedCardId === analysis.id;
        
        const collapsedContent = document.createElement('div');
        collapsedContent.className = 'article-collapsed';
        collapsedContent.innerHTML = `
            <div class="article-header">
                <div class="article-title">${escapeHtml(analysis.title)}</div>
                <div class="expand-indicator">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </div>
            </div>
            <div class="article-date">${formattedDate}</div>
        `;
        
        const expandedContent = document.createElement('div');
        expandedContent.className = 'article-expanded';
        expandedContent.style.display = isExpanded ? 'block' : 'none';
        
        if (analysis.matches && analysis.matches.length > 0) {
            expandedContent.innerHTML = `
                <div class="stocks-list">
                    ${analysis.matches.map(match => {
                        const scorePercent = (match.score * 100).toFixed(1);
                        return `
                            <div class="stock-item" data-ticker="${match.ticker}">
                                <div class="stock-header">
                                    <div class="stock-ticker">${match.ticker}</div>
                                    <div class="stock-score">${scorePercent}%</div>
                                </div>
                                <div class="stock-company">${escapeHtml(match.company)}</div>
                                <div class="stock-exchange">${match.exchange}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            
            expandedContent.querySelectorAll('.stock-item').forEach(stockItem => {
                stockItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const ticker = stockItem.getAttribute('data-ticker');
                    chrome.tabs.create({
                        url: `https://finance.yahoo.com/quote/${ticker}`
                    });
                });
            });
        } else {
            expandedContent.innerHTML = '<div class="no-stocks">No stocks found for this article</div>';
        }
        
        if (isExpanded) {
            card.classList.add('expanded');
        }
        
        card.appendChild(collapsedContent);
        card.appendChild(expandedContent);
        
        collapsedContent.addEventListener('click', () => {
            toggleCard(analysis.id);
        });
        
        return card;
    }
    
    function toggleCard(cardId) {
        if (expandedCardId === cardId) {
            expandedCardId = null;
        } else {
            expandedCardId = cardId;
        }
        
        document.querySelectorAll('.article-card').forEach(card => {
            const currentCardId = card.getAttribute('data-card-id');
            const expandedContent = card.querySelector('.article-expanded');
            const isCurrentlyExpanded = expandedCardId === currentCardId;
            
            if (isCurrentlyExpanded) {
                card.classList.add('expanded');
                expandedContent.style.display = 'block';
            } else {
                card.classList.remove('expanded');
                expandedContent.style.display = 'none';
            }
        });
    }
    
    function loadTrending() {
        const timeRange = timeFilter ? timeFilter.value : '7';
        const trendingStocks = getTrendingStocks(timeRange);
        
        const uniqueStocks = trendingStocks.filter(stock => stock.count > 1);
        if (uniqueStocks.length > 0 && trendingCount) {
            trendingCount.textContent = uniqueStocks.length;
            trendingCount.style.display = 'block';
        } else if (trendingCount) {
            trendingCount.style.display = 'none';
        }
        
        if (trendingStocks.length === 0 || !trendingContainer) {
            if (trendingContainer) trendingContainer.style.display = 'none';
            if (trendingEmpty) trendingEmpty.style.display = 'flex';
            return;
        }
        
        if (trendingEmpty) trendingEmpty.style.display = 'none';
        trendingContainer.style.display = 'flex';
        trendingContainer.innerHTML = '';
        
        const treemapContainer = document.createElement('div');
        treemapContainer.id = 'treemap-container';
        trendingContainer.appendChild(treemapContainer);
        
        new StockTreemap(treemapContainer, trendingStocks, {
            maxItems: 12,
            colors: [
                '#9333ea', '#7c3aed', '#a855f7', '#c084fc', 
                '#8b5cf6', '#d8b4fe', '#e9d5ff', '#f3e8ff'
            ]
        });
    }
    
    function getTrendingStocks(timeRange) {
        const stockFrequency = {};
        const now = new Date();
        const cutoffDate = new Date();
        
        if (timeRange !== 'all') {
            cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));
        } else {
            cutoffDate.setFullYear(2000);
        }
        
        analyses.forEach(analysis => {
            const analysisDate = new Date(analysis.timestamp);
            if (analysisDate < cutoffDate) return;
            
            analysis.matches.forEach(match => {
                const key = match.ticker;
                if (!stockFrequency[key]) {
                    stockFrequency[key] = {
                        ticker: match.ticker,
                        company: match.company,
                        exchange: match.exchange,
                        count: 0,
                        avgScore: 0,
                        scores: []
                    };
                }
                
                stockFrequency[key].count++;
                stockFrequency[key].scores.push(match.score);
            });
        });
        
        Object.values(stockFrequency).forEach(stock => {
            stock.avgScore = stock.scores.reduce((a, b) => a + b, 0) / stock.scores.length;
        });
        
        return Object.values(stockFrequency)
            .sort((a, b) => b.count - a.count);
    }
    
    function formatDate(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});