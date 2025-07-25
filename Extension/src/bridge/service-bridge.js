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
        
        // Clear existing data and add fresh sample data 
        if (analyses && analyses.length > 0) {
            console.log('Clearing existing', analyses.length, 'articles to add fresh sample data...');
            await storageManager.clearAll();
        }
        
        console.log('Adding sample analysis data (15 articles)...');
        const now = new Date();
        
        // Helper function to generate specific timestamp
        const getTimestamp = (daysAgo, hours = null, minutes = null) => {
            const timestamp = new Date(now);
            timestamp.setDate(timestamp.getDate() - daysAgo);
            timestamp.setHours(hours !== null ? hours : Math.floor(Math.random() * 24));
            timestamp.setMinutes(minutes !== null ? minutes : Math.floor(Math.random() * 60));
            return timestamp.toISOString();
        };
        
        // Helper function for random timestamp within range
        const getRandomTimestamp = (maxDaysAgo) => {
            const randomDays = Math.random() * maxDaysAgo;
            return getTimestamp(randomDays);
        };
        
        const sampleArticles = [
                {
                    id: 'sample-1',
                    title: 'Tesla Reports Strong Q4 Earnings Beat',
                    url: 'https://example.com/tesla-earnings',
                    timestamp: getTimestamp(0, 14, 30), // Today at 2:30 PM
                    matches: [
                        { ticker: 'TSLA', company: 'Tesla Inc', exchange: 'NASDAQ', score: 0.92 },
                        { ticker: 'NVDA', company: 'NVIDIA Corp', exchange: 'NASDAQ', score: 0.35 }
                    ],
                    content: 'Tesla reported strong fourth quarter earnings with record vehicle deliveries and impressive revenue growth.',
                    sentiment: 'positive'
                },
                {
                    id: 'sample-2',
                    title: 'Apple Unveils Revolutionary AI Features in iOS',
                    url: 'https://example.com/apple-ai',
                    timestamp: getTimestamp(0, 10, 15), // Today at 10:15 AM
                    matches: [
                        { ticker: 'AAPL', company: 'Apple Inc', exchange: 'NASDAQ', score: 0.88 },
                        { ticker: 'GOOGL', company: 'Alphabet Inc', exchange: 'NASDAQ', score: 0.42 }
                    ],
                    content: 'Apple announced groundbreaking AI capabilities that could reshape the smartphone industry.',
                    sentiment: 'positive'
                },
                {
                    id: 'sample-3',
                    title: 'Microsoft Azure Cloud Revenue Surges 40%',
                    url: 'https://example.com/microsoft-azure',
                    timestamp: getTimestamp(1, 16, 45), // Yesterday at 4:45 PM
                    matches: [
                        { ticker: 'MSFT', company: 'Microsoft Corporation', exchange: 'NASDAQ', score: 0.95 },
                        { ticker: 'AMZN', company: 'Amazon.com Inc', exchange: 'NASDAQ', score: 0.38 }
                    ],
                    content: 'Microsoft Azure continues to gain market share in the competitive cloud computing space.',
                    sentiment: 'positive'
                },
                {
                    id: 'sample-4',
                    title: 'NVIDIA AI Chip Demand Continues to Soar',
                    url: 'https://example.com/nvidia-ai-chips',
                    timestamp: getTimestamp(1, 9, 20), // Yesterday at 9:20 AM
                    matches: [
                        { ticker: 'NVDA', company: 'NVIDIA Corp', exchange: 'NASDAQ', score: 0.91 },
                        { ticker: 'AMD', company: 'Advanced Micro Devices', exchange: 'NASDAQ', score: 0.45 }
                    ],
                    content: 'NVIDIA sees unprecedented demand for its AI processors from tech giants and startups alike.',
                    sentiment: 'positive'
                },
                {
                    id: 'sample-5',
                    title: 'Amazon Prime Day Sets New Sales Records',
                    url: 'https://example.com/amazon-prime-day',
                    timestamp: getRandomTimestamp(21),
                    matches: [
                        { ticker: 'AMZN', company: 'Amazon.com Inc', exchange: 'NASDAQ', score: 0.89 },
                        { ticker: 'SHOP', company: 'Shopify Inc', exchange: 'NYSE', score: 0.32 }
                    ],
                    content: 'Amazon Prime Day exceeded expectations with record-breaking sales across all categories.',
                    sentiment: 'positive'
                },
                {
                    id: 'sample-6',
                    title: 'Meta Announces Major VR Breakthrough',
                    url: 'https://example.com/meta-vr',
                    timestamp: getRandomTimestamp(5),
                    matches: [
                        { ticker: 'META', company: 'Meta Platforms Inc', exchange: 'NASDAQ', score: 0.87 },
                        { ticker: 'NVDA', company: 'NVIDIA Corp', exchange: 'NASDAQ', score: 0.28 }
                    ],
                    content: 'Meta unveils next-generation VR technology that could revolutionize virtual reality experiences.',
                    sentiment: 'positive'
                },
                {
                    id: 'sample-7',
                    title: 'Google Search Algorithm Update Impacts Rankings',
                    url: 'https://example.com/google-algorithm',
                    timestamp: getRandomTimestamp(35),
                    matches: [
                        { ticker: 'GOOGL', company: 'Alphabet Inc', exchange: 'NASDAQ', score: 0.86 },
                        { ticker: 'META', company: 'Meta Platforms Inc', exchange: 'NASDAQ', score: 0.25 }
                    ],
                    content: 'Google releases major search algorithm update affecting website rankings globally.',
                    sentiment: 'neutral'
                },
                {
                    id: 'sample-8',
                    title: 'Netflix Subscriber Growth Exceeds Forecasts',
                    url: 'https://example.com/netflix-growth',
                    timestamp: getRandomTimestamp(28),
                    matches: [
                        { ticker: 'NFLX', company: 'Netflix Inc', exchange: 'NASDAQ', score: 0.93 },
                        { ticker: 'DIS', company: 'Walt Disney Co', exchange: 'NYSE', score: 0.41 }
                    ],
                    content: 'Netflix adds millions of new subscribers, driven by popular original content and global expansion.',
                    sentiment: 'positive'
                },
                {
                    id: 'sample-9',
                    title: 'SpaceX Starship Test Flight Achieves Milestone',
                    url: 'https://example.com/spacex-starship',
                    timestamp: getRandomTimestamp(42),
                    matches: [
                        { ticker: 'TSLA', company: 'Tesla Inc', exchange: 'NASDAQ', score: 0.72 },
                        { ticker: 'BA', company: 'Boeing Co', exchange: 'NYSE', score: 0.34 }
                    ],
                    content: 'SpaceX Starship completes successful test flight, marking major progress in space exploration.',
                    sentiment: 'positive'
                },
                {
                    id: 'sample-10',
                    title: 'AMD Ryzen 8000 Series Launches with AI Focus',
                    url: 'https://example.com/amd-ryzen-8000',
                    timestamp: getRandomTimestamp(18),
                    matches: [
                        { ticker: 'AMD', company: 'Advanced Micro Devices', exchange: 'NASDAQ', score: 0.90 },
                        { ticker: 'INTC', company: 'Intel Corporation', exchange: 'NASDAQ', score: 0.47 }
                    ],
                    content: 'AMD launches new Ryzen processors with built-in AI acceleration capabilities.',
                    sentiment: 'positive'
                },
                {
                    id: 'sample-11',
                    title: 'PayPal Introduces New Cryptocurrency Features',
                    url: 'https://example.com/paypal-crypto',
                    timestamp: getRandomTimestamp(50),
                    matches: [
                        { ticker: 'PYPL', company: 'PayPal Holdings Inc', exchange: 'NASDAQ', score: 0.85 },
                        { ticker: 'SQ', company: 'Block Inc', exchange: 'NYSE', score: 0.39 }
                    ],
                    content: 'PayPal expands cryptocurrency services with new trading and wallet features.',
                    sentiment: 'positive'
                },
                {
                    id: 'sample-12',
                    title: 'Intel Foundry Services Secures Major Client',
                    url: 'https://example.com/intel-foundry',
                    timestamp: getRandomTimestamp(25),
                    matches: [
                        { ticker: 'INTC', company: 'Intel Corporation', exchange: 'NASDAQ', score: 0.88 },
                        { ticker: 'TSM', company: 'Taiwan Semiconductor', exchange: 'NYSE', score: 0.33 }
                    ],
                    content: 'Intel Foundry Services wins significant manufacturing contract from major technology company.',
                    sentiment: 'positive'
                },
                {
                    id: 'sample-13',
                    title: 'Zoom Video Earnings Miss Wall Street Expectations',
                    url: 'https://example.com/zoom-earnings',
                    timestamp: getRandomTimestamp(12),
                    matches: [
                        { ticker: 'ZM', company: 'Zoom Video Communications', exchange: 'NASDAQ', score: 0.92 },
                        { ticker: 'MSFT', company: 'Microsoft Corporation', exchange: 'NASDAQ', score: 0.29 }
                    ],
                    content: 'Zoom reports quarterly earnings below analyst expectations as remote work trends normalize.',
                    sentiment: 'negative'
                },
                {
                    id: 'sample-14',
                    title: 'Oracle Cloud Infrastructure Gains Enterprise Traction',
                    url: 'https://example.com/oracle-cloud',
                    timestamp: getRandomTimestamp(55),
                    matches: [
                        { ticker: 'ORCL', company: 'Oracle Corporation', exchange: 'NYSE', score: 0.89 },
                        { ticker: 'CRM', company: 'Salesforce Inc', exchange: 'NYSE', score: 0.31 }
                    ],
                    content: 'Oracle expands cloud infrastructure presence with new enterprise partnerships and services.',
                    sentiment: 'positive'
                },
                {
                    id: 'sample-15',
                    title: 'Adobe Creative Cloud Subscription Growth Slows',
                    url: 'https://example.com/adobe-creative',
                    timestamp: getRandomTimestamp(45),
                    matches: [
                        { ticker: 'ADBE', company: 'Adobe Inc', exchange: 'NASDAQ', score: 0.91 },
                        { ticker: 'MSFT', company: 'Microsoft Corporation', exchange: 'NASDAQ', score: 0.26 }
                    ],
                    content: 'Adobe faces slower subscription growth for Creative Cloud as market reaches saturation.',
                    sentiment: 'neutral'
                }
        ];

        // Sort articles by timestamp to ensure proper ordering
        sampleArticles.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Save all sample articles
        for (const article of sampleArticles) {
            console.log('Saving article:', article.title, 'with timestamp:', article.timestamp);
            await storageManager.saveAnalysis(article);
        }
        
        console.log('Sample data added! Created', sampleArticles.length, 'articles');
        
        // Verify what was saved
        const savedArticles = await storageManager.getAllAnalyses();
        console.log('Verification - Saved articles timestamps:');
        savedArticles.forEach((article, index) => {
            console.log(`Article ${index + 1}: ${article.title} - ${article.timestamp}`);
        });
    }
}, 1000);