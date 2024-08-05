chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'contentExtracted') {
        console.log('Content extracted:', message);
        // Handle article contents
        // Send to API Gateway.   
    }
});






document.getElementById('scrape').addEventListener('click', () => {
    chrome.tabs.executeScript({
        file: 'content.js'
    });
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'contentExtracted') {
        document.getElementById('output').textContent = message.content;
    }
});


