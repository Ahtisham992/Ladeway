"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useConversationSession } from "@/hooks/useConversationSession"
import { ChatWidget } from "@/components/chat/ChatWidget"
import { Spinner } from "@/components/ui/Spinner"
import { AlertCircle } from "lucide-react"

export default function ChatPage() {
  const params = useParams()
  const configId = params.configId as string

  const {
    sessionToken,
    initialMessages,
    isLoading,
    error,
    reset,
  } = useConversationSession(configId)

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-xl font-semibold text-secondary-900 mb-2">Something went wrong</h1>
        <p className="text-secondary-500 mb-6 text-center">{error}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!sessionToken) {
    return null
  }

  return (
    <div className="h-screen w-full bg-background flex flex-col items-center">
      <div className="w-full max-w-2xl h-full shadow-lg border-x border-secondary-100 flex flex-col bg-white">
        <header className="p-4 border-b border-secondary-200 bg-white flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
              AI
            </div>
            <div>
              <h2 className="font-semibold text-secondary-900 leading-tight">Virtual Assistant</h2>
              <p className="text-xs text-secondary-500">Always online</p>
            </div>
          </div>
          <button 
            onClick={reset}
            className="text-xs text-secondary-500 hover:text-primary transition-colors"
          >
            Reset Chat
          </button>
        </header>
        <div className="flex-1 overflow-hidden relative">
          <ChatWidget 
            sessionToken={sessionToken} 
            initialMessages={initialMessages} 
            onSessionExpired={reset}
            className="h-full border-none shadow-none"
          />
        </div>
      </div>
    </div>
  )
}
