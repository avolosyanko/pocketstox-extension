import React, { useState, useEffect } from 'react'

const DebugArticlesTab = ({ onArticleClick, onSelectionChange, onActionsReady }) => {
  console.log('DebugArticlesTab rendering')
  const [selectedCount, setSelectedCount] = useState(0)

  // Simple actions without complex dependencies
  useEffect(() => {
    console.log('Setting up debug actions')
    const actions = {
      selectAll: () => {
        console.log('Select All clicked')
        setSelectedCount(5) // Mock selecting 5 articles
        onSelectionChange?.(5)
      },
      clearSelection: () => {
        console.log('Clear Selection clicked')
        setSelectedCount(0)
        onSelectionChange?.(0)
      },
      exportToCSV: () => {
        console.log('Export CSV clicked')
        alert('Export functionality would work here')
      },
      deleteSelected: () => {
        console.log('Delete clicked')
        setSelectedCount(0)
        onSelectionChange?.(0)
      }
    }
    
    onActionsReady?.(actions)
  }, [onSelectionChange, onActionsReady])

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Debug Articles Tab</h2>
      <p>Selected: {selectedCount}</p>
      
      <div className="mb-4 space-x-2">
        <button 
          onClick={() => {
            console.log('Manual select 1 article')
            setSelectedCount(1)
            onSelectionChange?.(1)
          }}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
        >
          Select 1
        </button>
        <button 
          onClick={() => {
            console.log('Manual select 3 articles')
            setSelectedCount(3)
            onSelectionChange?.(3)
          }}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
        >
          Select 3
        </button>
        <button 
          onClick={() => {
            console.log('Manual clear selection')
            setSelectedCount(0)
            onSelectionChange?.(0)
          }}
          className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
        >
          Clear
        </button>
      </div>
      
      <div className="space-y-2 mt-4">
        <div className="bg-white border rounded p-3">
          <h3 className="font-semibold">Sample Article 1</h3>
          <p className="text-sm text-gray-600">This is a test article</p>
        </div>
        <div className="bg-white border rounded p-3">
          <h3 className="font-semibold">Sample Article 2</h3>
          <p className="text-sm text-gray-600">This is another test article</p>
        </div>
      </div>
    </div>
  )
}

export default DebugArticlesTab