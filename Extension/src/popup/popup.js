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
let signInButton;
let profileButton;

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
    signInButton = document.getElementById('sign-in-button');
    profileButton = document.getElementById('profile-button');
    
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
    updateUsageDisplay();
    updateHeaderDisplay();
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
    
    if (signInButton) {
        signInButton.addEventListener('click', () => {
            chrome.tabs.create({
                url: 'https://pocketstox.com/upgrade'
            });
        });
    }
    
    if (profileButton) {
        profileButton.addEventListener('click', showProfileMenu);
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

async function handleScrapeClick() {
    console.log('Scrape button clicked!');

    // Check if limit is reached
    const storageManager = new window.StorageManager();
    const stats = await storageManager.getUsageStats();
    
    if (stats.limitReached) {
        // Go straight to upgrade page
        chrome.tabs.create({
            url: 'https://pocketstox.com/upgrade'
        });
        return;
    }

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
        
        // Update usage display after successful analysis
        updateUsageDisplay();
        updateHeaderDisplay();
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

function showUpgradeFlow() {
    // For now, open a new tab to your upgrade page
    // Later you can implement an in-extension flow
    chrome.tabs.create({
        url: 'https://pocketstox.com/upgrade' // Replace with your actual upgrade URL
    });
    
    // Alternatively, show an in-extension upgrade form
    // showUpgradeModal();
}

function showUpgradeModal() {
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop';
    modalBackdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const modal = document.createElement('div');
    modal.className = 'upgrade-modal';
    modal.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 400px;
        margin: 16px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    `;
    
    modal.innerHTML = `
        <h3 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #111827;">
            Create Your Account
        </h3>
        <p style="margin: 0 0 24px 0; color: #6b7280; line-height: 1.5;">
            Sign up to unlock premium features and keep your analysis history across devices.
        </p>
        <form id="upgrade-form">
            <input type="email" 
                placeholder="Email address" 
                required
                style="
                    width: 100%;
                    padding: 12px 16px;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 14px;
                    margin-bottom: 12px;
                    box-sizing: border-box;
                "
            />
            <input type="password" 
                placeholder="Create password" 
                required
                style="
                    width: 100%;
                    padding: 12px 16px;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 14px;
                    margin-bottom: 20px;
                    box-sizing: border-box;
                "
            />
            <button type="submit" style="
                width: 100%;
                padding: 12px 16px;
                border: none;
                background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
                color: white;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                font-size: 14px;
                box-shadow: 0 4px 14px 0 rgba(147, 51, 234, 0.35);
            ">Create Account & Upgrade</button>
        </form>
        <p style="margin: 16px 0 0 0; text-align: center; color: #6b7280; font-size: 13px;">
            Already have an account? 
            <a href="#" id="signin-link" style="color: #9333ea; text-decoration: none;">Sign in</a>
        </p>
    `;
    
    modalBackdrop.appendChild(modal);
    document.body.appendChild(modalBackdrop);
    
    // Handle form submission
    modal.querySelector('#upgrade-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        // Implement actual signup logic here
        alert('Account creation would happen here');
        modalBackdrop.remove();
    });
    
    // Close on backdrop click
    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
            modalBackdrop.remove();
        }
    });
}


async function updateUsageDisplay() {
    const storageManager = new window.StorageManager();
    const stats = await storageManager.getUsageStats();
    
    // Update the button and usage counter
    if (scrapeButton) {
        const buttonText = scrapeButton.querySelector('.button-text');
        const usageCounter = scrapeButton.querySelector('.usage-counter');
        const buttonIcon = scrapeButton.querySelector('svg:not(.spinner)');
        
        if (stats.isPremium) {
            // Premium user display
            if (usageCounter) {
                usageCounter.textContent = 'Premium';
                usageCounter.style.background = 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)';
                usageCounter.style.color = 'white';
            }
            if (buttonText) {
                buttonText.textContent = 'Generate Companies';
            }
            scrapeButton.disabled = false;
            scrapeButton.classList.remove('limit-reached');
        } else {
            // Free user display
            if (usageCounter) {
                usageCounter.textContent = `${stats.today}/5 today`;
                usageCounter.style.background = '';
                usageCounter.style.color = '';
            }
            
            if (stats.remaining > 0) {
                if (buttonText) {
                    buttonText.textContent = 'Generate Companies';
                }
                
                // Sparkle icon when searches available
                if (buttonIcon) {
                    buttonIcon.innerHTML = `<path d="M12 3v2M12 19v2M2 12h3M19 12h3M5.64 5.64l2.12 2.12M16.24 16.24l2.12 2.12M5.64 18.36l2.12-2.12M16.24 7.76l2.12-2.12"/>`;
                }
                
                // Enable hover effects
                scrapeButton.classList.remove('limit-reached');
            } else {
                if (buttonText) {
                    buttonText.textContent = 'Upgrade to Premium';
                }
                
                // Lock icon when limit reached
                if (buttonIcon) {
                    buttonIcon.innerHTML = `<rect x="5" y="11" width="14" height="10" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>`;
                }
                
                // Disable hover effects
                scrapeButton.classList.add('limit-reached');
            }
            
            // Always enabled to allow clicking
            scrapeButton.disabled = false;
        }
    }
}


function showProfileMenu() {
    // Create dropdown menu
    const dropdown = document.createElement('div');
    dropdown.className = 'profile-dropdown';
    dropdown.style.cssText = `
        position: absolute;
        top: 60px;
        right: 16px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        border: 1px solid #e5e7eb;
        min-width: 200px;
        z-index: 1000;
        overflow: hidden;
    `;
    
    // Get account info
    const storageManager = new window.StorageManager();
    storageManager.getAccount().then(account => {
        const isPremium = account && account.isPremium;
        
        dropdown.innerHTML = `
            <div style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6;">
                <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">
                    ${account ? account.email || 'Anonymous User' : 'Anonymous User'}
                </div>
                <div style="font-size: 12px; color: #6b7280;">
                    ${isPremium ? 'Premium Plan' : 'Free Plan'}
                </div>
            </div>
            <div style="padding: 8px 0;">
                ${!isPremium ? `
                    <button class="dropdown-item" data-action="upgrade">
                        <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        Upgrade to Premium
                    </button>
                ` : ''}
                <button class="dropdown-item" data-action="settings">
                    <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                        <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
                    </svg>
                    Settings
                </button>
                <button class="dropdown-item" data-action="signout">
                    <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                        <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd"/>
                    </svg>
                    Sign Out
                </button>
            </div>
        `;
        
        // Add event listeners
        dropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.target.closest('.dropdown-item').dataset.action;
                handleProfileAction(action);
                dropdown.remove();
            });
        });
    });
    
    // Add dropdown styles
    const style = document.createElement('style');
    style.textContent = `
        .dropdown-item {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            padding: 12px 16px;
            background: none;
            border: none;
            text-align: left;
            cursor: pointer;
            color: #374151;
            font-size: 14px;
            transition: background-color 0.2s ease;
        }
        .dropdown-item:hover {
            background: #f9fafb;
        }
        .dropdown-item svg {
            color: #6b7280;
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(dropdown);
    
    // Close on click outside
    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target) && e.target !== profileButton) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 0);
}

async function updateHeaderDisplay() {
    const storageManager = new window.StorageManager();
    const account = await storageManager.getAccount();
    
    if (account) {
        // User is signed in - show profile button
        if (signInButton) signInButton.style.display = 'none';
        if (profileButton) profileButton.style.display = 'flex';
    } else {
        // User is anonymous - show sign in button
        if (signInButton) signInButton.style.display = 'block';
        if (profileButton) profileButton.style.display = 'none';
    }
}

async function handleProfileAction(action) {
    switch (action) {
        case 'signin':
        case 'upgrade':
            chrome.tabs.create({
                url: 'https://pocketstox.com/upgrade'
            });
            break;
        case 'settings':
            // Could show settings modal or open settings page
            alert('Settings coming soon!');
            break;
        case 'signout':
            const storageManager = new window.StorageManager();
            await storageManager.clearAccount();
            updateUsageDisplay();
            updateHeaderDisplay();
            break;
    }
}

