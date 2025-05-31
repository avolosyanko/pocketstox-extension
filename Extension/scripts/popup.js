console.log('popup.js loaded');

let analyses = [];

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
    const marketCapFilter = document.getElementById('market-cap-filter');
    const sectorFilter = document.getElementById('sector-filter');
    const modal = document.getElementById('article-modal');
    const modalClose = document.getElementById('modal-close');
    
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
        
        if (marketCapFilter) {
            marketCapFilter.addEventListener('change', () => {
                loadTrending();
            });
        }
        
        if (sectorFilter) {
            sectorFilter.addEventListener('change', () => {
                loadTrending();
            });
        }
        
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
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
            
            loadArticles();
            loadTrending();
            
            showArticleModal(analysis);
            
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
        
        const date = new Date(analysis.timestamp);
        const formattedDate = formatDate(date);
        
        card.innerHTML = `
            <div class="article-title">${escapeHtml(analysis.title)}</div>
            <div class="article-date">${formattedDate}</div>
        `;
        
        card.addEventListener('click', () => {
            showArticleModal(analysis);
        });
        
        return card;
    }
    
    function loadTrending() {
        const timeRange = timeFilter ? timeFilter.value : '7';
        const marketCap = marketCapFilter ? marketCapFilter.value : 'all';
        const sector = sectorFilter ? sectorFilter.value : 'all';
        
        const trendingStocks = getTrendingStocks(timeRange, marketCap, sector);
        
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
        
        // Get max count for frequency bar
        const maxCount = Math.max(...trendingStocks.map(s => s.count));
        
        trendingStocks.forEach(stock => {
            const trendingCard = createTrendingCard(stock, maxCount);
            trendingContainer.appendChild(trendingCard);
        });
    }
    
    function getTrendingStocks(timeRange, marketCap = 'all', sector = 'all') {
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
                // Apply market cap filter
                if (marketCap !== 'all' && match.market_cap !== marketCap) return;
                
                // Apply sector filter
                if (sector !== 'all' && match.sector !== sector) return;
                
                const key = match.ticker;
                if (!stockFrequency[key]) {
                    stockFrequency[key] = {
                        ticker: match.ticker,
                        company: match.company,
                        exchange: match.exchange,
                        market_cap: match.market_cap,
                        sector: match.sector,
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
    
    function createTrendingCard(stock, maxCount) {
        const card = document.createElement('div');
        card.className = 'trending-card';
        
        const mentionText = stock.count === 1 ? '1 mention' : `${stock.count} mentions`;
        
        card.innerHTML = `
            <div class="trending-ticker">${stock.ticker}</div>
            <div class="trending-count">${mentionText}</div>
        `;
        
        card.addEventListener('click', () => {
            chrome.tabs.create({
                url: `https://finance.yahoo.com/quote/${stock.ticker}`
            });
        });
        
        return card;
    }
    
    function showArticleModal(analysis) {
        const modalTitle = document.getElementById('modal-article-title');
        const modalDate = document.getElementById('modal-article-date');
        const modalStocksList = document.getElementById('modal-stocks-list');
        
        if (modalTitle) modalTitle.textContent = analysis.title;
        if (modalDate) modalDate.textContent = formatDate(new Date(analysis.timestamp));
        
        if (modalStocksList) {
            modalStocksList.innerHTML = '';
            analysis.matches.forEach(match => {
                const stockItem = document.createElement('div');
                stockItem.className = 'modal-stock-item';
                
                const scorePercent = (match.score * 100).toFixed(1);
                
                stockItem.innerHTML = `
                    <div class="result-header">
                        <div class="result-ticker">${match.ticker}</div>
                        <div class="result-score">${scorePercent}%</div>
                    </div>
                    <div class="result-company">${escapeHtml(match.company)}</div>
                    <div class="result-exchange">${match.exchange}</div>
                `;
                
                stockItem.addEventListener('click', () => {
                    chrome.tabs.create({
                        url: `https://finance.yahoo.com/quote/${match.ticker}`
                    });
                });
                
                modalStocksList.appendChild(stockItem);
            });
        }
        
        if (modal) modal.style.display = 'flex';
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