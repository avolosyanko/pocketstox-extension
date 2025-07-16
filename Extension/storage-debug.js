// Storage Debug - Check what's actually in Chrome storage
(function() {
    'use strict';
    
    console.log('Storage Debug: Starting...');
    
    async function debugStorage() {
        try {
            console.log('=== CHROME STORAGE DEBUG ===');
            
            // Check raw Chrome storage
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                console.log('Chrome storage API available');
                
                // Get all storage keys
                const allKeys = await chrome.storage.local.get(null);
                console.log('All storage keys:', Object.keys(allKeys));
                console.log('Full storage contents:', allKeys);
                
                // Check specific keys
                const pocketstoxKeys = [
                    'pocketstox_analyses',
                    'pocketstox_usage', 
                    'pocketstox_install_id',
                    'pocketstox_account'
                ];
                
                for (const key of pocketstoxKeys) {
                    const result = await chrome.storage.local.get([key]);
                    console.log(`Storage[${key}]:`, result[key]);
                    
                    if (key === 'pocketstox_analyses' && result[key]) {
                        console.log(`Found ${result[key].length} analyses in storage`);
                        result[key].forEach((analysis, index) => {
                            console.log(`Analysis ${index + 1}:`, {
                                id: analysis.id,
                                title: analysis.title,
                                timestamp: analysis.timestamp,
                                matches: analysis.matches?.length || 0
                            });
                        });
                    }
                }
            } else {
                console.log('Chrome storage API not available');
            }
            
            // Check StorageManager
            if (typeof StorageManager !== 'undefined') {
                console.log('StorageManager class available');
                const manager = new StorageManager();
                
                const analyses = await manager.getAllAnalyses();
                console.log('StorageManager.getAllAnalyses():', analyses);
                console.log('Number of analyses:', analyses?.length || 0);
                
                if (analyses && analyses.length > 0) {
                    console.log('First analysis details:', analyses[0]);
                }
                
                const stats = await manager.getUsageStats();
                console.log('Usage stats:', stats);
            } else {
                console.log('StorageManager not available');
            }
            
            // Check extension services
            if (window.extensionServices?.storage) {
                console.log('Extension services storage available');
                const articles = await window.extensionServices.storage.getArticles();
                console.log('Extension services getArticles():', articles);
                console.log('Number of articles from extension services:', articles?.length || 0);
            } else {
                console.log('Extension services storage not available');
            }
            
            console.log('=== END STORAGE DEBUG ===');
            
        } catch (error) {
            console.error('Storage debug error:', error);
        }
    }
    
    // Run debug after everything loads
    setTimeout(debugStorage, 3000);
    
    // Also make it available globally for manual debugging
    window.debugStorage = debugStorage;
    
    console.log('Storage Debug: Ready (run window.debugStorage() manually if needed)');
    
})();