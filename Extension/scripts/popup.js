console.log('popup.js loaded');

document.addEventListener('DOMContentLoaded', function() {
    const scrapeButton = document.getElementById('scrape');
    if (scrapeButton) {
        scrapeButton.addEventListener('click', () => {
            console.log('popup.js scrape button clicked!');
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.scripting.executeScript({
                    target: {tabId: tabs[0].id},
                    files: ['scripts/Readability.min.js']
                }).then(() => {
                    chrome.scripting.executeScript({
                        target: {tabId: tabs[0].id},
                        files: ['scripts/content.js']
                    });
                });
            });
        });
    } else {
        console.error('Button with id "scrape" not found');
    }

    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === 'contentExtracted') {
            const { title, content } = message;
            
            // Detailed logging
            console.log('Sending to API:', {
                titleLength: title ? title.length : 0,
                contentLength: content ? content.length : 0,
                apiUrl: CONFIG.apiUrl
            });
    
            const headers = {
                'Content-Type': 'application/json'
            };
            
            // Conditionally add API key
            if (CONFIG.apiKey) {
                headers['X-Api-Key'] = CONFIG.apiKey;
            }
    
            // Prepare payload
            const payload = {
                title: title || '',
                content: content || ''
            };
    
            // Advanced fetch with more error details
            fetch(CONFIG.apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            })
            .then(async (response) => {
                // Log full response details
                console.log('Response Status:', response.status);
                console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
                // Try to get response text for more context
                const responseText = await response.text();
                console.log('Response Text:', responseText);
    
                // Check if response is not OK
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
                }
    
                // Parse JSON if possible
                try {
                    return JSON.parse(responseText);
                } catch (parseError) {
                    console.error('JSON Parse Error:', parseError);
                    return responseText;
                }
            })
            .then(data => {
                console.log('Successful API Response:', data);
            })
            .catch(error => {
                console.error('Comprehensive API Error:', {
                    message: error.message,
                    stack: error.stack,
                    apiUrl: CONFIG.apiUrl,
                    payloadSize: {
                        title: title ? title.length : 0,
                        content: content ? content.length : 0
                    }
                });
            });
        }
    });
});