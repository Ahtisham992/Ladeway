import * as React from "react"
import { cn } from "@/lib/utils"
import { TypingIndicator } from "./TypingIndicator"

export interface MessageProps {
  id: string
  sender: "user" | "ai"
  content: string
}

export function MessageBubble({ message }: { message: MessageProps }) {
  const isUser = message.sender === "user"
  const isTyping = !isUser && message.content.length === 0

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-white rounded-tr-sm"
            : "bg-secondary-50 text-secondary-900 rounded-tl-sm shadow-sm border border-secondary-100"
        )}
      >
        {isTyping ? <TypingIndicator /> : <span className="whitespace-pre-wrap">{message.content}</span>}
      </div>
    </div>
  )
}
