class StorageManager {
    constructor() {
        this.STORAGE_KEY = 'pocketstox_analyses';
        this.USAGE_KEY = 'pocketstox_usage';
        this.INSTALL_KEY = 'pocketstox_install_id';
        this.ACCOUNT_KEY = 'pocketstox_account';
        this.ACTIVITY_KEY = 'pocketstox_activity_log';
        this.MAX_ANALYSES = 100;
        this.MAX_ACTIVITIES = 500; // Keep 500 activity items
        this.initializeInstallId();
    }

    async initializeInstallId() {
        const result = await chrome.storage.local.get([this.INSTALL_KEY]);
        if (!result[this.INSTALL_KEY]) {
            const installId = this.generateInstallId();
            await chrome.storage.local.set({ [this.INSTALL_KEY]: installId });
        }
    }

    generateInstallId() {
        return 'inst_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async getInstallId() {
        const result = await chrome.storage.local.get([this.INSTALL_KEY]);
        return result[this.INSTALL_KEY];
    }

    async getAllAnalyses() {
        return new Promise((resolve) => {
            chrome.storage.local.get([this.STORAGE_KEY], (result) => {
                resolve(result[this.STORAGE_KEY] || []);
            });
        });
    }

    async saveAnalysis(analysisData) {
        const analyses = await this.getAllAnalyses();
        
        const analysis = {
            id: analysisData.id || Date.now().toString(),
            timestamp: analysisData.timestamp || new Date().toISOString(),
            title: analysisData.title || 'Untitled Article',
            url: analysisData.url || '',
            matches: analysisData.matches || [],
            articleContent: analysisData.content ? analysisData.content.substring(0, 500) : '' // Store preview
        };

        analyses.unshift(analysis);

        if (analyses.length > this.MAX_ANALYSES) {
            analyses.splice(this.MAX_ANALYSES);
        }

        return new Promise((resolve) => {
            chrome.storage.local.set({ [this.STORAGE_KEY]: analyses }, () => {
                resolve(analysis);
            });
        });
    }

    async getAnalysesByTimeRange(days) {
        const analyses = await this.getAllAnalyses();
        
        if (days === 'all') {
            return analyses;
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return analyses.filter(analysis => 
            new Date(analysis.timestamp) > cutoffDate
        );
    }

    async getTrendingStocks(days = 7) {
        const analyses = await this.getAnalysesByTimeRange(days);
        const stockFrequency = {};

        analyses.forEach(analysis => {
            analysis.matches.forEach(match => {
                const key = match.ticker;
                if (!stockFrequency[key]) {
                    stockFrequency[key] = {
                        ticker: match.ticker,
                        company: match.company,
                        exchange: match.exchange,
                        count: 0,
                        articles: [],
                        avgScore: 0,
                        scores: []
                    };
                }
                
                stockFrequency[key].count++;
                stockFrequency[key].articles.push({
                    id: analysis.id,
                    title: analysis.title,
                    timestamp: analysis.timestamp,
                    score: match.score
                });
                stockFrequency[key].scores.push(match.score);
            });
        });

        Object.values(stockFrequency).forEach(stock => {
            stock.avgScore = stock.scores.reduce((a, b) => a + b, 0) / stock.scores.length;
        });

        return Object.values(stockFrequency)
            .sort((a, b) => b.count - a.count);
    }

    async deleteAnalysis(analysisId) {
        const analyses = await this.getAllAnalyses();
        const filtered = analyses.filter(a => a.id !== analysisId);
        
        return new Promise((resolve) => {
            chrome.storage.local.set({ [this.STORAGE_KEY]: filtered }, resolve);
        });
    }

    async clearAll() {
        return new Promise((resolve) => {
            chrome.storage.local.remove([this.STORAGE_KEY], resolve);
        });
    }

    async getUsageStats() {
        const usage = await this.getUsageData();
        const analyses = await this.getAllAnalyses();

        return {
            total: analyses.length,
            today: usage.count,
            remaining: 999999,
            limitReached: false
        };
    }

    async getUsageData() {
        // Check both local and sync storage
        const [localResult, syncResult] = await Promise.all([
            chrome.storage.local.get([this.USAGE_KEY]),
            chrome.storage.sync.get([`${this.USAGE_KEY}_backup`])
        ]);
        
        const today = new Date().toDateString();
        const localUsage = localResult[this.USAGE_KEY];
        const syncUsage = syncResult[`${this.USAGE_KEY}_backup`];
        
        // Use the higher count from either storage (prevents easy reset)
        let usage = { date: today, count: 0 };
        
        if (localUsage && localUsage.date === today) {
            usage = localUsage;
        }
        
        if (syncUsage && syncUsage.date === today && syncUsage.count > usage.count) {
            usage = syncUsage;
        }
        
        return usage;
    }

    async canAnalyze() {
        return true;
    }

    async incrementUsage() {
        const usage = await this.getUsageData();
        const today = new Date().toDateString();
        const installId = await this.getInstallId();
        
        const newUsage = {
            date: today,
            count: usage.date === today ? usage.count + 1 : 1,
            installId: installId // Link usage to install
        };
        
        // Store in both local and sync for redundancy
        await Promise.all([
            chrome.storage.local.set({ [this.USAGE_KEY]: newUsage }),
            chrome.storage.sync.set({ [`${this.USAGE_KEY}_backup`]: newUsage })
        ]);
        
        return newUsage;
    }

    async resetUsageIfNewDay() {
        const usage = await this.getUsageData();
        const today = new Date().toDateString();
        
        if (usage.date !== today) {
            await chrome.storage.local.set({ 
                [this.USAGE_KEY]: { date: today, count: 0 } 
            });
        }
    }

    // Account management methods
    async getAccount() {
        const result = await chrome.storage.local.get([this.ACCOUNT_KEY]);
        return result[this.ACCOUNT_KEY] || null;
    }

    async setAccount(accountData) {
        await chrome.storage.local.set({ [this.ACCOUNT_KEY]: accountData });
    }

    async clearAccount() {
        await chrome.storage.local.remove([this.ACCOUNT_KEY]);
    }

    async isPremium() {
        const account = await this.getAccount();
        return account && account.isPremium === true;
    }

    async linkAnonymousToAccount(accountData) {
        // Preserve install ID and usage history when upgrading
        const installId = await this.getInstallId();
        const analyses = await this.getAllAnalyses();
        
        // Set account with preserved data
        await this.setAccount({
            ...accountData,
            linkedInstallId: installId,
            importedAnalysesCount: analyses.length
        });
    }

    async canAnalyze() {
        return true;
    }

    async getUsageStats() {
        const usage = await this.getUsageData();
        const analyses = await this.getAllAnalyses();
        const isPremium = await this.isPremium();

        return {
            total: analyses.length,
            today: usage.count,
            remaining: 999999,
            limitReached: false,
            isPremium: isPremium
        };
    }

    // Activity logging methods
    async getActivityLog() {
        return new Promise((resolve) => {
            chrome.storage.local.get([this.ACTIVITY_KEY], (result) => {
                resolve(result[this.ACTIVITY_KEY] || []);
            });
        });
    }

    async logActivity(activityData) {
        const activities = await this.getActivityLog();

        const activity = {
            id: activityData.id || Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
            type: activityData.type,
            timestamp: activityData.timestamp || new Date().toISOString(),
            description: activityData.description,
            metadata: activityData.metadata || {},
            relatedEntities: activityData.relatedEntities || []
        };

        activities.unshift(activity);

        // Keep only the most recent activities
        if (activities.length > this.MAX_ACTIVITIES) {
            activities.splice(this.MAX_ACTIVITIES);
        }

        return new Promise((resolve) => {
            chrome.storage.local.set({ [this.ACTIVITY_KEY]: activities }, () => {
                resolve(activity);
            });
        });
    }

    async deleteActivityLog() {
        return new Promise((resolve) => {
            chrome.storage.local.remove([this.ACTIVITY_KEY], resolve);
        });
    }
}

window.StorageManager = StorageManager;