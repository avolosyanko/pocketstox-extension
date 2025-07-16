// Compact Professional UI - Optimized for narrow side panels
(function() {
    'use strict';
    
    console.log('Compact Professional UI: Initializing...');
    
    let selectedArticles = new Set();
    let allArticles = [];
    let sortOrder = 'newest'; // newest, oldest, alphabetical
    let searchTerm = '';
    
    function createCompactProfessionalUI() {
        const root = document.getElementById('root');
        if (!root) return;
        
        // Clear any existing content
        root.innerHTML = '';
        
        // Create the main container
        const container = document.createElement('div');
        container.style.cssText = `
            width: 100%;
            min-height: 100vh;
            background: #fafbfc;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            display: flex;
            flex-direction: column;
        `;
        
        // Header section
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 16px 20px;
            background: white;
            border-bottom: 1px solid #e1e5e9;
            position: sticky;
            top: 0;
            z-index: 10;
        `;
        
        header.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <div>
                    <h1 style="margin: 0; font-size: 18px; font-weight: 600; color: #172b4d;">Portfolio Analysis</h1>
                    <p style="margin: 2px 0 0 0; font-size: 13px; color: #5e6c84;">Investment research history</p>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button id="sort-btn" style="
                        background: #f4f5f7;
                        border: 1px solid #dfe1e6;
                        border-radius: 4px;
                        padding: 6px 10px;
                        font-size: 12px;
                        color: #42526e;
                        cursor: pointer;
                        font-weight: 500;
                    ">📊 Sort</button>
                    <button id="bulk-actions-btn" style="
                        background: #0052cc;
                        border: 1px solid #0052cc;
                        border-radius: 4px;
                        padding: 6px 10px;
                        font-size: 12px;
                        color: white;
                        cursor: pointer;
                        font-weight: 500;
                        opacity: 0.6;
                    " disabled>Actions</button>
                </div>
            </div>
            
            <div style="position: relative;">
                <input id="search-input" type="text" placeholder="Search articles or tickers..." style="
                    width: 100%;
                    padding: 8px 12px 8px 32px;
                    border: 1px solid #dfe1e6;
                    border-radius: 4px;
                    font-size: 13px;
                    background: white;
                    box-sizing: border-box;
                ">
                <span style="
                    position: absolute;
                    left: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #8993a4;
                    font-size: 14px;
                ">🔍</span>
            </div>
        `;
        
        // Selection summary bar
        const selectionBar = document.createElement('div');
        selectionBar.id = 'selection-bar';
        selectionBar.style.cssText = `
            padding: 8px 20px;
            background: #e3fcef;
            border-bottom: 1px solid #abf5d1;
            font-size: 12px;
            color: #006644;
            display: none;
            align-items: center;
            justify-content: space-between;
        `;
        
        // Articles list container
        const listContainer = document.createElement('div');
        listContainer.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 8px 20px 20px 20px;
        `;
        listContainer.id = 'articles-list';
        
        // Assemble the UI
        container.appendChild(header);
        container.appendChild(selectionBar);
        container.appendChild(listContainer);
        root.appendChild(container);
        
        setupEventListeners();
        console.log('Compact Professional UI: Structure created');
        loadArticlesList();
    }
    
    function createCompactArticleCard(article, index) {
        const card = document.createElement('div');
        card.style.cssText = `
            background: white;
            border: 1px solid #e1e5e9;
            border-radius: 6px;
            margin-bottom: 8px;
            transition: all 0.2s ease;
            cursor: pointer;
            position: relative;
        `;
        
        // Hover effects
        card.addEventListener('mouseenter', () => {
            card.style.borderColor = '#0052cc';
            card.style.boxShadow = '0 2px 8px rgba(0, 82, 204, 0.12)';
        });
        card.addEventListener('mouseleave', () => {
            const isSelected = selectedArticles.has(article.id);
            card.style.borderColor = isSelected ? '#0052cc' : '#e1e5e9';
            card.style.boxShadow = isSelected ? '0 2px 8px rgba(0, 82, 204, 0.12)' : 'none';
        });
        
        // Selection checkbox (top-right corner)
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `article-${article.id}`;
        checkbox.style.cssText = `
            position: absolute;
            top: 12px;
            right: 12px;
            width: 16px;
            height: 16px;
            accent-color: #0052cc;
            cursor: pointer;
            z-index: 2;
        `;
        
        // Main content area
        const content = document.createElement('div');
        content.style.cssText = `
            padding: 12px 40px 12px 12px;
        `;
        
        // Title with truncation
        const title = document.createElement('h3');
        title.style.cssText = `
            margin: 0 0 6px 0;
            font-size: 14px;
            font-weight: 600;
            color: #172b4d;
            line-height: 1.3;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        `;
        title.textContent = article.title || 'Untitled Analysis';
        
        // Meta row (date and source)
        const meta = document.createElement('div');
        meta.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            font-size: 11px;
            color: #5e6c84;
        `;
        
        let timestamp = 'Unknown';
        try {
            if (article.timestamp) {
                const date = new Date(article.timestamp);
                timestamp = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });
            }
        } catch (error) {
            console.log('Error parsing timestamp:', error);
        }
        
        let source = '';
        try {
            if (article.url) {
                source = new URL(article.url).hostname.replace('www.', '').split('.')[0];
                source = source.charAt(0).toUpperCase() + source.slice(1);
            }
        } catch (error) {
            console.log('Error parsing URL:', error);
        }
        
        meta.innerHTML = `
            <span style="display: flex; align-items: center; gap: 3px;">
                <span style="color: #8993a4;">📅</span>
                <span>${timestamp}</span>
            </span>
            ${source ? `<span style="color: #8993a4;">•</span><span>${source}</span>` : ''}
        `;
        
        // Stock tickers row
        const stocksRow = document.createElement('div');
        stocksRow.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            align-items: center;
        `;
        
        if (article.matches && article.matches.length > 0) {
            // Show up to 4 tickers in compact format
            const visibleTickers = article.matches.slice(0, 4);
            
            visibleTickers.forEach(stock => {
                const ticker = document.createElement('span');
                ticker.style.cssText = `
                    background: #f4f5f7;
                    color: #42526e;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 10px;
                    font-weight: 600;
                    font-family: 'SF Mono', Monaco, monospace;
                    border: 1px solid #e1e5e9;
                `;
                ticker.textContent = stock.ticker;
                stocksRow.appendChild(ticker);
            });
            
            if (article.matches.length > 4) {
                const moreLabel = document.createElement('span');
                moreLabel.style.cssText = `
                    font-size: 10px;
                    color: #8993a4;
                    font-weight: 500;
                `;
                moreLabel.textContent = `+${article.matches.length - 4}`;
                stocksRow.appendChild(moreLabel);
            }
        } else {
            const noStocks = document.createElement('span');
            noStocks.style.cssText = `
                font-size: 11px;
                color: #8993a4;
                font-style: italic;
            `;
            noStocks.textContent = 'No tickers identified';
            stocksRow.appendChild(noStocks);
        }
        
        // Assemble the card
        content.appendChild(title);
        content.appendChild(meta);
        content.appendChild(stocksRow);
        
        card.appendChild(checkbox);
        card.appendChild(content);
        
        // Event handlers
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            toggleArticleSelection(article, card);
        });
        
        card.addEventListener('click', (e) => {
            if (e.target === checkbox) return;
            checkbox.checked = !checkbox.checked;
            toggleArticleSelection(article, card);
        });
        
        return card;
    }
    
    function toggleArticleSelection(article, card) {
        const checkbox = card.querySelector('input[type="checkbox"]');
        const isSelected = checkbox.checked;
        
        if (isSelected) {
            selectedArticles.add(article.id);
            card.style.borderColor = '#0052cc';
            card.style.backgroundColor = '#f4f7ff';
            card.style.boxShadow = '0 2px 8px rgba(0, 82, 204, 0.12)';
        } else {
            selectedArticles.delete(article.id);
            card.style.borderColor = '#e1e5e9';
            card.style.backgroundColor = 'white';
            card.style.boxShadow = 'none';
        }
        
        updateSelectionUI();
    }
    
    function updateSelectionUI() {
        const selectionBar = document.getElementById('selection-bar');
        const bulkActionsBtn = document.getElementById('bulk-actions-btn');
        
        const selectedCount = selectedArticles.size;
        const totalCount = allArticles.length;
        
        if (selectedCount > 0) {
            selectionBar.style.display = 'flex';
            selectionBar.innerHTML = `
                <span style="font-weight: 500;">${selectedCount} article${selectedCount > 1 ? 's' : ''} selected</span>
                <div style="display: flex; gap: 8px;">
                    <button onclick="window.exportSelected()" style="
                        background: transparent;
                        border: none;
                        color: #006644;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: 500;
                        text-decoration: underline;
                    ">Export</button>
                    <button onclick="window.deleteSelected()" style="
                        background: transparent;
                        border: none;
                        color: #de350b;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: 500;
                        text-decoration: underline;
                    ">Delete</button>
                    <button onclick="window.clearSelection()" style="
                        background: transparent;
                        border: none;
                        color: #006644;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: 500;
                    ">✕</button>
                </div>
            `;
            
            bulkActionsBtn.disabled = false;
            bulkActionsBtn.style.opacity = '1';
        } else {
            selectionBar.style.display = 'none';
            bulkActionsBtn.disabled = true;
            bulkActionsBtn.style.opacity = '0.6';
        }
    }
    
    function setupEventListeners() {
        // Search functionality
        document.getElementById('search-input').addEventListener('input', (e) => {
            searchTerm = e.target.value.toLowerCase();
            renderArticlesList();
        });
        
        // Sort button
        document.getElementById('sort-btn').addEventListener('click', () => {
            const sortOptions = ['newest', 'oldest', 'alphabetical'];
            const currentIndex = sortOptions.indexOf(sortOrder);
            sortOrder = sortOptions[(currentIndex + 1) % sortOptions.length];
            
            const sortBtn = document.getElementById('sort-btn');
            const sortLabels = {
                'newest': '📊 Newest',
                'oldest': '📊 Oldest', 
                'alphabetical': '📊 A-Z'
            };
            sortBtn.textContent = sortLabels[sortOrder];
            
            renderArticlesList();
        });
        
        // Bulk actions
        document.getElementById('bulk-actions-btn').addEventListener('click', () => {
            if (selectedArticles.size === 0) return;
            
            const menu = document.createElement('div');
            menu.style.cssText = `
                position: absolute;
                top: 100%;
                right: 0;
                background: white;
                border: 1px solid #dfe1e6;
                border-radius: 4px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 100;
                min-width: 120px;
            `;
            
            menu.innerHTML = `
                <button onclick="window.exportSelected(); this.parentElement.remove()" style="
                    display: block;
                    width: 100%;
                    padding: 8px 12px;
                    border: none;
                    background: none;
                    text-align: left;
                    cursor: pointer;
                    font-size: 13px;
                    color: #42526e;
                ">📊 Export Selected</button>
                <button onclick="window.deleteSelected(); this.parentElement.remove()" style="
                    display: block;
                    width: 100%;
                    padding: 8px 12px;
                    border: none;
                    background: none;
                    text-align: left;
                    cursor: pointer;
                    font-size: 13px;
                    color: #de350b;
                ">🗑️ Delete Selected</button>
            `;
            
            document.body.appendChild(menu);
            
            // Position relative to button
            const btn = document.getElementById('bulk-actions-btn');
            const rect = btn.getBoundingClientRect();
            menu.style.position = 'fixed';
            menu.style.top = rect.bottom + 4 + 'px';
            menu.style.right = (window.innerWidth - rect.right) + 'px';
            
            // Close on click outside
            setTimeout(() => {
                document.addEventListener('click', (e) => {
                    if (!menu.contains(e.target) && e.target !== btn) {
                        menu.remove();
                    }
                }, { once: true });
            }, 100);
        });
    }
    
    function filterAndSortArticles(articles) {
        let filtered = articles;
        
        // Apply search filter
        if (searchTerm) {
            filtered = articles.filter(article => 
                article.title?.toLowerCase().includes(searchTerm) ||
                article.url?.toLowerCase().includes(searchTerm) ||
                article.matches?.some(match => match.ticker.toLowerCase().includes(searchTerm))
            );
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortOrder) {
                case 'newest':
                    return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
                case 'oldest':
                    return new Date(a.timestamp || 0) - new Date(b.timestamp || 0);
                case 'alphabetical':
                    return (a.title || '').localeCompare(b.title || '');
                default:
                    return 0;
            }
        });
        
        return filtered;
    }
    
    function renderArticlesList() {
        const container = document.getElementById('articles-list');
        if (!container) return;
        
        const filteredArticles = filterAndSortArticles(allArticles);
        
        if (filteredArticles.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #8993a4;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
                    <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #42526e;">
                        ${searchTerm ? 'No matching articles' : 'No analyses yet'}
                    </h3>
                    <p style="margin: 0; font-size: 13px; line-height: 1.4;">
                        ${searchTerm ? 'Try adjusting your search terms.' : 'Your investment research will appear here.'}
                    </p>
                </div>
            `;
        } else {
            container.innerHTML = '';
            filteredArticles.forEach((article, index) => {
                const card = createCompactArticleCard(article, index);
                container.appendChild(card);
            });
        }
        
        updateSelectionUI();
    }
    
    function showLoadingState() {
        const container = document.getElementById('articles-list');
        if (!container) return;
        
        container.innerHTML = `
            <div style="padding: 20px;">
                ${[1, 2, 3].map(() => `
                    <div style="
                        background: linear-gradient(90deg, #f4f5f7 25%, #e1e5e9 50%, #f4f5f7 75%);
                        background-size: 200% 100%;
                        animation: shimmer 1.5s infinite;
                        border-radius: 6px;
                        height: 68px;
                        margin-bottom: 8px;
                    "></div>
                `).join('')}
            </div>
            <style>
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            </style>
        `;
    }
    
    async function loadArticlesList() {
        showLoadingState();
        selectedArticles.clear();
        
        try {
            let articles = [];
            
            // Try multiple methods to get articles
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                try {
                    const result = await chrome.storage.local.get(['pocketstox_analyses']);
                    if (result.pocketstox_analyses && result.pocketstox_analyses.length > 0) {
                        articles = result.pocketstox_analyses;
                        console.log('Compact Professional UI: Loaded', articles.length, 'articles from Chrome storage');
                    }
                } catch (error) {
                    console.log('Chrome storage access failed:', error);
                }
            }
            
            if (articles.length === 0 && typeof StorageManager !== 'undefined') {
                try {
                    const manager = new StorageManager();
                    const analyses = await manager.getAllAnalyses();
                    if (analyses && analyses.length > 0) {
                        articles = analyses;
                        console.log('Compact Professional UI: Loaded', articles.length, 'articles from StorageManager');
                    }
                } catch (error) {
                    console.log('StorageManager access failed:', error);
                }
            }
            
            allArticles = articles;
            renderArticlesList();
            
        } catch (error) {
            console.error('Compact Professional UI: Error loading articles:', error);
            const container = document.getElementById('articles-list');
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #de350b;">
                    <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                    <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600;">Error loading analyses</h3>
                    <p style="margin: 0; font-size: 13px;">Please refresh and try again.</p>
                </div>
            `;
        }
    }
    
    // Global functions for selection actions
    window.exportSelected = function() {
        const selected = allArticles.filter(article => selectedArticles.has(article.id));
        const dataStr = JSON.stringify(selected, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `pocketstox-analysis-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    };
    
    window.deleteSelected = async function() {
        if (selectedArticles.size === 0) return;
        
        if (!confirm(`Delete ${selectedArticles.size} selected analysis?`)) return;
        
        try {
            for (const articleId of selectedArticles) {
                if (window.extensionServices?.storage?.deleteArticle) {
                    await window.extensionServices.storage.deleteArticle(articleId);
                } else if (typeof StorageManager !== 'undefined') {
                    const manager = new StorageManager();
                    await manager.deleteAnalysis(articleId);
                }
            }
            
            selectedArticles.clear();
            loadArticlesList();
        } catch (error) {
            console.error('Error deleting articles:', error);
            alert('Error deleting analyses. Please try again.');
        }
    };
    
    window.clearSelection = function() {
        selectedArticles.clear();
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
            const card = checkbox.closest('div');
            if (card) {
                card.style.borderColor = '#e1e5e9';
                card.style.backgroundColor = 'white';
                card.style.boxShadow = 'none';
            }
        });
        updateSelectionUI();
    };
    
    // Make reload function available globally
    window.reloadCompactArticles = loadArticlesList;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createCompactProfessionalUI);
    } else {
        createCompactProfessionalUI();
    }
    
    console.log('Compact Professional UI: Ready');
    
})();