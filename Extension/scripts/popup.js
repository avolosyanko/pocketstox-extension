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
            const title = message.title;
            const content = message.content;
            
            console.log('Title:', title);
            console.log('Content:', content);
            
            fetch(CONFIG.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': CONFIG.apiKey
                },
                body: JSON.stringify({
                    title: title,
                    content: content
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Results:', data);
                if (data.matches && data.matches.length > 0) {
                    updateTableWithMatches(data.matches);
                }
            })
            .catch(error => {
                console.error('Error calling API:', error);
            });
        }
    });
});