// ArticlesTab Override - Stops infinite loop and console spam
(function() {
    'use strict';
    
    console.log('ArticlesTab Override: Initializing...');
    
    // Override console.log for ArticlesTab messages to prevent spam
    const originalConsoleLog = console.log;
    console.log = function(...args) {
        const message = args[0];
        if (typeof message === 'string' && (
            message.includes('ArticlesTab:') || 
            message.includes('Fallback UI:') ||
            message.includes('ArticlesTab Override:')
        )) {
            // Block spam console logs
            return;
        }
        originalConsoleLog.apply(console, args);
    };
    
    console.log('ArticlesTab Override: Console spam blocked');
})();