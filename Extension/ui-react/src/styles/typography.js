// Google-Inspired Typography System - Clean, Modern, Hierarchical
// Based on Google's Material Design 3 and Product typography

export const typography = {
  // PRIMARY HIERARCHY - Clear visual hierarchy
  display: "text-2xl font-normal text-gray-900 tracking-tight leading-8",     // Large displays (24px)
  headline: "text-xl font-normal text-gray-900 tracking-tight leading-7",     // Page headlines (20px)
  title: "text-lg font-medium text-gray-900 tracking-tight leading-6",        // Section titles (18px)
  subheading: "text-base font-medium text-gray-900 leading-6",                // Card/group titles (16px)
  body: "text-sm font-normal text-gray-700 leading-5",                        // Primary body text (14px)
  caption: "text-xs font-normal text-gray-600 leading-4",                     // Metadata/captions (12px)
  overline: "text-xs font-medium text-gray-500 leading-4", // Section labels (12px)
  
  // INTERACTIVE ELEMENTS
  button: "text-sm font-medium text-white leading-5",                         // Primary buttons (14px)
  buttonSecondary: "text-sm font-medium text-gray-700 leading-5",            // Secondary buttons (14px)
  link: "text-sm font-medium text-blue-600 leading-5",                       // Links (14px)
  
  // BRAND & SPECIAL ELEMENTS
  accent: "text-sm font-medium text-purple-600 leading-5",                   // Purple accent text (14px)
  mono: "text-xs font-mono text-gray-700 leading-4",                         // Code/symbols (12px)
}

// SEMANTIC MAPPING - Clean hierarchy following Google's design principles
export const semanticTypography = {
  // HEADINGS - Clear visual hierarchy
  pageTitle: typography.headline,        // Main page titles (20px)
  sectionTitle: typography.title,        // Section headings (18px)
  groupTitle: typography.overline,       // Time groups (Today, Yesterday) (12px)
  cardTitle: typography.subheading,      // Article titles (16px)
  drawerTitle: typography.headline,      // Drawer/modal titles (20px)
  
  // BODY TEXT - Readable and accessible
  primaryText: typography.body,          // Main content (14px)
  secondaryText: typography.caption,     // Supporting text (12px)
  description: typography.body,          // Descriptions (14px)
  metadata: typography.caption,          // Source, time, etc. (12px)
  timestamp: typography.caption,         // Timestamps (12px)
  
  // INTERACTIVE ELEMENTS
  primaryButton: typography.button,      // Primary actions
  secondaryButton: typography.buttonSecondary, // Secondary actions
  linkText: typography.link,             // Clickable links
  
  // NAVIGATION
  navigationItem: typography.body,       // Tab items (14px)
  navigationActive: typography.accent,   // Active tab
  
  // CONTENT TYPES
  articleTitle: typography.subheading,   // Article cards (16px)
  articleExcerpt: typography.body,       // Article previews (14px)
  stockSymbol: typography.mono,          // Stock symbols
  
  // STATUS & FEEDBACK
  successMessage: typography.accent,     // Success states
  warningMessage: typography.accent,     // Warning states
  errorMessage: typography.accent,       // Error states
  
  // LABELS & STRUCTURE
  formLabel: typography.subheading,      // Form field labels
  sectionLabel: typography.overline,     // Section dividers
  
  // EMPTY STATES
  emptyStateTitle: typography.title,     // Empty state headlines
  emptyStateDescription: typography.body, // Empty state descriptions
  placeholderText: typography.caption,   // Placeholder content
  
  // METRICS & DATA
  keyMetric: typography.title,           // Important numbers/stats
  smallMetric: typography.accent,        // Secondary metrics
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

// GOOGLE-INSPIRED SPACING SYSTEM - 8px Grid
// Following Material Design spacing principles
export const spacing = {
  // BASE SPACING - 8px increments
  xs: "space-y-1",    // 4px - tight spacing
  sm: "space-y-2",    // 8px - minimal spacing
  md: "space-y-3",    // 12px - default spacing
  lg: "space-y-4",    // 16px - comfortable spacing
  xl: "space-y-6",    // 24px - generous spacing
  xxl: "space-y-8",   // 32px - section spacing
  xxxl: "space-y-12", // 48px - page section spacing
  
  // PADDING - Component internal spacing
  paddingTight: "p-2",     // 8px
  paddingDefault: "p-3",   // 12px
  paddingComfortable: "p-4", // 16px
  paddingGenerous: "p-6",  // 24px
  
  // MARGIN - Component external spacing
  marginTight: "m-2",      // 8px
  marginDefault: "m-3",    // 12px
  marginComfortable: "m-4", // 16px
  marginGenerous: "m-6",   // 24px
  
  // GAPS - For flex/grid layouts
  gapTight: "gap-1",       // 4px
  gapDefault: "gap-2",     // 8px
  gapComfortable: "gap-3", // 12px
  gapGenerous: "gap-4",    // 16px
}

// COMPONENT-SPECIFIC SPACING
export const componentSpacing = {
  // Card spacing
  cardPadding: "px-4 py-4",        // 16px horizontal, 16px vertical
  cardSpacing: "space-y-3",        // 12px between cards
  cardGroupSpacing: "space-y-6",   // 24px between card groups
  
  // Navigation spacing
  navPadding: "px-4 py-2",         // 16px horizontal, 8px vertical
  navItemSpacing: "gap-6",         // 24px between nav items
  
  // Content area spacing
  contentPadding: "px-3 py-4",     // 12px horizontal, 16px vertical
  sectionSpacing: "space-y-6",     // 24px between sections
  
  // Header spacing
  headerPadding: "px-4 py-3",      // 16px horizontal, 12px vertical
  headerSpacing: "space-y-2",      // 8px internal spacing
}

export default typography