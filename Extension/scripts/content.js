// Extracts article contents
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/readability/0.4.4/Readability.min.js';
script.onload = function () {
    document.addEventListener('DOMContentLoaded', function() {
    const article = new Readability(document).parse();
    if (article) {
        console.log('Title:', article.title);
        console.log('Content:', article.textContent);
        // Send article contents to embeddings.js
        chrome.runtime.sendMessage({
            action: 'contentExtracted',
            title: article.title,
            content: article.textContent
        });
    } else {
        console.error('Failed to parse the document with Readability');
    }
    })
};
document.head.appendChild(script);