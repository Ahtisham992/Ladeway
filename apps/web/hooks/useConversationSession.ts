import { useState, useEffect, useRef, useCallback } from "react"
import { MessageProps } from "@/components/chat/MessageBubble"

export type ConversationStatus = "QUALIFYING" | "TRANSFERRED" | "CLOSED" | "ABANDONED"

export interface UseConversationSessionReturn {
  conversationId: string | null
  sessionToken: string | null
  initialMessages: MessageProps[]
  status: ConversationStatus | null
  isLoading: boolean
  error: string | null
  reset: () => void
}

export function useConversationSession(configId: string): UseConversationSessionReturn {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [initialMessages, setInitialMessages] = useState<MessageProps[]>([])
  const [status, setStatus] = useState<ConversationStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isStarting = useRef(false)

  const startNewSession = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/conversations/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configId }),
      })

      if (!response.ok) {
        throw new Error("Failed to start conversation")
      }

      const data = await response.json()
      sessionStorage.setItem(`ladeway_session_${configId}`, data.sessionToken)
      
      setConversationId(data.conversationId)
      setSessionToken(data.sessionToken)
      setInitialMessages([
        { id: crypto.randomUUID(), sender: "ai", content: data.greeting }
      ])
      setStatus("QUALIFYING")
    } catch (err: any) {
      setError(err.message || "Failed to start conversation")
    } finally {
      setIsLoading(false)
    }
  }, [configId])

  const resumeSession = useCallback(async (token: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/conversations/state?sessionToken=${token}`
      )

      if (response.status === 401 || response.status === 404 || response.status === 410) {
        // Session expired or invalid
        sessionStorage.removeItem(`ladeway_session_${configId}`)
        await startNewSession()
        return
      }

      if (!response.ok) {
        throw new Error("Failed to load conversation state")
      }

      const data = await response.json()
      setConversationId(data.conversationId)
      setSessionToken(token)
      setStatus(data.status)
      setInitialMessages(
        data.messages.map((m: any) => ({
          id: m.id,
          sender: m.sender.toLowerCase() === "user" ? "user" : "ai",
          content: m.content,
        }))
      )
    } catch (err: any) {
      setError(err.message || "Failed to resume conversation")
    } finally {
      setIsLoading(false)
    }
  }, [configId, startNewSession])

  useEffect(() => {
    if (isStarting.current) return
    isStarting.current = true
    
    setIsLoading(true)
    setError(null)
    
    const token = sessionStorage.getItem(`ladeway_session_${configId}`)
    if (token) {
      resumeSession(token)
    } else {
      startNewSession()
    }
  }, [configId, resumeSession, startNewSession])

  const reset = useCallback(() => {
    sessionStorage.removeItem(`ladeway_session_${configId}`)
    setConversationId(null)
    setSessionToken(null)
    setInitialMessages([])
    setStatus(null)
    isStarting.current = false
    setIsLoading(true)
    startNewSession().finally(() => {
      isStarting.current = true
    })
  }, [configId, startNewSession])

  return {
    conversationId,
    sessionToken,
    initialMessages,
    status,
    isLoading,
    error,
    reset,
  }
}
