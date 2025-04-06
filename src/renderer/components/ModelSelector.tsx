'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import type { Model } from '../types';

interface ModelSelectorProps {
  models: Model[];
  selectedModel: string;
  onSelectModel: (modelName: string) => void;
  onRefreshModels: () => void;
  onPullModel: (modelName: string) => void;
  onDeleteModel: (modelName: string) => void;
  loading: boolean;
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
  const [pullModelInput, setPullModelInput] = useState<string>('');
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const handleSelectModel = (modelName: string) => {
    onSelectModel(modelName);
    setIsDropdownOpen(false);
  };

  const handlePullModel = () => {
    if (pullModelInput.trim()) {
      onPullModel(pullModelInput.trim());
      setPullModelInput('');
    }
  };

  const handleDeleteModel = (modelName: string) => {
    if (
      window.confirm(`Are you sure you want to delete model "${modelName}"?`)
    ) {
      onDeleteModel(modelName);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const currentModel =
    models.find((model) => model.name === selectedModel)?.name ||
    'Select a model';

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-4 flex items-center text-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          Model Management
        </h2>

        {/* Current Model Display */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-1">Current Model</p>
          <div className="bg-muted/50 px-3 py-2 rounded-md text-sm font-medium text-foreground">
            {selectedModel || (
              <span className="text-muted-foreground">None selected</span>
            )}
          </div>
        </div>

        {/* Model Dropdown Selector */}
        <div className="relative mb-3">
          <button
            onClick={toggleDropdown}
            className={`w-full flex items-center justify-between p-2.5 bg-background border rounded-md text-sm transition-all
              ${isDropdownOpen ? 'ring-2 ring-primary/50 border-primary' : 'border-input hover:border-primary/50'}
              ${loading || models.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            disabled={loading || models.length === 0}
          >
            <span className="truncate pr-2">{currentModel}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 transition-transform text-muted-foreground ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isDropdownOpen && models.length > 0 && (
            <div className="absolute bg-[#fff] z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto animate-in fade-in-0 zoom-in-95">
              <div className="py-1">
                {models.map((model) => (
                  <div
                    key={model.name}
                    className={`
                      flex justify-between items-center px-3 py-2 text-sm cursor-pointer transition-colors
                      ${selectedModel === model.name ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}
                    `}
                    onClick={() => handleSelectModel(model.name)}
                    onMouseEnter={() => setHoveredModel(model.name)}
                    onMouseLeave={() => setHoveredModel(null)}
                  >
                    <div className="truncate flex-1">{model.name}</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {model.size
                          ? typeof model.size === 'number'
                            ? `${(model.size / 1e9).toFixed(1)} GB`
                            : model.size
                          : '?'}
                      </span>
                      {hoveredModel === model.name && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteModel(model.name);
                          }}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-6 w-6"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={onRefreshModels}
          disabled={loading}
          variant="outline"
          size="sm"
          className="w-full hover:bg-primary/10 hover:text-primary transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh Models
        </Button>
      </div>

      {/* Pull Model Section */}
      <div className="p-4 border-t bg-muted/10">
        <h3 className="text-sm font-semibold mb-3 flex items-center text-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-2 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
            />
          </svg>
          Download New Model
        </h3>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={pullModelInput}
              onChange={(e) => setPullModelInput(e.target.value)}
              placeholder="e.g., llama2:latest"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm transition-all 
                focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
              onKeyDown={(e) => e.key === 'Enter' && handlePullModel()}
            />
            <Button
              onClick={handlePullModel}
              disabled={loading || !pullModelInput.trim()}
              size="sm"
              className="bg-primary hover:bg-primary/90 transition-colors"
            >
              Download
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter model name (e.g., "llama2") or full name with tag (e.g.,
            "llama2:7b-chat")
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;
