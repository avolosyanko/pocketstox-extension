// Use config directly without import to avoid module issues
const CONFIG = {
    apiKey: 'd4c9q1eNwP1ppeJvxU4wH2wczAjEX5wG8cGGz4C3',
    apiUrl: 'https://gmoh9tv5t9.execute-api.eu-west-2.amazonaws.com/prod/vectormatch'
};

export async function analyzeArticle(title, content) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
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
        return JSON.parse(responseText);
    } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        throw new Error('Invalid response format');
    }
}