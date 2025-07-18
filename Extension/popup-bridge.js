// Service Bridge for popup.html
// This file creates the bridge between vanilla JS services and React components

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
        analyzeArticle: async () => {
            try {
                // Check usage limit first
                if (storageManager) {
                    const stats = await storageManager.getUsageStats();
                    if (stats.limitReached) {
                        throw new Error('Daily limit reached. Please upgrade to continue.');
                    }
                }
                
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
                            
                            // Call the API with extracted content
                            if (typeof analyzeArticle !== 'undefined') {
                                analyzeArticle(title, content).then(async (result) => {
                                    // Save the analysis using StorageManager
                                    if (storageManager && result) {
                                        await storageManager.saveAnalysis({
                                            title: title,
                                            url: window.currentArticleUrl || '',
                                            matches: result.matches || [],
                                            content: content
                                        });
                                        // Increment usage count
                                        await storageManager.incrementUsage();
                                    }
                                    resolve(result);
                                }).catch(reject);
                            } else {
                                reject(new Error('analyzeArticle function not found'));
                            }
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
                if (storageManager) {
                    const analyses = await storageManager.getAllAnalyses();
                    return analyses || [];
                }
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

// Debug: Check existing storage data on load
setTimeout(async () => {
    if (storageManager) {
        const analyses = await storageManager.getAllAnalyses();
        const usageStats = await storageManager.getUsageStats();
        console.log('=== DEBUG: Existing Storage Data ===');
        console.log('Analyses found:', analyses?.length || 0);
        console.log('Sample analysis:', analyses?.[0]);
        console.log('Usage stats:', usageStats);
        console.log('=== END DEBUG ===');
        
        // Add some test data if none exists
        if (!analyses || analyses.length === 0) {
            console.log('Adding test analysis data...');
            await storageManager.saveAnalysis({
                title: 'Test Article: Tesla Reports Strong Q4 Earnings',
                url: 'https://example.com/tesla-earnings',
                matches: [
                    { ticker: 'TSLA', company: 'Tesla Inc', exchange: 'NASDAQ', score: 0.92 },
                    { ticker: 'AAPL', company: 'Apple Inc', exchange: 'NASDAQ', score: 0.45 }
                ],
                content: 'Tesla reported strong fourth quarter earnings with record vehicle deliveries...'
            });
            
            await storageManager.saveAnalysis({
                title: 'Apple Announces New iPhone Features',
                url: 'https://example.com/apple-iphone',
                matches: [
                    { ticker: 'AAPL', company: 'Apple Inc', exchange: 'NASDAQ', score: 0.88 },
                    { ticker: 'NVDA', company: 'NVIDIA Corp', exchange: 'NASDAQ', score: 0.31 }
                ],
                content: 'Apple unveiled new AI-powered features for the iPhone lineup...'
            });
            
            console.log('Test data added!');
        }
    }
}, 1000);