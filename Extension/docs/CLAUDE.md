# Pocketstox Extension - Developer Guide

## Overview
Pocketstox is a Chrome extension that uses AI to analyze web articles and identify stocks that may be affected by the content. It performs semantic similarity searches between news articles and a vector database of earnings transcripts.

## Project Structure
```
Extension/
├── manifest.json          # Chrome extension manifest v3
├── popup.html            # Main UI window
├── scripts/
│   ├── config.js         # API configuration
│   ├── popup.js          # Main extension logic
│   ├── content.js        # Article extraction script
│   ├── storage.js        # Data persistence manager
│   └── Readability.min.js # Mozilla's article parser
├── styles/
│   ├── popup.css         # Extension styling
│   └── fonts/            # Inter font files
├── images/               # Icons and assets
└── lambda/               # AWS Lambda backend
    ├── lambda_function.py # API handler
    └── requirements.txt   # Python dependencies
```

## Key Components

### Frontend Architecture
- **Popup Interface**: 420x600px window with article analysis and history
- **Content Extraction**: Uses Mozilla Readability to parse articles
- **Storage**: Chrome local storage for persisting analysis history
- **Treemap Visualization**: Custom implementation for stock frequency display

### Backend Architecture
- **AWS Lambda**: Python function for vector similarity search
- **Voyage AI**: Finance-specific embeddings (voyage-finance-2 model)
- **Pinecone**: Vector database storing earnings transcript embeddings
- **API Gateway**: REST endpoint with API key authentication

## Development Workflow

### Testing the Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the Extension directory
4. Click the extension icon to test functionality

### API Configuration
The API endpoint and key are in `scripts/config.js`:
```javascript
const CONFIG = {
    apiKey: 'YOUR_API_KEY',
    apiUrl: 'https://gmoh9tv5t9.execute-api.eu-west-2.amazonaws.com/prod/vectormatch'
};
```

### Running Tests
Currently no automated tests. Manual testing procedure:
1. Navigate to a financial news article
2. Click extension icon
3. Click "Generate Companies"
4. Verify stocks appear with relevance scores

### Common Commands
```bash
# Package extension for distribution
zip -r pocketstox.zip . -x "*.git*" "lambda/*" "manual/*"

# Test Lambda locally (from lambda/ directory)
python lambda_function.py
```

## Code Conventions

### JavaScript
- Use camelCase for variables and functions
- Use PascalCase for classes
- No semicolons required but used consistently
- Async/await preferred over callbacks

### CSS
- BEM-style class naming (e.g., `.article-card`, `.article-card__title`)
- CSS variables for colors in :root
- Mobile-first responsive design not needed (fixed popup size)

### Python (Lambda)
- Snake_case for functions and variables
- Type hints where beneficial
- Comprehensive error handling and logging

## Important Implementation Details

### Article Processing Flow
1. User clicks "Generate Companies" button
2. `content.js` injected into active tab
3. Readability extracts article content
4. Content sent to Lambda via API
5. Lambda creates embeddings and queries Pinecone
6. Top 5 matching stocks returned with scores
7. Results displayed in popup and saved to storage

### Storage Schema
```javascript
{
    id: "timestamp",
    timestamp: "ISO 8601 date",
    title: "Article title",
    url: "Article URL",
    matches: [
        {
            ticker: "AAPL",
            company: "Apple Inc.",
            exchange: "NASDAQ",
            score: 0.89
        }
    ]
}
```

### Vector Search Details
- Embeddings: 1024-dimensional vectors from voyage-finance-2
- Database: Pinecone with "pocketstox-embeddings-db" namespace
- Search: Cosine similarity, top-k=5
- Content limit: 50,000 characters (truncated if longer)

## Security Considerations

### Current Issues
1. API key exposed in client-side code
2. No rate limiting beyond UI counter
3. CORS allows all origins

### Recommended Fixes
1. Move API key to secure backend service
2. Implement server-side rate limiting
3. Restrict CORS to extension origin only

## Debugging Tips

### Common Issues
1. **"Failed to analyze page"**: Usually CORS or content security policy
2. **Empty results**: Check if article has enough financial content
3. **API errors**: Verify Lambda environment variables are set

### Debug Mode
Add to popup.js for verbose logging:
```javascript
const DEBUG = true;
if (DEBUG) console.log('Debug info:', data);
```

### Chrome DevTools
1. Right-click extension icon → "Inspect popup"
2. Check Console for errors
3. Network tab to debug API calls

## Future Enhancements

### Planned Features
- User authentication for premium tiers
- Export analysis results
- Batch article processing
- Real-time stock prices integration
- Custom watchlists

### Architecture Improvements
- Background service worker for better performance
- IndexedDB for larger storage capacity
- WebSocket for real-time updates
- TypeScript migration for type safety

## Deployment

### Extension Store Submission
1. Update version in manifest.json
2. Create promotional images (1280x800, 640x400)
3. Write detailed description emphasizing financial analysis
4. Submit for review (typically 1-3 days)

### Lambda Deployment
```bash
cd lambda/
pip install -r requirements.txt -t .
zip -r function.zip .
aws lambda update-function-code --function-name pocketstox-vectormatch --zip-file fileb://function.zip
```

## Maintenance

### Regular Tasks
- Monitor API usage and costs
- Update dependencies monthly
- Review and moderate user feedback
- Update earnings transcript database quarterly

### Performance Monitoring
- Lambda cold start times (target: <2s)
- API response times (target: <3s)
- Extension load time (target: <500ms)
- Memory usage (target: <50MB)