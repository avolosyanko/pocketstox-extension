export function createArticleCard(analysis) {
    const card = document.createElement('div');
    card.className = 'article-card';
    card.setAttribute('data-card-id', analysis.id);
    
    const date = new Date(analysis.timestamp);
    const formattedDate = formatDate(date);
    
    // Format URL for display
    let displayUrl = '';
    if (analysis.url) {
        try {
            const url = new URL(analysis.url);
            displayUrl = url.hostname.replace('www.', '');
        } catch {
            displayUrl = analysis.url;
        }
    }
    
    // Get favicon URL
    let faviconUrl = '';
    if (analysis.url) {
        try {
            const url = new URL(analysis.url);
            faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=24`;
        } catch {
            faviconUrl = '';
        }
    }
    
    card.innerHTML = `
        <div class="article-header">
            <div class="article-title">${escapeHtml(analysis.title)}</div>
            <div class="expand-indicator">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 5l7 7-7 7"/>
                </svg>
            </div>
        </div>
        <div class="article-meta">
            <div class="article-date">${formattedDate}</div>
            ${displayUrl ? `
                <span class="meta-separator">•</span>
                <div class="article-url">
                    ${faviconUrl ? `<img src="${faviconUrl}" class="article-favicon" alt="" onerror="this.style.display='none'">` : ''}
                    ${displayUrl}
                </div>
            ` : ''}
        </div>
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
    
    // Check if it's today
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
        // Use relative time for today
        if (diffMins < 1) return 'Just now';
        if (diffMins === 1) return '1 min ago';
        if (diffMins < 60) return `${diffMins} mins ago`;
        if (diffHours === 1) return '1 hour ago';
        return `${diffHours} hours ago`;
    }
    
    // Use formatted date for all other days
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${month} ${day}, ${hours}:${minutes}`;
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