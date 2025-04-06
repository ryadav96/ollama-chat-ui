"use client"

import React, { useState } from 'react'
import { Button } from './ui/button'
import type { Model } from '../types'

interface ModelSelectorProps {
  models: Model[]
  selectedModel: string
  onSelectModel: (modelName: string) => void
  onRefreshModels: () => void
  onPullModel: (modelName: string) => void
  onDeleteModel: (modelName: string) => void
  loading: boolean
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onSelectModel,
  onRefreshModels,
  onPullModel,
  onDeleteModel,
  loading,
}) => {
  const [pullModelInput, setPullModelInput] = useState<string>('')
  const [hoveredModel, setHoveredModel] = useState<string | null>(null)

  const handleSelectModel = (modelName: string) => {
    onSelectModel(modelName)
  }

  const handlePullModel = () => {
    if (pullModelInput.trim()) {
      onPullModel(pullModelInput.trim())
      setPullModelInput('')
    }
  }

  const handleDeleteModel = (modelName: string) => {
    if (window.confirm(`Are you sure you want to delete model "${modelName}"?`)) {
      onDeleteModel(modelName)
    }
  }

  const formatModelSize = (size: number | undefined): string => {
    if (size === undefined) return '? GB'
    // Convert to GB and round to 1 decimal place
    return `${(size / 1e9).toFixed(1)} GB`
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Models
        </h2>
        <Button 
          onClick={onRefreshModels} 
          disabled={loading}
          variant="outline"
          size="sm"
          className="w-full flex items-center justify-center hover-shadow-effect"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {models.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-muted-foreground text-sm">No models available</p>
            <p className="text-xs text-muted-foreground mt-1">Pull a model to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {models.map((model) => (
              <div
                key={model.name}
                className={`
                  relative p-3 rounded-md cursor-pointer transition-all duration-200
                  hover-shadow-effect
                  ${selectedModel === model.name 
                    ? "bg-primary/10 border border-primary/30 shadow-sm" 
                    : "hover:bg-muted border border-transparent"
                  }
                `}
                onClick={() => handleSelectModel(model.name)}
                onMouseEnter={() => setHoveredModel(model.name)}
                onMouseLeave={() => setHoveredModel(null)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <div className="font-medium text-sm">{model.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      {formatModelSize(model.size)}
                    </div>
                  </div>
                  
                  {(hoveredModel === model.name || selectedModel === model.name) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteModel(model.name)
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  )}
                </div>
                
                {selectedModel === model.name && (
                  <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-primary transform translate-x-1/2 -translate-y-1/2"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <h3 className="text-sm font-medium mb-2 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          Pull New Model
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={pullModelInput}
            onChange={(e) => setPullModelInput(e.target.value)}
            placeholder="e.g., llama2:latest"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm transition-all 
            focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
          />
          <Button
            onClick={handlePullModel}
            disabled={loading || !pullModelInput.trim()}
            size="sm"
            variant="gradient"
          >
            Pull
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ModelSelector

