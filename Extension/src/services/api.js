// Use config directly without import to avoid module issues
const CONFIG = {
    apiKey: 'd4c9q1eNwP1ppeJvxU4wH2wczAjEX5wG8cGGz4C3',
    apiUrl: 'https://gmoh9tv5t9.execute-api.eu-west-2.amazonaws.com/prod/vectormatch'
};

export async function analyzeArticle(title, content) {
    // Check usage limit before making API call
    const storageManager = new window.StorageManager();
    const canAnalyze = await storageManager.canAnalyze();
    
    if (!canAnalyze) {
        const stats = await storageManager.getUsageStats();
        throw new Error(`LIMIT_REACHED:${stats.today}`);
    }
    
    // Get monitoring data
    const installId = await storageManager.getInstallId();
    const usage = await storageManager.getUsageData();
    const account = await storageManager.getAccount();
    
    const headers = {
        'Content-Type': 'application/json',
        'X-Install-Id': installId || 'unknown',
        'X-Usage-Count': usage.count.toString(),
        'X-Usage-Date': usage.date
    };
    
    // Add auth token if user is logged in
    if (account && account.authToken) {
        headers['Authorization'] = `Bearer ${account.authToken}`;
    }
    
    if (CONFIG.apiKey) {
        headers['X-Api-Key'] = CONFIG.apiKey;
    }
    
    const payload = {
        title: title || '',
        content: content || ''
    };
    
    console.log('Sending to API:', CONFIG.apiUrl);
    
    const response = await fetch(CONFIG.apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    });
    
    console.log('Response Status:', response.status);
    const responseText = await response.text();
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    try {
        const result = JSON.parse(responseText);
        
        // Increment usage counter on successful response
        await storageManager.incrementUsage();
        
        return result;
    } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        throw new Error('Invalid response format');
    }
}