"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { SendIcon, AlertCircle } from "lucide-react"
import { MessageBubble, type MessageProps } from "./MessageBubble"
import { cn } from "@/lib/utils"

export interface ChatWidgetProps {
  sessionToken: string
  initialMessages: MessageProps[]
  onComplete?: () => void
  className?: string
}

export function ChatWidget({ sessionToken, initialMessages, onComplete, className }: ChatWidgetProps) {
  const [messages, setMessages] = useState<MessageProps[]>(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [streamError, setStreamError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll using a ref, per requirements
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isStreaming || isComplete) return

    const userMessage = inputValue.trim()
    setInputValue("")
    setStreamError(null)

    // Add user message and a blank AI message for the typing indicator
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), sender: "user", content: userMessage },
      { id: "streaming", sender: "ai", content: "" }, // empty, grows with tokens
    ])
    setIsStreaming(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/conversations/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ message: userMessage }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Your session has expired.")
        }
        throw new Error("Failed to send message.")
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No readable stream available")

      const decoder = new TextDecoder()
      let buffer = ""
      let currentEvent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process complete lines only
        const lines = buffer.split("\n")
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim()
          }
          if (line.startsWith("data: ")) {
            const rawData = line.slice(6).trim()
            try {
              const data = JSON.parse(rawData)
              if (currentEvent === "token") {
                // Append to current AI message
                setMessages((prev) => {
                  const updated = [...prev]
                  updated[updated.length - 1].content += data.content
                  return updated
                })
              }
              if (currentEvent === "done") {
                setIsStreaming(false)
                if (["CLOSED", "TRANSFERRED", "ABANDONED"].includes(data.status)) {
                  setIsComplete(true)
                  if (onComplete) onComplete()
                }
              }
              if (currentEvent === "error") {
                setStreamError(data.message || "An error occurred during streaming.")
                setIsStreaming(false)
              }
            } catch {
              // Incomplete JSON — continue
            }
            currentEvent = ""
          }
        }
      }
    } catch (err: any) {
      setStreamError(err.message || "Network error. Please try again.")
      setIsStreaming(false)
    }
  }

  return (
    <div className={cn("flex h-full flex-col bg-background min-w-[375px]", className)}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <MessageBubble key={msg.id !== "streaming" ? msg.id : `streaming-${i}`} message={msg} />
        ))}
        {streamError && (
          <div className="flex justify-center my-4">
            <div className="inline-flex items-center text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
              <AlertCircle size={16} className="mr-2" />
              {streamError}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-secondary-200 shadow-sm">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isStreaming || isComplete}
            placeholder={isComplete ? "Conversation ended." : "Type your message..."}
            className="flex-1 min-h-[44px]"
          />
          <Button
            type="submit"
            disabled={isStreaming || isComplete || !inputValue.trim()}
            className="min-h-[44px] min-w-[44px] px-3"
            aria-label="Send message"
          >
            <SendIcon size={18} />
          </Button>
        </form>
      </div>
    </div>
  )
}
