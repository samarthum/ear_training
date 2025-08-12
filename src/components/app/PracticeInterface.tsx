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
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-[color:var(--brand-text)] tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-[color:var(--brand-muted)] max-w-2xl mx-auto">
            {description}
          </p>
        )}
      </div>

      {/* Practice Panel */}
      <div className="max-w-2xl mx-auto">
        <div 
          className={cn(
            "rounded-xl p-8 border border-[color:var(--brand-line)]",
            "bg-[color:var(--brand-panel)] backdrop-blur-sm",
            "shadow-[var(--brand-shadow)]",
          )}
        >
          {/* Audio Controls */}
          <div className="text-center space-y-4 mb-8">
            <Button
              onClick={hasStarted ? onReplay : onStart}
              disabled={isPlaying || isLoading}
              variant="brandPrimary"
              size="lg"
              shape="pill"
              className="min-w-[160px]"
            >
              {isLoading
                ? "Loading..."
                : isPlaying
                ? "Playing..."
                : hasStarted
                ? "🔄 Replay"
                : "🎵 Start Practice"}
            </Button>
            
            {feedback && (
              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
                feedback.startsWith("✅") 
                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
              )}>
                {feedback}
              </div>
            )}
          </div>

          {/* Practice Content */}
          <div className="space-y-6">
            {children}
          </div>

          {/* Current Info */}
          {currentInfo && (
            <div className="mt-6 pt-4 border-t border-[color:var(--brand-line)]">
              <p className="text-sm text-[color:var(--brand-muted)] text-center">
                {currentInfo}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}