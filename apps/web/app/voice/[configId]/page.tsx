"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { VoiceWidget } from "@/components/voice/VoiceWidget"
import { HelpWidget } from "@/components/ui/HelpWidget"

export default function VoicePage() {
  const params = useParams()
  const configId = params.configId as string

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center p-8">
      <div className="w-full max-w-4xl text-center mb-12 mt-12">
        <h1 className="text-4xl font-extrabold text-secondary-900 mb-4 tracking-tight">
          AI Voice Assistant
        </h1>
        <p className="text-lg text-secondary-500 max-w-2xl mx-auto">
          Test the ultra-low latency conversational AI voice pipeline. Make sure your microphone is enabled.
        </p>
      </div>

      <VoiceWidget configId={configId} />

      <HelpWidget context="voice" />
    </div>
  )
}
