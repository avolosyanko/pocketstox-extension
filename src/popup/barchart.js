class StockBarChart {
    constructor(container, data, options = {}) {
        this.container = container;
        this.data = data;
        this.options = {
            maxItems: options.maxItems || 5,
            barHeight: options.barHeight || 32,
            gap: options.gap || 6,
            color: options.color || '#9333ea',
            ...options
        };
        this.init();
    }

    init() {
        this.container.innerHTML = '';
        this.container.style.cssText = `
            width: 100%;
            padding: 0;
            background-color: transparent;
            display: flex;
            flex-direction: column;
            gap: ${this.options.gap}px;
        `;

        this.processData();
        this.render();
    }

    processData() {
        // Sort by count descending and take top items
        this.processedData = [...this.data]
            .sort((a, b) => b.count - a.count)
            .slice(0, this.options.maxItems);
        
        // Get the max count for scaling
        this.maxCount = this.processedData[0]?.count || 1;
    }

    render() {
        this.processedData.forEach((item, index) => {
            this.createBar(item, index);
        });
    }

    createBar(item, index) {
        // Create main container
        const barContainer = document.createElement('div');
        barContainer.className = 'stock-bar';
        barContainer.style.cssText = `
            display: grid;
            grid-template-columns: 140px 1fr;
            align-items: center;
            gap: 12px;
            height: ${this.options.barHeight}px;
            cursor: pointer;
        `;

        // Create left content (ticker and company)
        const leftContent = document.createElement('div');
        leftContent.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
        `;

        const ticker = document.createElement('div');
        ticker.style.cssText = `
            font-size: 13px;
            font-weight: 500;
            color: #1f2937;
            line-height: 1.2;
        `;
        ticker.textContent = item.ticker;

        const company = document.createElement('div');
        company.style.cssText = `
            font-size: 11px;
            font-weight: 400;
            color: #6b7280;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: 1.2;
        `;
        company.textContent = item.company;

        leftContent.appendChild(ticker);
        leftContent.appendChild(company);

        // Create bar visual container
        const barVisual = document.createElement('div');
        barVisual.style.cssText = `
            position: relative;
            height: 24px;
            background-color: #f3f4f6;
            border-radius: 6px;
            overflow: visible;
        `;

        // Create filled bar
        const fillPercentage = (item.count / this.maxCount) * 100;
        const filledBar = document.createElement('div');
        filledBar.className = 'filled-bar';
        filledBar.style.cssText = `
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: ${fillPercentage}%;
            background-color: ${this.options.color};
            opacity: ${0.9 - (index * 0.15)};
            transition: opacity 0.2s ease, width 0.3s ease;
            border-radius: 6px;
        `;

        // Create mention badge
        const mentionBadge = document.createElement('div');
        mentionBadge.className = 'mention-badge';
        mentionBadge.style.cssText = `
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            left: 8px;
            background-color: rgba(255, 255, 255, 0.9);
            color: #4b5563;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: 500;
            white-space: nowrap;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;
            z-index: 1;
        `;
        mentionBadge.textContent = `${item.count} mention${item.count > 1 ? 's' : ''}`;

        barVisual.appendChild(filledBar);
        barVisual.appendChild(mentionBadge);

        // Assemble
        barContainer.appendChild(leftContent);
        barContainer.appendChild(barVisual);

        // Add hover effects
        barContainer.addEventListener('mouseenter', () => {
            filledBar.style.opacity = '1';
            barContainer.style.backgroundColor = 'rgba(147, 51, 234, 0.05)';
        });

        barContainer.addEventListener('mouseleave', () => {
            filledBar.style.opacity = `${0.9 - (index * 0.15)}`;
            barContainer.style.backgroundColor = 'transparent';
        });

        // Click handler
        barContainer.addEventListener('click', () => {
            chrome.tabs.create({
                url: `https://robinhood.com/stocks/${item.ticker}`
            });
        });

        this.container.appendChild(barContainer);
    }
}

export default StockBarChart;