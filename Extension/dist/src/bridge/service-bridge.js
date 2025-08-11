// Create instances of services
console.log('Service Bridge: Checking if AuthService is available:', typeof AuthService !== 'undefined');
console.log('Service Bridge: Checking if StorageManager is available:', typeof StorageManager !== 'undefined');

const authService = typeof AuthService !== 'undefined' ? new AuthService() : null;
const storageManager = typeof StorageManager !== 'undefined' ? new StorageManager() : null;

console.log('Service Bridge: AuthService instance:', authService);
console.log('Service Bridge: StorageManager instance:', storageManager);

// Create global extension services object for React to access
window.extensionServices = {
    auth: {
        signIn: async () => {
            try {
                // Redirect to upgrade page like the original popup
                chrome.tabs.create({
                    url: 'https://pocketstox.com/upgrade'
                });
                return null;
            } catch (error) {
                console.error('Auth sign in failed:', error);
                return null;
            }
        },
        signOut: async () => {
            try {
                if (authService) {
                    // Sign out logic
                    return true;
                }
                return true;
            } catch (error) {
                console.error('Auth sign out failed:', error);
                throw error;
            }
        },
        getUser: async () => {
            try {
                if (storageManager) {
                    const account = await storageManager.getAccount();
                    return account?.user || null;
                }
                return null;
            } catch (error) {
                console.error('Get user failed:', error);
                return null;
            }
        }
    },
    api: {
        extractContent: async () => {
            // Content extraction without token usage
            return new Promise((resolve, reject) => {
                // Set up message listener for content extraction
                const messageListener = (message, sender, sendResponse) => {
                    if (message.action === 'contentExtracted') {
                        chrome.runtime.onMessage.removeListener(messageListener);
                        
                        const { title, content } = message;
                        console.log('Content extracted:', { 
                            titleLength: title ? title.length : 0, 
                            contentLength: content ? content.length : 0 
                        });
                        
                        // Return extracted content without API call
                        resolve({ title, content });
                    }
                };
                
                chrome.runtime.onMessage.addListener(messageListener);
                
                // Execute content extraction scripts
                chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                    if (tabs[0]) {
                        window.currentArticleUrl = tabs[0].url;
                        window.currentArticleTitle = tabs[0].title;
                        
                        chrome.scripting.executeScript({
                            target: {tabId: tabs[0].id},
                            files: ['src/lib/Readability.min.js']
                        }).then(() => {
                            return chrome.scripting.executeScript({
                                target: {tabId: tabs[0].id},
                                files: ['src/content/content.js']
                            });
                        }).catch((error) => {
                            chrome.runtime.onMessage.removeListener(messageListener);
                            reject(error);
                        });
                    } else {
                        chrome.runtime.onMessage.removeListener(messageListener);
                        reject(new Error('No active tab found'));
                    }
                });
            });
        },
        analyzeArticle: async (title, content) => {
            try {
                // Call the API with provided content (will increment usage)
                if (typeof analyzeArticle !== 'undefined') {
                    const result = await analyzeArticle(title, content, true);
                    
                    // Save the analysis using StorageManager
                    if (storageManager && result) {
                        await storageManager.saveAnalysis({
                            title: title,
                            url: window.currentArticleUrl || '',
                            matches: result.matches || [],
                            content: content
                        });
                    }
                    
                    return result;
                } else {
                    throw new Error('analyzeArticle function not found');
                }
            } catch (error) {
                console.error('Article analysis failed:', error);
                throw error;
            }
        },
        getTrendingStocks: async () => {
            try {
                if (typeof APIService !== 'undefined' && APIService.getTrendingStocks) {
                    return await APIService.getTrendingStocks();
                }
                
                // Mock data for development
                return [
                    { symbol: 'NVDA', name: 'NVIDIA Corp', trending: true },
                    { symbol: 'TSLA', name: 'Tesla Inc', trending: true },
                    { symbol: 'AAPL', name: 'Apple Inc', trending: false }
                ];
            } catch (error) {
                console.error('Get trending stocks failed:', error);
                throw error;
            }
        }
    },
    storage: {
        getArticles: async () => {
            try {
                console.log('Service Bridge: getArticles called');
                console.log('Service Bridge: storageManager available:', !!storageManager);
                
                if (storageManager) {
                    console.log('Service Bridge: Calling storageManager.getAllAnalyses()');
                    const analyses = await storageManager.getAllAnalyses();
                    console.log('Service Bridge: getAllAnalyses returned:', analyses);
                    
                    // Transform the data to match ArticleCard expectations
                    const transformedAnalyses = (analyses || []).map(analysis => ({
                        ...analysis,
                        companies: analysis.matches || [], // Map matches to companies
                        snippet: analysis.content ? analysis.content.substring(0, 200) + '...' : '',
                        timestamp: analysis.timestamp || new Date().toISOString(),
                        id: analysis.id || Date.now().toString()
                    }));
                    
                    // Sort by timestamp in descending order (newest first)
                    transformedAnalyses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    
                    console.log('Service Bridge: Transformed analyses:', transformedAnalyses);
                    return transformedAnalyses;
                }
                
                console.log('Service Bridge: storageManager not available, returning empty array');
                return [];
            } catch (error) {
                console.error('Get articles failed:', error);
                return [];
            }
        },
        saveArticle: async (article) => {
            try {
                if (storageManager) {
                    return await storageManager.saveAnalysis(article);
                }
                
                // Mock save for development
                console.log('Mock saving article:', article);
                return { success: true, id: Date.now().toString() };
            } catch (error) {
                console.error('Save article failed:', error);
                throw error;
            }
        },
        deleteArticle: async (id) => {
            try {
                if (storageManager) {
                    return await storageManager.deleteAnalysis(id);
                }
                
                console.log('Mock deleting article:', id);
                return { success: true };
            } catch (error) {
                console.error('Delete article failed:', error);
                throw error;
            }
        },
        getUsageCount: async () => {
            try {
                if (storageManager) {
                    const stats = await storageManager.getUsageStats();
                    return stats.today || 0;
                }
                
                // Mock usage count for development
                return 2;
            } catch (error) {
                console.error('Get usage count failed:', error);
                return 0;
            }
        },
        getUsageStats: async () => {
            try {
                if (storageManager) {
                    return await storageManager.getUsageStats();
                }
                
                // Mock usage stats for development
                return {
                    total: 15,
                    today: 2,
                    remaining: 3,
                    limitReached: false,
                    isPremium: false
                };
            } catch (error) {
                console.error('Get usage stats failed:', error);
                return {
                    total: 0,
                    today: 0,
                    remaining: 5,
                    limitReached: false,
                    isPremium: false
                };
            }
        },
        resetDailyUsage: async () => {
            try {
                if (storageManager) {
                    // Reset usage to 0 for today using the correct storage key
                    const today = new Date().toDateString();
                    await chrome.storage.local.set({
                        'pocketstox_usage': {
                            count: 0,
                            date: today
                        }
                    });
                    console.log('Daily usage reset to 0 for', today);
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Reset daily usage failed:', error);
                return false;
            }
        }
    }
};

// Listen for React events
window.addEventListener('reactEvent', (event) => {
    console.log('React event received:', event.detail);
    // Handle React to vanilla JS communication
});

// Send events to React
window.notifyReact = (type, data) => {
    const event = new CustomEvent('extensionEvent', {
        detail: { type, data }
    });
    window.dispatchEvent(event);
};

// Initialize services
console.log('Extension services bridge initialized');

