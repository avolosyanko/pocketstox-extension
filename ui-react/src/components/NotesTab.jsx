import React, { memo, useEffect, useState } from 'react'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { useStorage } from '@/contexts/ServiceContext'
import CompanyIcon from './CompanyIcon'

// Default collections
const DEFAULT_COLLECTIONS = [
  { id: 'owned', name: 'Owned', companies: [], expanded: true },
  { id: 'research', name: 'Research', companies: [], expanded: true },
  { id: 'watching', name: 'Watching', companies: [], expanded: true }
]

// Company Card Component
const CompanyCard = ({ company, onViewCompany }) => {
  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-all cursor-pointer ml-4"
      onClick={() => onViewCompany(company)}
    >
      <div className="flex items-center gap-3">
        <CompanyIcon article={{ matches: [company] }} size="sm" className="rounded-md" />
        <div>
          <h4 className="text-sm font-medium text-gray-900">{company.ticker}</h4>
          <p className="text-xs text-gray-500">{company.company}</p>
        </div>
      </div>
    </div>
  )
}

// Collapsible Collection Section Component
const CollectionSection = ({ collection, companies, onToggleExpanded, onViewCompany }) => {
  const companyCount = companies.length
  
  return (
    <div className="mb-6">
      {/* Collection Header */}
      <div 
        className="flex items-center gap-3 p-4 bg-white rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
        onClick={() => onToggleExpanded(collection.id)}
      >
        {/* Chevron Icon */}
        <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
          {collection.expanded ? (
            <ChevronDown size={16} className="text-gray-600" />
          ) : (
            <ChevronRight size={16} className="text-gray-600" />
          )}
        </div>

        {/* Collection Icon/Placeholder */}
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-gray-600">
            {collection.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
        
        {/* Collection Info */}
        <div className="flex-1">
          {/* Collection Name */}
          <h3 className="text-sm font-medium text-gray-900 leading-normal mb-1">
            {collection.name}
          </h3>
          
          {/* Company Count */}
          <div className="text-xs text-gray-500">
            <span>{companyCount} Companies</span>
          </div>
        </div>
      </div>

      {/* Companies List (Collapsible) */}
      {collection.expanded && (
        <div className="mt-3 space-y-2">
          {companies.map((company) => (
            <CompanyCard
              key={company.ticker}
              company={company}
              onViewCompany={onViewCompany}
            />
          ))}
          {companies.length === 0 && (
            <div className="ml-4 text-center py-4">
              <p className="text-sm text-gray-500">No companies in this collection yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


const NotesTab = memo(({ onViewCollection, onViewCompany }) => {
  const storage = useStorage()
  
  const [collections, setCollections] = useState(DEFAULT_COLLECTIONS)
  const [allCompanies, setAllCompanies] = useState([])
  const [isCreatingCollection, setIsCreatingCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')

  // Load companies from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await storage.getWatchlist?.() || []

        let savedCompanies
        // Always use demo data for now to show UI with companies
        savedCompanies = [
          // Owned companies
          { ticker: 'AAPL', company: 'Apple Inc.', label: 'owned' },
          { ticker: 'MSFT', company: 'Microsoft Corporation', label: 'owned' },
          { ticker: 'GOOGL', company: 'Alphabet Inc.', label: 'owned' },
          { ticker: 'AMZN', company: 'Amazon.com Inc.', label: 'owned' },
          
          // Research companies
          { ticker: 'RBLX', company: 'Roblox Corporation', label: 'researching' },
          { ticker: 'PLTR', company: 'Palantir Technologies Inc.', label: 'researching' },
          { ticker: 'SNOW', company: 'Snowflake Inc.', label: 'researching' },
          { ticker: 'CRWD', company: 'CrowdStrike Holdings Inc.', label: 'researching' },
          { ticker: 'NET', company: 'Cloudflare Inc.', label: 'researching' },
          
          // Watching companies
          { ticker: 'META', company: 'Meta Platforms Inc.', label: 'watching' },
          { ticker: 'NFLX', company: 'Netflix Inc.', label: 'watching' },
          { ticker: 'NVDA', company: 'NVIDIA Corporation', label: 'conviction' },
          { ticker: 'TSLA', company: 'Tesla Inc.', label: 'watching' },
          { ticker: 'AMD', company: 'Advanced Micro Devices Inc.', label: 'conviction' },
          { ticker: 'SHOP', company: 'Shopify Inc.', label: 'watching' },
          { ticker: 'SQ', company: 'Block Inc.', label: 'watching' },
        ]

        setAllCompanies(savedCompanies)
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }

    loadData()
  }, [storage])

  // Get companies for a specific collection
  const getCompaniesForCollection = (collectionId) => {
    if (collectionId === 'owned') {
      return allCompanies.filter(c => c.label === 'owned')
    } else if (collectionId === 'research') {
      return allCompanies.filter(c => c.label === 'researching')
    } else if (collectionId === 'watching') {
      return allCompanies.filter(c => ['watching', 'conviction'].includes(c.label))
    }
    return []
  }

  const handleToggleExpanded = (collectionId) => {
    setCollections(prev => 
      prev.map(collection => 
        collection.id === collectionId 
          ? { ...collection, expanded: !collection.expanded }
          : collection
      )
    )
  }

  const handleCreateCollection = () => {
    setIsCreatingCollection(true)
  }

  const handleSaveNewCollection = () => {
    if (newCollectionName.trim()) {
      const newCollection = {
        id: newCollectionName.toLowerCase().replace(/\s+/g, '-'),
        name: newCollectionName.trim(),
        companies: [],
        expanded: true
      }
      setCollections(prev => [...prev, newCollection])
      setNewCollectionName('')
      setIsCreatingCollection(false)
    }
  }

  const handleCancelCreateCollection = () => {
    setNewCollectionName('')
    setIsCreatingCollection(false)
  }


  // Combined view with all collections and their companies
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* All Collections with Companies */}
          {collections.map((collection) => (
            <CollectionSection
              key={collection.id}
              collection={collection}
              companies={getCompaniesForCollection(collection.id)}
              onToggleExpanded={handleToggleExpanded}
              onViewCompany={onViewCompany}
            />
          ))}
          
          {/* Create New Collection Card */}
          {!isCreatingCollection ? (
            <div 
              className="bg-white rounded-lg p-4 hover:bg-gray-50 transition-all cursor-pointer flex items-center gap-4 border-2 border-dashed border-gray-200"
              onClick={handleCreateCollection}
            >
              {/* Plus Icon */}
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Plus size={20} className="text-gray-500" />
              </div>
              
              {/* Create Text */}
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">
                  Create new list
                </h3>
              </div>
            </div>
          ) : (
            /* Creating Collection Input */
            <div className="bg-white border-2 border-gray-300 rounded-lg p-4 flex items-center gap-4">
              {/* Input Icon */}
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-gray-600">📝</span>
              </div>
              
              {/* Input and Actions */}
              <div className="flex-1">
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveNewCollection()
                    } else if (e.key === 'Escape') {
                      handleCancelCreateCollection()
                    }
                  }}
                  placeholder="Collection name..."
                  className="w-full text-sm font-medium text-gray-900 bg-transparent border-0 focus:outline-none placeholder:text-gray-500"
                  autoFocus
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleSaveNewCollection}
                    className="px-2 py-1 text-xs bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelCreateCollection}
                    className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

NotesTab.displayName = 'NotesTab'

export default NotesTab