// Fallback UI - Vanilla JavaScript implementation
(function() {
    'use strict';
    
    console.log('Fallback UI: Initializing...');
    
    function createFallbackUI() {
        const root = document.getElementById('root');
        if (!root) return;
        
        // Clear any existing content
        root.innerHTML = '';
        
        // Create the basic UI structure
        const container = document.createElement('div');
        container.style.cssText = `
            width: 100%;
            min-height: 100vh;
            background: white;
            font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
        `;
        
        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 16px;
            border-bottom: 1px solid #e5e5e5;
            background: #f8f9fa;
        `;
        header.innerHTML = `
            <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">
                ⚡ Discover
            </h2>
        `;
        
        // Generate button
        const generateSection = document.createElement('div');
        generateSection.style.cssText = `
            padding: 16px;
            border-bottom: 1px solid #e5e5e5;
        `;
        
        const generateButton = document.createElement('button');
        generateButton.style.cssText = `
            width: 100%;
            background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 16px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        `;
        generateButton.innerHTML = '⚡ Generate';
        generateButton.addEventListener('mouseenter', () => {
            generateButton.style.transform = 'translateY(-1px)';
            generateButton.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
        });
        generateButton.addEventListener('mouseleave', () => {
            generateButton.style.transform = 'translateY(0)';
            generateButton.style.boxShadow = 'none';
        });
        generateButton.addEventListener('click', () => {
            // Reset the hasLoadedOnce flag and try to load articles again
            hasLoadedOnce = false;
            loadArticles();
        });
        
        const usageText = document.createElement('div');
        usageText.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 8px;
            font-size: 12px;
            color: #6b7280;
        `;
        usageText.innerHTML = `
            <span>Usage Today</span>
            <span>0/5</span>
        `;
        
        generateSection.appendChild(generateButton);
        generateSection.appendChild(usageText);
        
        // Articles section
        const articlesSection = document.createElement('div');
        articlesSection.style.cssText = `
            flex: 1;
            padding: 16px;
            overflow-y: auto;
        `;
        articlesSection.id = 'articles-container';
        
        // Assemble the UI
        container.appendChild(header);
        container.appendChild(generateSection);
        container.appendChild(articlesSection);
        root.appendChild(container);
        
        console.log('Fallback UI: Basic structure created');
        
        // Load articles
        loadArticles();
    }
    
    function createArticleCard(article) {
        console.log('Creating card for article:', article);
        
        const card = document.createElement('div');
        card.style.cssText = `
            background: white;
            border: 1px solid #e5e5e5;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        `;
        
        // Hover effects
        card.addEventListener('mouseenter', () => {
            card.style.borderColor = '#8B5CF6';
            card.style.transform = 'translateY(-1px)';
            card.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.15)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.borderColor = '#e5e5e5';
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        });
        
        const title = document.createElement('h3');
        title.style.cssText = `
            margin: 0 0 8px 0;
            font-size: 14px;
            font-weight: 600;
            color: #1a1a1a;
            line-height: 1.4;
        `;
        title.textContent = article.title || 'Untitled Article';
        
        const meta = document.createElement('div');
        meta.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            font-size: 12px;
            color: #6b7280;
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
            <span>📄</span>
            <span>${timestamp}</span>
            ${hostname ? `<span>•</span><span>${hostname}</span>` : ''}
        `;
        
        let companiesHTML = '';
        if (article.matches && article.matches.length > 0) {
            const companies = article.matches.slice(0, 4);
            companiesHTML = `
                <div style="margin-top: 8px;">
                    <div style="font-size: 10px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
                        Mentioned Stocks
                    </div>
                    <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                        ${companies.map(company => `
                            <span style="
                                background: #f3f4f6;
                                color: #374151;
                                padding: 2px 6px;
                                border-radius: 4px;
                                font-size: 11px;
                                font-weight: 500;
                                font-family: 'Courier New', monospace;
                            ">${company.ticker}</span>
                        `).join('')}
                        ${article.matches.length > 4 ? `<span style="font-size: 11px; color: #6b7280;">+${article.matches.length - 4} more</span>` : ''}
                    </div>
                </div>
            `;
        }
        
        card.appendChild(title);
        card.appendChild(meta);
        if (companiesHTML) {
            const companiesDiv = document.createElement('div');
            companiesDiv.innerHTML = companiesHTML;
            card.appendChild(companiesDiv);
        }
        
        console.log('Card created successfully');
        return card;
    }
    
    function showEmptyState() {
        const container = document.getElementById('articles-container');
        if (!container) return;
        
        container.innerHTML = `
            <div style="
                border: 2px dashed #d1d5db;
                border-radius: 8px;
                padding: 32px;
                text-align: center;
                color: #6b7280;
            ">
                <div style="
                    background: #f3f4f6;
                    border-radius: 50%;
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px;
                ">
                    📄
                </div>
                <h3 style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #374151;">
                    No analyses yet
                </h3>
                <p style="margin: 0; font-size: 12px;">
                    Click "Generate" above to analyse your first article.
                </p>
            </div>
        `;
    }
    
    function showLoadingState() {
        const container = document.getElementById('articles-container');
        if (!container) return;
        
        container.innerHTML = `
            <div style="space-y: 12px;">
                ${[1, 2, 3].map(() => `
                    <div style="
                        background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
                        background-size: 200% 100%;
                        animation: shimmer 1.5s infinite;
                        border-radius: 8px;
                        height: 80px;
                        margin-bottom: 12px;
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
    
    let hasLoadedOnce = false;
    
    // Make loadArticles available globally for debugging
    window.reloadArticles = function() {
        hasLoadedOnce = false;
        loadArticles();
    };
    
    async function loadArticles() {
        if (hasLoadedOnce) return; // Only load once
        
        const container = document.getElementById('articles-container');
        if (!container) return;
        
        showLoadingState();
        
        try {
            hasLoadedOnce = true;
            container.innerHTML = '';
            
            let articles = [];
            
            // Method 1: Try direct Chrome storage access
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                try {
                    const result = await chrome.storage.local.get(['pocketstox_analyses']);
                    if (result.pocketstox_analyses && result.pocketstox_analyses.length > 0) {
                        articles = result.pocketstox_analyses;
                        console.log('Fallback UI: Loaded', articles.length, 'articles from Chrome storage');
                    }
                } catch (error) {
                    console.log('Fallback UI: Chrome storage access failed:', error);
                }
            }
            
            // Method 2: Try StorageManager if no articles found
            if (articles.length === 0 && typeof StorageManager !== 'undefined') {
                try {
                    const manager = new StorageManager();
                    const analyses = await manager.getAllAnalyses();
                    if (analyses && analyses.length > 0) {
                        articles = analyses;
                        console.log('Fallback UI: Loaded', articles.length, 'articles from StorageManager');
                    }
                } catch (error) {
                    console.log('Fallback UI: StorageManager access failed:', error);
                }
            }
            
            // Method 3: Try extension services if still no articles
            if (articles.length === 0) {
                let attempts = 0;
                while (!window.extensionServices?.storage?.getArticles && attempts < 3) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    attempts++;
                }
                
                if (window.extensionServices?.storage?.getArticles) {
                    try {
                        const serviceArticles = await window.extensionServices.storage.getArticles();
                        if (serviceArticles && serviceArticles.length > 0) {
                            articles = serviceArticles;
                            console.log('Fallback UI: Loaded', articles.length, 'articles from extension services');
                        }
                    } catch (error) {
                        console.log('Fallback UI: Extension services access failed:', error);
                    }
                }
            }
            
            // Display articles or show appropriate state
            if (articles && articles.length > 0) {
                console.log('Fallback UI: Displaying', articles.length, 'real articles');
                console.log('Fallback UI: Article data:', articles);
                
                articles.forEach((article, index) => {
                    try {
                        console.log(`Fallback UI: Creating card for article ${index + 1}:`, article.title);
                        const card = createArticleCard(article);
                        container.appendChild(card);
                    } catch (error) {
                        console.error(`Fallback UI: Error creating card for article ${index + 1}:`, error);
                    }
                });
                
                console.log('Fallback UI: All cards created and added to container');
            } else {
                console.log('Fallback UI: No real articles found, showing empty state');
                showEmptyState();
            }
        } catch (error) {
            hasLoadedOnce = true;
            showEmptyState();
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            try {
                createFallbackUI();
                setTimeout(loadArticles, 2000); // Load articles after UI is ready
            } catch (error) {
                console.error('Fallback UI: Error during initialization:', error);
            }
        });
    } else {
        try {
            createFallbackUI();
            setTimeout(loadArticles, 2000);
        } catch (error) {
            console.error('Fallback UI: Error during initialization:', error);
        }
    }
    
})();