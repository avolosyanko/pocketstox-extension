// Checkbox List UI - shadcn-style interface for article history
(function() {
    'use strict';
    
    console.log('Checkbox List UI: Initializing...');
    
    let selectedArticles = new Set();
    let allArticles = [];
    let searchTerm = '';
    
    function createCheckboxListUI() {
        const root = document.getElementById('root');
        if (!root) return;
        
        // Clear any existing content
        root.innerHTML = '';
        
        // Create the main container
        const container = document.createElement('div');
        container.style.cssText = `
            width: 100%;
            min-height: 100vh;
            background: white;
            font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
        `;
        
        // Generate button section
        const generateSection = document.createElement('div');
        generateSection.style.cssText = `
            padding: 16px;
            border-bottom: 1px solid #e5e7eb;
            background: white;
        `;
        
        const generateButton = document.createElement('button');
        generateButton.style.cssText = `
            width: 100%;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 16px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        `;
        generateButton.textContent = 'Generate Analysis';
        generateButton.addEventListener('mouseenter', () => {
            generateButton.style.transform = 'translateY(-1px)';
            generateButton.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
        });
        generateButton.addEventListener('mouseleave', () => {
            generateButton.style.transform = 'translateY(0)';
            generateButton.style.boxShadow = 'none';
        });
        
        generateSection.appendChild(generateButton);
        
        // Header section
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 16px;
            border-bottom: 1px solid #e5e7eb;
            background: #f9fafb;
        `;
        header.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #111827;">
                    Article History
                </h2>
                <div style="display: flex; gap: 8px;">
                    <button id="select-all-btn" style="
                        background: #f3f4f6;
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        padding: 6px 12px;
                        font-size: 12px;
                        font-weight: 500;
                        color: #374151;
                        cursor: pointer;
                        transition: all 0.2s;
                    ">Select All</button>
                    <button id="delete-selected-btn" style="
                        background: #fef2f2;
                        border: 1px solid #fecaca;
                        border-radius: 6px;
                        padding: 6px 12px;
                        font-size: 12px;
                        font-weight: 500;
                        color: #dc2626;
                        cursor: pointer;
                        transition: all 0.2s;
                        opacity: 0.5;
                    " disabled>Delete Selected</button>
                </div>
            </div>
            
            <div style="position: relative;">
                <input id="search-input" type="text" placeholder="Search articles..." style="
                    width: 100%;
                    padding: 8px 12px 8px 32px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 13px;
                    background: white;
                    transition: all 0.2s;
                    box-sizing: border-box;
                ">
                <span style="
                    position: absolute;
                    left: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #9ca3af;
                    font-size: 14px;
                ">🔍</span>
            </div>
        `;
        
        // Selection counter
        const selectionInfo = document.createElement('div');
        selectionInfo.id = 'selection-info';
        selectionInfo.style.cssText = `
            padding: 8px 16px;
            background: #eff6ff;
            border-bottom: 1px solid #e5e7eb;
            font-size: 12px;
            color: #1e40af;
            display: none;
        `;
        
        // Articles list container
        const listContainer = document.createElement('div');
        listContainer.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 8px;
        `;
        listContainer.id = 'articles-list';
        
        // Assemble the UI
        container.appendChild(generateSection);
        container.appendChild(header);
        container.appendChild(selectionInfo);
        container.appendChild(listContainer);
        root.appendChild(container);
        
        // Add event listeners
        setupEventListeners();
        
        console.log('Checkbox List UI: Structure created');
        loadArticlesList();
    }
    
    function createArticleListItem(article, index) {
        const listItem = document.createElement('div');
        listItem.style.cssText = `
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 12px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 8px;
            background: white;
            transition: all 0.2s;
            cursor: pointer;
        `;
        
        // Hover effects
        listItem.addEventListener('mouseenter', () => {
            listItem.style.borderColor = '#c7d2fe';
            listItem.style.backgroundColor = '#fafbff';
        });
        listItem.addEventListener('mouseleave', () => {
            const isSelected = selectedArticles.has(article.id);
            listItem.style.borderColor = isSelected ? '#6366f1' : '#e5e7eb';
            listItem.style.backgroundColor = isSelected ? '#f0f9ff' : 'white';
        });
        
        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `article-${article.id}`;
        checkbox.style.cssText = `
            width: 16px;
            height: 16px;
            margin-top: 2px;
            accent-color: #6366f1;
            cursor: pointer;
        `;
        
        // Main content area
        const content = document.createElement('div');
        content.style.cssText = `
            flex: 1;
            min-width: 0;
        `;
        
        // Title
        const title = document.createElement('h3');
        title.style.cssText = `
            margin: 0 0 6px 0;
            font-size: 14px;
            font-weight: 600;
            color: #111827;
            line-height: 1.4;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        `;
        title.textContent = article.title || 'Untitled Article';
        
        // Meta information
        const meta = document.createElement('div');
        meta.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            font-size: 11px;
            color: #6b7280;
            flex-wrap: wrap;
        `;
        
        let timestamp = 'Unknown date';
        try {
            if (article.timestamp) {
                timestamp = new Date(article.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        } catch (error) {
            console.log('Error parsing timestamp:', error);
        }
        
        let hostname = '';
        try {
            if (article.url) {
                hostname = new URL(article.url).hostname.replace('www.', '');
            }
        } catch (error) {
            console.log('Error parsing URL:', error);
        }
        
        meta.innerHTML = `
            <span style="display: flex; align-items: center; gap: 4px;">
                <span>${timestamp}</span>
            </span>
            ${hostname ? `<span>•</span><span>${hostname}</span>` : ''}
        `;
        
        // Stock badges
        const stocksContainer = document.createElement('div');
        stocksContainer.style.cssText = `
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
            align-items: center;
        `;
        
        if (article.matches && article.matches.length > 0) {
            const stocksLabel = document.createElement('span');
            stocksLabel.style.cssText = `
                font-size: 10px;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-right: 4px;
            `;
            stocksLabel.textContent = 'Stocks:';
            stocksContainer.appendChild(stocksLabel);
            
            const visibleStocks = article.matches.slice(0, 3);
            visibleStocks.forEach(stock => {
                const badge = document.createElement('span');
                badge.style.cssText = `
                    background: #f3f4f6;
                    color: #374151;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 600;
                    font-family: 'Courier New', monospace;
                    border: 1px solid #e5e7eb;
                `;
                badge.textContent = stock.ticker;
                stocksContainer.appendChild(badge);
            });
            
            if (article.matches.length > 3) {
                const moreLabel = document.createElement('span');
                moreLabel.style.cssText = `
                    font-size: 10px;
                    color: #6b7280;
                    font-weight: 500;
                `;
                moreLabel.textContent = `+${article.matches.length - 3} more`;
                stocksContainer.appendChild(moreLabel);
            }
        }
        
        // Assemble the list item
        content.appendChild(title);
        content.appendChild(meta);
        if (stocksContainer.children.length > 0) {
            content.appendChild(stocksContainer);
        }
        
        listItem.appendChild(checkbox);
        listItem.appendChild(content);
        
        // Click handlers
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            toggleArticleSelection(article, listItem);
        });
        
        listItem.addEventListener('click', (e) => {
            if (e.target === checkbox) return;
            checkbox.checked = !checkbox.checked;
            toggleArticleSelection(article, listItem);
        });
        
        return listItem;
    }
    
    function toggleArticleSelection(article, listItem) {
        const checkbox = listItem.querySelector('input[type="checkbox"]');
        const isSelected = checkbox.checked;
        
        if (isSelected) {
            selectedArticles.add(article.id);
            listItem.style.borderColor = '#6366f1';
            listItem.style.backgroundColor = '#f0f9ff';
        } else {
            selectedArticles.delete(article.id);
            listItem.style.borderColor = '#e5e7eb';
            listItem.style.backgroundColor = 'white';
        }
        
        updateSelectionUI();
    }
    
    function updateSelectionUI() {
        const selectionInfo = document.getElementById('selection-info');
        const deleteBtn = document.getElementById('delete-selected-btn');
        const selectAllBtn = document.getElementById('select-all-btn');
        
        const selectedCount = selectedArticles.size;
        const totalCount = allArticles.length;
        
        if (selectedCount > 0) {
            selectionInfo.style.display = 'block';
            selectionInfo.textContent = `${selectedCount} of ${totalCount} articles selected`;
            deleteBtn.disabled = false;
            deleteBtn.style.opacity = '1';
            selectAllBtn.textContent = selectedCount === totalCount ? 'Deselect All' : 'Select All';
        } else {
            selectionInfo.style.display = 'none';
            deleteBtn.disabled = true;
            deleteBtn.style.opacity = '0.5';
            selectAllBtn.textContent = 'Select All';
        }
    }
    
    function filterArticles(articles, searchTerm) {
        if (!searchTerm) return articles;
        
        return articles.filter(article => 
            article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.matches?.some(match => match.ticker.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }
    
    function renderArticlesList() {
        const container = document.getElementById('articles-list');
        if (!container) return;
        
        const filteredArticles = filterArticles(allArticles, searchTerm);
        container.innerHTML = '';
        
        if (filteredArticles && filteredArticles.length > 0) {
            console.log('Checkbox List UI: Displaying', filteredArticles.length, 'articles');
            filteredArticles.forEach((article, index) => {
                const listItem = createArticleListItem(article, index);
                container.appendChild(listItem);
            });
        } else {
            console.log('Checkbox List UI: No articles found');
            showEmptyState();
        }
        
        updateSelectionUI();
    }
    
    function setupEventListeners() {
        // Search functionality
        document.getElementById('search-input').addEventListener('input', (e) => {
            searchTerm = e.target.value;
            renderArticlesList();
        });
        
        // Select All / Deselect All
        document.getElementById('select-all-btn').addEventListener('click', () => {
            const shouldSelectAll = selectedArticles.size !== allArticles.length;
            
            allArticles.forEach(article => {
                const checkbox = document.getElementById(`article-${article.id}`);
                const listItem = checkbox.closest('div');
                
                if (shouldSelectAll) {
                    selectedArticles.add(article.id);
                    checkbox.checked = true;
                    listItem.style.borderColor = '#6366f1';
                    listItem.style.backgroundColor = '#f0f9ff';
                } else {
                    selectedArticles.delete(article.id);
                    checkbox.checked = false;
                    listItem.style.borderColor = '#e5e7eb';
                    listItem.style.backgroundColor = 'white';
                }
            });
            
            updateSelectionUI();
        });
        
        // Delete Selected
        document.getElementById('delete-selected-btn').addEventListener('click', async () => {
            if (selectedArticles.size === 0) return;
            
            const confirmDelete = confirm(`Are you sure you want to delete ${selectedArticles.size} selected article(s)?`);
            if (!confirmDelete) return;
            
            try {
                // Delete from storage
                for (const articleId of selectedArticles) {
                    if (window.extensionServices?.storage?.deleteArticle) {
                        await window.extensionServices.storage.deleteArticle(articleId);
                    } else if (typeof StorageManager !== 'undefined') {
                        const manager = new StorageManager();
                        await manager.deleteAnalysis(articleId);
                    }
                }
                
                // Clear selection and reload
                selectedArticles.clear();
                loadArticlesList();
                
            } catch (error) {
                console.error('Error deleting articles:', error);
                alert('Error deleting articles. Please try again.');
            }
        });
    }
    
    function showLoadingState() {
        const container = document.getElementById('articles-list');
        if (!container) return;
        
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; padding: 40px; color: #6b7280;">
                <div style="text-align: center;">
                    <div style="width: 40px; height: 40px; border: 3px solid #f3f4f6; border-top: 3px solid #6366f1; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 12px;"></div>
                    <p style="margin: 0; font-size: 14px;">Loading articles...</p>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    }
    
    function showEmptyState() {
        const container = document.getElementById('articles-list');
        if (!container) return;
        
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; padding: 40px; color: #6b7280;">
                <div style="text-align: center;">
                    <div style="width: 60px; height: 60px; background: #f3f4f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">
                        
                    </div>
                    <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #374151;">
                        No articles yet
                    </h3>
                    <p style="margin: 0; font-size: 14px; max-width: 200px;">
                        Your analyzed articles will appear here as a manageable list.
                    </p>
                </div>
            </div>
        `;
    }
    
    async function loadArticlesList() {
        const container = document.getElementById('articles-list');
        if (!container) return;
        
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
                        console.log('Checkbox List UI: Loaded', articles.length, 'articles from Chrome storage');
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
                        console.log('Checkbox List UI: Loaded', articles.length, 'articles from StorageManager');
                    }
                } catch (error) {
                    console.log('StorageManager access failed:', error);
                }
            }
            
            allArticles = articles;
            renderArticlesList();
            
        } catch (error) {
            console.error('Checkbox List UI: Error loading articles:', error);
            showEmptyState();
        }
    }
    
    // Make reload function available globally
    window.reloadArticlesList = loadArticlesList;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createCheckboxListUI);
    } else {
        createCheckboxListUI();
    }
    
    console.log('Checkbox List UI: Ready');
    
})();