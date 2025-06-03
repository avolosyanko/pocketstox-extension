export function createArticleCard(analysis) {
    const card = document.createElement('div');
    card.className = 'article-card';
    card.setAttribute('data-card-id', analysis.id);
    
    const date = new Date(analysis.timestamp);
    const formattedDate = formatDate(date);
    
    card.innerHTML = `
        <div class="article-header">
            <div class="article-title">${escapeHtml(analysis.title)}</div>
            <div class="expand-indicator">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 5l7 7-7 7"/>
                </svg>
            </div>
        </div>
        <div class="article-date">${formattedDate}</div>
    `;
    
    card.addEventListener('click', () => {
        // Show overlay instead of expanding
        if (window.showAnalysisOverlay) {
            window.showAnalysisOverlay(analysis);
        }
    });
    
    return card;
}

export function formatDate(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function getTrendingStocks(analyses, timeRange) {
    const stockFrequency = {};
    const now = new Date();
    const cutoffDate = new Date();
    
    if (timeRange !== 'all') {
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));
    } else {
        cutoffDate.setFullYear(2000);
    }
    
    analyses.forEach(analysis => {
        const analysisDate = new Date(analysis.timestamp);
        if (analysisDate < cutoffDate) return;
        
        analysis.matches.forEach(match => {
            const key = match.ticker;
            if (!stockFrequency[key]) {
                stockFrequency[key] = {
                    ticker: match.ticker,
                    company: match.company,
                    exchange: match.exchange,
                    count: 0,
                    avgScore: 0,
                    scores: []
                };
            }
            
            stockFrequency[key].count++;
            stockFrequency[key].scores.push(match.score);
        });
    });
    
    Object.values(stockFrequency).forEach(stock => {
        stock.avgScore = stock.scores.reduce((a, b) => a + b, 0) / stock.scores.length;
    });
    
    return Object.values(stockFrequency)
        .sort((a, b) => b.count - a.count);
}