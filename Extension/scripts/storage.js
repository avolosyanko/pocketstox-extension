class StorageManager {
    constructor() {
        this.STORAGE_KEY = 'pocketstox_analyses';
        this.MAX_ANALYSES = 0;
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
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
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
        const analyses = await this.getAllAnalyses();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayCount = analyses.filter(a => 
            new Date(a.timestamp) >= today
        ).length;

        return {
            total: analyses.length,
            today: todayCount,
            remaining: 5 - todayCount
        };
    }
}

window.StorageManager = StorageManager;