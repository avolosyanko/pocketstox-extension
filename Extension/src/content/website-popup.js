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

    createPopup() {
        // Create popup container
        this.popup = document.createElement('div');
        this.popup.id = 'pocketstox-website-popup';
        this.popup.innerHTML = `
            <div class="pocketstox-popup-content">
                <div class="pocketstox-popup-actions">
                    <button class="pocketstox-logo-btn" id="pocketstox-logo">
                        <img src="${chrome.runtime.getURL('assets/images/128x128.png')}" alt="Pocketstox" width="18" height="18" />
                    </button>
                    <div class="pocketstox-separator"></div>
                    <button class="pocketstox-analyze-btn" id="pocketstox-analyze">
                        Analyse
                    </button>
                    <button class="pocketstox-action-btn" id="pocketstox-settings">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                    <button class="pocketstox-action-btn" id="pocketstox-close">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
                right: 20px;
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
                background: rgba(209, 213, 219, 0.6);
                backdrop-filter: blur(20px);
                border-radius: 16px;
                padding: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.2);
                display: flex;
                align-items: center;
                min-width: 250px;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            }
            
            .pocketstox-popup-actions {
                display: flex;
                gap: 8px;
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
                transform: scale(1.05);
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
            
            .pocketstox-analyze-btn {
                height: 36px;
                padding: 0 16px;
                border-radius: 8px;
                border: none;
                background: linear-gradient(to bottom right, #9333ea, #7c3aed);
                color: white;
                font-size: 12px;
                font-weight: 500;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 200ms ease;
                white-space: nowrap;
                flex: 1;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            
            .pocketstox-analyze-btn:hover {
                background: linear-gradient(to bottom right, #7c3aed, #6d28d9);
                box-shadow: 0 10px 15px -3px rgba(139, 92, 246, 0.3), 0 4px 6px -2px rgba(139, 92, 246, 0.05);
                transform: translateY(-2px);
            }
            
            .pocketstox-action-btn {
                width: 36px;
                height: 36px;
                border-radius: 10px;
                border: none;
                background: rgba(107, 114, 128, 0.08);
                color: #374151;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
                backdrop-filter: blur(10px);
            }
            
            .pocketstox-action-btn:hover {
                background: rgba(107, 114, 128, 0.15);
                color: #1f2937;
                transform: scale(1.05);
            }
            
            .pocketstox-action-btn:active {
                transform: scale(0.95);
            }
            
            @media (max-width: 768px) {
                #pocketstox-website-popup {
                    bottom: 10px;
                    right: 10px;
                }
                
                .pocketstox-popup-content {
                    padding: 10px;
                    min-width: 180px;
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
        
        // Analyze button
        this.popup.querySelector('#pocketstox-analyze').addEventListener('click', () => {
            this.analyzeCurrentPage();
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