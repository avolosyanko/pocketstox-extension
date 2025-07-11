// Website popup that appears on specific domains
class WebsitePopup {
    constructor() {
        this.popup = null;
        this.isVisible = false;
        this.targetDomains = [
            'cnn.com',
            'bbc.com',
            'bbc.co.uk',
            'reuters.com',
            'bloomberg.com',
            'wsj.com',
            'ft.com',
            'marketwatch.com',
            'cnbc.com',
            'techcrunch.com',
            'theverge.com'
        ];
        
        this.init();
    }

    init() {
        // Check if current domain should show popup
        if (this.shouldShowPopup()) {
            this.createPopup();
            this.showPopup();
        }
    }

    shouldShowPopup() {
        const currentDomain = window.location.hostname.toLowerCase();
        console.log('Pocketstox: Current domain:', currentDomain);
        
        const shouldShow = this.targetDomains.some(domain => 
            currentDomain.includes(domain) || currentDomain.endsWith(domain)
        );
        
        console.log('Pocketstox: Should show popup:', shouldShow);
        return shouldShow;
    }

    getFaviconUrl() {
        // Try to get favicon from page
        let faviconUrl = null;
        
        // Try to find favicon link in head
        const faviconLink = document.querySelector('link[rel*="icon"]');
        if (faviconLink) {
            faviconUrl = faviconLink.href;
        }
        
        // Fallback to Google's favicon service
        if (!faviconUrl) {
            faviconUrl = `https://www.google.com/s2/favicons?sz=16&domain=${window.location.hostname}`;
        }
        
        return faviconUrl;
    }

    getSiteName() {
        const hostname = window.location.hostname.toLowerCase();
        
        // Map domains to friendly names
        const siteNames = {
            'cnn.com': 'CNN',
            'bbc.com': 'BBC',
            'bbc.co.uk': 'BBC',
            'reuters.com': 'Reuters',
            'bloomberg.com': 'Bloomberg',
            'wsj.com': 'WSJ',
            'ft.com': 'Financial Times',
            'marketwatch.com': 'MarketWatch',
            'cnbc.com': 'CNBC',
            'techcrunch.com': 'TechCrunch',
            'theverge.com': 'The Verge'
        };
        
        // Find matching domain
        for (const [domain, name] of Object.entries(siteNames)) {
            if (hostname.includes(domain)) {
                return name;
            }
        }
        
        // Fallback to hostname
        return hostname.replace('www.', '');
    }

    createPopup() {
        // Get site favicon and domain info
        const faviconUrl = this.getFaviconUrl();
        const siteName = this.getSiteName();
        
        // Create popup container
        this.popup = document.createElement('div');
        this.popup.id = 'pocketstox-website-popup';
        this.popup.innerHTML = `
            <div class="pocketstox-popup-content">
                <div class="pocketstox-site-info">
                    <img src="${faviconUrl}" alt="${siteName}" class="pocketstox-favicon" />
                    <div class="pocketstox-site-details">
                        <span class="pocketstox-site-name">${siteName}</span>
                        <div class="pocketstox-scannable-indicator">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 12l2 2 4-4"/>
                                <circle cx="12" cy="12" r="9"/>
                            </svg>
                            <span>Scannable</span>
                        </div>
                    </div>
                </div>
                <div class="pocketstox-popup-actions">
                    <button class="pocketstox-logo-btn" id="pocketstox-logo">
                        <img src="${chrome.runtime.getURL('assets/images/128x128.png')}" alt="Pocketstox" width="18" height="18" />
                    </button>
                    <div class="pocketstox-separator"></div>
                    <button class="pocketstox-action-btn" id="pocketstox-panel">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="transform: scaleX(-1);">
                            <rect width="18" height="18" x="3" y="3" rx="2"/>
                            <path d="M9 3v18"/>
                        </svg>
                    </button>
                    <button class="pocketstox-action-btn" id="pocketstox-settings">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                    <button class="pocketstox-action-btn" id="pocketstox-close">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 6 6 18"/>
                            <path d="m6 6 12 12"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        // Add CSS styles
        this.addStyles();
        
        // Add event listeners
        this.addEventListeners();
        
        // Append to body
        document.body.appendChild(this.popup);
    }

    addStyles() {
        if (document.getElementById('pocketstox-popup-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'pocketstox-popup-styles';
        styles.textContent = `
            #pocketstox-website-popup {
                position: fixed;
                bottom: 20px;
                left: 20px;
                z-index: 999999;
                opacity: 0;
                transform: translateY(10px);
                transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: none;
            }
            
            #pocketstox-website-popup.visible {
                opacity: 1;
                transform: translateY(0);
                pointer-events: all;
            }
            
            .pocketstox-popup-content {
                background: rgba(209, 213, 219, 0.3);
                backdrop-filter: blur(20px);
                border-radius: 16px;
                padding: 8px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.2);
                display: flex;
                flex-direction: column;
                gap: 8px;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            }
            
            .pocketstox-site-info {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 4px 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                backdrop-filter: blur(10px);
            }
            
            .pocketstox-favicon {
                width: 16px;
                height: 16px;
                border-radius: 3px;
                object-fit: contain;
            }
            
            .pocketstox-site-details {
                display: flex;
                flex-direction: column;
                gap: 2px;
                flex: 1;
            }
            
            .pocketstox-site-name {
                font-size: 12px;
                font-weight: 600;
                color: #1f2937;
                line-height: 1.2;
            }
            
            .pocketstox-scannable-indicator {
                display: flex;
                align-items: center;
                gap: 4px;
                color: #10b981;
                font-size: 10px;
                font-weight: 500;
                line-height: 1.2;
            }
            
            .pocketstox-scannable-indicator svg {
                width: 10px;
                height: 10px;
                stroke-width: 2.5;
            }
            
            .pocketstox-popup-actions {
                display: flex;
                gap: 6px;
                align-items: center;
                width: 100%;
            }
            
            .pocketstox-logo-btn {
                width: 36px;
                height: 36px;
                border-radius: 10px;
                border: none;
                background: rgba(255, 255, 255, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
                backdrop-filter: blur(10px);
            }
            
            .pocketstox-logo-btn:hover {
                background: rgba(255, 255, 255, 1);
                transform: translateY(-2px);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .pocketstox-logo-btn img {
                width: 18px;
                height: 18px;
                object-fit: contain;
            }
            
            .pocketstox-separator {
                width: 1px;
                height: 24px;
                background: rgba(107, 114, 128, 0.3);
                margin: 0 4px;
            }
            
            .pocketstox-action-btn {
                width: 36px;
                height: 36px;
                border-radius: 10px;
                border: none;
                background: transparent;
                color: #1f2937;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
                backdrop-filter: blur(10px);
            }
            
            .pocketstox-action-btn:hover {
                background: rgba(107, 114, 128, 0.15);
                color: #111827;
            }
            
            .pocketstox-action-btn:active {
                transform: scale(0.95);
            }
            
            @media (max-width: 768px) {
                #pocketstox-website-popup {
                    bottom: 10px;
                    left: 10px;
                }
                
                .pocketstox-popup-content {
                    padding: 6px;
                }
                
                .pocketstox-popup-icon {
                    width: 36px;
                    height: 36px;
                }
                
                .pocketstox-action-btn {
                    width: 32px;
                    height: 32px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    addEventListeners() {
        // Logo button - toggle sidebar
        this.popup.querySelector('#pocketstox-logo').addEventListener('click', () => {
            this.toggleExtensionPopup();
        });
        
        // Settings button - always open sidebar
        this.popup.querySelector('#pocketstox-settings').addEventListener('click', () => {
            this.openExtensionPopup();
        });
        
        // Panel button - open side panel
        this.popup.querySelector('#pocketstox-panel').addEventListener('click', () => {
            this.openExtensionPopup();
        });
        
        // Close button
        this.popup.querySelector('#pocketstox-close').addEventListener('click', () => {
            this.hidePopup();
        });
    }

    showPopup() {
        if (this.popup && !this.isVisible) {
            console.log('Pocketstox: Showing popup...');
            // Delay to ensure DOM is ready
            setTimeout(() => {
                this.popup.classList.add('visible');
                this.isVisible = true;
                console.log('Pocketstox: Popup should be visible now');
                
                // No auto-hide - user must manually close with X button
            }, 300);
        }
    }

    hidePopup() {
        if (this.popup && this.isVisible) {
            this.popup.classList.remove('visible');
            this.isVisible = false;
            
            // Remove from DOM after animation
            setTimeout(() => {
                if (this.popup && this.popup.parentNode) {
                    this.popup.parentNode.removeChild(this.popup);
                }
            }, 300);
        }
    }

    openExtensionPopup() {
        // Send message to background script to open side panel
        if (chrome && chrome.runtime) {
            chrome.runtime.sendMessage({ action: 'openSidePanel' });
        }
    }

    toggleExtensionPopup() {
        // Send message to background script to toggle side panel
        if (chrome && chrome.runtime) {
            chrome.runtime.sendMessage({ action: 'toggleSidePanel' });
        }
    }

    analyzeCurrentPage() {
        // Send message to background script to analyze current page
        if (chrome && chrome.runtime) {
            chrome.runtime.sendMessage({ 
                action: 'analyzeCurrentPage',
                url: window.location.href,
                title: document.title
            });
        }
        this.hidePopup();
    }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'showSidePanelInfo') {
        console.log('Pocketstox:', message.message);
        // Could show a toast notification here if desired
    }
});

// Initialize popup when DOM is ready
console.log('Pocketstox content script loaded on:', window.location.href);

function initializePopup() {
    console.log('Pocketstox: Initializing popup...');
    try {
        new WebsitePopup();
    } catch (error) {
        console.error('Pocketstox: Error initializing popup:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePopup);
} else {
    initializePopup();
}

// Backup initialization after a delay
setTimeout(() => {
    if (!document.getElementById('pocketstox-website-popup')) {
        console.log('Pocketstox: Backup initialization triggered');
        initializePopup();
    }
}, 2000);