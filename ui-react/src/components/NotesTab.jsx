import React, { memo, useEffect, useState, useCallback, useRef } from 'react'
import { Plus } from 'lucide-react'
import { useStorage } from '@/contexts/ServiceContext'

// Color palette for label circles (5 distinct colors)
const LABEL_COLORS = [
  'bg-amber-400',    // yellow/amber
  'bg-blue-400',     // blue
  'bg-green-400',    // green
  'bg-purple-400',   // purple
  'bg-rose-400',     // rose/pink
]

// Simple hash function to get consistent color for a label
const getColorForLabel = (labelName) => {
  if (!labelName) return 'bg-gray-300'
  let hash = 0
  for (let i = 0; i < labelName.length; i++) {
    hash = labelName.charCodeAt(i) + ((hash << 5) - hash)
  }
  return LABEL_COLORS[Math.abs(hash) % LABEL_COLORS.length]
}

// Helper function to capitalize first letter
const capitalizeFirst = (str) => {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Collapsible Section Component (Linear-style)
const CollapsibleSection = ({ title, defaultExpanded = false, children, rightElement }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="border-b border-gray-100 py-3 px-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-1 hover:opacity-70 transition-all"
      >
        <span className="text-xs font-medium text-gray-700">{title}</span>
        <svg
          className="w-2 h-2 text-gray-400"
          fill="currentColor"
          viewBox="0 0 6 6"
        >
          {isExpanded ? (
            <path d="M0 1.5l3 3 3-3H0z" />
          ) : (
            <path d="M1.5 0l3 3-3 3V0z" />
          )}
        </svg>
        <div className="flex-1" />
        {rightElement}
      </button>
      {isExpanded && (
        <div className="mt-3">
          {children}
        </div>
      )}
    </div>
  )
}

// Property Row Component (Linear-style)
const PropertyRow = ({ label, children }) => (
  <div className="flex items-center py-1.5">
    <span className="text-xs text-gray-400 w-28 flex-shrink-0">{label}</span>
    <div className="text-xs text-gray-900 flex items-center">{children}</div>
  </div>
)

const NotesTab = memo(() => {
  const storage = useStorage()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedCompany, setSelectedCompany] = useState('')
  const [trackedCompanies, setTrackedCompanies] = useState([])
  const [lastSaved, setLastSaved] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isTrackingExpanded, setIsTrackingExpanded] = useState(false)
  const [editingLabelTicker, setEditingLabelTicker] = useState(null)
  const [labelInputValue, setLabelInputValue] = useState('')
  const [viewingCompany, setViewingCompany] = useState(null)
  const [companyThesis, setCompanyThesis] = useState('')
  const [showLabelDropdown, setShowLabelDropdown] = useState(null)
  const [availableLabels, setAvailableLabels] = useState(['watching', 'researching', 'conviction', 'owned'])
  const [creatingNewLabel, setCreatingNewLabel] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')

  const contentRef = useRef(null)
  const titleRef = useRef(null)
  const labelInputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Handle label submit
  const handleLabelSubmit = (companyTicker) => {
    const trimmed = labelInputValue.trim()

    setTrackedCompanies(prev =>
      prev.map(c =>
        c.ticker === companyTicker ? { ...c, label: trimmed || null } : c
      )
    )

    setEditingLabelTicker(null)
    setLabelInputValue('')

    // Save to storage
    const updated = trackedCompanies.map(c =>
      c.ticker === companyTicker ? { ...c, label: trimmed || null } : c
    )
    storage.saveWatchlist?.(updated)
  }

  // Start editing a label - now shows dropdown instead of text input
  const startEditingLabel = (company) => {
    setShowLabelDropdown(company.ticker)
    setCreatingNewLabel(false)
    setNewLabelName('')
  }

  // Handle selecting a label from dropdown
  const handleLabelSelect = (companyTicker, labelName) => {
    setTrackedCompanies(prev =>
      prev.map(c =>
        c.ticker === companyTicker ? { ...c, label: labelName } : c
      )
    )
    
    setShowLabelDropdown(null)
    
    // Save to storage
    const updated = trackedCompanies.map(c =>
      c.ticker === companyTicker ? { ...c, label: labelName } : c
    )
    storage.saveWatchlist?.(updated)
  }

  // Handle creating a new label
  const handleCreateNewLabel = (companyTicker) => {
    const trimmedName = newLabelName.trim()
    if (trimmedName && !availableLabels.includes(trimmedName)) {
      setAvailableLabels(prev => [...prev, trimmedName])
    }
    
    if (trimmedName) {
      handleLabelSelect(companyTicker, trimmedName)
    }
    
    setCreatingNewLabel(false)
    setNewLabelName('')
  }

  // Handle removing a label (set to null)
  const handleRemoveLabel = (companyTicker) => {
    handleLabelSelect(companyTicker, null)
  }

  // Load companies from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await storage.getWatchlist?.() || []

        let savedCompanies
        if (result && result.length > 0) {
          savedCompanies = result
        } else {
          // Demo data
          savedCompanies = [
            { ticker: 'META', company: 'Meta Platforms Inc.', label: 'watching' },
            { ticker: 'NFLX', company: 'Netflix Inc.', label: 'watching' },
            { ticker: 'RBLX', company: 'Roblox Corporation', label: 'researching' },
            { ticker: 'NVDA', company: 'NVIDIA Corporation', label: 'conviction' },
            { ticker: 'AAPL', company: 'Apple Inc.', label: 'owned' },
            { ticker: 'GOOGL', company: 'Alphabet Inc.', label: 'researching' },
            { ticker: 'MSFT', company: 'Microsoft Corporation', label: 'conviction' },
          ]
        }

        setTrackedCompanies(savedCompanies)

        // Load current note from storage if exists
        const currentNote = await storage.getCurrentNote?.()
        if (currentNote) {
          setTitle(currentNote.title || '')
          setContent(currentNote.content || '')
          setSelectedCompany(currentNote.ticker || '')
          setLastSaved(currentNote.lastSaved)
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }

    loadData()
  }, [storage])

  // Auto-save functionality
  const saveNote = useCallback(async () => {
    if (!title && !content) return

    setIsSaving(true)
    try {
      const noteData = {
        title: title || 'Untitled',
        content,
        ticker: selectedCompany,
        lastSaved: new Date().toISOString()
      }

      // Check if this is a new note or update
      const isNewNote = !lastSaved

      // Save to storage
      await storage.saveCurrentNote?.(noteData)
      setLastSaved(noteData.lastSaved)

      // Log activity
      if (selectedCompany) {
        const company = trackedCompanies.find(c => c.ticker === selectedCompany)
        await storage.logActivity?.({
          type: isNewNote ? 'note_created' : 'note_updated',
          description: isNewNote
            ? `Created note on ${selectedCompany}`
            : `Updated note on ${selectedCompany}`,
          metadata: {
            ticker: selectedCompany,
            companyName: company?.company,
            noteTitle: title || 'Untitled'
          },
          relatedEntities: [selectedCompany]
        })
      } else if (isNewNote) {
        await storage.logActivity?.({
          type: 'note_created',
          description: `Created note: ${title || 'Untitled'}`,
          metadata: {
            noteTitle: title || 'Untitled'
          },
          relatedEntities: []
        })
      }

      // If company is selected, also save as a note on that company
      if (selectedCompany && content) {
        const company = trackedCompanies.find(c => c.ticker === selectedCompany)
        if (company) {
          const newNote = {
            text: content,
            timestamp: new Date().toISOString()
          }

          const updatedCompany = {
            ...company,
            notes: [newNote, ...(company.notes || [])]
          }

          await storage.updateCompany?.(updatedCompany)
        }
      }
    } catch (error) {
      console.error('Failed to save note:', error)
    } finally {
      setIsSaving(false)
    }
  }, [title, content, selectedCompany, trackedCompanies, storage, lastSaved])

  // Auto-save on content change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title || content) {
        saveNote()
      }
    }, 1000) // Save 1 second after user stops typing

    return () => clearTimeout(timer)
  }, [title, content, selectedCompany, saveNote])

  // Focus on title when component mounts
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus()
    }
  }, [])

  // Handle click outside to close label dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLabelDropdown && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowLabelDropdown(null)
        setCreatingNewLabel(false)
        setNewLabelName('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showLabelDropdown])

  const handleManualSave = () => {
    saveNote()
  }

  const hasContent = !!(title || content)

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Company Detail View - Full screen overlay
  if (viewingCompany) {
    const colorClass = getColorForLabel(viewingCompany.label)

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white">
        {/* Header with Back Button */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200">
          <div className="px-4 py-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewingCompany(null)}
                className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                ←
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-medium text-gray-900">
                  Notes
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Properties Section */}
          <CollapsibleSection
            title="Properties"
            defaultExpanded={true}
            rightElement={<span className="text-gray-300 text-sm">+</span>}
          >
            <div>
              <PropertyRow label="Ticker">
                {viewingCompany.ticker}
              </PropertyRow>
              <PropertyRow label="Company">
                {viewingCompany.company}
              </PropertyRow>
              <PropertyRow label="Date Added">
                <svg className="w-3.5 h-3.5 text-gray-400 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(viewingCompany.dateAdded)}
              </PropertyRow>
              <PropertyRow label="Yahoo Finance">
                <a
                  href={`https://finance.yahoo.com/quote/${viewingCompany.ticker}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-900 hover:text-blue-600 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-gray-400 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open
                </a>
              </PropertyRow>
              <PropertyRow label="Labels">
                <div className="relative" ref={showLabelDropdown === `detail-${viewingCompany.ticker}` ? dropdownRef : null}>
                  <button
                    className="flex items-center text-gray-900 hover:text-gray-600 transition-colors"
                    onClick={() => setShowLabelDropdown(`detail-${viewingCompany.ticker}`)}
                  >
                    {viewingCompany.label ? (
                      <>
                        <span className={`w-2.5 h-2.5 rounded-full ${colorClass} mr-1.5`}></span>
                        {capitalizeFirst(viewingCompany.label)}
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 text-gray-400 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        None
                      </>
                    )}
                  </button>
                  
                  {/* Label Dropdown for Detail View */}
                  {showLabelDropdown === `detail-${viewingCompany.ticker}` && (
                    <div className="absolute left-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                      {/* Remove Label Option */}
                      <button
                        onClick={() => {
                          handleRemoveLabel(viewingCompany.ticker)
                          setViewingCompany(prev => ({ ...prev, label: null }))
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                        None
                      </button>
                      
                      {/* Existing Labels */}
                      {availableLabels.map((label) => (
                        <button
                          key={label}
                          onClick={() => {
                            handleLabelSelect(viewingCompany.ticker, label)
                            setViewingCompany(prev => ({ ...prev, label }))
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <span className={`w-2 h-2 rounded-full ${getColorForLabel(label)}`}></span>
                          {capitalizeFirst(label)}
                        </button>
                      ))}
                      
                      {/* Create New Label */}
                      {!creatingNewLabel ? (
                        <button
                          onClick={() => setCreatingNewLabel(true)}
                          className="w-full px-3 py-2 text-left text-xs text-gray-500 hover:bg-gray-50 border-t border-gray-100"
                        >
                          + Create new
                        </button>
                      ) : (
                        <div className="p-2 border-t border-gray-100">
                          <input
                            type="text"
                            value={newLabelName}
                            onChange={(e) => setNewLabelName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const trimmedName = newLabelName.trim()
                                if (trimmedName) {
                                  handleCreateNewLabel(viewingCompany.ticker)
                                  setViewingCompany(prev => ({ ...prev, label: trimmedName }))
                                }
                              } else if (e.key === 'Escape') {
                                setCreatingNewLabel(false)
                                setNewLabelName('')
                              }
                            }}
                            placeholder="Label name..."
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-gray-400"
                            autoFocus
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </PropertyRow>
            </div>
          </CollapsibleSection>

          {/* Investment Thesis Section */}
          <CollapsibleSection
            title="Investment Thesis"
            defaultExpanded={true}
            rightElement={<span className="text-gray-300 text-sm">+</span>}
          >
            <textarea
              value={companyThesis}
              onChange={(e) => setCompanyThesis(e.target.value)}
              placeholder="Add your investment thesis for this company..."
              className="w-full h-20 px-0 py-0 text-xs text-gray-600 bg-transparent border-0 focus:outline-none resize-none placeholder:text-gray-400"
            />
          </CollapsibleSection>

          {/* Activity Section */}
          <CollapsibleSection
            title="Activity"
            defaultExpanded={true}
            rightElement={<span className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">See all</span>}
          >
            <div className="space-y-2">
              {viewingCompany.dateAdded ? (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-gray-600">
                    Added to tracking · <span className="text-gray-400">{formatDate(viewingCompany.dateAdded)}</span>
                  </span>
                </div>
              ) : (
                <p className="text-xs text-gray-400">No activity yet</p>
              )}
            </div>
          </CollapsibleSection>
        </div>
      </div>
    )
  }

  // Notes View (default)
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Main Note Editor - Centered (hidden when tracking expanded) */}
      {!isTrackingExpanded && (
        <div className="flex-1 overflow-hidden px-4 pt-4">
          <div className="h-full w-full max-w-2xl mx-auto flex flex-col">
            {/* Title Input */}
            <input
              ref={titleRef}
              type="text"
              placeholder="Untitled"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-0 py-1.5 text-lg font-semibold border-0 focus:outline-none placeholder:text-gray-300 bg-transparent mb-1"
              style={{ caretColor: '#000' }}
            />

            {/* Divider */}
            <div className="mb-4 pb-2 border-b border-gray-100"></div>

            {/* Content Textarea - Takes up all remaining space */}
            <textarea
              ref={contentRef}
              placeholder="Write your investment thesis..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 w-full px-0 py-0 pb-4 text-sm leading-relaxed border-0 focus:outline-none resize-none placeholder:text-gray-300 bg-transparent overflow-y-auto"
              style={{
                caretColor: '#000'
              }}
            />
          </div>
        </div>
      )}

      {/* Expanded Following Content - Takes full space when expanded */}
      {isTrackingExpanded && (
        <>
          {/* Following Header - At top when expanded */}
          <div className="flex-shrink-0 bg-white border-b border-gray-100">
            <div className="flex items-center px-4 py-2.5">
              <button
                onClick={() => setIsTrackingExpanded(!isTrackingExpanded)}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-all"
              >
                <svg
                  className="w-2 h-2 text-gray-500"
                  fill="currentColor"
                  viewBox="0 0 6 6"
                >
                  <path d="M0 1.5l3 3 3-3H0z" />
                </svg>
                <span className="font-medium text-gray-700">Following</span>
                <span className="text-gray-400">{trackedCompanies.length}</span>
              </button>
              <div className="flex-1" />
              <button
                onClick={() => {
                  setIsTrackingExpanded(true)
                }}
                className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                aria-label="Add company"
              >
                <Plus size={14} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Company List */}
          <div className="flex-1 overflow-y-auto">
            {trackedCompanies.map((company) => {
            const colorClass = getColorForLabel(company.label)
            const isSelected = selectedCompany === company.ticker
            const isEditing = editingLabelTicker === company.ticker

            return (
              <div
                key={company.ticker}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs transition-all ${
                  isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                {/* Company Info - Click to open detail view */}
                <button
                  onClick={() => setViewingCompany(company)}
                  className="flex-1 flex items-center gap-2 text-left min-w-0"
                >
                  <span className="font-medium text-gray-900">{company.ticker}</span>
                  <span className="text-gray-400 truncate">{company.company}</span>
                </button>

                {/* Label Pill - Click to show dropdown */}
                <div className="relative" ref={showLabelDropdown === company.ticker ? dropdownRef : null}>
                  <button
                    onClick={() => startEditingLabel(company)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs text-gray-500 border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <span className={`w-2 h-2 rounded-full ${colorClass}`}></span>
                    {company.label ? capitalizeFirst(company.label) : 'None'}
                  </button>
                  
                  {/* Label Dropdown */}
                  {showLabelDropdown === company.ticker && (
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                      {/* Remove Label Option */}
                      <button
                        onClick={() => handleRemoveLabel(company.ticker)}
                        className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                        None
                      </button>
                      
                      {/* Existing Labels */}
                      {availableLabels.map((label) => (
                        <button
                          key={label}
                          onClick={() => handleLabelSelect(company.ticker, label)}
                          className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <span className={`w-2 h-2 rounded-full ${getColorForLabel(label)}`}></span>
                          {capitalizeFirst(label)}
                        </button>
                      ))}
                      
                      {/* Create New Label */}
                      {!creatingNewLabel ? (
                        <button
                          onClick={() => setCreatingNewLabel(true)}
                          className="w-full px-3 py-2 text-left text-xs text-gray-500 hover:bg-gray-50 border-t border-gray-100"
                        >
                          + Create new
                        </button>
                      ) : (
                        <div className="p-2 border-t border-gray-100">
                          <input
                            type="text"
                            value={newLabelName}
                            onChange={(e) => setNewLabelName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCreateNewLabel(company.ticker)
                              } else if (e.key === 'Escape') {
                                setCreatingNewLabel(false)
                                setNewLabelName('')
                              }
                            }}
                            placeholder="Label name..."
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-gray-400"
                            autoFocus
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          </div>
        </>
      )}

      {/* Bottom Bar - Save Button & Company Selector (hidden when following expanded) */}
      {!isTrackingExpanded && (
        <div className="flex-shrink-0 px-4 py-3 flex items-center justify-start gap-2">
          {/* Save Button */}
          <button
            onClick={handleManualSave}
            disabled={!hasContent || isSaving}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              hasContent && !isSaving
                ? 'bg-gray-900 text-white hover:bg-gray-800 cursor-pointer'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>

          {/* Company Selector Pill */}
          <div className="relative">
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className={`appearance-none px-3 py-1.5 rounded-full text-xs cursor-pointer transition-colors border-0 focus:outline-none pr-6 ${
                selectedCompany
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
              }`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 8L3 5h6z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center'
              }}
            >
              <option value="">Select company...</option>
              {trackedCompanies.map((company) => (
                <option key={company.ticker} value={company.ticker}>
                  {company.ticker}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Following Header - Only visible at bottom when collapsed */}
      {!isTrackingExpanded && (
        <div className="flex-shrink-0 bg-white border-t border-gray-100">
          <div className="flex items-center px-4 py-2.5">
            <button
              onClick={() => setIsTrackingExpanded(!isTrackingExpanded)}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-all"
            >
              <svg
                className="w-2 h-2 text-gray-500"
                fill="currentColor"
                viewBox="0 0 6 6"
              >
                <path d="M1.5 0l3 3-3 3V0z" />
              </svg>
              <span className="font-medium text-gray-700">Following</span>
              <span className="text-gray-400">{trackedCompanies.length}</span>
            </button>
            <div className="flex-1" />
            <button
              onClick={() => {
                setIsTrackingExpanded(true)
              }}
              className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              aria-label="Add company"
            >
              <Plus size={14} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
})

NotesTab.displayName = 'NotesTab'

export default NotesTab
