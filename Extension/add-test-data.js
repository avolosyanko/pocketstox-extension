// Simple script to add test data to Chrome storage
// Run this in browser console when extension is open

console.log('Adding test article history data...');

const testArticles = [
  {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    title: 'Tesla Reports Strong Q4 Earnings',
    url: 'https://example.com/tesla-earnings',
    matches: [
      { ticker: 'TSLA', company: 'Tesla Inc', exchange: 'NASDAQ', score: 0.92 },
      { ticker: 'AAPL', company: 'Apple Inc', exchange: 'NASDAQ', score: 0.45 }
    ],
    articleContent: 'Tesla reported strong fourth quarter earnings with record vehicle deliveries exceeding expectations. The company showed significant growth in both revenue and profit margins...'
  },
  {
    id: (Date.now() + 1).toString(),
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    title: 'Apple Announces New iPhone Features',
    url: 'https://example.com/apple-iphone',
    matches: [
      { ticker: 'AAPL', company: 'Apple Inc', exchange: 'NASDAQ', score: 0.88 },
      { ticker: 'NVDA', company: 'NVIDIA Corp', exchange: 'NASDAQ', score: 0.31 }
    ],
    articleContent: 'Apple unveiled new AI-powered features for the iPhone lineup, including enhanced camera capabilities and improved battery life. The announcement has generated significant interest...'
  },
  {
    id: (Date.now() + 2).toString(),
    timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    title: 'NVIDIA Stock Surges on AI Demand',
    url: 'https://example.com/nvidia-ai',
    matches: [
      { ticker: 'NVDA', company: 'NVIDIA Corp', exchange: 'NASDAQ', score: 0.95 },
      { ticker: 'AMD', company: 'Advanced Micro Devices', exchange: 'NASDAQ', score: 0.67 }
    ],
    articleContent: 'NVIDIA shares jumped following strong demand for AI chips and data center products. The company continues to dominate the artificial intelligence hardware market...'
  }
];

// Function to add test data
async function addTestData() {
  try {
    // Use Chrome storage API directly
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ 'pocketstox_analyses': testArticles });
      console.log('✅ Test data added successfully!');
      
      // Verify the data was saved
      const result = await chrome.storage.local.get(['pocketstox_analyses']);
      console.log('✅ Verification - Articles in storage:', result.pocketstox_analyses?.length || 0);
      
      return result.pocketstox_analyses;
    } else {
      console.error('❌ Chrome storage API not available');
      return null;
    }
  } catch (error) {
    console.error('❌ Error adding test data:', error);
    return null;
  }
}

// Function to check current storage
async function checkStorage() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(['pocketstox_analyses']);
      console.log('📊 Current articles in storage:', result.pocketstox_analyses?.length || 0);
      console.log('📊 Sample article:', result.pocketstox_analyses?.[0]);
      return result.pocketstox_analyses;
    } else {
      console.error('❌ Chrome storage API not available');
      return null;
    }
  } catch (error) {
    console.error('❌ Error checking storage:', error);
    return null;
  }
}

// Function to clear storage
async function clearStorage() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.remove(['pocketstox_analyses']);
      console.log('🗑️ Storage cleared successfully!');
      return true;
    } else {
      console.error('❌ Chrome storage API not available');
      return false;
    }
  } catch (error) {
    console.error('❌ Error clearing storage:', error);
    return false;
  }
}

// Run the functions
console.log('🚀 Chrome Extension Storage Debug Tools');
console.log('📋 Available functions:');
console.log('  - addTestData() - Add sample articles');
console.log('  - checkStorage() - Check current storage');
console.log('  - clearStorage() - Clear all articles');
console.log('');

// Auto-check current storage
checkStorage();

// Make functions available globally
window.addTestData = addTestData;
window.checkStorage = checkStorage;
window.clearStorage = clearStorage;