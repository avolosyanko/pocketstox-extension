// Minimal Typography System - Inspired by Instagram/Modern Apps
// Only 8 essential variations for clean, professional UI

export const typography = {
  // PRIMARY HIERARCHY - Just 4 core sizes
  heading: "text-base font-semibold text-gray-900",        // Main headings (16px)
  subheading: "text-sm font-medium text-gray-900",         // Secondary headings (14px)
  body: "text-sm font-normal text-gray-700",               // Primary body text (14px)
  caption: "text-xs font-normal text-gray-500",            // Small text/metadata (12px)
  
  // INTERACTIVE ELEMENTS - Just 2 button styles
  button: "text-sm font-medium text-white",                // Primary buttons (14px)
  buttonSecondary: "text-sm font-medium text-gray-700",    // Secondary buttons (14px)
  
  // BRAND ELEMENTS - Just 2 special cases
  accent: "text-sm font-medium text-purple-600",           // Purple accent text (14px)
  mono: "text-xs font-mono text-gray-700",                 // Code/symbols (12px)
}

// SEMANTIC MAPPING - All use cases map to these 8 styles
export const semanticTypography = {
  // HEADINGS - All use heading or subheading
  pageTitle: typography.heading,
  sectionTitle: typography.heading,
  cardTitle: typography.subheading,
  drawerTitle: typography.heading,
  
  // BODY TEXT - All use body or caption
  primaryText: typography.body,
  secondaryText: typography.caption,
  description: typography.body,
  metadata: typography.caption,
  timestamp: typography.caption,
  
  // INTERACTIVE - All use button variants
  primaryButton: typography.button,
  secondaryButton: typography.buttonSecondary,
  
  // NAVIGATION - Uses existing styles
  navigationItem: typography.caption,
  navigationActive: typography.accent,
  
  // SPECIAL CONTENT
  articleTitle: typography.heading,
  articleExcerpt: typography.body,
  stockSymbol: typography.mono,
  
  // STATUS - Uses accent color with different colors
  successMessage: typography.accent,  // Will override color to green
  warningMessage: typography.accent,  // Will override color to yellow
  errorMessage: typography.accent,    // Will override color to red
  
  // LABELS
  formLabel: typography.subheading,
  sectionLabel: typography.caption,   // Will add uppercase
  
  // EMPTY STATES
  emptyStateTitle: typography.subheading,
  emptyStateDescription: typography.caption,
  placeholderText: typography.caption,
  
  // METRICS
  keyMetric: typography.accent,       // Will increase size for emphasis
  smallMetric: typography.accent,
}

// COLOR OVERRIDES - For status messages and special cases
export const colorOverrides = {
  success: "text-green-600",
  warning: "text-yellow-600", 
  error: "text-red-600",
  muted: "text-gray-400",
  accent: "text-purple-600",
  primary: "text-gray-900",
  secondary: "text-gray-700",
  tertiary: "text-gray-500",
}

// SIZE OVERRIDES - For special emphasis
export const sizeOverrides = {
  large: "text-lg",      // 18px - for key metrics
  small: "text-xs",      // 12px - already default for caption
  tiny: "text-[11px]",   // 11px - for very small text if needed
}

// UTILITY FUNCTIONS
export const getTypographyClass = (type, options = {}) => {
  let baseClass = semanticTypography[type] || typography.body
  
  // Apply color override
  if (options.color && colorOverrides[options.color]) {
    baseClass = baseClass.replace(/text-\w+-\d+/, colorOverrides[options.color])
  }
  
  // Apply size override
  if (options.size && sizeOverrides[options.size]) {
    baseClass = baseClass.replace(/text-\w+/, sizeOverrides[options.size])
  }
  
  // Add uppercase for section labels
  if (type === 'sectionLabel') {
    baseClass += ' uppercase tracking-wider'
  }
  
  return baseClass
}

// USAGE EXAMPLES
export const usageExamples = {
  // Basic usage
  heading: "className={semanticTypography.pageTitle}",
  
  // With color override
  success: "className={getTypographyClass('successMessage', { color: 'success' })}",
  
  // With size override
  largeMetric: "className={getTypographyClass('keyMetric', { size: 'large' })}",
  
  // Section label (auto-adds uppercase)
  sectionLabel: "className={getTypographyClass('sectionLabel')}",
}

// MIGRATION MAP - From old system to new minimal system
export const migrationMap = {
  // OLD SYSTEM -> NEW SYSTEM
  h1: 'pageTitle',
  h2: 'sectionTitle', 
  h3: 'cardTitle',
  h4: 'cardTitle',
  body: 'primaryText',
  bodySmall: 'secondaryText',
  button: 'primaryButton',
  buttonSmall: 'primaryButton',
  label: 'formLabel',
  labelMuted: 'sectionLabel',
  metadata: 'metadata',
  metadataSmall: 'metadata',
  nav: 'navigationItem',
  navActive: 'navigationActive',
  metric: 'keyMetric',
  metricSmall: 'smallMetric',
  code: 'stockSymbol',
  success: 'successMessage',
  warning: 'warningMessage',
  error: 'errorMessage',
  articleTitle: 'articleTitle',
  articleSnippet: 'articleExcerpt',
  placeholder: 'placeholderText',
  emptyState: 'emptyStateTitle',
}

export default typography