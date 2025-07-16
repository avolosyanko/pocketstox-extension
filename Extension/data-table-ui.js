// Data Table UI - shadcn-style table component for article history
(function() {
    'use strict';
    
    console.log('Data Table UI: Initializing...');
    
    let selectedArticles = new Set();
    let allArticles = [];
    let sortColumn = 'timestamp';
    let sortDirection = 'desc';
    let searchTerm = '';
    
    function createDataTableUI() {
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
        
        // Header with search and actions
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 20px;
            border-bottom: 1px solid #e5e7eb;
            background: white;
        `;
        
        header.innerHTML = `
            <div style="display: flex; items-center; justify-content: between; gap: 16px; margin-bottom: 16px;">
                <div style="flex: 1;">
                    <h1 style="margin: 0 0 4px 0; font-size: 24px; font-weight: 700; color: #111827;">Article History</h1>
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">Manage your analyzed articles and stock mentions</p>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button id="export-btn" style="
                        background: white;
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        padding: 8px 16px;
                        font-size: 14px;
                        font-weight: 500;
                        color: #374151;
                        cursor: pointer;
                        transition: all 0.2s;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    ">📊 Export</button>
                    <button id="refresh-btn" style="
                        background: #6366f1;
                        border: 1px solid #6366f1;
                        border-radius: 6px;
                        padding: 8px 16px;
                        font-size: 14px;
                        font-weight: 500;
                        color: white;
                        cursor: pointer;
                        transition: all 0.2s;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    ">🔄 Refresh</button>
                </div>
            </div>
            
            <div style="display: flex; items-center; gap: 12px;">
                <div style="flex: 1; position: relative;">
                    <input id="search-input" type="text" placeholder="Search articles..." style="
                        width: 100%;
                        padding: 8px 12px 8px 36px;
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        font-size: 14px;
                        background: white;
                        transition: all 0.2s;
                    ">
                    <span style="
                        position: absolute;
                        left: 12px;
                        top: 50%;
                        transform: translateY(-50%);
                        color: #9ca3af;
                        font-size: 14px;
                    ">🔍</span>
                </div>
                <button id="delete-selected-btn" style="
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    border-radius: 6px;
                    padding: 8px 16px;
                    font-size: 14px;
                    font-weight: 500;
                    color: #dc2626;
                    cursor: pointer;
                    transition: all 0.2s;
                    opacity: 0.5;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                " disabled>🗑️ Delete Selected</button>
            </div>
        `;
        
        // Selection info bar
        const selectionBar = document.createElement('div');
        selectionBar.id = 'selection-bar';
        selectionBar.style.cssText = `
            padding: 12px 20px;
            background: #eff6ff;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
            color: #1e40af;
            display: none;
            align-items: center;
            justify-content: between;
        `;
        
        // Table container
        const tableContainer = document.createElement('div');
        tableContainer.style.cssText = `
            flex: 1;
            overflow: auto;
            background: white;
        `;
        tableContainer.id = 'table-container';
        
        // Assemble the UI
        container.appendChild(header);
        container.appendChild(selectionBar);
        container.appendChild(tableContainer);
        root.appendChild(container);
        
        setupEventListeners();
        console.log('Data Table UI: Structure created');
        loadArticlesTable();
    }
    
    function createTable(articles) {
        const table = document.createElement('table');
        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            background: white;
        `;
        
        // Table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr style="border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
                <th style="padding: 12px 20px; text-align: left; width: 40px;">
                    <input type="checkbox" id="select-all-checkbox" style="
                        width: 16px;
                        height: 16px;
                        accent-color: #6366f1;
                        cursor: pointer;
                    ">
                </th>
                <th data-column="title" style="
                    padding: 12px 20px;
                    text-align: left;
                    font-size: 12px;
                    font-weight: 600;
                    color: #374151;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    user-select: none;
                    position: relative;
                ">
                    Article Title
                    <span class="sort-indicator" style="margin-left: 4px; color: #9ca3af;">↕️</span>
                </th>
                <th data-column="timestamp" style="
                    padding: 12px 20px;
                    text-align: left;
                    font-size: 12px;
                    font-weight: 600;
                    color: #374151;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    user-select: none;
                    width: 120px;
                ">
                    Date
                    <span class="sort-indicator" style="margin-left: 4px; color: #6366f1;">↓</span>
                </th>
                <th data-column="source" style="
                    padding: 12px 20px;
                    text-align: left;
                    font-size: 12px;
                    font-weight: 600;
                    color: #374151;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    user-select: none;
                    width: 120px;
                ">
                    Source
                    <span class="sort-indicator" style="margin-left: 4px; color: #9ca3af;">↕️</span>
                </th>
                <th style="
                    padding: 12px 20px;
                    text-align: left;
                    font-size: 12px;
                    font-weight: 600;
                    color: #374151;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    width: 200px;
                ">
                    Stocks
                </th>
                <th style="
                    padding: 12px 20px;
                    text-align: center;
                    font-size: 12px;
                    font-weight: 600;
                    color: #374151;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    width: 80px;
                ">
                    Actions
                </th>
            </tr>
        `;
        
        // Table body
        const tbody = document.createElement('tbody');
        
        articles.forEach((article, index) => {
            const row = createTableRow(article, index);
            tbody.appendChild(row);
        });
        
        table.appendChild(thead);
        table.appendChild(tbody);
        
        // Add column click handlers for sorting
        const columnHeaders = thead.querySelectorAll('th[data-column]');
        columnHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.column;
                handleSort(column);
            });
        });
        
        // Add select all handler
        const selectAllCheckbox = thead.querySelector('#select-all-checkbox');
        selectAllCheckbox.addEventListener('change', handleSelectAll);
        
        return table;
    }
    
    function createTableRow(article, index) {
        const row = document.createElement('tr');
        row.style.cssText = `
            border-bottom: 1px solid #f3f4f6;
            transition: background-color 0.2s;
        `;
        
        // Hover effect
        row.addEventListener('mouseenter', () => {
            if (!selectedArticles.has(article.id)) {
                row.style.backgroundColor = '#f9fafb';
            }
        });
        row.addEventListener('mouseleave', () => {
            if (!selectedArticles.has(article.id)) {
                row.style.backgroundColor = 'white';
            }
        });
        
        // Checkbox cell
        const checkboxCell = document.createElement('td');
        checkboxCell.style.cssText = 'padding: 12px 20px; vertical-align: top;';
        checkboxCell.innerHTML = `
            <input type="checkbox" data-article-id="${article.id}" style="
                width: 16px;
                height: 16px;
                accent-color: #6366f1;
                cursor: pointer;
            ">
        `;
        
        // Title cell
        const titleCell = document.createElement('td');
        titleCell.style.cssText = 'padding: 12px 20px; vertical-align: top;';
        titleCell.innerHTML = `
            <div style="font-weight: 500; color: #111827; margin-bottom: 4px; line-height: 1.4;">
                ${article.title || 'Untitled Article'}
            </div>
            <div style="font-size: 12px; color: #6b7280;">
                ID: ${article.id}
            </div>
        `;
        
        // Date cell
        const dateCell = document.createElement('td');
        dateCell.style.cssText = 'padding: 12px 20px; vertical-align: top; font-size: 13px; color: #6b7280;';
        let formattedDate = 'Unknown';
        try {
            if (article.timestamp) {
                formattedDate = new Date(article.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
            }
        } catch (error) {
            console.log('Error parsing date:', error);
        }
        dateCell.textContent = formattedDate;
        
        // Source cell
        const sourceCell = document.createElement('td');
        sourceCell.style.cssText = 'padding: 12px 20px; vertical-align: top; font-size: 13px; color: #6b7280;';
        let source = 'Unknown';
        try {
            if (article.url) {
                source = new URL(article.url).hostname.replace('www.', '');
            }
        } catch (error) {
            console.log('Error parsing URL:', error);
        }
        sourceCell.textContent = source;
        
        // Stocks cell
        const stocksCell = document.createElement('td');
        stocksCell.style.cssText = 'padding: 12px 20px; vertical-align: top;';
        
        if (article.matches && article.matches.length > 0) {
            const stockBadges = article.matches.slice(0, 3).map(stock => 
                `<span style="
                    display: inline-block;
                    background: #f0f9ff;
                    color: #0369a1;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    margin-right: 4px;
                    margin-bottom: 2px;
                    border: 1px solid #bae6fd;
                ">${stock.ticker}</span>`
            ).join('');
            
            const extraCount = article.matches.length > 3 ? 
                `<span style="font-size: 11px; color: #6b7280;">+${article.matches.length - 3}</span>` : '';
            
            stocksCell.innerHTML = stockBadges + extraCount;
        } else {
            stocksCell.innerHTML = '<span style="color: #9ca3af; font-size: 12px;">No stocks</span>';
        }
        
        // Actions cell
        const actionsCell = document.createElement('td');
        actionsCell.style.cssText = 'padding: 12px 20px; vertical-align: top; text-align: center;';
        actionsCell.innerHTML = `
            <button data-article-id="${article.id}" class="view-btn" style="
                background: #f3f4f6;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                padding: 4px 8px;
                font-size: 12px;
                color: #374151;
                cursor: pointer;
                margin-right: 4px;
                transition: all 0.2s;
            ">👁️</button>
            <button data-article-id="${article.id}" class="delete-btn" style="
                background: #fef2f2;
                border: 1px solid #fecaca;
                border-radius: 4px;
                padding: 4px 8px;
                font-size: 12px;
                color: #dc2626;
                cursor: pointer;
                transition: all 0.2s;
            ">🗑️</button>
        `;
        
        // Add event listeners
        const checkbox = checkboxCell.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => toggleArticleSelection(article, row));
        
        const viewBtn = actionsCell.querySelector('.view-btn');
        viewBtn.addEventListener('click', () => viewArticle(article));
        
        const deleteBtn = actionsCell.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteArticle(article.id));
        
        row.appendChild(checkboxCell);
        row.appendChild(titleCell);
        row.appendChild(dateCell);
        row.appendChild(sourceCell);
        row.appendChild(stocksCell);
        row.appendChild(actionsCell);
        
        return row;
    }
    
    function handleSort(column) {
        if (sortColumn === column) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortColumn = column;
            sortDirection = 'desc';
        }
        
        renderTable();
    }
    
    function handleSelectAll() {
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        const shouldSelectAll = selectAllCheckbox.checked;
        
        const rowCheckboxes = document.querySelectorAll('tbody input[type="checkbox"]');
        rowCheckboxes.forEach(checkbox => {
            checkbox.checked = shouldSelectAll;
            const articleId = checkbox.dataset.articleId;
            const row = checkbox.closest('tr');
            
            if (shouldSelectAll) {
                selectedArticles.add(articleId);
                row.style.backgroundColor = '#eff6ff';
            } else {
                selectedArticles.delete(articleId);
                row.style.backgroundColor = 'white';
            }
        });
        
        updateSelectionUI();
    }
    
    function toggleArticleSelection(article, row) {
        const checkbox = row.querySelector('input[type="checkbox"]');
        
        if (checkbox.checked) {
            selectedArticles.add(article.id);
            row.style.backgroundColor = '#eff6ff';
        } else {
            selectedArticles.delete(article.id);
            row.style.backgroundColor = 'white';
        }
        
        updateSelectionUI();
    }
    
    function updateSelectionUI() {
        const selectionBar = document.getElementById('selection-bar');
        const deleteBtn = document.getElementById('delete-selected-btn');
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        
        const selectedCount = selectedArticles.size;
        const totalCount = allArticles.length;
        
        if (selectedCount > 0) {
            selectionBar.style.display = 'flex';
            selectionBar.innerHTML = `
                <span>${selectedCount} of ${totalCount} articles selected</span>
                <button onclick="selectedArticles.clear(); renderTable();" style="
                    background: transparent;
                    border: none;
                    color: #6366f1;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                ">Clear selection</button>
            `;
            
            deleteBtn.disabled = false;
            deleteBtn.style.opacity = '1';
            
            selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < totalCount;
            selectAllCheckbox.checked = selectedCount === totalCount;
        } else {
            selectionBar.style.display = 'none';
            deleteBtn.disabled = true;
            deleteBtn.style.opacity = '0.5';
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.checked = false;
        }
    }
    
    function setupEventListeners() {
        // Search functionality
        document.getElementById('search-input').addEventListener('input', (e) => {
            searchTerm = e.target.value.toLowerCase();
            renderTable();
        });
        
        // Refresh button
        document.getElementById('refresh-btn').addEventListener('click', () => {
            loadArticlesTable();
        });
        
        // Export button
        document.getElementById('export-btn').addEventListener('click', () => {
            exportArticles();
        });
        
        // Delete selected
        document.getElementById('delete-selected-btn').addEventListener('click', () => {
            deleteSelectedArticles();
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
            let aValue, bValue;
            
            switch (sortColumn) {
                case 'title':
                    aValue = a.title || '';
                    bValue = b.title || '';
                    break;
                case 'timestamp':
                    aValue = new Date(a.timestamp || 0);
                    bValue = new Date(b.timestamp || 0);
                    break;
                case 'source':
                    aValue = a.url ? new URL(a.url).hostname : '';
                    bValue = b.url ? new URL(b.url).hostname : '';
                    break;
                default:
                    return 0;
            }
            
            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        
        return filtered;
    }
    
    function renderTable() {
        const container = document.getElementById('table-container');
        if (!container) return;
        
        const filteredArticles = filterAndSortArticles(allArticles);
        
        if (filteredArticles.length === 0) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; padding: 60px; color: #6b7280;">
                    <div style="text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 16px;">📄</div>
                        <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #374151;">
                            ${searchTerm ? 'No articles found' : 'No articles yet'}
                        </h3>
                        <p style="margin: 0; font-size: 14px;">
                            ${searchTerm ? 'Try adjusting your search terms.' : 'Your analyzed articles will appear here.'}
                        </p>
                    </div>
                </div>
            `;
        } else {
            const table = createTable(filteredArticles);
            container.innerHTML = '';
            container.appendChild(table);
        }
        
        updateSelectionUI();
    }
    
    function viewArticle(article) {
        alert(`Article: ${article.title}\nURL: ${article.url}\nStocks: ${article.matches?.map(m => m.ticker).join(', ') || 'None'}`);
    }
    
    async function deleteArticle(articleId) {
        if (!confirm('Are you sure you want to delete this article?')) return;
        
        try {
            if (window.extensionServices?.storage?.deleteArticle) {
                await window.extensionServices.storage.deleteArticle(articleId);
            } else if (typeof StorageManager !== 'undefined') {
                const manager = new StorageManager();
                await manager.deleteAnalysis(articleId);
            }
            
            selectedArticles.delete(articleId);
            loadArticlesTable();
        } catch (error) {
            console.error('Error deleting article:', error);
            alert('Error deleting article. Please try again.');
        }
    }
    
    async function deleteSelectedArticles() {
        if (selectedArticles.size === 0) return;
        
        if (!confirm(`Are you sure you want to delete ${selectedArticles.size} selected article(s)?`)) return;
        
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
            loadArticlesTable();
        } catch (error) {
            console.error('Error deleting articles:', error);
            alert('Error deleting articles. Please try again.');
        }
    }
    
    function exportArticles() {
        const dataStr = JSON.stringify(allArticles, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `pocketstox-articles-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }
    
    function showLoadingState() {
        const container = document.getElementById('table-container');
        if (!container) return;
        
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; padding: 60px; color: #6b7280;">
                <div style="text-align: center;">
                    <div style="width: 40px; height: 40px; border: 3px solid #f3f4f6; border-top: 3px solid #6366f1; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
                    <p style="margin: 0; font-size: 16px; font-weight: 500;">Loading articles...</p>
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
    
    async function loadArticlesTable() {
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
                        console.log('Data Table UI: Loaded', articles.length, 'articles from Chrome storage');
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
                        console.log('Data Table UI: Loaded', articles.length, 'articles from StorageManager');
                    }
                } catch (error) {
                    console.log('StorageManager access failed:', error);
                }
            }
            
            allArticles = articles;
            renderTable();
            
        } catch (error) {
            console.error('Data Table UI: Error loading articles:', error);
            const container = document.getElementById('table-container');
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; padding: 60px; color: #dc2626;">
                    <div style="text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                        <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 600;">Error loading articles</h3>
                        <p style="margin: 0; font-size: 14px;">Please try refreshing the page.</p>
                    </div>
                </div>
            `;
        }
    }
    
    // Make reload function available globally
    window.reloadArticlesTable = loadArticlesTable;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createDataTableUI);
    } else {
        createDataTableUI();
    }
    
    console.log('Data Table UI: Ready');
    
})();