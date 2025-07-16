// Background script for Pocketstox extension
let sidePanelStates = new Map(); // Track side panel states per window

chrome.runtime.onInstalled.addListener(() => {
    console.log('Pocketstox extension installed');
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
    await toggleSidePanel(tab.windowId);
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
        const isCurrentlyOpen = sidePanelStates.get(windowId) || false;
        
        if (isCurrentlyOpen) {
            // Close the side panel by sending a message to it
            sidePanelStates.set(windowId, false);
            console.log('Closing side panel');
            
            // Send message to the side panel to close itself
            chrome.runtime.sendMessage({
                action: 'closeSidePanel',
                windowId: windowId
            }).catch((error) => {
                console.log('Could not send close message to side panel:', error);
            });
            
        } else {
            // Open the side panel
            await chrome.sidePanel.open({ windowId: windowId });
            sidePanelStates.set(windowId, true);
            console.log('Side panel opened');
        }
        
    } catch (error) {
        console.error('Failed to toggle side panel:', error);
        // Fallback: just try to open it
        try {
            await chrome.sidePanel.open({ windowId: windowId });
            sidePanelStates.set(windowId, true);
        } catch (fallbackError) {
            console.error('Fallback open failed:', fallbackError);
        }
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