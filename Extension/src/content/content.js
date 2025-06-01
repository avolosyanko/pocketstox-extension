console.log('content.js being run!');

try {
    const documentClone = document.cloneNode(true);
    const reader = new Readability(documentClone);
    const article = reader.parse();
    
    if (article) {
        chrome.runtime.sendMessage({
            action: 'contentExtracted',
            title: article.title,
            content: article.textContent
        });
    } else {
        console.error('Failed to parse the document with Readability');
    }
} catch (error) {
    console.error('Error parsing with Readability:', error);
}