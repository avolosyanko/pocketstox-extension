// Background script for Pocketstox extension
let sidePanelStates = new Map(); // Track side panel states per window

chrome.runtime.onInstalled.addListener(() => {
    console.log('Pocketstox extension installed');
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    toggleSidePanel(tab.windowId);
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);
    
    switch (message.action) {
        case 'openSidePanel':
            handleOpenSidePanel(sender.tab);
            break;
            
        case 'toggleSidePanel':
            handleToggleSidePanel(sender.tab);
            break;
            
        case 'analyzeCurrentPage':
            handleAnalyzeCurrentPage(message, sender.tab);
            break;
            
        default:
            console.log('Unknown action:', message.action);
    }
    
    return true; // Keep message channel open for async response
});

async function toggleSidePanel(windowId) {
    try {
        // Chrome Side Panel API doesn't support programmatic closing
        // So we'll just always open it, but provide better UX feedback
        await chrome.sidePanel.open({ windowId: windowId });
        sidePanelStates.set(windowId, true);
        console.log('Side panel opened (Chrome API limitation: cannot programmatically close)');
        
        // Send a message to the content script to show a notification
        chrome.tabs.query({ windowId: windowId, active: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { 
                    action: 'showSidePanelInfo',
                    message: 'Side panel opened. To close, click the X in the panel or press Escape.'
                }).catch((error) => {
                    // Ignore errors - content script might not be available on all pages
                    console.log('Content script not available on this page');
                });
            }
        });
        
    } catch (error) {
        console.error('Failed to open side panel:', error);
    }
}

async function handleOpenSidePanel(tab) {
    try {
        await chrome.sidePanel.open({ windowId: tab.windowId });
        sidePanelStates.set(tab.windowId, true);
        console.log('Side panel opened');
    } catch (error) {
        console.error('Failed to open side panel:', error);
    }
}

async function handleToggleSidePanel(tab) {
    await toggleSidePanel(tab.windowId);
}

async function handleAnalyzeCurrentPage(message, tab) {
    try {
        // Open side panel first
        await chrome.sidePanel.open({ windowId: tab.windowId });
        
        // Wait a moment for panel to load, then trigger analysis
        setTimeout(() => {
            // Send message to side panel to start analysis
            chrome.runtime.sendMessage({
                action: 'startAnalysis',
                url: message.url,
                title: message.title,
                tabId: tab.id
            }).catch((error) => {
                // Ignore errors - side panel might not be ready yet
                console.log('Side panel not ready for messages yet');
            });
        }, 500);
        
        console.log('Analysis triggered for:', message.url);
    } catch (error) {
        console.error('Failed to analyze current page:', error);
    }
}