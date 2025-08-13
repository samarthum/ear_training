"use client";
import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface PracticeInterfaceProps {
  title: string
  description?: string
  children: React.ReactNode
  onReplay?: () => void
  onStart?: () => void
  isPlaying?: boolean
  isLoading?: boolean
  feedback?: string | null
  currentInfo?: string
  hasStarted?: boolean
  className?: string
}

export function PracticeInterface({ 
  title,
  description,
  children,
  onReplay,
  onStart,
  isPlaying = false,
  isLoading = false,
  feedback,
  currentInfo,
  hasStarted = false,
  className
}: PracticeInterfaceProps) {
  return (
    <div className={cn("h-screen flex flex-col overflow-hidden", className)}>
      {/* Header - Minimal */}
      <div className="text-center py-2 border-b border-[color:var(--brand-line)]">
        <h1 className="text-lg font-bold text-[color:var(--brand-text)]">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-[color:var(--brand-muted)] mt-1">
            {description}
          </p>
        )}
      </div>

      {/* Practice Panel - Auto-sized container at top */}
      <div className="flex-1 flex flex-col items-center p-4 min-h-0">
        <div 
          className={cn(
            "rounded-lg border border-[color:var(--brand-line)] p-6 max-w-2xl w-full",
            "bg-[color:var(--brand-panel)] backdrop-blur-sm",
            "shadow-[var(--brand-shadow)] flex flex-col",
          )}
        >
          {/* Audio Controls - Compact */}
          {!hasStarted && (
            <div className="text-center mb-4">
              <Button
                onClick={onStart}
                disabled={isPlaying || isLoading}
                variant="brandPrimary"
                size="lg"
                shape="pill"
                className="min-w-[140px] h-10"
              >
                {isLoading
                  ? "Loading..."
                  : isPlaying
                  ? "Playing..."
                  : "Start session"}
              </Button>
            </div>
          )}
            
          {feedback && (
            <div className="text-center mb-4">
              <div role="status" aria-live="polite" className={cn(
                "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium animate-in slide-in-from-top duration-300",
                feedback.startsWith("✅") 
                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                  : feedback.startsWith("❌")
                  ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
              )}>
                {feedback}
              </div>
            </div>
          )}

          {/* Practice Content */}
          <div className="flex flex-col space-y-4">
            {children}
          </div>

          {/* Current Info - Compact */}
          {currentInfo && (
            <div className="mt-2 pt-2 border-t border-[color:var(--brand-line)]">
              <p className="text-xs text-[color:var(--brand-muted)] text-center">
                {currentInfo}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}