import StockBarChart from './barchart.js';
import { createArticleCard, formatDate, escapeHtml, getTrendingStocks } from './components.js';
import { analyzeArticle } from '../services/api.js';

console.log('popup.js loaded');

let analyses = [];
let expandedCardId = null;
let currentArticleUrl = '';
let currentArticleTitle = '';

// DOM elements
let scrapeButton;
let emptyState;
let loadingState;
let articlesContainer;
let trendingContainer;
let trendingEmpty;
let timeFilter;
let tabButtons;
let tabPanels;
let analysisOverlay;
let overlayContent;
let overlayBack;

// Make these available globally for components
window.expandedCardId = null;
window.toggleCard = toggleCard;

// Set up message listener immediately
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

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Initialize DOM elements
    scrapeButton = document.getElementById('scrape');
    emptyState = document.getElementById('empty-state');
    loadingState = document.getElementById('loading-state');
    articlesContainer = document.getElementById('articles-container');
    trendingContainer = document.getElementById('trending-container');
    trendingEmpty = document.getElementById('trending-empty');
    timeFilter = document.getElementById('time-filter');
    tabButtons = document.querySelectorAll('.tab-button');
    tabPanels = document.querySelectorAll('.tab-panel');
    analysisOverlay = document.getElementById('analysis-overlay');
    overlayContent = document.getElementById('overlay-content');
    overlayBack = document.getElementById('overlay-back');
    
    init();
});

function init() {
    console.log('Initializing popup');
    
    chrome.storage.local.get(['pocketstox_analyses'], (result) => {
        console.log('Storage result:', result);
        if (result.pocketstox_analyses) {
            analyses = result.pocketstox_analyses;
            console.log('Loaded analyses:', analyses.length);
            loadArticles();
            loadTrending();
        } else {
            console.log('No analyses found in storage');
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
        scrapeButton.addEventListener('click', () => {
            console.log('Scrape button clicked!');
            handleScrapeClick();
        });
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
    
    if (overlayBack) {
        overlayBack.addEventListener('click', hideAnalysisOverlay);
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
            files: ['src/lib/Readability.min.js']
        }).then(() => {
            console.log('Readability loaded, now loading content script');
            return chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                files: ['src/content/content.js']
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

async function sendToAPI(title, content) {
    try {
        const data = await analyzeArticle(title, content);
        console.log('API Response:', data);
        
        const analysis = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            title: title || currentArticleTitle,
            url: currentArticleUrl,
            matches: data.matches || []
        };
        
        // Automatically save to history
        analyses.unshift(analysis);
        chrome.storage.local.set({ pocketstox_analyses: analyses });
        
        // Update UI
        loadArticles();
        loadTrending();
        
        // Show results in overlay
        showAnalysisOverlay(analysis, false);
        
        hideLoadingState();
    } catch (error) {
        console.error('API Error:', error);
        hideLoadingState();
        hideAnalysisOverlay();
        alert(`Analysis failed: ${error.message}`);
    }
}

function showLoadingState() {
    if (!scrapeButton) return;
    
    scrapeButton.disabled = true;
    scrapeButton.classList.add('loading');
    const spinner = scrapeButton.querySelector('.loading-spinner');
    if (spinner) {
        spinner.style.display = 'block';
    }
    
    // Show overlay with loading state
    showAnalysisOverlay(null, true);
}

function hideLoadingState() {
    if (!scrapeButton) return;
    
    scrapeButton.disabled = false;
    scrapeButton.classList.remove('loading');
    const spinner = scrapeButton.querySelector('.loading-spinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

function createSkeletonCard(isNew = false) {
    const card = document.createElement('div');
    card.className = 'article-card skeleton-article-card';
    
    if (isNew) {
        // Expanded skeleton for new article being processed
        card.innerHTML = `
            <div class="article-collapsed">
                <div class="article-header">
                    <div class="skeleton skeleton-title" style="width: 75%; height: 16px;"></div>
                    <div class="skeleton" style="width: 16px; height: 16px; border-radius: 4px;"></div>
                </div>
                <div class="skeleton skeleton-date" style="width: 60px; height: 12px; margin-top: 6px;"></div>
            </div>
            <div class="article-expanded" style="display: block; border-top: 1px solid #e5e7eb; padding: 10px 12px;">
                <div class="skeleton-stocks-container">
                    <div class="skeleton-stock-item">
                        <div class="skeleton" style="width: 50px; height: 18px; margin-bottom: 4px;"></div>
                        <div class="skeleton" style="width: 120px; height: 12px; margin-bottom: 2px;"></div>
                        <div class="skeleton" style="width: 60px; height: 10px;"></div>
                    </div>
                    <div class="skeleton-stock-item">
                        <div class="skeleton" style="width: 45px; height: 18px; margin-bottom: 4px;"></div>
                        <div class="skeleton" style="width: 100px; height: 12px; margin-bottom: 2px;"></div>
                        <div class="skeleton" style="width: 55px; height: 10px;"></div>
                    </div>
                    <div class="skeleton-stock-item">
                        <div class="skeleton" style="width: 48px; height: 18px; margin-bottom: 4px;"></div>
                        <div class="skeleton" style="width: 110px; height: 12px; margin-bottom: 2px;"></div>
                        <div class="skeleton" style="width: 58px; height: 10px;"></div>
                    </div>
                </div>
            </div>
        `;
        card.classList.add('expanded', 'skeleton-processing');
    } else {
        // Collapsed skeleton for existing articles
        card.innerHTML = `
            <div class="article-collapsed">
                <div class="article-header">
                    <div class="skeleton skeleton-title" style="width: ${60 + Math.random() * 20}%; height: 16px;"></div>
                    <div class="skeleton" style="width: 16px; height: 16px; border-radius: 4px;"></div>
                </div>
                <div class="skeleton skeleton-date" style="width: ${70 + Math.random() * 30}px; height: 12px; margin-top: 6px;"></div>
            </div>
        `;
    }
    
    return card;
}

function loadArticles() {
    if (!articlesContainer || !emptyState) return;
    
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

function toggleCard(cardId) {
    if (expandedCardId === cardId) {
        expandedCardId = null;
        window.expandedCardId = null;
    } else {
        expandedCardId = cardId;
        window.expandedCardId = cardId;
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
    if (!trendingContainer) return;
    
    const timeRange = timeFilter ? timeFilter.value || '7' : '7';
    const trendingStocks = getTrendingStocks(analyses, timeRange);
    
    
    if (trendingStocks.length === 0) {
        if (trendingContainer) trendingContainer.style.display = 'none';
        if (trendingEmpty) trendingEmpty.style.display = 'flex';
        return;
    }
    
    if (trendingEmpty) trendingEmpty.style.display = 'none';
    if (trendingContainer) {
        trendingContainer.style.display = 'flex';
        trendingContainer.innerHTML = '';
        
        const barchartContainer = document.createElement('div');
        barchartContainer.id = 'barchart-container';
        trendingContainer.appendChild(barchartContainer);
        
        new StockBarChart(barchartContainer, trendingStocks, {
            maxItems: 10,
            color: '#9333ea'
        });
    }
}

function showAnalysisOverlay(analysis, isLoading = false) {
    if (!analysisOverlay || !overlayContent) return;
    
    // Clear content
    overlayContent.innerHTML = '';
    
    if (isLoading) {
        // Show loading state
        overlayContent.innerHTML = `
            <div class="overlay-loading">
                <div class="overlay-spinner"></div>
                <div class="overlay-loading-text">Analyzing article...</div>
            </div>
        `;
    } else if (analysis) {
        // Show article info
        const articleInfo = document.createElement('div');
        articleInfo.className = 'overlay-article-info';
        
        // Format URL for display
        let displayUrl = '';
        let faviconUrl = '';
        if (analysis.url) {
            try {
                const url = new URL(analysis.url);
                displayUrl = url.hostname.replace('www.', '');
                faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=24`;
            } catch {
                displayUrl = analysis.url;
            }
        }
        
        articleInfo.innerHTML = `
            <div class="overlay-article-title">${analysis.title || 'Untitled Article'}</div>
            <div class="overlay-article-meta">
                ${displayUrl ? `
                    <div class="overlay-article-url">
                        ${faviconUrl ? `<img src="${faviconUrl}" class="article-favicon" alt="" onerror="this.style.display='none'">` : ''}
                        ${displayUrl}
                    </div>
                    <span class="meta-separator">•</span>
                ` : ''}
                <div class="overlay-article-date">${formatDate(new Date(analysis.timestamp))}</div>
            </div>
        `;
        
        // Make URL clickable
        if (analysis.url && displayUrl) {
            const urlElement = articleInfo.querySelector('.overlay-article-url');
            if (urlElement) {
                urlElement.style.cursor = 'pointer';
                urlElement.addEventListener('click', () => {
                    chrome.tabs.create({ url: analysis.url });
                });
            }
        }
        
        overlayContent.appendChild(articleInfo);
        
        // Show stocks
        if (analysis.matches && analysis.matches.length > 0) {
            const stocksGrid = document.createElement('div');
            stocksGrid.className = 'overlay-stocks-grid';
            
            // Limit to top 6 stocks
            const topStocks = analysis.matches.slice(0, 6);
            
            topStocks.forEach(match => {
                const stockCard = document.createElement('div');
                stockCard.className = 'overlay-stock-card';
                
                const scorePercent = (match.score * 100).toFixed(1);
                
                stockCard.innerHTML = `
                    <div class="overlay-stock-header">
                        <div class="overlay-stock-ticker">${match.ticker}</div>
                        <div class="overlay-stock-score">${scorePercent}% match</div>
                    </div>
                    <div class="overlay-stock-company">${match.company}</div>
                    <div class="overlay-stock-exchange">${match.exchange}</div>
                `;
                
                stockCard.addEventListener('click', () => {
                    chrome.tabs.create({
                        url: `https://robinhood.com/stocks/${match.ticker}`
                    });
                });
                
                stocksGrid.appendChild(stockCard);
            });
            
            overlayContent.appendChild(stocksGrid);
        } else {
            overlayContent.innerHTML += '<div class="no-stocks">No stocks found for this article</div>';
        }
    }
    
    // Show overlay with smooth fade
    analysisOverlay.classList.add('show');
}

function hideAnalysisOverlay() {
    if (!analysisOverlay) return;
    
    analysisOverlay.classList.remove('show');
}

// Make it available globally for components
window.showAnalysisOverlay = showAnalysisOverlay;

