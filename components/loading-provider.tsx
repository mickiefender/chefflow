"use client"

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react"
import { Spinner } from "@/components/ui/spinner" // Assuming Spinner component is available

interface LoadingContextType {
  isLoading: boolean
  showLoading: () => void
  hideLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)

  const showLoading = useCallback(() => setIsLoading(true), [])
  const hideLoading = useCallback(() => setIsLoading(false), [])

  return (
    <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <Spinner className="w-16 h-16 text-purple-600" />
        </div>
      )}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider")
  }
  return context
}