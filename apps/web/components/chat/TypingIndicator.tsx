import * as React from "react"
import { cn } from "@/lib/utils"

export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center space-x-1 h-6", className)}>
      <div className="h-1.5 w-1.5 rounded-full bg-secondary-400 animate-bounce" style={{ animationDelay: "0ms" }}></div>
      <div className="h-1.5 w-1.5 rounded-full bg-secondary-400 animate-bounce" style={{ animationDelay: "150ms" }}></div>
      <div className="h-1.5 w-1.5 rounded-full bg-secondary-400 animate-bounce" style={{ animationDelay: "300ms" }}></div>
    </div>
  )
}
