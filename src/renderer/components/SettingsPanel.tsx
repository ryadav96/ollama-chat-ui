"use client"

import React, { useState, useEffect } from "react"
import { Button } from "./ui/button"
import type { Settings } from "../types"

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  settings: Settings
  onSave: (settings: Settings) => void
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [formState, setFormState] = useState<Settings>(settings)

  // Update form state when settings change
  useEffect(() => {
    setFormState(settings)
  }, [settings])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormState((prev) => ({
      ...prev,
      [name]: name === "temperature" || name === "maxTokens" ? parseFloat(value) : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formState)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex justify-center items-center animate-in fade-in-50">
      <div className="bg-card shadow-xl rounded-lg max-w-md w-full p-6 border border-border/50 relative transform transition-all">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
            title="Close"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="apiEndpoint" className="text-sm font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              API Endpoint
            </label>
            <div className="relative">
              <input
                type="text"
                id="apiEndpoint"
                name="apiEndpoint"
                value={formState.apiEndpoint}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm transition-all focus-ring"
                placeholder="http://localhost:11434"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              The URL of your Ollama instance
            </p>
          </div>

          <div className="p-4 bg-muted/30 rounded-lg space-y-4 shadow-inner">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label htmlFor="temperature" className="text-sm font-medium flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  Temperature
                </label>
                <span className="text-sm font-mono bg-background px-2 py-1 rounded-md">
                  {formState.temperature.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                id="temperature"
                name="temperature"
                min="0"
                max="2"
                step="0.1"
                value={formState.temperature}
                onChange={handleInputChange}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>Deterministic</span>
                <span>Creative</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label htmlFor="maxTokens" className="text-sm font-medium flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  Max Tokens
                </label>
                <span className="text-sm font-mono bg-background px-2 py-1 rounded-md">
                  {formState.maxTokens}
                </span>
              </div>
              <input
                type="range"
                id="maxTokens"
                name="maxTokens"
                min="100"
                max="4000"
                step="100"
                value={formState.maxTokens}
                onChange={handleInputChange}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>Short</span>
                <span>Long</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={onClose} className="hover-shadow-effect">
              Cancel
            </Button>
            <Button type="submit" variant="gradient" className="hover-shadow-effect">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SettingsPanel

