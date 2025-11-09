console.log('content.js being run on:', window.location.href);

function extractContentWithFallbacks() {
    let title = '';
    let content = '';
    
    // Method 1: Try Readability first
    try {
        const documentClone = document.cloneNode(true);
        const reader = new Readability(documentClone);
        const article = reader.parse();
        
        if (article && article.textContent && article.textContent.length > 100) {
            console.log('Readability extraction successful');
            title = article.title || document.title;
            content = article.textContent;
            return { title, content };
        }
    } catch (error) {
        console.warn('Readability extraction failed:', error);
    }
    
    // Method 2: BBC News specific selectors
    if (window.location.hostname.includes('bbc.co')) {
        console.log('Trying BBC-specific extraction');
        
        // BBC News article selectors
        const bbcSelectors = [
            '[data-component="text-block"]',
            '.ssrcss-1q0x1qg-Paragraph',
            '.story-body__inner p',
            '.gel-body-copy',
            '[data-component="text-block"] p'
        ];
        
        title = document.title || 
                document.querySelector('h1')?.textContent || 
                document.querySelector('[data-component="headline"]')?.textContent || '';
        
        let extractedParagraphs = [];
        
        for (const selector of bbcSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                console.log(`Found ${elements.length} elements with selector: ${selector}`);
                elements.forEach(el => {
                    const text = el.textContent?.trim();
                    if (text && text.length > 20) {
                        extractedParagraphs.push(text);
                    }
                });
                if (extractedParagraphs.length > 0) break;
            }
        }
        
        if (extractedParagraphs.length > 0) {
            content = extractedParagraphs.join('\n\n');
            console.log('BBC-specific extraction successful, content length:', content.length);
            return { title, content };
        }
    }
    
    // Method 3: Generic fallback selectors
    console.log('Trying generic extraction methods');
    
    title = document.title || 
            document.querySelector('h1')?.textContent ||
            document.querySelector('.headline')?.textContent ||
            document.querySelector('[class*="title"]')?.textContent || '';
    
    const genericSelectors = [
        'article p',
        '.article-content p',
        '.content p',
        '.post-content p',
        '.entry-content p',
        'main p',
        '[role="main"] p'
    ];
    
    let paragraphs = [];
    
    for (const selector of genericSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            console.log(`Found ${elements.length} paragraphs with selector: ${selector}`);
            elements.forEach(p => {
                const text = p.textContent?.trim();
                if (text && text.length > 20) {
                    paragraphs.push(text);
                }
            });
            if (paragraphs.length > 2) break; // Need at least a few paragraphs
        }
    }
    
    if (paragraphs.length > 0) {
        content = paragraphs.join('\n\n');
        console.log('Generic extraction successful, content length:', content.length);
        return { title, content };
    }
    
    // Method 4: Last resort - get all text content
    console.log('Using last resort extraction');
    const bodyText = document.body.textContent || '';
    if (bodyText.length > 500) {
        // Try to clean up the text a bit
        const lines = bodyText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 20 && !line.includes('Cookie') && !line.includes('JavaScript'))
            .slice(0, 20); // Limit to first 20 meaningful lines
        
        content = lines.join('\n');
        title = title || document.title || 'Article';
        return { title, content };
    }
    
    return { title, content: 'Unable to extract content from this page' };
}

try {
    const { title, content } = extractContentWithFallbacks();
    
    console.log('Final extraction result:', {
        title: title.substring(0, 100),
        contentLength: content.length,
        contentPreview: content.substring(0, 200)
    });
    
    chrome.runtime.sendMessage({
        action: 'contentExtracted',
        title: title,
        content: content
    });
    
} catch (error) {
    console.error('All extraction methods failed:', error);
    
    // Send fallback response
    chrome.runtime.sendMessage({
        action: 'contentExtracted',
        title: document.title || 'Article',
        content: 'Content extraction failed for this page'
    });
}