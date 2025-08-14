"use client";
import * as React from "react"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
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
  belowPanel?: React.ReactNode
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
  className,
  belowPanel
}: PracticeInterfaceProps) {
  return (
    <div className={cn("min-h-screen flex flex-col", className)}>
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
      <div className="flex-1 flex flex-col items-center p-3">
        <div 
          className={cn(
            "rounded-lg border border-[color:var(--brand-line)] p-4 max-w-2xl w-full",
            "bg-[color:var(--brand-panel)] backdrop-blur-sm",
            "shadow-[var(--brand-shadow)] flex flex-col",
          )}
        >
          {/* Audio Controls - Prominent Start Button */}
          {!hasStarted && (
            <div className="text-center mb-6">
              <Button
                onClick={onStart}
                disabled={isPlaying || isLoading}
                variant="brandPrimary"
                size="lg"
                className="min-w-[200px] h-14 text-lg font-bold hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
                {(isLoading || isPlaying) && <Spinner className="size-4" />} {isLoading
                  ? "Loading…"
                  : isPlaying
                  ? "Playing…"
                  : "Start Practice"}
              </Button>
            </div>
          )}
            
          {feedback && (
            <div className="text-center mb-4">
              <div role="status" aria-live="assertive" aria-atomic="true" className={cn(
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
        {belowPanel && (
          <div className="w-full max-w-2xl mt-2 flex items-center justify-center">
            {belowPanel}
          </div>
        )}
      </div>
    </div>
  )
}