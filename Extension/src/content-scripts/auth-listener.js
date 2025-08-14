// Content script to listen for auth messages from pocketstox.com
console.log('Pocketstox auth listener loaded')

// Listen for messages from the web page
window.addEventListener('message', (event) => {
  // Only accept messages from pocketstox.com
  if (event.origin !== 'https://pocketstox.com') {
    return
  }
  
  // Check for our auth success message
  if (event.data.type === 'POCKETSTOX_AUTH_SUCCESS' && event.data.source === 'pocketstox-landing') {
    console.log('Received auth data from landing page:', event.data)
    
    // Forward the message to the extension
    chrome.runtime.sendMessage({
      type: 'AUTH_SUCCESS',
      source: 'pocketstox-landing',
      data: event.data.data
    })
  }
})