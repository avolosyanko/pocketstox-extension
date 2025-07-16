// Tab Navigation - Vanilla JavaScript implementation
(function() {
    'use strict';
    
    console.log('Tab Navigation: Initializing...');
    
    let currentTab = 'articles';
    
    const tabs = [
        { id: 'articles', label: 'Discover', icon: '⚡' },
        { id: 'patterns', label: 'Analytics', icon: '📈' },
        { id: 'community', label: 'Portfolio', icon: '📊' },
        { id: 'account', label: 'Account', icon: '👤' }
    ];
    
    function createTabNavigation() {
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
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
        `;
        
        // Tab navigation bar
        const tabBar = document.createElement('div');
        tabBar.style.cssText = `
            display: flex;
            background: white;
            border-bottom: 1px solid #e5e7eb;
            position: sticky;
            top: 0;
            z-index: 10;
        `;
        
        // Create tab buttons
        tabs.forEach(tab => {
            const tabButton = document.createElement('button');
            tabButton.id = `tab-${tab.id}`;
            tabButton.style.cssText = `
                flex: 1;
                padding: 12px 8px;
                border: none;
                background: none;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                border-bottom: 2px solid transparent;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                color: #6b7280;
            `;
            
            tabButton.innerHTML = `
                <span style="font-size: 16px;">${tab.icon}</span>
                <span class="tab-full-text">${tab.label}</span>
                <span class="tab-short-text" style="display: none;">${tab.label.slice(0, 3)}</span>
            `;
            
            tabButton.addEventListener('click', () => switchToTab(tab.id));
            tabBar.appendChild(tabButton);
        });
        
        // Content area
        const contentArea = document.createElement('div');
        contentArea.id = 'tab-content';
        contentArea.style.cssText = `
            flex: 1;
            overflow-y: auto;
        `;
        
        // Assemble the UI
        container.appendChild(tabBar);
        container.appendChild(contentArea);
        root.appendChild(container);
        
        console.log('Tab Navigation: Structure created');
        
        // Initialize with the articles tab
        switchToTab('articles');
    }
    
    function switchToTab(tabId) {
        console.log('Tab Navigation: Switching to', tabId);
        currentTab = tabId;
        
        // Update tab button states
        tabs.forEach(tab => {
            const tabButton = document.getElementById(`tab-${tab.id}`);
            if (tabButton) {
                if (tab.id === tabId) {
                    tabButton.style.color = '#6366f1';
                    tabButton.style.borderBottomColor = '#6366f1';
                    tabButton.style.backgroundColor = '#f8fafc';
                } else {
                    tabButton.style.color = '#6b7280';
                    tabButton.style.borderBottomColor = 'transparent';
                    tabButton.style.backgroundColor = 'transparent';
                }
            }
        });
        
        // Load the appropriate content
        loadTabContent(tabId);
    }
    
    function loadTabContent(tabId) {
        const contentArea = document.getElementById('tab-content');
        if (!contentArea) return;
        
        // Clear existing content
        contentArea.innerHTML = '';
        
        switch (tabId) {
            case 'articles':
                loadArticlesTab(contentArea);
                break;
            case 'patterns':
                loadPatternsTab(contentArea);
                break;
            case 'community':
                loadCommunityTab(contentArea);
                break;
            case 'account':
                loadAccountTab(contentArea);
                break;
            default:
                loadArticlesTab(contentArea);
        }
    }
    
    function loadArticlesTab(container) {
        // Create a temporary container for the checkbox list UI
        const articlesContainer = document.createElement('div');
        articlesContainer.id = 'articles-tab-content';
        articlesContainer.style.cssText = `
            width: 100%;
            height: 100%;
        `;
        container.appendChild(articlesContainer);
        
        // Load the checkbox list UI content into this container
        loadCheckboxListContent(articlesContainer);
    }
    
    function loadCheckboxListContent(container) {
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
                    <button id="articles-select-all-btn" style="
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
                    <button id="articles-delete-selected-btn" style="
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
                <input id="articles-search-input" type="text" placeholder="Search articles..." style="
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
        selectionInfo.id = 'articles-selection-info';
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
        listContainer.id = 'articles-list-container';
        
        // Assemble the content
        container.appendChild(generateSection);
        container.appendChild(header);
        container.appendChild(selectionInfo);
        container.appendChild(listContainer);
        
        // Initialize the articles functionality
        if (window.reloadArticlesList) {
            window.reloadArticlesList();
        }
    }
    
    function loadPatternsTab(container) {
        container.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #6b7280;">
                <div style="font-size: 48px; margin-bottom: 16px;">📈</div>
                <h2 style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #374151;">Analytics</h2>
                <p style="margin: 0; font-size: 14px;">Pattern analysis and market insights coming soon.</p>
            </div>
        `;
    }
    
    function loadCommunityTab(container) {
        container.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #6b7280;">
                <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
                <h2 style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #374151;">Portfolio</h2>
                <p style="margin: 0; font-size: 14px;">Portfolio tracking and community features coming soon.</p>
            </div>
        `;
    }
    
    function loadAccountTab(container) {
        container.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #6b7280;">
                <div style="font-size: 48px; margin-bottom: 16px;">👤</div>
                <h2 style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #374151;">Account</h2>
                <p style="margin: 0; font-size: 14px;">Account settings and preferences coming soon.</p>
            </div>
        `;
    }
    
    // Make tab switching available globally
    window.switchToTab = switchToTab;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createTabNavigation);
    } else {
        createTabNavigation();
    }
    
    console.log('Tab Navigation: Ready');
    
})();